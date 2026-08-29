import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/PdfMerge/',
  plugins: [react()],
  /* The repo lives on a Windows mount, where inotify never fires: without polling, HMR silently serves stale modules. */
  server: { watch: { usePolling: true } },
})
