#!/usr/bin/env python3
"""
Reproduce the evaluation figures shown on the landing page.

Runs the exact model file the browser demo serves against the official LexGLUE
UNFAIR-ToS *test* split and prints per-class precision/recall/F1 with support
counts, plus macro- and micro-F1.

    pip install onnxruntime pyarrow
    python scripts/eval-unfair-tos.py

Protocol, stated explicitly so the numbers can be checked:
  * Split      official LexGLUE `unfair_tos` test split (1,607 clauses), unmodified.
  * Model      public/models/legalsan/legalsan-int8.onnx — the int8 file the
               browser downloads, not an unquantised checkpoint.
  * Tokenizer  bert-base-uncased WordPiece, 128 tokens, [CLS] … [SEP].
  * Decision   independent sigmoid per label at threshold 0.5.
  * Macro-F1   unweighted mean of the eight per-label F1 scores. Clauses with no
               unfair label are kept in the set as negatives, but no "fair" class
               is scored, so this figure is NOT comparable to published numbers
               that score an extra none-of-the-above class.
"""

import io
import json
import os
import sys
import unicodedata
import re
import urllib.request

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, "public", "models", "legalsan", "legalsan-int8.onnx")
VOCAB = os.path.join(ROOT, "public", "models", "legalsan", "vocab.txt")
TEST_URL = "https://huggingface.co/api/datasets/coastalcph/lex_glue/parquet/unfair_tos/test/0.parquet"

LABELS = [
    "Limitation of liability", "Unilateral termination", "Unilateral change",
    "Content removal", "Contract by using", "Choice of law", "Jurisdiction",
    "Arbitration",
]
MAX_LEN = 128
THRESHOLD = 0.5


# ── tokenizer (mirrors public/demo/legalsan-worker.js) ──────────────────────

class WordPiece:
    def __init__(self, path):
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


# ── evaluation ──────────────────────────────────────────────────────────────

def prf(gold, pred):
    tp = int(((gold == 1) & (pred == 1)).sum())
    fp = int(((gold == 0) & (pred == 1)).sum())
    fn = int(((gold == 1) & (pred == 0)).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1


def load_test_split(cache):
    import pyarrow.parquet as pq

    if not os.path.exists(cache):
        print(f"downloading the official test split → {cache}")
        with urllib.request.urlopen(TEST_URL) as response:
            data = response.read()
        with open(cache, "wb") as handle:
            handle.write(data)

    table = pq.read_table(cache)
    names = json.loads(table.schema.metadata[b"huggingface"].decode())
    names = names["info"]["features"]["labels"]["feature"]["names"]
    if names != LABELS:
        sys.exit(f"label order changed upstream: {names}")
    columns = table.to_pydict()
    return columns["text"], columns["labels"]


def main():
    import onnxruntime as ort

    cache = os.path.join(os.path.dirname(os.path.abspath(__file__)), "unfair_tos_test.parquet")
    texts, label_lists = load_test_split(cache)

    gold = np.zeros((len(texts), 8), dtype=int)
    for row, labels in enumerate(label_lists):
        for label in labels:
            gold[row, label] = 1

    tokenizer = WordPiece(VOCAB)
    session = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])

    probs = np.zeros((len(texts), 8), dtype=np.float32)
    for start in range(0, len(texts), 32):
        ids, mask = tokenizer.batch(texts[start:start + 32])
        probs[start:start + 32] = session.run(
            None, {"input_ids": ids, "attention_mask": mask}
        )[0]

    pred = (probs >= THRESHOLD).astype(int)

    print(f"\nLexGLUE UNFAIR-ToS test split · n={len(texts)} · threshold {THRESHOLD}\n")
    print(f"{'label':<26}{'P':>7}{'R':>7}{'F1':>7}{'support':>9}")
    f1s = []
    for k, name in enumerate(LABELS):
        precision, recall, f1 = prf(gold[:, k], pred[:, k])
        f1s.append(f1)
        print(f"{name:<26}{precision:>7.3f}{recall:>7.3f}{f1:>7.3f}{int(gold[:, k].sum()):>9}")

    macro = float(np.mean(f1s))
    micro = prf(gold.ravel(), pred.ravel())[2]
    print(f"\nmacro-F1 {macro:.4f}   micro-F1 {micro:.4f}")
    print("(macro-F1 is the mean over the eight labels above; no 'fair' class is scored)")


if __name__ == "__main__":
    main()
