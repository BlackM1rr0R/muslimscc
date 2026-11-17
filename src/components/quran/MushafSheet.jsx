// ═══════════════════════════════════════════════════════
// Mushaf vərəqi (15 sətir) + səhifə məlumatı hooku — MushafPage və "Birlikdə oxu" otağı (ReadTogetherPage) üçün ortaq.
// Mətn və sətir düzülüşü: Quran.com API (utils/mushaf.js). Hər sözdə data-ak="<surə>:<ayə>" var —
// otaqda oxunan ayənin işarələnməsi bununla edilir.
// ═══════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { BASMALA_DISPLAY } from '../../utils/quranText'
import {
  MUSHAF_PAGES, juzForPage, surahsOnPage, surahInfo, hizbFromRub, layoutPage, isCenteredLine, fetchMushafPage, getCachedPage,
} from '../../utils/mushaf'

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
export const toArabicDigits = n => String(n).replace(/\d/g, d => AR_DIGITS[d])

/** Sətirləri konteynerə sığdırır: daşan sətrin şrift ölçüsünü azaldır */
function useFitLines(sheetRef, deps) {
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return undefined
    const fit = () => {
      const lines = sheet.querySelectorAll('.mp-line--words')
      lines.forEach(el => { el.style.fontSize = '' })
      lines.forEach(el => {
        const over = el.scrollWidth - el.clientWidth
        if (over > 1) {
          const base = parseFloat(getComputedStyle(el).fontSize)
          el.style.fontSize = `${Math.floor(base * (el.clientWidth / el.scrollWidth) * 0.98 * 10) / 10}px`
        }
      })
    }
    fit()
    let raf = 0
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit) }) : null
    ro?.observe(sheet)
    // Şrift gec yüklənərsə yenidən ölç
    document.fonts?.ready?.then(fit).catch(() => {})
    return () => { ro?.disconnect(); cancelAnimationFrame(raf) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Bir səhifənin məlumatı (keş → şəbəkə). enabled=false — heç nə yüklənmir. */
export function useMushafPage(p, wl, reload, enabled = true) {
  const [st, setSt] = useState(() => ({ p, data: enabled ? getCachedPage(p, wl) : null, error: null }))
  useEffect(() => {
    if (!enabled) return undefined
    let alive = true
    const hit = getCachedPage(p, wl)
    setSt({ p, data: hit, error: null })
    if (!hit) {
      fetchMushafPage(p, wl)
        .then(v => { if (alive) setSt({ p, data: v, error: null }) })
        .catch(e => { if (alive) setSt({ p, data: null, error: e?.kind || 'network' }) })
    }
    return () => { alive = false }
  }, [p, wl, reload, enabled])
  // Səhifə dəyişən kimi köhnə səhifənin məlumatı göstərilməsin
  return st.p === p ? st : { p, data: enabled ? getCachedPage(p, wl) : null, error: null }
}

/**
 * Bir mushaf vərəqi: başlıq (surə, cüz/hizb), 15 sətir, səhifə nömrəsi.
 * side: 'right' | 'left' | '' — açıq kitabda vərəqin tərəfi (kölgə, kənar).
 */
export function MushafSheet({ page, data, error, prefs, sel, onWordClick, L, onRetry, side = '' }) {
  const sheetRef = useRef(null)
  const lines = useMemo(() => (data ? layoutPage(data.words, page) : null), [data, page])
  useFitLines(sheetRef, [lines, prefs.tajweed])
  const juz = data?.juz || juzForPage(page)
  const hz = hizbFromRub(data?.rub)
  const headerSurah = data?.words?.[0]?.s || surahsOnPage(page)[0]
  const label = `${L.page} ${page} ${L.of} ${MUSHAF_PAGES} · ${L.juz} ${juz}`
  return (
    <article className={`mp-sheet${prefs.tajweed ? ' is-tajweed' : ''}${prefs.wbw ? ' is-wbw' : ''}${side ? ` mp-sheet--${side}` : ''}`}
      aria-label={label} aria-busy={!data && !error}>
      <div className="mp-sheet__head" dir="rtl">
        <span className="mp-sheet__surah ui-arabic" lang="ar">{headerSurah ? `سورة ${surahInfo(headerSurah)?.ar}` : ''}</span>
        <span className="mp-sheet__juz" dir="auto">
          {L.juz} <span className="ui-num">{juz}</span>
          {hz && <> · {L.hizb} <span className="ui-num">{hz.hizb}</span>{hz.quarter ? ` ${L.quarter[hz.quarter]}` : ''}</>}
        </span>
      </div>

      <div className="mp-sheet__body" ref={sheetRef} lang="ar" dir="rtl">
        {error && !data && (
          <div className="mp-error" role="alert">
            <span className="ui-icon-tile ui-icon-tile--lg" aria-hidden="true"><Icon name="quran" /></span>
            <p>{error === 'offline' ? L.offline : L.error}</p>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={onRetry}>
              <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
            </button>
          </div>
        )}
        {!data && !error && <MushafSkeleton label={L.loading} />}
        {lines && lines.map(line => {
          if (line.kind === 'header') {
            return (
              <div key={line.n} className="mp-line mp-line--header">
                <span className="mp-surah-title ui-arabic">سورة {surahInfo(line.surah)?.ar}</span>
              </div>
            )
          }
          if (line.kind === 'basmala') {
            return <div key={line.n} className="mp-line mp-line--basmala ui-arabic">{BASMALA_DISPLAY}</div>
          }
          if (line.kind === 'blank') return <div key={line.n} className="mp-line mp-line--blank" aria-hidden="true" />
          return (
            <div key={line.n} className={`mp-line mp-line--words${isCenteredLine(line, page) ? ' is-centered' : ''}`}>
              {line.words.map(w => {
                if (w.type === 'end') {
                  return <span key={`${w.key}-e`} className="mp-end" aria-label={w.key} data-ak={w.key}>{toArabicDigits(w.a)}</span>
                }
                const active = sel && sel.w.key === w.key && sel.w.p === w.p
                const content = prefs.tajweed && w.tj
                  ? <span className="mp-word__t" dangerouslySetInnerHTML={{ __html: w.tj }} />
                  : <span className="mp-word__t">{w.text}</span>
                return prefs.wbw ? (
                  <button key={`${w.key}-${w.p}`} type="button" className={`mp-word${active ? ' is-active' : ''}`} data-wk={`${w.key}:${w.p}`} data-ak={w.key}
                    aria-expanded={active} aria-label={w.tr ? `${w.text} — ${w.tr}` : w.text} onClick={onWordClick(w)}>
                    {content}
                  </button>
                ) : (
                  <span key={`${w.key}-${w.p}`} className="mp-word" data-wk={`${w.key}:${w.p}`} data-ak={w.key}>{content}</span>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="mp-sheet__foot" aria-hidden="true">
        <span className="mp-sheet__num ui-arabic">{toArabicDigits(page)}</span>
      </div>
    </article>
  )
}

function MushafSkeleton({ label }) {
  return (
    <div className="mp-skel" role="status" aria-label={label}>
      {Array.from({ length: 15 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--text mp-skel__line" />)}
    </div>
  )
}

