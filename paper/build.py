#!/usr/bin/env python3
"""
Render the LegalSAN working paper to PDF.

    pip install reportlab
    python paper/build.py

Reads paper/legalsan-working-paper.md and writes
public/papers/legalsan-working-paper.pdf — the file the landing page links.

The source is ordinary prose plus a handful of line directives:

    @meta key: value      title / author / date / runninghead
    @abstract … @end      the abstract block
    @keywords …           the keyword line
    # / ##                section and subsection headings
    | a | b |             a table; the first row is the header
    @table                optional, forces a header row on the table below
    @caption …            a table or figure caption
    @figure <name>        one of the figures drawn in FIGURES below
    @equation …           a centred display line
    @ref …                a reference entry
    @small …              a small-print paragraph

Figures are drawn here rather than embedded as images so the numbers in them
stay tied to the numbers in the tables.
"""

import os
import re
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Flowable, Frame, KeepTogether, PageTemplate, Paragraph,
    Spacer, Table, TableStyle,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "paper", "legalsan-working-paper.md")
OUTPUT = os.path.join(ROOT, "public", "papers", "legalsan-working-paper.pdf")

# Palette shared with the landing page. ACCENT carries the highlighted mark in
# every figure; CONTEXT is deliberately recessive. Every mark is directly
# labelled, so identity never rests on colour alone.
INK = colors.HexColor("#25363d")
MUTED = colors.HexColor("#596970")
LINE = colors.HexColor("#cad2d0")
ACCENT = colors.HexColor("#11748d")
CONTEXT = colors.HexColor("#9aa8ac")
RULE = colors.HexColor("#b6c1bf")

FONTS = "/usr/share/fonts/truetype/dejavu"


def register_fonts():
    faces = {
        "Body": "DejaVuSans.ttf",
        "Body-Bold": "DejaVuSans-Bold.ttf",
        "Mono": "DejaVuSansMono.ttf",
    }
    for name, filename in faces.items():
        path = os.path.join(FONTS, filename)
        if not os.path.exists(path):
            sys.exit(f"missing font: {path}")
        pdfmetrics.registerFont(TTFont(name, path))
    pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold")


# ── styles ──────────────────────────────────────────────────────────────────

def styles():
    base = dict(fontName="Body", textColor=INK, leading=14.2)
    return {
        "title": ParagraphStyle("title", **{**base, "fontName": "Body-Bold",
                                            "fontSize": 19, "leading": 25,
                                            "spaceAfter": 9}),
        "author": ParagraphStyle("author", **{**base, "fontSize": 11,
                                              "leading": 15, "spaceAfter": 2}),
        "date": ParagraphStyle("date", **{**base, "fontSize": 9,
                                          "textColor": MUTED, "leading": 13,
                                          "spaceAfter": 16}),
        "h1": ParagraphStyle("h1", **{**base, "fontName": "Body-Bold",
                                      "fontSize": 12.5, "leading": 17,
                                      "spaceBefore": 15, "spaceAfter": 6}),
        "h2": ParagraphStyle("h2", **{**base, "fontName": "Body-Bold",
                                      "fontSize": 10.5, "leading": 15,
                                      "spaceBefore": 11, "spaceAfter": 4}),
        "body": ParagraphStyle("body", **{**base, "fontSize": 9.3,
                                          "alignment": TA_JUSTIFY,
                                          "spaceAfter": 7}),
        "abstract": ParagraphStyle("abstract", **{**base, "fontSize": 8.9,
                                                  "leading": 13.4,
                                                  "alignment": TA_JUSTIFY,
                                                  "spaceAfter": 7}),
        "keywords": ParagraphStyle("keywords", **{**base, "fontSize": 8.4,
                                                  "textColor": MUTED,
                                                  "leading": 12.5,
                                                  "spaceAfter": 4}),
        "caption": ParagraphStyle("caption", **{**base, "fontSize": 7.9,
                                                "textColor": MUTED,
                                                "leading": 11.4,
                                                "spaceBefore": 5,
                                                "spaceAfter": 11}),
        "equation": ParagraphStyle("equation", **{**base, "fontSize": 9.6,
                                                  "alignment": TA_CENTER,
                                                  "spaceBefore": 4,
                                                  "spaceAfter": 9}),
        "small": ParagraphStyle("small", **{**base, "fontSize": 7.9,
                                            "textColor": MUTED, "leading": 11.6,
                                            "spaceAfter": 6}),
        "ref": ParagraphStyle("ref", **{**base, "fontSize": 7.9,
                                        "leading": 11.6, "spaceAfter": 4.5,
                                        "leftIndent": 15, "firstLineIndent": -15}),
        "cell": ParagraphStyle("cell", **{**base, "fontSize": 8.3,
                                          "leading": 11.6}),
        "cellhead": ParagraphStyle("cellhead", **{**base, "fontName": "Body-Bold",
                                                  "fontSize": 8.3, "leading": 11.6}),
        "cellnum": ParagraphStyle("cellnum", **{**base, "fontSize": 8.3,
                                                "leading": 11.6, "alignment": TA_RIGHT}),
        "cellnumhead": ParagraphStyle("cellnumhead", **{**base, "fontName": "Body-Bold",
                                                        "fontSize": 8.3, "leading": 11.6,
                                                        "alignment": TA_RIGHT}),
    }


