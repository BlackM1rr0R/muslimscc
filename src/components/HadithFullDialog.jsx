// ═══════════════════════════════════════════════════════
// HadithFullDialog — hədisin TAM mətni (isnadla ərəbcə) + tam tərcümə
//
// Mənbə: fawazahmed0/hadith-api (Unlicense) — scripts/build-hadith-full.mjs
// /data/hadith-full/<id>.json yaradır; mətnlər OLDUĞU KİMİDİR (tərcümə edilmir).
// Azərbaycan dilində tam tərcümə mənbəsi yoxdur — türkcə göstərilir (seçim:
// türkcə / ingiliscə / rusca, hansı varsa). Ravi: data/hadithNarrators.js.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import ReaderDialog from './reader/ReaderDialog'
export { FULL_T, narratorLine, hasFull } from '../utils/hadithFull'
import { FULL_T, narratorLine } from '../utils/hadithFull'
import { localizeSource } from '../utils/sourceNames'
import { pickUi } from '../utils/uiText'
import '../styles/HadithFull.css'

const TR_LABEL = { tr: 'Türkçe', en: 'English', ru: 'Русский' } // lang-ok: dilin öz adı (endonim)
const BOOK_AZ = { bukhari: 'Buxari', muslim: 'Muslim', tirmidhi: 'Tirmizi', abudawud: 'Əbu Davud', ibnmajah: 'İbn Macə', nasai: 'Nəsai' } // lang-ok: mənbə adı (localizeSource çevirir)

// İlkin tərcümə dili: rus → rus (yoxdursa ingilis), türk/az → türk, digərləri → ingilis
const defaultTr = (lang, d) => {
  const order = lang === 'ru' ? ['ru', 'en', 'tr'] : (lang === 'tr' || lang === 'az') ? ['tr', 'en', 'ru'] : ['en', 'tr', 'ru']
  return order.find(k => d?.[k]) || null
}

export default function HadithFullDialog({ id, lang, onClose, onPrev, onNext, position }) {
  const u = pickUi(FULL_T, lang, 'en')
  const [data, setData] = useState(null)
  const [err, setErr] = useState(false)
  const [trLang, setTrLang] = useState(null)
  useEffect(() => {
    if (id == null) return
    let live = true
    setData(null); setErr(false); setTrLang(null)
    fetch(`/data/hadith-full/${id}.json`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(d => { if (live) { setData(d); setTrLang(defaultTr(lang, d)) } })
      .catch(() => { if (live) setErr(true) })
    return () => { live = false }
  }, [id, lang])

  const narr = id != null ? narratorLine(id, lang) : null
  const ref = data ? localizeSource(`${BOOK_AZ[data.ref[0]]} ${data.ref[2]}`, lang) : ''
  const avail = data ? ['tr', 'en', 'ru'].filter(k => data[k]) : []
  return (
    <ReaderDialog
      open={id != null}
      onClose={onClose}
      labelledBy="hfull-title"
      onPrev={onPrev}
      onNext={onNext}
      position={position}
      labels={{ close: u.close, prev: u.prev, next: u.next }}
      className="hfull"
      contentKey={id}
      head={<h2 id="hfull-title" className="hfull__title">{u.title}</h2>}
    >
      <div className="hfull__body" data-testid="hadith-full">
        {(narr || ref) && (
          <p className="hfull__meta">
            {narr && <span><b>{u.narr}:</b> {narr}</span>}
            {ref && <span className="hfull__ref">{ref}</span>}
          </p>
        )}
        {!data && !err && <p className="hfull__loading">{u.loading}</p>}
        {err && <p className="hfull__err" role="alert">{u.err}</p>}
        {data && (
          <>
            <h3 className="hfull__h">{u.arH}</h3>
            <p className="hfull__ar ui-arabic" lang="ar" dir="rtl">{data.ar}</p>
            {lang !== 'ar' && trLang && (
              <>
                <div className="hfull__trhead">
                  <h3 className="hfull__h">{u.trH}</h3>
                  {avail.length > 1 && (
                    <div className="hfull__chips" role="group" aria-label={u.trH}>
                      {avail.map(k => (
                        <button key={k} type="button" className="hfull__chip" aria-pressed={trLang === k}
                          onClick={() => setTrLang(k)} lang={k}>{TR_LABEL[k]}</button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="hfull__tr" lang={trLang}>{data[trLang]}</p>
              </>
            )}
            <p className="hfull__note">{u.note}</p>
          </>
        )}
      </div>
    </ReaderDialog>
  )
}
