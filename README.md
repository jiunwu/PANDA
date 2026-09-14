# PANDA

Public product site for PANDA plus the internal planning dashboard for the
EXIST Gründungsstipendium Vorhaben.

Team: Jiun & Nina

- `/` — the public landing page, including the in-browser clause demo.
- Everything else — the internal dashboard, behind the team login at the
  bottom of the landing page.

## Tech Stack

- Next.js 14 (App Router)
- Vanilla CSS
- onnxruntime-web (WASM) for the in-browser model
- Vercel deployment ready

## Public landing page & clause demo

The landing page runs the LegalSan unfair-clause model entirely in the
visitor's browser. Nothing a visitor pastes is ever uploaded: the weights and
the vocabulary are static assets and inference happens locally in a Web Worker.

### The model

| | |
|---|---|
| File | `public/models/legalsan/legalsan-int8.onnx` (24 MB) |
| Architecture | 6-layer transformer encoder, 768 hidden, mean-pooled head |
| Inputs | `input_ids`, `attention_mask` (int64, max 128 tokens) |
| Output | `probs`, 8 sigmoid units — multi-label, so a clause can match several |
| Tokenizer | `bert-base-uncased` WordPiece (`public/models/legalsan/vocab.txt`) |

The eight output units, **in this order**, are: limitation of liability,
unilateral termination, unilateral change, content removal, contract by using,
choice of law, jurisdiction, arbitration. `CATEGORIES` in `src/lib/legalsan.js`
mirrors that order and must stay in sync with the model.

The graph remaps the 30,522-token BERT vocabulary onto its own 12,000-token
embedding table internally, so the standard `bert-base-uncased` vocabulary is
the correct one to tokenize with. The browser tokenizer in
`public/demo/legalsan-worker.js` is verified byte-for-byte against HuggingFace
`BertTokenizerFast` on accents, punctuation, symbols, CJK and abbreviations.

### Evaluation

Two scripts score the **exact int8 file the browser serves**, through the same
tokenizer the browser worker implements. Both default to threshold **0.40**, the
value shipped with the checkpoint; `src/lib/legalsan.js` uses the same number and
a unit test pins the two together, so the demo cannot drift away from the
published figures.

```bash
pip install onnxruntime pyarrow
python scripts/eval-legalbench-unfair-tos.py   # the landing page's headline figures
python scripts/eval-unfair-tos.py              # the working paper's Table 1 and Table 3
```

They use **different splits and different metrics**, and the numbers are not
interchangeable:

| Script | Split | Task | Reproduces |
| --- | --- | --- | --- |
| `eval-legalbench-unfair-tos.py` | LegalBench `unfair_tos` test, 3,813 clauses | single-label, 9 classes incl. `Other` | 95.88% accuracy, 88.46% binary macro-F1 |
| `eval-unfair-tos.py` | LexGLUE `unfair_tos` test, 1,607 clauses | multi-label, 8 labels, no fair class | macro-F1 0.7883, micro-F1 0.7619, binary F1 0.8193, exact match 0.9527 |

Read the landing page's accuracy figure against the baseline the LegalBench
script prints: `Other` is 90.58% of that split, so predicting "fair" everywhere
already scores 90.58%, and the 95.88% is 5.3 points above it. The figure that
describes actually finding unfair clauses is the unfair-class F1, **79.02%**
(precision 0.822, recall 0.760) — which is why the landing page shows it beside
the other two.

The LegalBench script also reports where each of its clauses appears in LexGLUE.
The LegalBench test split is drawn from LexGLUE's validation and test splits
(58.4% and 40.4%), so most of it is data a standard recipe would have used for
model selection. Accuracy on the never-selected-on portion is *higher* (95.98%
vs 95.82%), so the headline figure is not inflated by that overlap — but it is
not a clean held-out estimate either, and should not be described as one.

Full methodology is in the working paper, *LegalSAN: Compact Local Inference for
Unfair-Clause Classification*, built from `paper/` and served at
`public/papers/legalsan-working-paper.pdf`. Set `NEXT_PUBLIC_PANDA_PREPRINT_URL`
to override that link once the paper is published elsewhere.

### The runtime

`onnxruntime-web` is served from this origin rather than a CDN, so the demo
keeps working on locked-down networks. `scripts/copy-ort.js` stages the three
files it needs from `node_modules` into `public/vendor/ort/` (git-ignored) on
`postinstall` and again on `prebuild`. If that directory is missing, the worker
falls back to the public CDN on its own.

