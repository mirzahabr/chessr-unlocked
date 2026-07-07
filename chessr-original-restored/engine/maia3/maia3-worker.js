/**
 * Maia 3 Web Worker — ONNX inference off the main thread.
 *
 * Loaded via `new Worker(chrome-extension://.../engine/maia3/maia3-worker.js)`.
 * Asset paths are passed in the 'init' message so the worker can resolve them
 * relative to the extension origin (importScripts at construction time only
 * supports paths relative to the worker file itself).
 *
 * Messages FROM main thread:
 *   { type: 'init', modelUrl, ortBaseUrl, ortRuntimeUrl }
 *   { type: 'inference', id, tokens, eloSelfs, eloOppos, batchSize }
 *
 * Messages TO main thread:
 *   { type: 'status', status: 'loading' | 'ready' | 'error' }
 *   { type: 'progress', progress: 0..100 }
 *   { type: 'error', message, id? }
 *   { type: 'inference-result', id, logitsMove, logitsValue }
 *
 * No IndexedDB cache — Chrome already caches the .onnx fetch from the
 * extension URL so repeat loads are free.
 */

let session = null;
let ORT = null;

self.onmessage = async (e) => {
  const msg = e.data;

  try {
    switch (msg.type) {
      case 'init': {
        postMessage({ type: 'status', status: 'loading' });

        importScripts(msg.ortRuntimeUrl);
        ORT = self.ort;
        ORT.env.wasm.wasmPaths = msg.ortBaseUrl;

        const response = await fetch(msg.modelUrl);
        if (!response.ok) throw new Error(`fetch model ${response.status}`);
        const total = +(response.headers.get('Content-Length') || 0);
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;
        let lastReported = -10;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            const pct = Math.floor((received / total) * 100);
            if (pct >= lastReported + 10) {
              postMessage({ type: 'progress', progress: pct });
              lastReported = pct;
            }
          }
        }
        const buffer = new Uint8Array(received);
        let position = 0;
        for (const chunk of chunks) { buffer.set(chunk, position); position += chunk.length; }

        session = await ORT.InferenceSession.create(buffer.buffer);
        postMessage({ type: 'status', status: 'ready' });
        break;
      }

      case 'inference': {
        if (!session) {
          postMessage({ type: 'error', message: 'Model not initialised', id: msg.id });
          return;
        }
        const { id, tokens, eloSelfs, eloOppos, batchSize } = msg;

        const tokenArr = new Float32Array(tokens);
        const tokenChannels = tokenArr.length / (batchSize * 64); // 96 with history=8
        const feeds = {
          tokens:   new ORT.Tensor('float32', tokenArr,                   [batchSize, 64, tokenChannels]),
          elo_self: new ORT.Tensor('float32', new Float32Array(eloSelfs), [batchSize]),
          elo_oppo: new ORT.Tensor('float32', new Float32Array(eloOppos), [batchSize]),
        };
        const result = await session.run(feeds);
        const logitsMove  = new Float32Array(result.logits_move.data);
        const logitsValue = new Float32Array(result.logits_value.data);

        postMessage(
          { type: 'inference-result', id, logitsMove: logitsMove.buffer, logitsValue: logitsValue.buffer },
          [logitsMove.buffer, logitsValue.buffer],
        );
        break;
      }
    }
  } catch (err) {
    postMessage({ type: 'error', message: (err && err.message) || String(err), id: msg && msg.id });
  }
};
