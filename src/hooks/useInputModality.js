// ═══════════════════════════════════════════════════════
// Giriş üsulu (barmaq/siçan və ya klaviatura) — fokus halqası üçün
//
// PROBLEM (sahibin göstərdiyi): telefonda "Sıfırla" düyməsinə toxunanda
// window.confirm() bağlanır, fokus düyməyə qayıdır və brauzer bunu
// :focus-visible sayır — düymənin ətrafında qalın narıncı/rəngli halqa
// qalırdı. Brauzerin evristikası pəncərə/dialoqdan sonra yanılır.
//
// HƏLL: son qarşılıqlı əlaqəni izləyirik və <html>-ə sinif yazırıq:
//   html.qm-input-pointer   — son hərəkət toxunuş/siçan idi → halqa YOX
//   html.qm-input-keyboard  — son hərəkət Tab/ox/Enter idi → yumşaq halqa
// motion.css halqanı yalnız klaviatura rejimində göstərir. Əlçatanlıq
// panelinin "Fokusu vurğula" seçimi (html.a11y-highlight-focus) həmişə qalib gəlir.
// ═══════════════════════════════════════════════════════

const NAV_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Home', 'End', 'PageUp', 'PageDown'])

let started = false

export function initInputModality() {
  if (started || typeof window === 'undefined') return
  started = true
  const root = document.documentElement
  let mode = ''
  const set = (m) => {
    if (m === mode) return
    mode = m
    root.classList.toggle('qm-input-pointer', m === 'pointer')
    root.classList.toggle('qm-input-keyboard', m === 'keyboard')
  }
  // Susmaya görə: toxunma ekranında barmaq, qalanında klaviatura (ehtiyatlı seçim)
  try {
    set(window.matchMedia('(hover: none) and (pointer: coarse)').matches ? 'pointer' : 'keyboard')
  } catch {
    set('keyboard')
  }
  window.addEventListener('pointerdown', () => set('pointer'), { capture: true, passive: true })
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (NAV_KEYS.has(e.key)) set('keyboard')
  }, { capture: true })
}

export default initInputModality
