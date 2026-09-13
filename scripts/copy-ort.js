#!/usr/bin/env node
/*
 * Copies the onnxruntime-web files the public clause demo needs out of
 * node_modules and into public/vendor/ort, so the demo serves its own runtime
 * instead of depending on a third-party CDN at page-view time.
 *
 * Runs on postinstall and again before the build. Never fails the build: if the
 * files cannot be staged, the worker falls back to the CDN and says so.
 */

const fs = require('fs');
const path = require('path');

// WASM execution provider only — no WebGL/WebGPU/training builds.
const FILES = [
  'ort.wasm.min.js',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.wasm',
];

const source = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'dist');
const target = path.join(__dirname, '..', 'public', 'vendor', 'ort');

function main() {
  if (!fs.existsSync(source)) {
    console.warn('[copy-ort] onnxruntime-web is not installed; skipping.');
    return;
  }

  fs.mkdirSync(target, { recursive: true });

  let copied = 0;
  for (const file of FILES) {
    const from = path.join(source, file);
    const to = path.join(target, file);
    if (!fs.existsSync(from)) {
      console.warn(`[copy-ort] missing ${file} in onnxruntime-web/dist; skipping.`);
      continue;
    }
    const fresh =
      fs.existsSync(to) && fs.statSync(to).size === fs.statSync(from).size;
    if (!fresh) fs.copyFileSync(from, to);
    copied += 1;
  }

  const manifest = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'package.json');
  const version = JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
  fs.writeFileSync(
    path.join(target, 'VERSION'),
    `onnxruntime-web ${version}\ncopied by scripts/copy-ort.js\n`
  );
  console.log(`[copy-ort] staged ${copied}/${FILES.length} onnxruntime-web ${version} files.`);
}

try {
  main();
} catch (error) {
  console.warn('[copy-ort] could not stage onnxruntime-web:', error.message);
}
