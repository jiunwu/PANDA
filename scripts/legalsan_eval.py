"""
Shared evaluation machinery for the LegalSan clause classifier.

Both evaluation scripts in this directory score the *exact* int8 file the
browser downloads, through the same tokenizer the browser worker implements,
so their numbers describe the shipped artifact rather than a checkpoint that
only ever existed in a notebook:

    eval-unfair-tos.py            LexGLUE UNFAIR-ToS test split, 8 labels
    eval-legalbench-unfair-tos.py LegalBench unfair_tos test split, 9 classes

The two use different splits and different metrics on purpose; see each
script's docstring. Keeping the tokenizer and the model-loading path in one
place is what makes their numbers comparable to each other.
"""

import os
import unicodedata
import urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, "public", "models", "legalsan", "legalsan-int8.onnx")
VOCAB = os.path.join(ROOT, "public", "models", "legalsan", "vocab.txt")
CACHE = os.path.dirname(os.path.abspath(__file__))

# The eight unfair-clause labels, in the order of the model's output units.
LABELS = [
    "Limitation of liability", "Unilateral termination", "Unilateral change",
    "Content removal", "Contract by using", "Choice of law", "Jurisdiction",
    "Arbitration",
]

MAX_LEN = 128

# The threshold the checkpoint ships with, and the one every published
# LegalSan figure is measured at. src/lib/legalsan.js must agree with this;
# src/lib/legalsan.test.js asserts that it does.
DEFAULT_THRESHOLD = 0.40


# ── tokenizer (mirrors public/demo/legalsan-worker.js) ──────────────────────

class WordPiece:
    def __init__(self, path=VOCAB):
        with open(path, encoding="utf-8") as handle:
            self.vocab = {t.rstrip("\n"): i for i, t in enumerate(handle)}
        self.unk = self.vocab["[UNK]"]
        self.cls = self.vocab["[CLS]"]
        self.sep = self.vocab["[SEP]"]
        self.pad = self.vocab["[PAD]"]

    @staticmethod
    def _is_punct(ch):
        code = ord(ch)
        if 33 <= code <= 47 or 58 <= code <= 64 or 91 <= code <= 96 or 123 <= code <= 126:
            return True
        return unicodedata.category(ch).startswith("P")

    @staticmethod
    def _is_cjk(code):
        return (0x4E00 <= code <= 0x9FFF or 0x3400 <= code <= 0x4DBF
                or 0xF900 <= code <= 0xFAFF or 0x20000 <= code <= 0x2A6DF)

    def _basic(self, text):
        text = unicodedata.normalize("NFD", text.lower())
        text = "".join(c for c in text if unicodedata.category(c) != "Mn")
        out = []
        for chunk in text.split():
            current = ""
            for ch in chunk:
                if self._is_punct(ch) or self._is_cjk(ord(ch)):
                    if current:
                        out.append(current)
                    out.append(ch)
                    current = ""
                else:
                    current += ch
            if current:
                out.append(current)
        return out

    def _wordpiece(self, word):
        if len(word) > 100:
            return ["[UNK]"]
        if word in self.vocab:
            return [word]
        pieces, start = [], 0
        while start < len(word):
            end, match = len(word), None
            while start < end:
                piece = word[start:end] if start == 0 else "##" + word[start:end]
                if piece in self.vocab:
                    match = piece
                    break
                end -= 1
            if match is None:
                return ["[UNK]"]
            pieces.append(match)
            start = end
        return pieces

    def encode(self, text):
        tokens = []
        for word in self._basic(text):
            tokens.extend(self._wordpiece(word))
        tokens = tokens[: MAX_LEN - 2]
        return [self.cls] + [self.vocab.get(t, self.unk) for t in tokens] + [self.sep]

    def batch(self, texts):
        encoded = [self.encode(t) for t in texts]
        width = max(len(e) for e in encoded)
        ids = np.full((len(encoded), width), self.pad, dtype=np.int64)
        mask = np.zeros((len(encoded), width), dtype=np.int64)
        for row, seq in enumerate(encoded):
            ids[row, : len(seq)] = seq
            mask[row, : len(seq)] = 1
        return ids, mask


# ── inference ───────────────────────────────────────────────────────────────

def score(texts, batch_size=32):
    """Runs the shipped int8 model over texts, returning an (n, 8) sigmoid array."""
    import onnxruntime as ort

    tokenizer = WordPiece()
    session = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
    probs = np.zeros((len(texts), len(LABELS)), dtype=np.float32)
    for start in range(0, len(texts), batch_size):
        ids, mask = tokenizer.batch(texts[start:start + batch_size])
        probs[start:start + batch_size] = session.run(
            None, {"input_ids": ids, "attention_mask": mask}
        )[0]
    return probs


# ── metrics ─────────────────────────────────────────────────────────────────

def prf(gold, pred):
    """Precision, recall and F1 for one binary indicator vector."""
    tp = int(((gold == 1) & (pred == 1)).sum())
    fp = int(((gold == 0) & (pred == 1)).sum())
    fn = int(((gold == 1) & (pred == 0)).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1


def download(url, path, what):
    if not os.path.exists(path):
        print(f"downloading {what} → {path}")
        with urllib.request.urlopen(url) as response:
            data = response.read()
        with open(path, "wb") as handle:
            handle.write(data)
    return path
