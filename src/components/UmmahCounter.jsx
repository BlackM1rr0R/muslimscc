// ═══════════════════════════════════════════════════════
// UmmahCounter — "Ümmət bu gün" (/dhikr): saytda bu gün birlikdə deyilən salavat, zikr və oxunan cüz
//
//   <UmmahCounter lang="az" />
//
// • Rəqəmlər server/ummah.js-dən (anonim cəm), 20 s-dən bir yenilənir; siz toxunduqca
//   (utils/ummah.ummahAdd) dərhal artır — dalğa animasiyası (transform/opacity, bir dəfəlik).
// • "Mənim toxunuşlarım sayılmasın" — söndürmək mümkündür (yalnız bu cihazda).
// Stillər: src/styles/UmmahCounter.css
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import Icon from './Icon'
import { fetchUmmah, pendingUmmah, UMMAH_OFF_KEY } from '../utils/ummah'
import '../styles/UmmahCounter.css'

const T = {
  az: { title: 'Ümmət bu gün', lead: 'Saytda bu gün birlikdə deyilən zikrlər — kimin nə dediyi saxlanmır, yalnız ümumi say.', salawat: 'salavat', dhikr: 'zikr', juz: 'oxunan cüz', total: (n) => `İndiyə qədər: ${n}`, opt: 'Mənim toxunuşlarım sayılmasın', err: 'Sayğacı yükləmək alınmadı.' },
  en: { title: 'The ummah today', lead: 'Remembrance said together on the site today — nobody’s actions are stored, only the total.', salawat: 'salawat', dhikr: 'dhikr', juz: 'juz read', total: (n) => `All time: ${n}`, opt: 'Don’t count my taps', err: 'Could not load the counter.' },
  ru: { title: 'Умма сегодня', lead: 'Зикры, сказанные вместе на сайте сегодня, — кто что сказал, не сохраняется, только общий счёт.', salawat: 'салаватов', dhikr: 'зикров', juz: 'прочитано джузов', total: (n) => `Всего: ${n}`, opt: 'Не учитывать мои нажатия', err: 'Не удалось загрузить счётчик.' },
  tr: { title: 'Ümmet bugün', lead: 'Sitede bugün birlikte söylenen zikirler — kimin ne dediği saklanmaz, yalnızca toplam.', salawat: 'salavat', dhikr: 'zikir', juz: 'okunan cüz', total: (n) => `Bugüne kadar: ${n}`, opt: 'Dokunuşlarım sayılmasın', err: 'Sayaç yüklenemedi.' },
  ar: { title: 'الأمة اليوم', lead: 'الأذكار التي قيلت معًا على الموقع اليوم — لا يُحفظ من قال ماذا، بل المجموع فقط.', salawat: 'صلاة على النبي', dhikr: 'ذكر', juz: 'جزء مقروء', total: (n) => `المجموع: ${n}`, opt: 'لا تحتسب لمساتي', err: 'تعذّر تحميل العدّاد.' },
}
const ICON = { salawat: 'sparkle', dhikr: 'dhikr', juz: 'quran' }
const fmt = (n, lang) => Number(n || 0).toLocaleString(lang === 'ar' ? 'ar-u-nu-latn' : lang)

export default function UmmahCounter({ lang = 'az' }) {
  const t = T[lang] || T.az
  const [data, setData] = useState(null)
  const [err, setErr] = useState(false)
  const [mine, setMine] = useState(() => pendingUmmah())
  const [pulse, setPulse] = useState(0)
  const [off, setOff] = useState(() => { try { return localStorage.getItem(UMMAH_OFF_KEY) === '1' } catch { return false } })

  useEffect(() => {
    let alive = true
    const load = () => fetchUmmah().then(d => { if (alive) { setData(d); setErr(false); setMine(pendingUmmah()) } }).catch(() => alive && setErr(true))
    load()
    const id = setInterval(() => { if (document.visibilityState === 'visible') load() }, 20000)
    const onFlush = () => setTimeout(load, 800)
    window.addEventListener('qm-ummah', onFlush)
    // Toxunuşlar hələ göndərilməyibsə də ekranda dərhal artsın
    const tick = setInterval(() => {
      const p = pendingUmmah()
      setMine(m => { if (m.salawat !== p.salawat || m.dhikr !== p.dhikr || m.juz !== p.juz) { setPulse(x => x + 1); return p } return m })
    }, 400)
    return () => { alive = false; clearInterval(id); clearInterval(tick); window.removeEventListener('qm-ummah', onFlush) }
  }, [])

  const toggleOff = (v) => { setOff(v); try { if (v) localStorage.setItem(UMMAH_OFF_KEY, '1'); else localStorage.removeItem(UMMAH_OFF_KEY) } catch { /* */ } }

  return (
    <section className="ui-card um" aria-labelledby="um-title" data-testid="ummah-counter">
      <span className="um__wave" key={pulse} aria-hidden="true" />
      <div className="um__head">
        <h2 id="um-title" className="um__title"><Icon name="globe" size={18} /> {t.title}</h2>
        <p className="um__lead">{t.lead}</p>
      </div>
      {err && !data ? <p className="um__lead" role="alert">{t.err}</p> : (
        <ul className="um__stats">
          {['salawat', 'dhikr', 'juz'].map(k => (
            <li key={k} className="um__stat">
              <Icon name={ICON[k]} size={20} />
              <b className="ui-num" data-testid={`ummah-${k}`}>{data ? fmt((data.today?.[k] || 0) + (mine[k] || 0), lang) : '…'}</b>
              <span>{t[k]}</span>
              {data && <small className="ui-num">{t.total(fmt((data.total?.[k] || 0) + (mine[k] || 0), lang))}</small>}
            </li>
          ))}
        </ul>
      )}
      <label className="um__opt">
        <input type="checkbox" checked={off} onChange={e => toggleOff(e.target.checked)} /> {t.opt}
      </label>
    </section>
  )
}
