/*
 * LegalSan demo worker — runs the PANDA unfair-clause model entirely in the
 * visitor's browser. Nothing in this file ever sends clause text anywhere:
 * the model weights and the vocabulary are downloaded as static assets and
 * inference happens locally through onnxruntime-web (WASM).
 */

// Pinned: the runtime file names below are version-specific, and
// package.json pins the same version for the copy that is served locally.
const ORT_VERSION = '1.19.2';
const ORT_LOCAL_BASE = '/vendor/ort/';
const ORT_CDN_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const ORT_ENTRY = 'ort.wasm.min.js';

const MODEL_URL = '/models/legalsan/legalsan-int8.onnx';
const VOCAB_URL = '/models/legalsan/vocab.txt';

// The encoder was trained with 128 learned position embeddings.
const MAX_LEN = 128;
const BATCH_SIZE = 8;

let session = null;
let vocab = null; // Map<token, id>
let special = null; // { pad, unk, cls, sep }

/* ────────────────────────── WordPiece tokenizer ────────────────────────── */

// BERT's `_is_punctuation`: the ASCII ranges it hard-codes plus anything in a
// Unicode punctuation category.
const ASCII_PUNCT = /[!-/:-@[-`{-~]/;
const UNICODE_PUNCT = /\p{P}/u;

function isPunct(ch) {
  return ASCII_PUNCT.test(ch) || UNICODE_PUNCT.test(ch);
}

function isCjk(code) {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0x20000 && code <= 0x2a6df)
  );
}

// Lowercase, decompose, then drop combining marks — the same normalisation
// BasicTokenizer(do_lower_case=True) applies.
function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
}

function basicTokenize(text) {
  const out = [];
  for (const chunk of normalize(text).split(/\s+/)) {
    if (!chunk) continue;
    let current = '';
    for (const ch of chunk) {
      if (isPunct(ch) || isCjk(ch.codePointAt(0))) {
        if (current) out.push(current);
        out.push(ch);
        current = '';
      } else {
        current += ch;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

function wordpiece(word) {
  if (word.length > 100) return ['[UNK]'];
  if (vocab.has(word)) return [word];

  const pieces = [];
  let start = 0;
  while (start < word.length) {
    let end = word.length;
    let match = null;
    while (start < end) {
      const piece = start > 0 ? `##${word.slice(start, end)}` : word.slice(start, end);
      if (vocab.has(piece)) {
        match = piece;
        break;
      }
      end -= 1;
    }
    if (match === null) return ['[UNK]'];
    pieces.push(match);
    start = end;
  }
  return pieces;
}

function encode(text) {
  const tokens = [];
  for (const word of basicTokenize(text)) {
    for (const piece of wordpiece(word)) tokens.push(piece);
  }
  // Room for [CLS] … [SEP].
  const kept = tokens.slice(0, MAX_LEN - 2);
  const ids = [special.cls];
  for (const token of kept) ids.push(vocab.has(token) ? vocab.get(token) : special.unk);
  ids.push(special.sep);
  return { ids, truncated: tokens.length > kept.length };
}

/* ───────────────────────────── asset loading ───────────────────────────── */

async function loadVocab() {
  const res = await fetch(VOCAB_URL);
  if (!res.ok) throw new Error(`Could not load the vocabulary (HTTP ${res.status}).`);
  const lines = (await res.text()).split('\n');
  vocab = new Map();
  lines.forEach((line, index) => {
    const token = line.replace(/\r$/, '');
    if (token.length && !vocab.has(token)) vocab.set(token, index);
  });
  special = {
    pad: vocab.get('[PAD]'),
    unk: vocab.get('[UNK]'),
    cls: vocab.get('[CLS]'),
    sep: vocab.get('[SEP]'),
  };
  for (const [name, id] of Object.entries(special)) {
    if (id === undefined) throw new Error(`Vocabulary is missing the ${name} token.`);
  }
}