Because the copy runs as `prebuild`, the Vercel build command is `npm run
build` rather than `next build` directly.

### Working on the demo

```bash
npm test          # clause segmentation and scoring
npm run dev       # the landing page is at /
```

- Sample contracts: `src/data/demo-contracts.js` (original texts, fictional
  companies).
- Segmentation, categories, thresholds and scoring: `src/lib/legalsan.js`.
- UI: `src/components/ClauseScanner.js`, styles in `src/app/landing.css`.

To swap in a new model, replace the `.onnx` file, and update `MODEL_INFO` and
`CATEGORIES` in `src/lib/legalsan.js` if the shape or label order changed.

## Getting Started

```bash
npm install
npm run dev
```

## Deploy to Vercel

Push to GitHub, import at [vercel.com/new](https://vercel.com/new), deploy.

Or via CLI:

```bash
npx vercel
```

## Topic images

In `/topics`, drop images into the editor or type `/image` and choose **Upload**.
JPEG, PNG, GIF, WebP, and AVIF images up to 4 MB are supported. Save the topic
after uploads finish to persist the image blocks in the document.

Images use the existing `BLOB_READ_WRITE_TOKEN` and private Vercel Blob store,
with authenticated image delivery through `/api/topics/images/[id]`.

## API Documentation for External AI Agents

PANDA exposes a set of APIs to allow external AI agents to query the project state and push updates autonomously. All API endpoints require authentication using a Bearer token.

### Authentication

Include the `PANDA_API_KEY` (configured in the environment) in the `Authorization` header for all requests:

```http
Authorization: Bearer <YOUR_PANDA_API_KEY>
```

### 1. Get Dashboard Data

**`GET /api/dashboard-data`**

Returns the full current project state in JSON format, including milestones, work packages, goals, sprints, notes, and budgets.

### 2. Push Updates

**`POST /api/update`**

Allows agents to mutate the project state. The body must be a JSON object containing `type`, `action`, and `data` fields. You can optionally include `agent` and `author`.

#### Update or Add Milestones

```json
// Add a milestone
{
  "type": "milestone",
  "action": "add",
  "data": {
    "title": "New Milestone Title",
    "date": "2026-10-15",
    "status": "upcoming"
  },
  "agent": "MyCustomAgent"
}

// Update a milestone status
{
  "type": "milestone",
  "action": "update",
  "data": {
    "title": "New Milestone Title",
    "status": "done"
  },
  "agent": "MyCustomAgent"
}
```

#### Update or Add Progress (Work Packages)

```json
// Add a work package
{
  "type": "progress",
  "action": "add",
  "data": {
    "id": "AP6",
    "name": "Beta Testing",
    "progress": 0,
    "owner": "Nina"
  }
}

// Update work package progress
{
  "type": "progress",
  "action": "update",
  "data": {
    "id": "AP1",
    "progress": 85
  }
}
```

#### Update or Add Budget

```json
// Add a budget item
{
  "type": "budget",
  "action": "add",
  "data": {
    "label": "Marketing",
    "amount": 5000,
    "pct": 3
  }
}

// Update a budget amount
{
  "type": "budget",
  "action": "update",
  "data": {
    "label": "Marketing",
    "amount": 8000
  }
}
```

#### Add Notes

```json
// Add a new project note
{
  "type": "note",
  "action": "add",
  "data": {
    "text": "Completed review of the financial projections."
  },
  "author": "Alice"
}
```

## Colab Notebook Viewer

Open **More → Notebook** to read the connected Colab notebook inside PANDA.
The viewer loads saved cells and outputs from Google Drive; use **Refresh notebook**
after saving changes in Colab. Editing, execution, and interactive widgets remain
available through **Open in Colab**. HTML outputs are isolated with scripts disabled.

The notebook must remain downloadable through its Google Drive sharing settings.
The fixed notebook source is configured in `src/app/api/notebook/route.js`, and its
Colab link is in `src/app/notebook/page.js`. No Google credentials are stored by PANDA.
The page and API use PANDA's existing authentication middleware.

## Source Structure

```
src/app/
  globals.css    Design system for the internal dashboard
  landing.css    Design system for the public landing page
  layout.js      Root layout
  page.js        Public landing page
  dashboard/     Internal dashboard
public/
  models/legalsan/   Model weights and vocabulary
  demo/              Inference Web Worker
  vendor/ort/        onnxruntime-web, staged at build time (git-ignored)
```
