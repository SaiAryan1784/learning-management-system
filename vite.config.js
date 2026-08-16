import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Stamps one id into the bundle (`__BUILD_ID__`) and into a tiny unhashed
 * `build.json` beside it.
 *
 * This is what lets a running tab notice it is out of date. Vite fingerprints
 * every chunk, so a tab left open overnight keeps asking for chunk hashes that
 * no longer exist on the server — dynamic imports (the PDF viewer, every lazy
 * route) then fail silently and the page looks broken for no visible reason.
 * `build.json` is deliberately NOT content-hashed so the app can always fetch
 * it at a known path and compare.
 */
function buildIdPlugin() {
  const buildId = Date.now().toString(36);
  return {
    name: "lms-build-id",
    config: () => ({ define: { __BUILD_ID__: JSON.stringify(buildId) } }),
    generateBundle() {
      // Build only — in dev there is no build.json, the fetch 404s, and the
      // banner correctly never appears.
      this.emitFile({
        type: "asset",
        fileName: "build.json",
        source: JSON.stringify({ buildId }),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), buildIdPlugin()],
  resolve: {
    alias: [
      // Exact match — redirects `import toastr from "toastr"` to sonner wrapper.
      // Does NOT catch toastr/build/toastr.min.css (handled by removing that import).
      { find: /^toastr$/, replacement: path.resolve(__dirname, 'src/utils/toast.js') },
    ],
  },
})