// Streamed so the page can show a real progress bar for the 24 MB download.
async function loadModelBytes() {
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`Could not load the model (HTTP ${res.status}).`);

  const declared = Number(res.headers.get('content-length')) || 0;
  if (!res.body) {
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }

  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    post({ type: 'progress', stage: 'model', loaded: received, total: declared });
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

// The runtime is served from this origin. Only if that copy is missing (a build
// that skipped scripts/copy-ort.js) do we fall back to the public CDN.
// importScripts throws synchronously when the script cannot be fetched.
function loadRuntime() {
  try {
    self.importScripts(`${ORT_LOCAL_BASE}${ORT_ENTRY}`);
    return ORT_LOCAL_BASE;
  } catch (error) {
    self.importScripts(`${ORT_CDN_BASE}${ORT_ENTRY}`);
    return ORT_CDN_BASE;
  }
}

async function init() {
  post({ type: 'progress', stage: 'runtime', loaded: 0, total: 0 });

  const base = loadRuntime();

  const ort = self.ort;
  ort.env.wasm.wasmPaths = base;
  // Single-threaded keeps the demo working without cross-origin isolation
  // (SharedArrayBuffer would otherwise be unavailable).
  ort.env.wasm.numThreads = 1;
  ort.env.logLevel = 'error';

  post({ type: 'progress', stage: 'vocab', loaded: 0, total: 0 });
  await loadVocab();

  const bytes = await loadModelBytes();

  post({ type: 'progress', stage: 'session', loaded: 0, total: 0 });
  session = await ort.InferenceSession.create(bytes, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });

  post({ type: 'ready', modelBytes: bytes.length, runtime: base });
  return session;
}

/* ────────────────────────────── inference ─────────────────────────────── */

async function classify(requestId, clauses) {
  if (!session) throw new Error('The model is not ready yet.');

  const encoded = clauses.map((text) => encode(text));

  for (let offset = 0; offset < encoded.length; offset += BATCH_SIZE) {
    const batch = encoded.slice(offset, offset + BATCH_SIZE);
    const width = Math.max(...batch.map((item) => item.ids.length));

    const inputIds = new BigInt64Array(batch.length * width).fill(BigInt(special.pad));
    const attentionMask = new BigInt64Array(batch.length * width); // zero-filled

    batch.forEach((item, row) => {
      const base = row * width;
      item.ids.forEach((id, col) => {
        inputIds[base + col] = BigInt(id);
        attentionMask[base + col] = 1n;
      });
    });

    const ort = self.ort;
    const dims = [batch.length, width];
    const output = await session.run({
      input_ids: new ort.Tensor('int64', inputIds, dims),
      attention_mask: new ort.Tensor('int64', attentionMask, dims),
    });

    const probs = output.probs.data;
    const labels = output.probs.dims[1];
    batch.forEach((item, row) => {
      post({
        type: 'clause',
        requestId,
        index: offset + row,
        scores: Array.from(probs.slice(row * labels, (row + 1) * labels)),
        tokens: item.ids.length,
        truncated: item.truncated,
      });
    });
  }

  post({ type: 'done', requestId, count: encoded.length });
}

/* ─────────────────────────────── plumbing ─────────────────────────────── */

function post(message) {
  self.postMessage(message);
}

let startup = null;

// Messages are dispatched concurrently, so every entry point funnels through the
// same start-up promise instead of assuming the session already exists.
function ensureReady() {
  if (!startup) {
    startup = init().catch((error) => {
      startup = null;
      throw error;
    });
  }
  return startup;
}

self.onmessage = async (event) => {
  const { type } = event.data || {};
  try {
    if (type === 'init') {
      await ensureReady();
    } else if (type === 'classify') {
      await ensureReady();
      await classify(event.data.requestId, event.data.clauses);
    }
  } catch (error) {
    post({
      type: 'error',
      requestId: event.data && event.data.requestId,
      message: error && error.message ? error.message : String(error),
    });
  }
};
