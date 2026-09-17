import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * The build writes a 640px copy of every picture next to it (scripts/make-image-sizes.mjs) and the
 * cards ask the browser for `name@640.jpg`. Those copies only exist in dist, so during `npm run dev`
 * the request would 404 and the card would show a broken image. Here the dev server answers such a
 * request with the original file — same picture, just not resized, which is all dev needs.
 */
function smallImagesInDev(): Plugin {
  return {
    name: 'gnc-small-images-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const m = req.url?.match(/^(\/img\/.+)@640(\.(?:jpe?g|png))(\?.*)?$/i)
        if (m) req.url = m[1] + m[2] + (m[3] ?? '')
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), smallImagesInDev()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
