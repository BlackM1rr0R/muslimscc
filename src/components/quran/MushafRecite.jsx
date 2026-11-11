// ═══════════════════════════════════════════════════════
// MushafRecite (v6.1) — Mushafda canlı qiraət: qari oxuduqca söz qızılı parlayır (/mushaf)
//
//   <MushafRecite pages={[3, 4]} words={[…]} stageRef={ref} lang="az" wbw={false}
//                 canNext={true} onNextPage={() => …} />
//
// • Söz vaxtları və səs — Quran.com API v4 (/recitations/7/by_page/{səhifə}?fields=segments,
//   Mişari əl-Əfasi; səs verses.quran.com-dan oxunur, saytda saxlanmır). utils/mushafRecite.js.
// • Oxunan söz [data-wk="s:a:p"] — .is-rc-word, ayə [data-ak] — .is-rc-ayah (MushafPage sözləri).
// • Səhifə bitəndə vərəq özü çevrilir ("Vərəqi özü çevir") və qiraət yeni səhifədən davam edir.
//   İstifadəçi özü vərəqləsə də qiraət həmin səhifədən başlayır. Sözə toxunmaq — oradan oxu
//   ("Söz-söz" rejimində toxunuş tərcüməni açır, qiraəti yox).
// • Oxunan söz ekrandan çıxanda səhifə yumşaq sürüşür (istifadəçi özü sürüşdürübsə — 4 s gözləyir).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { buildPageTimings, pageVerses, wordAtMs, startOf } from '../../utils/mushafRecite'
import '../../styles/MushafRecite.css'

const API = 'https://api.quran.com/api/v4'
const T = {
  az: { btn: 'Canlı qiraət', reciter: 'Mişari əl-Əfasi', play: 'Davam et', pause: 'Dayandır', close: 'Bağla', loading: 'Yüklənir…', err: 'Qiraəti yükləmək alınmadı. İnterneti yoxlayıb yenidən cəhd edin.', retry: 'Yenidən', auto: 'Vərəqi özü çevir', ayah: 'Ayə', done: 'Səhifə bitdi', hint: 'Sözə toxunun — qiraət oradan başlasın.', src: 'Səs və söz vaxtları: Quran.com' },
  en: { btn: 'Live recitation', reciter: 'Mishary al-Afasy', play: 'Resume', pause: 'Pause', close: 'Close', loading: 'Loading…', err: 'Could not load the recitation. Check your connection and try again.', retry: 'Retry', auto: 'Turn pages automatically', ayah: 'Ayah', done: 'Page finished', hint: 'Tap a word to recite from there.', src: 'Audio and word timings: Quran.com' },
  // lang-ok[Quran]: sayt adı (Quran.com)
  ru: { btn: 'Живое чтение', reciter: 'Мишари аль-Афаси', play: 'Продолжить', pause: 'Пауза', close: 'Закрыть', loading: 'Загрузка…', err: 'Не удалось загрузить чтение. Проверьте соединение и попробуйте снова.', retry: 'Повторить', auto: 'Листать автоматически', ayah: 'Аят', done: 'Страница прочитана', hint: 'Коснитесь слова — чтение начнётся с него.', src: 'Аудио и тайминги слов: Quran.com' },
  // lang-ok[Quran]: sayt adı (Quran.com)
  ar: { btn: 'تلاوة حيّة', reciter: 'مشاري العفاسي', play: 'تابع', pause: 'إيقاف', close: 'إغلاق', loading: 'جارٍ التحميل…', err: 'تعذّر تحميل التلاوة. تحقّق من الاتصال وحاول مجددًا.', retry: 'أعد المحاولة', auto: 'قلّب الصفحات تلقائيًا', ayah: 'الآية', done: 'انتهت الصفحة', hint: 'المس كلمة لتبدأ التلاوة منها.', src: 'الصوت وتوقيت الكلمات: Quran.com' },
  // lang-ok[Quran]: sayt adı (Quran.com)
  tr: { btn: 'Canlı tilavet', reciter: 'Mişari el-Afasi', play: 'Devam', pause: 'Duraklat', close: 'Kapat', loading: 'Yükleniyor…', err: 'Tilavet yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar', auto: 'Sayfayı kendisi çevirsin', ayah: 'Âyet', done: 'Sayfa bitti', hint: 'Bir kelimeye dokunun — tilavet oradan başlasın.', src: 'Ses ve kelime zamanlamaları: Quran.com' },
}
const cache = new Map()   // səhifə → Promise<Map>
const loadPage = (p) => {
  if (!cache.has(p)) {
    cache.set(p, fetch(`${API}/recitations/7/by_page/${p}?fields=segments&per_page=50`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status))).then(buildPageTimings)
      .catch(e => { cache.delete(p); throw e }))
  }
  return cache.get(p)
}
const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user') } catch { return false } }

