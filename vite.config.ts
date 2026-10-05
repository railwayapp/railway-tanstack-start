import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    // Nitro produces a self-contained Node server in .output/ —
    // Railway runs it with `node .output/server/index.mjs`.
    nitro({
      // Static prerendering: /features is rendered to HTML at build time and
      // served as a static file. Everything else is server-rendered per request.
      prerender: { routes: ['/features'], crawlLinks: false },
    }),
  ],
})
