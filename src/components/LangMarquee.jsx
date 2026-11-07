// Dil zolağı (vau3.css §3): saytın bütün dilləri öz adları ilə, sonsuz sürüşən
// sıra. Hər ad həmin dildə ana səhifəyə (yalnız Quran olan dildə — Qurana)
// aparan həqiqi <a href>-dir; adi klik LangContext.setLang ilə (lüğət əvvəlcədən
// yüklənir, səhifə yanıb-sönmür). İkinci sıra yalnız vizual davamdır —
// aria-hidden, linkləri fokuslanmır (ekran oxuyucu siyahını bir dəfə eşidir).
import { memo } from 'react'
import { useLang } from '../contexts/LangContext'
import { LANGS, EXTRA_CODES, EXTRA_LANGS, hasPageInLang, pathFor } from '../seo/routes'

const CORE_NATIVE = { az: 'Azərbaycanca', en: 'English', ru: 'Русский', ar: 'العربية', tr: 'Türkçe' }

export const MARQUEE_LANGS = [
  ...LANGS.map(c => ({ code: c, name: CORE_NATIVE[c], dir: c === 'ar' ? 'rtl' : 'ltr' })),
  ...EXTRA_CODES.map(c => ({ code: c, name: EXTRA_LANGS[c].name, dir: EXTRA_LANGS[c].dir || 'ltr' })),
]

function plainClick(e) {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

function LangMarquee({ label, duration }) {
  const { siteLang, setLang } = useLang()
  const row = (hidden) => (
    <ul className="vx-marquee__row" aria-hidden={hidden || undefined}>
      {MARQUEE_LANGS.map(x => {
        const href = pathFor(hasPageInLang('home', x.code) ? 'home' : 'quran', x.code)
        return (
          <li key={x.code}>
            <a
              className="vx-marquee__item"
              href={href}
              hrefLang={x.code}
              lang={x.code}
              tabIndex={hidden ? -1 : undefined}
              aria-current={x.code === siteLang ? 'true' : undefined}
              onClick={(e) => { if (plainClick(e) && hasPageInLang('home', x.code)) { e.preventDefault(); setLang(x.code) } }}
            >
              <b aria-hidden="true">{x.code}</b>
              <span dir={x.dir}>{x.name}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
  return (
    <div className="vx-marquee" role="region" aria-label={label} style={duration ? { '--mq-dur': duration } : undefined}>
      <div className="vx-marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}

export default memo(LangMarquee)
