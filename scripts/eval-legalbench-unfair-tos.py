#!/usr/bin/env python3
"""
Reproduce the two headline figures on the landing page.

    pip install onnxruntime pyarrow
    python scripts/eval-legalbench-unfair-tos.py [--threshold 0.40]

The landing page advertises 95.88% overall accuracy and 88.46% binary macro-F1.
Those come from a *different* protocol than eval-unfair-tos.py: the LegalBench
`unfair_tos` task, which is single-label over nine classes — the eight unfair
categories plus an explicit "Other" for clauses that are not unfair.

  * Split      LegalBench `unfair_tos` test split (3,813 clauses), unmodified.
  * Model      public/models/legalsan/legalsan-int8.onnx — the int8 file the
               browser downloads.
  * Decision   "Other" when no label reaches the threshold, otherwise the
               highest-scoring label. The model has eight independent sigmoid
               outputs, so "Other" is an absence of evidence, not a ninth unit.
  * Accuracy   fraction of the 3,813 clauses whose single predicted class equals
               the gold class.
  * Binary     fair vs unfair, macro-averaged over the two classes.

Read the accuracy figure against the baseline this script prints. "Other" is
90.58% of the split, so predicting "fair" for every clause already scores
90.58%. The number that describes finding unfair clauses is the unfair-class
F1, which is much lower than either headline figure.

The script also reports where each LegalBench clause came from in LexGLUE.
The LegalBench test split is drawn from the LexGLUE validation and test splits,
so a majority of it is data a standard training recipe would have used for model
selection. Accuracy on the never-selected-on portion is printed separately; if
the two agree, the headline figure is not inflated by that overlap.
"""

import argparse
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from legalsan_eval import (  # noqa: E402
    CACHE, DEFAULT_THRESHOLD, LABELS, download, prf, score,
)

BASE = "https://huggingface.co/api/datasets/{}/parquet/unfair_tos/{}/0.parquet"
LEGALBENCH = BASE.format("nguha/legalbench", "test")
LEXGLUE = {split: BASE.format("coastalcph/lex_glue", split)
           for split in ("train", "validation", "test")}

OTHER = len(LABELS)  # the ninth class index
CLASSES = LABELS + ["Other"]


def normalise(text):
    return re.sub(r"\s+", " ", text.strip().lower())


def load_legalbench():
    import pyarrow.parquet as pq

    path = download(LEGALBENCH, os.path.join(CACHE, "legalbench_unfair_tos_test.parquet"),
                    "the LegalBench unfair_tos test split")
    columns = pq.read_table(path).to_pydict()
    unknown = sorted(set(columns["answer"]) - set(CLASSES))
    if unknown:
        sys.exit(f"unexpected LegalBench classes: {unknown}")
    gold = np.array([OTHER if a == "Other" else LABELS.index(a) for a in columns["answer"]])
    return columns["text"], gold


def lexglue_origin(texts):
    """Labels each clause with the LexGLUE split it appears in, or 'unseen'."""
    import pyarrow.parquet as pq

    members = {}
    for split, url in LEXGLUE.items():
        path = download(url, os.path.join(CACHE, f"lex_glue_unfair_tos_{split}.parquet"),
                        f"the LexGLUE {split} split")
        members[split] = {normalise(t) for t in pq.read_table(path).to_pydict()["text"]}

    # train wins over validation wins over test: report the strongest exposure.
    def classify(text):
        key = normalise(text)
        for split in ("train", "validation", "test"):
            if key in members[split]:
                return split
        return "unseen"

    return np.array([classify(t) for t in texts])


