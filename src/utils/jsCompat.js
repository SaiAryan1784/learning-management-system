/**
 * Shims for JS APIs that pdfjs-dist 5.7.284 calls with NO feature check and NO
 * fallback, but that only landed in browsers within roughly the last year.
 *
 * This is not defensive padding. Every entry below is a real, unguarded call site
 * in the pdf.js bundles we ship, and on a browser that lacks the method the call
 * throws `TypeError: x is not a function` and the PDF preview dies. That is the
 * bug a client hit in production: her console showed
 *
 *   TypeError: i(...).getOrInsertComputed is not a function
 *       at VA.getOptionalContentConfig (pdf-DeWlx49F.js)
 *       at og.render (pdf-DeWlx49F.js)
 *
 * It never reproduced for us because our machines run newer browsers, and it never
 * reproduced in a Node-side repro either — Node's V8 already has these methods.
 * The project has no `build.target` and no browserslist, and Vite never polyfills
 * *APIs* regardless (it only transpiles syntax), so these ship raw to every user.
 *
 * MUST stay dependency-free and side-effect-only. It is loaded two ways:
 *   1. as a normal module on the main thread, and
 *   2. inlined as source text (`?raw`) into a blob module that the pdf.js Web
 *      Worker imports before the real worker code.
 * A Worker has its own global scope, so patching `Map.prototype` on the main
 * thread does NOT reach it — that gap is exactly why (2) exists.
 *
 * Guarded call sites are deliberately NOT shimmed: pdf.js checks Float16Array via
 * `isFloat16ArraySupported` before use, so that one degrades on its own.
 */

const def = (obj, name, value) => {
  if (typeof obj[name] !== "function") {
    Object.defineProperty(obj, name, { value, writable: true, configurable: true });
  }
};

/* ── Map/WeakMap.prototype.getOrInsert{,Computed} ──────────────────────────────
   TC39 "Upsert" proposal. 19 unguarded call sites across the two bundles. The
   main-thread ones are unavoidable on any render: PDFPageProxy#render goes through
   `_intentStates.getOrInsertComputed(...)` and `getOptionalContentConfig` through
   `#methodPromises.getOrInsertComputed(...)`. This is the one the client actually
   hit. Worker-side sites are XFA/AcroForm paths — rarer, but reachable. */
for (const C of [Map, WeakMap]) {
  def(C.prototype, "getOrInsertComputed", function (key, callbackfn) {
    if (this.has(key)) return this.get(key);
    const value = callbackfn(key);
    this.set(key, value);
    return value;
  });
  def(C.prototype, "getOrInsert", function (key, value) {
    if (this.has(key)) return this.get(key);
    this.set(key, value);
    return value;
  });
}

/* ── Promise.try (Chrome 128 / Firefox 134 / Safari 18.2) ──────────────────────
   The most dangerous one on this list. Both MessageHandler instances — main-side
   and worker-side — dispatch EVERY incoming RPC through `Promise.try(action, ...)`.
   Missing it does not degrade the viewer, it means no document ever loads at all,
   because even the initial GetDocRequest handshake goes through that line. */
def(Promise, "try", function (fn, ...args) {
  return new Promise((resolve) => resolve(fn.apply(this, args)));
});

/* ── Promise.withResolvers (Chrome 119 / Firefox 121 / Safari 17.4) ────────────
   40 call sites. pdf.js uses it as its general-purpose deferred. */
def(Promise, "withResolvers", function () {
  let resolve, reject;
  const promise = new this((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
});

/* ── Math.sumPrecise (Chrome 137 / Firefox 138) ────────────────────────────────
   17 call sites. The worker's OpenType writer sizes the `glyf` and `name` tables
   with it, so this is on the font-repair path — hit whenever pdf.js has to rebuild
   an embedded subset font, which is common in real documents.

   Neumaier compensated summation. Not bit-for-bit identical to the spec's exact
   algorithm, but every call site here sums integer byte counts or layout widths,
   where it is exact anyway — and the alternative on an older browser is a hard
   TypeError, not a rounding difference. */
def(Math, "sumPrecise", function (items) {
  let sum = 0;
  let compensation = 0;
  let count = 0;
  for (const raw of items) {
    const value = Number(raw);
    if (Number.isNaN(value)) return NaN;
    count++;
    const t = sum + value;
    compensation +=
      Math.abs(sum) >= Math.abs(value) ? sum - t + value : value - t + sum;
    sum = t;
  }
  if (count === 0) return -0;
  return sum + compensation;
});

/* ── Uint8Array base64 helpers (Chrome 140 / Firefox 133 / Safari 18.2) ────────
   Shipped in Chrome only in late 2025, so a large share of real users lack it.
   `toBase64` builds the `@font-face { src: url(data:...) }` rule pdf.js falls back
   to when the native FontFace path is unavailable; `fromBase64` decodes embedded
   signature and XFA payloads. */
def(Uint8Array.prototype, "toBase64", function () {
  let binary = "";
  // Chunked so a large font does not blow the argument limit on String.fromCharCode.
  for (let i = 0; i < this.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, this.subarray(i, i + 0x8000));
  }
  return btoa(binary);
});
def(Uint8Array, "fromBase64", function (string) {
  const binary = atob(string);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
});

/* ── Set.prototype.intersection (Chrome 122 / Firefox 127 / Safari 17) ─────────
   One call site, narrowing named destinations while saving a document. Iterating
   the smaller collection matches the spec's shape and the observable ordering for
   the real-Set argument pdf.js passes. */
def(Set.prototype, "intersection", function (other) {
  const result = new Set();
  if (this.size <= other.size) {
    for (const value of this) if (other.has(value)) result.add(value);
  } else {
    for (const value of other.keys()) if (this.has(value)) result.add(value);
  }
  return result;
});

/* ── AbortSignal.any (Chrome 116 / Firefox 124 / Safari 17.4) ──────────────────
   Used by pdf.js's touch/gesture manager. Oldest item here and so the least likely
   to bite, but it is unguarded like the rest and costs little to cover. */
if (typeof globalThis.AbortSignal === "function") {
  def(AbortSignal, "any", function (signals) {
    const controller = new AbortController();
    const list = [...signals];
    const aborted = list.find((s) => s.aborted);
    if (aborted) {
      controller.abort(aborted.reason);
      return controller.signal;
    }
    const onAbort = function () {
      controller.abort(this.reason);
      for (const s of list) s.removeEventListener("abort", onAbort);
    };
    for (const s of list) s.addEventListener("abort", onAbort);
    return controller.signal;
  });
}

/* ── Object.hasOwn (Chrome 93 / Firefox 92 / Safari 15.4) ──────────────────────
   Not from pdf.js alone — it also appears unguarded in an app chunk. Old enough
   that it is unlikely to be anyone's failure, included because it is free. */
def(Object, "hasOwn", function (obj, key) {
  return Object.prototype.hasOwnProperty.call(Object(obj), key);
});
