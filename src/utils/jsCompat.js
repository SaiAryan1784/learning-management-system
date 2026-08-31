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
 *
 * SHIM WHOLE PROPOSALS, NOT INDIVIDUAL CALL SITES. The first version of this file
 * covered only the methods that had a call site at the time — toBase64/fromBase64
 * but not toHex — and the viewer promptly failed one stage later on `toHex` in the
 * worker instead. Sibling methods of the same proposal ship together in browsers
 * and get used together by libraries, so a per-call-site shim just moves the
 * failure. When adding an entry, cover its whole proposal surface.
 *
 * To re-audit after a pdfjs-dist bump, grep the BUILT bundles — note the worker is
 * `.mjs`, so a `*.js` glob silently misses the file where most parsing lives:
 *   cd dist/assets && grep -o "\.methodName(" pdf-*.js pdf.worker.min-*.mjs
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

/* ── Uint8Array base64/hex helpers (Chrome 140 / Firefox 133 / Safari 18.2) ────
   Shipped in Chrome only in late 2025, so a large share of real users lack them.

   ALL SIX methods of the proposal are shimmed, not just the ones with a visible
   call site today. Shipping a partial shim is what caused the second outage: the
   first pass covered toBase64/fromBase64 and skipped toHex, so the viewer got
   past the Map/Promise failures and then died in the worker on

     TypeError: a.toHex is not a function

   from `PDFDocument#fingerprints`, which is computed on EVERY document load —
   so every preview still failed, just one stage later. These methods ship as a
   set; treat them as a set.

   Reachability: `toHex` = document fingerprints (every load, worker). `toBase64`
   = the `@font-face { src: url(data:...) }` fallback rule. `fromBase64` = embedded
   signature and XFA payloads. */
const HEX = "0123456789abcdef";

def(Uint8Array.prototype, "toHex", function () {
  let out = "";
  for (let i = 0; i < this.length; i++) {
    out += HEX[this[i] >> 4] + HEX[this[i] & 15];
  }
  return out;
});
def(Uint8Array, "fromHex", function (string) {
  if (string.length % 2 !== 0) {
    throw new SyntaxError("String should have an even number of characters");
  }
  const out = new Uint8Array(string.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(string.substr(i * 2, 2), 16);
    if (Number.isNaN(byte)) throw new SyntaxError("String contains non-hex characters");
    out[i] = byte;
  }
  return out;
});
def(Uint8Array.prototype, "setFromHex", function (string) {
  const src = Uint8Array.fromHex(string);
  const written = Math.min(src.length, this.length);
  this.set(src.subarray(0, written));
  return { read: written * 2, written };
});

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
def(Uint8Array.prototype, "setFromBase64", function (string) {
  const src = Uint8Array.fromBase64(string);
  const written = Math.min(src.length, this.length);
  this.set(src.subarray(0, written));
  return { read: string.length, written };
});

/* ── ArrayBuffer.prototype.transfer{,ToFixedLength} (Chrome 114 / Safari 17.4) ─
   Two unguarded worker call sites, both in the font-info compiler
   (`compileSystemFontInfo` / `compileFontInfo`), which over-allocates a buffer
   and then truncates it to the bytes actually written.

   The real method DETACHES the source; a polyfill cannot detach, so this copies
   instead. pdf.js drops the source on the next line in both call sites, so the
   observable result is identical — but do not reuse this shim anywhere that
   relies on the source becoming unusable. */
if (typeof globalThis.ArrayBuffer === "function") {
  const transferTo = function (newLength) {
    const len = newLength === undefined ? this.byteLength : newLength;
    const out = new ArrayBuffer(len);
    new Uint8Array(out).set(
      new Uint8Array(this, 0, Math.min(len, this.byteLength)),
    );
    return out;
  };
  def(ArrayBuffer.prototype, "transferToFixedLength", transferTo);
  def(ArrayBuffer.prototype, "transfer", transferTo);
}

/* ── Array.prototype.findLast/findLastIndex (Chrome 97 / Firefox 104 / Safari 15.4)
   One unguarded call site in the main-thread bundle, narrowing search params.
   Old enough that it is unlikely to be anyone's failure on its own — included
   because it is unguarded and free, on the same principle as the rest. */