def binary_macro_f1(gold, pred):
    """Macro-F1 over the two classes of the fair/unfair collapse."""
    gold_unfair = (gold != OTHER).astype(int)
    pred_unfair = (pred != OTHER).astype(int)
    unfair = prf(gold_unfair, pred_unfair)
    fair = prf(1 - gold_unfair, 1 - pred_unfair)
    return (unfair[2] + fair[2]) / 2, unfair, fair


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD,
                        help=f"decision threshold (default {DEFAULT_THRESHOLD}, the checkpoint's)")
    args = parser.parse_args()

    texts, gold = load_legalbench()
    probs = score(texts)
    # "Other" when nothing crosses the threshold, else the strongest label.
    pred = np.where((probs >= args.threshold).sum(1) == 0, OTHER, probs.argmax(1))

    n = len(gold)
    accuracy = float((pred == gold).mean())
    baseline = float((gold == OTHER).mean())
    macro_binary, unfair, fair = binary_macro_f1(gold, pred)

    print(f"\nLegalBench unfair_tos test split · n={n} · threshold {args.threshold}\n")
    print(f"{'class':<26}{'P':>7}{'R':>7}{'F1':>7}{'support':>9}")
    f1s = []
    for k, name in enumerate(CLASSES):
        precision, recall, f1 = prf((gold == k).astype(int), (pred == k).astype(int))
        f1s.append(f1)
        print(f"{name:<26}{precision:>7.3f}{recall:>7.3f}{f1:>7.3f}{int((gold == k).sum()):>9}")

    print(f"\noverall accuracy        {accuracy * 100:>6.2f}%   "
          f"({int((pred == gold).sum())}/{n})")
    print(f"  all-'Other' baseline  {baseline * 100:>6.2f}%   "
          f"(predicting 'fair' for every clause)")
    print(f"  margin over baseline  {(accuracy - baseline) * 100:>+6.2f} points")
    print(f"nine-class macro-F1     {np.mean(f1s) * 100:>6.2f}%")
    print(f"binary macro-F1         {macro_binary * 100:>6.2f}%   "
          f"(mean of the two F1 scores below)")
    print(f"  fair    P {fair[0]:.3f}  R {fair[1]:.3f}  F1 {fair[2] * 100:>6.2f}%   "
          f"support {int((gold == OTHER).sum())}")
    print(f"  unfair  P {unfair[0]:.3f}  R {unfair[1]:.3f}  F1 {unfair[2] * 100:>6.2f}%   "
          f"support {int((gold != OTHER).sum())}")
    print("\nThe unfair row is the one that describes catching unfair clauses;"
          "\nthe two headline figures are both lifted by the 'Other' majority.")

    origin = lexglue_origin(texts)
    print(f"\nProvenance in LexGLUE · {'split':<12}{'n':>6}{'%':>7}"
          f"{'accuracy':>10}{'binary F1':>11}")
    for split in ("train", "validation", "test", "unseen"):
        mask = origin == split
        if not mask.any():
            continue
        acc = float((pred[mask] == gold[mask]).mean())
        f1 = binary_macro_f1(gold[mask], pred[mask])[0]
        print(f"{'':<21}{split:<12}{int(mask.sum()):>6}{mask.mean() * 100:>6.1f}%"
              f"{acc * 100:>9.2f}%{f1 * 100:>10.2f}%")

    held_out = origin == "test"
    selected_on = ~held_out
    if held_out.any() and selected_on.any():
        acc_held = float((pred[held_out] == gold[held_out]).mean())
        acc_seen = float((pred[selected_on] == gold[selected_on]).mean())
        print(f"\nnever selected on (LexGLUE test only): accuracy {acc_held * 100:.2f}%, "
              f"binary macro-F1 {binary_macro_f1(gold[held_out], pred[held_out])[0] * 100:.2f}%")
        print(f"possibly selected on (train+validation): accuracy {acc_seen * 100:.2f}%, "
              f"binary macro-F1 {binary_macro_f1(gold[selected_on], pred[selected_on])[0] * 100:.2f}%")
        verdict = ("no inflation from the overlap" if acc_held >= acc_seen
                   else "the overlap may inflate the headline figure")
        print(f"→ {verdict}.")


if __name__ == "__main__":
    main()