# ── figures ─────────────────────────────────────────────────────────────────

class Figure(Flowable):
    """A figure that draws itself; subclasses set height and implement paint."""

    def __init__(self, width, height):
        Flowable.__init__(self)
        self.width, self.height = width, height

    def wrap(self, *_):
        return self.width, self.height

    def label(self, text, x, y, size=7.2, font="Body", color=MUTED, align="l"):
        c = self.canv
        c.setFont(font, size)
        c.setFillColor(color)
        {"l": c.drawString, "r": c.drawRightString, "c": c.drawCentredString}[align](x, y, text)


class Pipeline(Figure):
    """Figure 1 — the clause-to-score inference path."""

    APP = ["Clause text (English)", "Contracts-BERT tokenizer",
           "Threshold 0.40 per output"]
    GRAPH = ["ID remapping — retained IDs, others to UNK",
             "Embedding lookup — 12,000 rows × 768",
             "6 attention-only blocks — 12 heads, no FFN",
             "Content mask — original IDs + input mask",
             "Masked mean pooling — excludes padding/specials",
             "Linear head + sigmoid — 8 independent scores"]

    BOX_H, GAP, PAD = 14.5, 6.0, 7.0

    def __init__(self, width):
        Figure.__init__(self, width, 162)

    def column(self, x, w, title, rows, tint, top):
        c = self.canv
        height = len(rows) * (self.BOX_H + self.GAP) - self.GAP + 2 * self.PAD
        c.setStrokeColor(LINE)
        c.setLineWidth(0.5)
        c.setFillColor(tint)
        c.rect(x, top - height, w, height, stroke=1, fill=1)
        self.label(title, x, top + 4.5, 6.5, "Body-Bold", MUTED)
        y = top - self.PAD - self.BOX_H
        centres = []
        for row in rows:
            c.setFillColor(colors.white)
            c.setStrokeColor(RULE)
            c.rect(x + self.PAD, y, w - 2 * self.PAD, self.BOX_H, stroke=1, fill=1)
            self.label(row, x + self.PAD + 5, y + 4.6, 6.8, "Body", INK)
            centres.append(y + self.BOX_H / 2)
            y -= self.BOX_H + self.GAP
        return centres

    def draw(self):
        c = self.canv
        col_w = self.width * 0.435
        left_x, right_x = 0, self.width - col_w
        top = self.height - 13

        left = self.column(left_x, col_w, "APPLICATION / JAVASCRIPT", self.APP,
                           colors.HexColor("#f3f1ec"), top)
        right = self.column(right_x, col_w, "EXPORTED ONNX GRAPH", self.GRAPH,
                            colors.HexColor("#edf3f4"), top)

        mid_x = (left_x + col_w + right_x) / 2

        # tokenizer hands token IDs and the attention mask to the graph
        c.setStrokeColor(ACCENT)
        c.setLineWidth(0.9)
        c.line(left_x + col_w + 2, left[1], right_x - 2, right[0])
        c.setFillColor(ACCENT)
        c.circle(right_x - 2, right[0], 1.6, stroke=0, fill=1)
        self.label("IDs + mask", mid_x, max(left[1], right[0]) + 6,
                   6.3, "Body", ACCENT, align="c")

        # dashed branch: the original IDs also reach the content mask
        spur = right_x - 11
        c.setDash(2, 2)
        c.setStrokeColor(CONTEXT)
        c.setLineWidth(0.7)
        c.line(right_x - 2, right[0], spur, right[0])
        c.line(spur, right[0], spur, right[3])
        c.line(spur, right[3], right_x + self.PAD, right[3])
        c.setDash()
        self.label("original IDs", spur - 5, (right[0] + right[3]) / 2, 6.0,
                   "Body", CONTEXT, align="r")

        # the scores come back out to the application
        c.setStrokeColor(ACCENT)
        c.setLineWidth(0.9)
        c.line(right_x - 2, right[5], left_x + col_w + 2, left[2])
        c.setFillColor(ACCENT)
        c.circle(left_x + col_w + 2, left[2], 1.6, stroke=0, fill=1)
        self.label("8 scores", mid_x, min(right[5], left[2]) - 9,
                   6.3, "Body", ACCENT, align="c")

        self.label("Runtime binaries and tokenization stay outside the model artifact.",
                   0, 1, 6.6, "Body", MUTED)


