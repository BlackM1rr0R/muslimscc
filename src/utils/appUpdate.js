// ═══════════════════════════════════════════════════════
// Yeni versiya çıxanda açıq sayt / ana ekrandakı tətbiq özü yenilənsin
//
// Problem: iPhone-da ana ekrana əlavə olunmuş tətbiq arxa planda "yatır" —
// geri açılanda səhifə yenidən yüklənmir və deploydan sonra da köhnə versiya
// qalırdı (istifadəçi tətbiqi tam bağlayıb açmalı idi).
//
// Həll: hər build-in ID-si (__BUILD_ID__, vite.config.js) dist/version.json-a
// yazılır. Tətbiq ön plana qayıdanda və hər 30 dəqiqədə onu yoxlayır:
//   • fərqlidirsə və istifadəçi bu an heç nə yazmırsa — tətbiqə QAYIDAN anda
//     səssizcə yenilənir (oxucu yeri, ayarlar localStorage-dadır, itmir);
//   • istifadəçi nəsə yazırsa (forma, axtarış) — kəsmirik, "Yenilə" düyməli
//     kiçik bildiriş çıxır.
// Service worker-in özü də (public/sw.js) eyni anda yenilənməyə yoxlanılır.
// ═══════════════════════════════════════════════════════

/* global __BUILD_ID__ */
const CURRENT = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : ''
const CHECK_EVERY_MS = 30 * 60 * 1000
const MIN_GAP_MS = 60 * 1000            // ön plana hər qayıdışda deyil, ən çox dəqiqədə bir
const RELOAD_GUARD_KEY = 'qm-update-reload'

const TEXT = {
  az: { msg: 'Saytın yeni versiyası hazırdır', btn: 'Yenilə', close: 'Bağla' },
  en: { msg: 'A new version of the site is ready', btn: 'Update', close: 'Close' },
  ru: { msg: 'Доступна новая версия сайта', btn: 'Обновить', close: 'Закрыть' },
  ar: { msg: 'إصدار جديد من الموقع جاهز', btn: 'تحديث', close: 'إغلاق' },
  tr: { msg: 'Sitenin yeni sürümü hazır', btn: 'Güncelle', close: 'Kapat' },
}

let lastCheck = 0
let pending = false
let toastEl = null

async function latestBuild() {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return ''
    const j = await r.json()
    return typeof j.build === 'string' ? j.build : ''
  } catch { return '' }   // oflayn və s. — sakit keç
}

/** İstifadəçi bu an yazırmı (yeniləmə yazdığını itirməsin)? */
function userIsTyping() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  return tag === 'TEXTAREA' || el.isContentEditable ||
    (tag === 'INPUT' && !['button', 'checkbox', 'radio', 'range', 'submit'].includes(el.type))
}

function reloadOnce() {
  // Döngü qoruyucusu: eyni yeni versiyaya görə ikinci dəfə yeniləmə (məs.
  // CDN köhnə HTML verirsə) — onda yalnız bildiriş göstəririk
  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === pending) return false
    sessionStorage.setItem(RELOAD_GUARD_KEY, pending)
  } catch { /* yaddaş bağlıdır */ }
  window.location.reload()
  return true
}

function showToast() {
  if (toastEl || !document.body) return
  const lang = (document.documentElement.lang || 'az').slice(0, 2)
  const t = TEXT[lang] || TEXT.az
  toastEl = document.createElement('div')
  toastEl.className = 'ui-toast ui-toast--top qm-update-toast'
  toastEl.setAttribute('role', 'status')
  toastEl.innerHTML =
    '<div class="ui-toast__body"><strong class="ui-toast__title"></strong></div>' +
    '<div class="ui-toast__actions"><button type="button" class="ui-btn ui-btn--primary ui-btn--sm"></button></div>' +
    '<button type="button" class="ui-toast__close">×</button>'
  toastEl.querySelector('.ui-toast__title').textContent = t.msg
  const btn = toastEl.querySelector('.ui-btn')
  btn.textContent = t.btn
  btn.addEventListener('click', () => window.location.reload())
  const close = toastEl.querySelector('.ui-toast__close')
  close.setAttribute('aria-label', t.close)
  close.addEventListener('click', () => { toastEl?.remove(); toastEl = null })
  document.body.appendChild(toastEl)
}

async function check({ resumed = false } = {}) {
  if (!CURRENT || CURRENT.startsWith('local-') && import.meta.env.DEV) return
  const now = Date.now()
  if (now - lastCheck < MIN_GAP_MS) return
  lastCheck = now
  // Service worker faylı dəyişibsə onu da yenilə (push, keş qaydaları)
  navigator.serviceWorker?.getRegistration?.().then((reg) => reg?.update()).catch(() => {})
  const latest = await latestBuild()
  if (!latest || latest === CURRENT) return
  pending = latest
  if (resumed && !userIsTyping() && reloadOnce()) return
  showToast()
}

export function startUpdateWatcher() {
  if (typeof window === 'undefined' || !CURRENT) return
  // Tətbiq ön plana qayıdanda (iPhone PWA-da əsas hal)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check({ resumed: true })
  })
  // iOS səhifəni "bfcache"-dən bərpa edəndə
  window.addEventListener('pageshow', (e) => { if (e.persisted) check({ resumed: true }) })
  // Uzun müddət açıq qalan tab üçün
  setInterval(() => { if (document.visibilityState === 'visible') check() }, CHECK_EVERY_MS)
}