def(Array.prototype, "findLast", function (predicate, thisArg) {
  for (let i = this.length - 1; i >= 0; i--) {
    if (predicate.call(thisArg, this[i], i, this)) return this[i];
  }
  return undefined;
});
def(Array.prototype, "findLastIndex", function (predicate, thisArg) {
  for (let i = this.length - 1; i >= 0; i--) {
    if (predicate.call(thisArg, this[i], i, this)) return i;
  }
  return -1;
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

/* ── {Array,String,TypedArray}.prototype.at (Chrome 92 / Firefox 90 / Safari 15.4)
   57 unguarded call sites across the two bundles — by count the most-used modern
   method in pdf.js. Almost every one is the `at(-1)` last-element idiom, in the
   shading, font and CMap parsers. Old enough that it is unlikely to be anyone's
   failure today, but it is unguarded and the polyfill is exact. */
{
  const at = function (index) {
    const len = this.length;
    const i = Math.trunc(index) || 0;
    const k = i < 0 ? len + i : i;
    return k < 0 || k >= len ? undefined : this[k];
  };
  for (const proto of [Array.prototype, String.prototype]) def(proto, "at", at);
  // All TypedArrays share one hidden prototype; patch it once via any instance.
  def(Object.getPrototypeOf(Uint8Array.prototype), "at", at);
}

/* ── String.prototype.replaceAll (Chrome 85 / Firefox 77 / Safari 13.1) ────────
   44 unguarded call sites. Old, but free to cover.

   Both branches delegate to the native `replace`, which matters: pdf.js calls
   this with FUNCTION replacements (`replaceAll(/-([a-zA-Z])/g, (e,t) => ...)`)
   and with `$`-substitution (`replaceAll(/\\(.)/g, "$1")`). A naive
   split(pattern).join(replacement) silently breaks both, so the string branch
   escapes the literal into a global RegExp and hands it to `replace` rather than
   reimplementing substitution. An empty pattern also behaves correctly that way
   — `new RegExp("", "g")` matches at every position, which is what the spec says. */
def(String.prototype, "replaceAll", function (pattern, replacement) {
  if (pattern instanceof RegExp) {
    if (!pattern.global) {
      throw new TypeError("replaceAll must be called with a global RegExp");
    }
    return this.replace(pattern, replacement);
  }
  const escaped = String(pattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return this.replace(new RegExp(escaped, "g"), replacement);
});

/* ── WeakRef / FinalizationRegistry (Chrome 84 / Firefox 79 / Safari 14.1) ─────
   One unguarded site each: a WeakRef around a cached canvas on the main thread,
   and a FinalizationRegistry that frees the qcms WASM colour transformer in the
   worker.

   Both fallbacks trade memory for not crashing, which is the right trade here:
   this WeakRef holds a STRONG reference, so the canvas it points at is never
   collected, and this FinalizationRegistry never fires, so the WASM transformer
   is never freed. On a browser this old that is a slow leak in a long session
   instead of a dead viewer. Do not reuse these where the weakness is load-bearing. */
if (typeof globalThis.WeakRef !== "function") {
  globalThis.WeakRef = function WeakRef(target) {
    this._target = target;
  };
  globalThis.WeakRef.prototype.deref = function () {
    return this._target;
  };
}
if (typeof globalThis.FinalizationRegistry !== "function") {
  globalThis.FinalizationRegistry = function FinalizationRegistry() {};
  globalThis.FinalizationRegistry.prototype.register = function () {};
  globalThis.FinalizationRegistry.prototype.unregister = function () {
    return false;
  };
}

/* ── DELIBERATELY NOT SHIMMED ──────────────────────────────────────────────────
   `structuredClone` (Chrome 98 / Firefox 94 / Safari 15.4) has 4 unguarded call
   sites in the main bundle, including LoopbackPort#postMessage. It is left alone
   on purpose: a faithful implementation has to handle cycles, Maps, Sets, typed
   arrays AND the `{transfer}` detach semantics, and a polyfill cannot detach at
   all. A subtly-wrong deep clone corrupts page data silently, which is strictly
   worse than the clear TypeError you get without one. Chrome 98 is Feb 2022, so
   this is below any browser we have evidence of. Revisit only if it is actually
   reported.

   Verified GUARDED by pdf.js itself, so intentionally absent: Float16Array
   (`isFloat16ArraySupported`), ImageDecoder (`isImageDecoderSupported`),
   OffscreenCanvas (`isOffscreenCanvasSupported`), crypto.randomUUID (typeof
   check), and Compression/DecompressionStream (inside try blocks). */