class Quantization(Figure):
    """Figure 2 — size and macro-F1 as two panels, never one pair of axes."""

    ROWS = [("PyTorch reference", 94.13, 0.7883, False),
            ("ONNX FP32", 94.35, 0.7883, False),
            ("INT8 MatMul", 51.98, 0.7883, False),
            ("INT8 MatMul + Gather", 24.04, 0.7870, True)]

    def __init__(self, width):
        Figure.__init__(self, width, 124)

    def panel(self, x, w, title, unit, values, maximum, fmt):
        c = self.canv
        top = self.height - 14
        self.label(title, x, top + 8, 7.2, "Body-Bold", INK)
        self.label(unit, x, top - 1, 6.5, "Body", MUTED)
        bar_h, gap = 13, 11
        y = top - 14
        plot_x = x + 96
        plot_w = w - 96 - 34
        for (name, _, _, featured), value in zip(self.ROWS, values):
            self.label(name, plot_x - 6, y + 3.6, 6.8, "Body", INK, align="r")
            c.setFillColor(LINE)
            c.rect(plot_x, y, plot_w, bar_h, stroke=0, fill=1)
            c.setFillColor(ACCENT if featured else CONTEXT)
            c.rect(plot_x, y, plot_w * (value / maximum), bar_h, stroke=0, fill=1)
            self.label(fmt(value), plot_x + plot_w + 5, y + 3.6, 6.9,
                       "Body-Bold" if featured else "Body",
                       INK if featured else MUTED)
            y -= bar_h + gap
        # zero baseline, so the eye anchors where the scale starts
        c.setStrokeColor(RULE)
        c.setLineWidth(0.6)
        c.line(plot_x, y + gap + 1, plot_x, top - 14 + bar_h + 2)

    def draw(self):
        half = (self.width - 26) / 2
        self.panel(0, half, "Artifact size", "megabytes · scale from 0",
                   [r[1] for r in self.ROWS], 100, lambda v: f"{v:.2f}")
        self.panel(half + 26, half, "Macro-F1 (8 labels)", "scale from 0 to 1",
                   [r[2] for r in self.ROWS], 1.0, lambda v: f"{v:.4f}")
        self.label("Full INT8 quantization is 74.5% smaller; macro-F1 moves by 0.0013.",
                   0, 2, 6.8, "Body", MUTED)