export default function MushafRecite({ pages, words, stageRef, lang = 'az', wbw = false, canNext, onNextPage }) {
  const t = pickUi(T, lang)
  const [on, setOn] = useState(false)
  const [state, setState] = useState('idle')   // idle | loading | playing | paused | done | error
  const [auto, setAuto] = useState(() => { try { return localStorage.getItem('mushaf_recite_auto') !== '0' } catch { return true } })
  const [curKey, setCurKey] = useState(null)
  const verses = useMemo(() => pageVerses(words), [words])
  const pagesKey = pages.filter(Boolean).join(',')
  const R = useRef({ audio: null, queue: [], idx: 0, tim: new Map(), lastW: null, raf: 0, pending: false, userScroll: 0, live: false })
  const live = useRef({}); live.current = { auto, canNext, onNextPage, wbw, verses, pagesKey }

  const book = () => stageRef.current?.querySelector('.mp-book')
  const clearMarks = () => { book()?.querySelectorAll('.is-rc-word, .is-rc-ayah').forEach(el => el.classList.remove('is-rc-word', 'is-rc-ayah')) }
  const markAyah = (key) => { clearMarks(); book()?.querySelectorAll(`[data-ak="${key}"]`).forEach(el => el.classList.add('is-rc-ayah')) }
  const markWord = (key, pos) => {
    const b = book(); if (!b) return
    b.querySelector('.is-rc-word')?.classList.remove('is-rc-word')
    const el = b.querySelector(`[data-wk="${key}:${pos}"]`)
    if (!el) return
    el.classList.add('is-rc-word')
    if (Date.now() - R.current.userScroll < 4000) return
    const r = el.getBoundingClientRect(), vh = window.innerHeight
    if (r.top < 70 || r.bottom > vh - 110) window.scrollBy({ top: r.top - vh * 0.38, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  const stopLoop = () => cancelAnimationFrame(R.current.raf)
  const loop = useCallback(() => {
    const S = R.current
    cancelAnimationFrame(S.raf)
    const v = S.queue[S.idx], tm = v && S.tim.get(v.key)
    if (tm && S.audio && !S.audio.paused) {
      const pos = wordAtMs(tm.segs, S.audio.currentTime * 1000)
      if (pos != null && pos !== S.lastW) { S.lastW = pos; markWord(v.key, pos) }
    }
    S.raf = requestAnimationFrame(loop)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const playIdx = useCallback((i, fromPos = null) => {
    const S = R.current
    const v = S.queue[i], tm = v && S.tim.get(v.key)
    if (!v) { setState('done'); return }
    if (!tm) { playIdx(i + 1); return }     // vaxtı olmayan ayə — keç
    S.idx = i; S.lastW = null
    const a = S.audio
    const at = fromPos ? startOf(tm.segs, fromPos) / 1000 : 0
    if (a.src !== tm.url) { a.src = tm.url; if (at) a.addEventListener('loadedmetadata', () => { a.currentTime = at }, { once: true }) } else a.currentTime = at
    setCurKey(v.key); markAyah(v.key)
    setState('playing')
    a.play().then(() => loop()).catch((e) => { if (e?.name !== 'AbortError') setState('error') })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop])

  const ensureAudio = () => {
    const S = R.current
    if (S.audio) return S.audio
    const a = new Audio(); a.preload = 'auto'
    a.addEventListener('ended', () => {
      const L = live.current
      if (S.idx + 1 < S.queue.length) { playIdx(S.idx + 1); return }
      stopLoop(); clearMarks()
      if (L.auto && L.canNext) { S.pending = true; setState('loading'); L.onNextPage?.() } else setState('done')
    })
    a.addEventListener('error', () => { if (S.live) setState('error') })
    S.audio = a
    return a
  }

  const begin = useCallback(async (startKey = null, startPos = null) => {
    const S = R.current
    ensureAudio(); S.live = true
    setState('loading')
    const ps = live.current.pagesKey.split(',').map(Number).filter(Boolean)
    try {
      const maps = await Promise.all(ps.map(loadPage))
      if (!S.live || live.current.pagesKey !== ps.join(',')) return
      S.tim = new Map(maps.flatMap(m => [...m])); S.qPages = ps.join(',')
      S.queue = live.current.verses
      const i = startKey ? Math.max(0, S.queue.findIndex(v => v.key === startKey)) : 0
      playIdx(i, startKey ? startPos : null)
      // növbəti səhifəni qabaqcadan yüklə
      const nx = Math.max(...ps) + 1; if (nx <= 604) loadPage(nx).catch(() => {})
    } catch { if (S.live) setState('error') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playIdx])

  // Səhifə dəyişdi: avtomatik çevrilmə və ya istifadəçi vərəqlədi — oxuyurdusa yeni səhifədən davam
  useEffect(() => {
    const S = R.current
    if (!S.live || !verses.length) return
    const changed = S.qPages !== pagesKey
    if (changed && (S.pending || state === 'playing' || state === 'loading')) {
      S.pending = false; S.qPages = pagesKey
      S.audio?.pause(); stopLoop()
      // DOM yeni səhifəni çəkdikdən sonra
      const id = setTimeout(() => begin(), 60)
      return () => clearTimeout(id)
    }
    // eyni səhifə, sözlər sonradan gəldi (iki səhifəli görünüşdə sol vərəq) — növbəni yenilə
    const k = S.queue[S.idx]?.key
    S.queue = verses
    const j = verses.findIndex(v => v.key === k); if (j >= 0) S.idx = j
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagesKey, verses])

  // Sözə toxunuş — oradan oxu (Söz-söz rejimində yox)
  useEffect(() => {
    const st = stageRef.current
    if (!on || !st) return undefined
    const onClick = (e) => {
      if (live.current.wbw) return
      const el = e.target.closest?.('[data-wk]'); if (!el || !st.querySelector('.mp-book')?.contains(el)) return
      const [s, a, p] = el.getAttribute('data-wk').split(':')
      begin(`${s}:${a}`, Number(p))
    }
    st.addEventListener('click', onClick)
    return () => st.removeEventListener('click', onClick)
  }, [on, stageRef, begin])
  useEffect(() => {
    if (!on) return undefined
    const mark = () => { R.current.userScroll = Date.now() }
    window.addEventListener('wheel', mark, { passive: true }); window.addEventListener('touchmove', mark, { passive: true })
    return () => { window.removeEventListener('wheel', mark); window.removeEventListener('touchmove', mark) }
  }, [on])
  useEffect(() => () => { const S = R.current; S.live = false; S.audio?.pause(); cancelAnimationFrame(S.raf) }, [])

  const start = () => { setOn(true); begin() }
  const toggle = () => {
    const S = R.current
    if (state === 'playing') { S.audio?.pause(); stopLoop(); setState('paused'); return }
    if (state === 'paused') { S.audio?.play().then(() => { setState('playing'); loop() }).catch(() => setState('error')); return }
    begin()
  }
  const close = () => { const S = R.current; S.live = false; S.pending = false; S.audio?.pause(); stopLoop(); clearMarks(); setOn(false); setState('idle'); setCurKey(null) }
  const setAutoP = () => setAuto(v => { try { localStorage.setItem('mushaf_recite_auto', v ? '0' : '1') } catch { /* */ } return !v })

  const status = state === 'loading' ? t.loading : state === 'error' ? t.err : state === 'done' ? t.done : curKey ? `${t.ayah} ${curKey}` : ''
  return (
    <>
      <button type="button" className="ui-chip mp-rc-chip" aria-pressed={on} onClick={on ? close : start} data-testid="mushaf-recite">
        <Icon name={on ? 'close' : 'volume'} size={16} /> {t.btn}
      </button>
      {on && (
        <div className="mp-rc-bar" role="region" aria-label={t.btn} data-testid="mushaf-recite-bar">
          <span className={`mp-rc-bar__wave${state === 'playing' ? ' is-on' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="mp-rc-bar__txt">
            <b>{t.reciter}</b>
            <span aria-live="polite" data-testid="mushaf-recite-status" dir="auto">{status}</span>
          </span>
          {state === 'error' ? (
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => begin(curKey)}><Icon name="refresh" className="ui-btn__icon" />{t.retry}</button>
          ) : (
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm mp-rc-bar__play" onClick={toggle} disabled={state === 'loading'} aria-label={state === 'playing' ? t.pause : t.play} data-testid="mushaf-recite-toggle">
              <Icon name={state === 'playing' ? 'pause' : 'play'} className="ui-btn__icon" />{state === 'playing' ? t.pause : t.play}
            </button>
          )}
          <label className="mp-rc-bar__auto"><input type="checkbox" checked={auto} onChange={setAutoP} /> {t.auto}</label>
          <button type="button" className="ui-icon-btn mp-rc-bar__x" onClick={close} aria-label={t.close} title={t.close}><Icon name="close" size={16} /></button>
          <small className="mp-rc-bar__src">{wbw ? '' : `${t.hint} · `}{t.src}</small>
        </div>
      )}
    </>
  )
}
