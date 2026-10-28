import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { pathToFileURL } from 'url'

// ── PERFORMANS: "virtual:daily-pools" ──
// NƏ: ana səhifənin "Günün xatırlatmaları" zolağı (DailyReminderBar) üçün
// hovuzlar build zamanı src/data/quotes.js + duas.js-dən hesablanır
// (src/utils/dailyPools.js) və kiçik JSON modulu kimi verilir.
// NİYƏ: əvvəl zolaq ana səhifədə bütöv quotes (~56 KB gzip) + duas (~16 KB
// gzip) chunk-larını yükləyirdi; hovuz modulu ~40 KB gzip-dir, quotes/duas
// chunk-ları isə yalnız onlara ehtiyacı olan səhifələrdə yüklənir.
// Data faylları DƏYİŞMİR. Dev-də fayl dəyişəndə modul yenidən qurulur.
const DAILY_POOLS_ID = 'virtual:daily-pools'
function dailyPoolsPlugin() {
  const resolved = '\0' + DAILY_POOLS_ID
  const files = ['src/data/quotes.js', 'src/data/duas.js', 'src/utils/dailyPools.js'].map(f => path.resolve(f))
  // Node ESM keşini aşmaq üçün sorğu sətri (dev-də dəyişiklik görünsün)
  const load = (f) => import(pathToFileURL(f).href + '?t=' + Date.now())
  return {
    name: 'muslims-daily-pools',
    resolveId(id) { return id === DAILY_POOLS_ID ? resolved : null },
    async load(id) {
      if (id !== resolved) return null
      files.forEach(f => this.addWatchFile(f))
      const [{ QUOTES }, { DUAS_DATA }, { buildDailyPools }] = await Promise.all(files.map(load))
      const pools = buildDailyPools(QUOTES, DUAS_DATA)
      return Object.entries(pools)
        .map(([k, v]) => `export const ${k} = JSON.parse(${JSON.stringify(JSON.stringify(v))})`)
        .join('\n')
    },
    handleHotUpdate({ file, server }) {
      if (files.includes(path.resolve(file))) {
        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), dailyPoolsPlugin()],

  // Firebase ilə yalnız bir React nüsxəsi olsun deyə
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'firebase/app',
      'firebase/firestore',
    ],
  },

  build: {
    // PERFORMANS: .vite/manifest.json — scripts/prerender.mjs hər marşrutun HTML-inə
    // həmin səhifənin chunk-ı və CSS-i üçün preload yazmaq üçün oxuyur (bax orada).
    // Fayl nöqtəli qovluqdadır — nginx onu vermir (location ~ /\.).
    manifest: true,
    rollupOptions: {
      output: {
        // Vendor kitabxanalarini ayrica chunk-a cixar: bunlar nadir deyisir,
        // ona gore brauzer kesi deploy-dan deploy-a saxlanilir.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase'
          if (id.includes('react-router')) return 'router'
          if (id.includes('/react/') || id.includes('/react-dom/') ||
              id.includes('scheduler')) return 'react'
        },
      },
    },
    // Chunk-lar artiq bolundukden sonra xebardarliq hedd-i realdir
    chunkSizeWarningLimit: 700,
  },

  server: {
    port: 5173,
    strictPort: false,
    hmr: { overlay: true },
  },
})