class Headline(Figure):
    """Figure 3 — the aggregates against the baseline they must be read against."""

    ROWS = [("Overall accuracy", 95.88, True, "nine classes, including Other"),
            ("All-'Other' baseline", 90.58, False, "calling every clause fair"),
            ("Binary macro-F1", 88.46, True, "mean of the fair and unfair F1"),
            ("Unfair-class F1", 79.02, True, "the unfair class on its own")]

    BAR_H, STEP, LABEL_W = 14, 28, 128

    def __init__(self, width):
        Figure.__init__(self, width, 20 + len(self.ROWS) * self.STEP + 6)

    def draw(self):
        c = self.canv
        plot_x = self.LABEL_W
        plot_w = self.width - plot_x - 44
        self.label("percent · scale from 0 to 100", plot_x, self.height - 8,
                   6.5, "Body", MUTED)
        y = self.height - 20 - self.BAR_H
        for name, value, measured, note in self.ROWS:
            self.label(name, plot_x - 8, y + 4.2, 6.9, "Body", INK, align="r")
            self.label(note, plot_x - 8, y - 5.4, 6.1, "Body", MUTED, align="r")
            c.setFillColor(LINE)
            c.rect(plot_x, y, plot_w, self.BAR_H, stroke=0, fill=1)
            c.setFillColor(ACCENT if measured else CONTEXT)
            c.rect(plot_x, y, plot_w * (value / 100), self.BAR_H, stroke=0, fill=1)
            self.label(f"{value:.2f}%", plot_x + plot_w + 5, y + 4.2, 6.9,
                       "Body-Bold" if measured else "Body",
                       INK if measured else MUTED)
            y -= self.STEP
        c.setStrokeColor(RULE)
        c.setLineWidth(0.6)
        c.line(plot_x, y + self.STEP - 8, plot_x, self.height - 20)


FIGURES = {"pipeline": Pipeline, "quantization": Quantization,
           "headline": Headline}


# ── source parsing ──────────────────────────────────────────────────────────

def inline(text):
    """Escapes XML and renders the small amount of inline markup used."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    # file and script names read better in the mono face
    text = re.sub(r"((?:[\w./-]+/)?[\w.-]+\.(?:py|js|ipynb|onnx|md|pt))",
                  r'<font face="Mono" size="8.3">\1</font>', text)
    return text


def inline_math(text):
    """As inline(), plus x_t subscripts. Equations only — body text has
    identifiers like unfair_tos in it that must keep their underscores."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return re.sub(r"_(\w)", r"<sub>\1</sub>", text)


def parse(path):
    """Yields (kind, payload) blocks in document order."""
    with open(path, encoding="utf-8") as handle:
        lines = handle.read().split("\n")

    meta, i = {}, 0
    blocks = []
    pending_table = False
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()

        if stripped.startswith("@meta "):
            key, _, value = stripped[6:].partition(":")
            meta[key.strip()] = value.strip()
        elif stripped == "@abstract":
            body = []
            i += 1
            while lines[i].strip() != "@end":
                body.append(lines[i].strip())
                i += 1
            blocks.append(("abstract", " ".join(b for b in body if b)))
        elif stripped.startswith("@keywords "):
            blocks.append(("keywords", stripped[10:]))
        elif stripped == "@table":
            pending_table = True
        elif stripped.startswith("@caption "):
            blocks.append(("caption", stripped[9:]))
        elif stripped.startswith("@figure "):
            blocks.append(("figure", stripped[8:].strip()))
        elif stripped.startswith("@equation "):
            blocks.append(("equation", stripped[10:]))
        elif stripped.startswith("@small "):
            blocks.append(("small", stripped[7:]))
        elif stripped.startswith("@ref "):
            blocks.append(("ref", stripped[5:]))
        elif stripped.startswith("## "):
            blocks.append(("h2", stripped[3:]))
        elif stripped.startswith("# "):
            blocks.append(("h1", stripped[2:]))
        elif stripped.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                rows.append(cells)
                i += 1
            blocks.append(("table", (rows, pending_table)))
            pending_table = False
            continue
        elif stripped:
            blocks.append(("p", stripped))
        i += 1
    return meta, blocks


# ── document assembly ───────────────────────────────────────────────────────

