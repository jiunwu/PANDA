#!/usr/bin/env python3
"""
Reproduce the working paper's Table 1 and Table 3 (LexGLUE protocol).

Runs the exact model file the browser demo serves against the official LexGLUE
UNFAIR-ToS *test* split and prints per-class precision/recall/F1 with support
counts, plus macro- and micro-F1.

    pip install onnxruntime pyarrow
    python scripts/eval-unfair-tos.py [--threshold 0.40]

Protocol, stated explicitly so the numbers can be checked:
  * Split      official LexGLUE `unfair_tos` test split (1,607 clauses), unmodified.
  * Model      public/models/legalsan/legalsan-int8.onnx — the int8 file the
               browser downloads, not an unquantised checkpoint.
  * Tokenizer  bert-base-uncased WordPiece, 128 tokens, [CLS] … [SEP].
  * Decision   independent sigmoid per label at the checkpoint threshold, 0.40.
  * Macro-F1   unweighted mean of the eight per-label F1 scores. Clauses with no
               unfair label are kept in the set as negatives, but no "fair" class
               is scored, so this figure is NOT comparable to published numbers
               that score an extra none-of-the-above class. For the nine-class
               protocol behind the landing page's headline figures, use
               eval-legalbench-unfair-tos.py instead.

At the default threshold this reproduces the paper's reference row exactly:
macro-F1 0.7883, micro-F1 0.7619, binary F1 0.8193, exact match 0.9527.
"""

import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from legalsan_eval import (  # noqa: E402
    CACHE, DEFAULT_THRESHOLD, LABELS, download, prf, score,
)

TEST_URL = "https://huggingface.co/api/datasets/coastalcph/lex_glue/parquet/unfair_tos/test/0.parquet"


def load_test_split():
    import pyarrow.parquet as pq

    path = download(TEST_URL, os.path.join(CACHE, "unfair_tos_test.parquet"),
                    "the official LexGLUE test split")
    table = pq.read_table(path)
    names = json.loads(table.schema.metadata[b"huggingface"].decode())
    names = names["info"]["features"]["labels"]["feature"]["names"]
    if names != LABELS:
        sys.exit(f"label order changed upstream: {names}")
    columns = table.to_pydict()
    return columns["text"], columns["labels"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD,
                        help=f"decision threshold (default {DEFAULT_THRESHOLD}, the checkpoint's)")
    args = parser.parse_args()

    texts, label_lists = load_test_split()

    gold = np.zeros((len(texts), len(LABELS)), dtype=int)
    for row, labels in enumerate(label_lists):
        for label in labels:
            gold[row, label] = 1

    probs = score(texts)
    pred = (probs >= args.threshold).astype(int)

    print(f"\nLexGLUE UNFAIR-ToS test split · n={len(texts)} · threshold {args.threshold}\n")
    print(f"{'label':<26}{'P':>7}{'R':>7}{'F1':>7}{'support':>9}")
    f1s = []
    for k, name in enumerate(LABELS):
        precision, recall, f1 = prf(gold[:, k], pred[:, k])
        f1s.append(f1)
        print(f"{name:<26}{precision:>7.3f}{recall:>7.3f}{f1:>7.3f}{int(gold[:, k].sum()):>9}")

    macro = float(np.mean(f1s))
    micro = prf(gold.ravel(), pred.ravel())[2]
    binary = prf((gold.sum(1) > 0).astype(int), (pred.sum(1) > 0).astype(int))[2]
    exact = float((pred == gold).all(1).mean())
    print(f"\nmacro-F1 {macro:.4f}   micro-F1 {micro:.4f}   "
          f"binary F1 {binary:.4f}   exact match {exact:.4f}")
    print("(macro-F1 is the mean over the eight labels above; no 'fair' class is scored)")


if __name__ == "__main__":
    main()
