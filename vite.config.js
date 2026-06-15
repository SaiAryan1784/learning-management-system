import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Exact match — redirects `import toastr from "toastr"` to sonner wrapper.
      // Does NOT catch toastr/build/toastr.min.css (handled by removing that import).
      { find: /^toastr$/, replacement: path.resolve(__dirname, 'src/utils/toast.js') },
    ],
  },
})
