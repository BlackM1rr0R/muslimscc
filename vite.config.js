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

// ── PERFORMANS: "virtual:hadiths/<dil>" ──
// NƏ: hər dil üçün ayrıca hədis modulu (yalnız həmin dilin təkrarsız siyahısı +
// ərəbcə + mənbə + id + kateqoriya, alias cədvəli, birləşmə açarlarının həşi).
// Təkrarsızlaşdırma (bütün dillərin mətnindən asılıdır) BUILD ZAMANI
// src/utils/uniqueHadiths.js → buildHadithLangData() ilə hesablanır.
// NİYƏ: /hadith və axtarış əvvəl bütöv hadiths.js-i (~1.2 MB xam / ~400 KB
// gzip, 5 dil) yükləyib təkrarsızlaşdırmanı brauzerdə hesablayırdı; indi
// yalnız cari dil (ölçülüb: az/en/tr ~123 KB, ru ~135 KB, ar ~67 KB gzip). src/data/hadiths.js DƏYİŞMİR və qalır
// (Instagram skripti, mobil tətbiq, admin toxum paneli onu birbaşa oxuyur).
// Yükləyici: src/utils/hadithData.js. Chunk adı "hadiths-<dil>" (prerender
// /<dil>/hadith HTML-inə həmin chunk üçün modulepreload yazır).
const HADITH_PREFIX = 'virtual:hadiths/'
const HADITH_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
// + "virtual:hadiths/keys" — Firebase birləşməsi üçün açar həşləri (dildən asılı
// deyil, ~31 KB gzip; yalnız /hadith-də ilk boyamadan sonra yüklənir)
const HADITH_MODS = [...HADITH_LANGS, 'keys']
function hadithLangPlugin() {
  const files = ['src/data/hadiths.js', 'src/utils/uniqueHadiths.js'].map(f => path.resolve(f))
  const load = (f) => import(pathToFileURL(f).href + '?t=' + Date.now())
  let cache = null // hadiths.js + qurucular — bir build-də bütün modullar üçün bir dəfə yüklənir
  return {
    name: 'muslims-hadith-langs',
    buildStart() { cache = null },
    resolveId(id) {
      if (!id.startsWith(HADITH_PREFIX)) return null
      const lang = id.slice(HADITH_PREFIX.length)
      return HADITH_MODS.includes(lang) ? '\0' + id + '.js' : null
    },
    async load(id) {
      if (!id.startsWith('\0' + HADITH_PREFIX)) return null
      const lang = id.slice(1 + HADITH_PREFIX.length, -3)
      files.forEach(f => this.addWatchFile(f))
      if (!cache) {
        const [{ HADITHS }, { buildHadithLangData, buildHadithMergeKeys }] = await Promise.all(files.map(load))
        cache = { HADITHS, buildHadithLangData, buildHadithMergeKeys }
      }
      const data = lang === 'keys'
        ? cache.buildHadithMergeKeys(cache.HADITHS)
        : cache.buildHadithLangData(cache.HADITHS, lang)
      // JSON.parse böyük obyekt literalından tez parse olunur (V8 tövsiyəsi)
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(data))})`
    },
    handleHotUpdate({ file, server }) {
      if (!files.includes(path.resolve(file))) return
      cache = null
      for (const l of HADITH_MODS) {
        const mod = server.moduleGraph.getModuleById('\0' + HADITH_PREFIX + l + '.js')
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), dailyPoolsPlugin(), hadithLangPlugin()],

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
          // Hədis dil modulları: sabit ad "hadiths-<dil>" (prerender preload-u tapır)
          if (id.startsWith('\0' + HADITH_PREFIX)) return 'hadiths-' + id.slice(1 + HADITH_PREFIX.length, -3)
          if (!id.includes('node_modules')) return
          // Auth SDK yalnız admin girişində dinamik yüklənir (src/firebase/auth.js) —
          // ümumi "firebase" chunk-ına düşüb hər səhifəyə yük olmasın
          if (/[\\/]@?firebase[\\/]auth[\\/]/.test(id)) return 'firebase-auth'
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
