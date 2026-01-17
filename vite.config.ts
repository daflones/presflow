import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { loadEnv } from 'vite'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.PORT || '3001'
  const backendTarget = env.VITE_BACKEND_URL || env.BACKEND_URL || `http://localhost:${backendPort}`

  const htmlCifrasDir = path.resolve(__dirname, 'html_cifras')

  const serveHtmlCifras = () => {
    return {
      name: 'serve-html-cifras',
      configureServer(server: any) {
        server.middlewares.use('/html_cifras', (req: any, res: any, next: any) => {
          const urlPath = String(req.url || '/')
          const rel = decodeURIComponent(urlPath.split('?')[0])
          const safeRel = rel.replace(/^\/+/, '')
          const filePath = path.join(htmlCifrasDir, safeRel)

          const tryPaths = [filePath]
          if (safeRel === '' || safeRel.endsWith('/')) {
            tryPaths.unshift(path.join(htmlCifrasDir, '(Setlist) 17-01-2026.html'))
          }

          for (const p of tryPaths) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) {
              const ext = path.extname(p).toLowerCase()
              const contentType =
                ext === '.html'
                  ? 'text/html; charset=utf-8'
                  : ext === '.css'
                    ? 'text/css; charset=utf-8'
                    : ext === '.js'
                      ? 'text/javascript; charset=utf-8'
                      : ext === '.txt'
                        ? 'text/plain; charset=utf-8'
                        : ext === '.png'
                          ? 'image/png'
                          : ext === '.jpg' || ext === '.jpeg'
                            ? 'image/jpeg'
                            : ext === '.svg'
                              ? 'image/svg+xml'
                              : ext === '.webp'
                                ? 'image/webp'
                                : 'application/octet-stream'

              res.setHeader('Cache-Control', 'no-cache')
              res.setHeader('Content-Type', contentType)
              return res.end(fs.readFileSync(p))
            }
          }

          return next()
        })
      },
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist', 'html_cifras')
        if (!fs.existsSync(htmlCifrasDir)) return

        fs.mkdirSync(outDir, { recursive: true })

        const copyRecursive = (src: string, dest: string) => {
          const st = fs.statSync(src)
          if (st.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true })
            for (const entry of fs.readdirSync(src)) {
              copyRecursive(path.join(src, entry), path.join(dest, entry))
            }
            return
          }
          fs.copyFileSync(src, dest)
        }

        copyRecursive(htmlCifrasDir, outDir)
      },
    }
  }

  return {
  plugins: [
    react(),
    serveHtmlCifras(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,txt,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, 
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/html_cifras\//],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/html_cifras/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'setlist-assets',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'vite.svg'],
      manifest: {
        name: 'LogiKon - Gestão para Igrejas',
        short_name: 'LogiKon',
        description: 'Plataforma de gestão para igrejas com automação inteligente.',
        theme_color: '#D4AF37',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      }
    }
  }
  }
})