def build_table(rows, forced_header, st, width):
    header, body = rows[0], rows[1:]
    columns = len(header)

    # a column whose body cells are all numeric is set flush right, so the
    # digits line up down the page
    def numeric(k):
        return all(re.fullmatch(r"[−\-+]?[\d,]+(?:\.\d+)?%?", row[k].strip())
                   for row in body if k < len(row))
    numeric_cols = {k for k in range(1, columns) if numeric(k)}

    def cell(text, k, head):
        if k in numeric_cols:
            return Paragraph(inline(text), st["cellnumhead" if head else "cellnum"])
        return Paragraph(inline(text), st["cellhead" if head else "cell"])

    data = [[cell(c, k, True) for k, c in enumerate(header)]]
    data += [[cell(c, k, False) for k, c in enumerate(row)] for row in body]

    # first column carries names; the rest are numeric and can be narrower
    first = width * (0.40 if columns <= 3 else 0.30)
    rest = (width - first) / (columns - 1) if columns > 1 else width
    widths = [first] + [rest] * (columns - 1)

    table = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1)
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Body"),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("LINEABOVE", (0, 0), (-1, 0), 0.7, INK),
        ("LINEBELOW", (0, 0), (-1, 0), 0.4, RULE),
        ("LINEBELOW", (0, -1), (-1, -1), 0.7, INK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f6f2")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.6),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def flowables(meta, blocks, st, width):
    story = [
        Paragraph(inline(meta["title"]), st["title"]),
        Paragraph(inline(meta["author"]), st["author"]),
        Paragraph(inline(meta["date"]), st["date"]),
    ]
    for kind, payload in blocks:
        if kind == "abstract":
            story += [Paragraph("<b>Abstract</b>", st["h2"]),
                      Paragraph(inline(payload), st["abstract"])]
        elif kind == "keywords":
            story.append(Paragraph("<b>Keywords:</b> " + inline(payload), st["keywords"]))
        elif kind in ("h1", "h2"):
            story.append(Paragraph(inline(payload), st[kind]))
        elif kind == "p":
            story.append(Paragraph(inline(payload), st["body"]))
        elif kind == "equation":
            story.append(Paragraph(inline_math(payload), st["equation"]))
        elif kind == "small":
            story.append(Paragraph(inline(payload), st["small"]))
        elif kind == "ref":
            story.append(Paragraph(inline(payload), st["ref"]))
        elif kind == "table":
            rows, forced = payload
            story.append(build_table(rows, forced, st, width))
            story.append(Spacer(1, 9))
        elif kind == "figure":
            story.append(FIGURES[payload](width))
        elif kind == "caption":
            story.append(Paragraph(inline(payload), st["caption"]))

    # keep each figure or table glued to the caption that follows it
    glued, i = [], 0
    while i < len(story):
        if (i + 1 < len(story) and isinstance(story[i], (Table, Figure))
                and isinstance(story[i + 1], Paragraph)
                and story[i + 1].style.name == "caption"):
            glued.append(KeepTogether([story[i], story[i + 1]]))
            i += 2
        else:
            glued.append(story[i])
            i += 1
    return glued


def main():
    register_fonts()
    st = styles()
    meta, blocks = parse(SOURCE)

    margin_x, margin_top, margin_bottom = 21 * mm, 18 * mm, 18 * mm
    page_w, page_h = A4
    width = page_w - 2 * margin_x
    running = meta.get("runninghead", "")

    def decorate(canvas, doc):
        canvas.saveState()
        canvas.setFont("Body", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(margin_x, page_h - margin_top + 7, running)
        canvas.drawRightString(page_w - margin_x, page_h - margin_top + 7,
                               str(doc.page))
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.4)
        canvas.line(margin_x, page_h - margin_top + 3.5,
                    page_w - margin_x, page_h - margin_top + 3.5)
        canvas.restoreState()

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    doc = BaseDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=margin_x, rightMargin=margin_x,
        topMargin=margin_top, bottomMargin=margin_bottom,
        title=meta["title"], author=meta["author"],
        subject="Working paper", creator="paper/build.py",
    )
    frame = Frame(margin_x, margin_bottom, width,
                  page_h - margin_top - margin_bottom, id="body",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="paper", frames=[frame], onPage=decorate)])
    doc.build(flowables(meta, blocks, st, width))
    print(f"wrote {OUTPUT} ({os.path.getsize(OUTPUT) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
