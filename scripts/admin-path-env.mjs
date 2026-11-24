// ═══════════════════════════════════════════════════════
// Prerender (Node) üçün: gizli admin ünvanı VITE_ADMIN_PATH-i Vite-in oxuduğu eyni .env
// fayllarından (.env, .env.production, .env.production.local …) process.env-ə yaz.
// scripts/prerender.mjs bunu src/seo/routes.js-dən ƏVVƏL idxal edir (ESM idxalları sırayla
// icra olunur) — beləcə brauzer paketi ilə statik fayllar (dist/<gizli>/index.html) eyni
// ünvanı görür. Dəyər çap OLUNMUR. Mühitdə artıq varsa (process.env) — o üstündür.
// ═══════════════════════════════════════════════════════
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
if (!process.env.VITE_ADMIN_PATH) {
  const env = loadEnv(process.env.PRERENDER_MODE || 'production', ROOT, 'VITE_ADMIN_PATH')
  if (env.VITE_ADMIN_PATH) process.env.VITE_ADMIN_PATH = env.VITE_ADMIN_PATH
}
