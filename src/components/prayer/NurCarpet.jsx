// ═══════════════════════════════════════════════════════
// NurCarpet — "Nur xalçası": ilin bütün namazları bir xalçada (/prayer-tracker)
//
//   <NurCarpet snap={snap} periods={periods} today="2026-11-05" lang="az" onPick={(date) => …} />
//
// • 12 ay = 12 zolaq; hər zolaqda gün sütunları, hər sütunda 5 ilmə (sübh → işa).
// • Qılınan namaz — qızıl ilmə (nur), qəza — firuzəyi, üzrlü gün — solğun
//   bənövşəyi (cəza deyil), qılınmayan — tünd, gələcək günlər — çox solğun.
// • Kənarda xalça haşiyəsi (həndəsi naxış). Sütuna toxunuş — həmin gün açılır (onPick).
// • SVG (≈1860 ilmə), yalnız bu cihazdakı məlumat. Stillər: src/styles/NurCarpet.css
// ═══════════════════════════════════════════════════════
import { memo, useMemo } from 'react'
import { PRAYERS, prayerStatus, excusedPeriod, monthDays } from '../../utils/prayerTracker'
import '../../styles/NurCarpet.css'

const T = {
  az: { title: 'Nur xalçası', lead: (y) => `${y}-ci ilin bütün namazları: hər sütun bir gün, hər ilmə bir namaz.`, prayed: 'qılındı', qada: 'qəza', excused: 'üzrlü', none: 'qeyd yoxdur', sum: (n, y) => `${y}: ${n} namaz qılındı`, months: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sent', 'Okt', 'Noy', 'Dek'] },
  en: { title: 'The carpet of light', lead: (y) => `Every prayer of ${y}: each column is a day, each knot a prayer.`, prayed: 'prayed', qada: 'made up', excused: 'excused', none: 'not recorded', sum: (n, y) => `${y}: ${n} prayers prayed`, months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
  ru: { title: 'Ковёр света', lead: (y) => `Все намазы ${y} года: столбец — день, узелок — намаз.`, prayed: 'совершён', qada: 'возмещён', excused: 'освобождение', none: 'не отмечено', sum: (n, y) => `${y}: совершено намазов — ${n}`, months: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'] },
  tr: { title: 'Nur halısı', lead: (y) => `${y} yılının bütün namazları: her sütun bir gün, her ilmek bir namaz.`, prayed: 'kılındı', qada: 'kaza', excused: 'mazeretli', none: 'işaret yok', sum: (n, y) => `${y}: ${n} namaz kılındı`, months: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'] },
  ar: { title: 'سجادة النور', lead: (y) => `كل صلوات عام ${y}: كل عمود يوم، وكل عقدة صلاة.`, prayed: 'أُدّيت', qada: 'قضاء', excused: 'عذر', none: 'لم تُسجَّل', sum: (n, y) => `${y}: أُدّيت ${n} صلاة`, months: ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'] },
}

const CW = 10, CH = 4.4, G = 1, MG = 7, LEFT = 30, TOP = 16
const ROW_H = PRAYERS.length * (CH + G) - G
const W = LEFT + 31 * (CW + G) + 14, H = TOP + 12 * (ROW_H + MG) + 8

function NurCarpet({ snap, periods, today, lang = 'az', onPick }) {
  const t = T[lang] || T.az
  const year = Number(today.slice(0, 4))
  const data = useMemo(() => {
    let prayed = 0
    const months = Array.from({ length: 12 }, (_, m) => monthDays(year, m).map(date => {
      if (date > today) return { date, future: true }
      const ex = excusedPeriod(periods, date, today)
      const st = PRAYERS.map(p => prayerStatus(snap, date, p))
      st.forEach(s => { if (s === 'prayed' || s === 'qada') prayed++ })
      return { date, ex: !!ex, st }
    }))
    return { months, prayed }
  }, [snap, periods, today, year])

  return (
    <figure className="nc" data-testid="nur-carpet">
      <figcaption className="nc__head">
        <span className="nc__title">{t.title}</span>
        <span className="nc__lead">{t.lead(year)}</span>
      </figcaption>
      <div className="nc__frame">
        <svg className="nc__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.sum(data.prayed, year)}>
          {data.months.map((days, m) => {
            const y0 = TOP + m * (ROW_H + MG)
            return (
              <g key={m} className="nc__month" style={{ '--i': m }}>
                <text className="nc__mlabel" x={LEFT - 5} y={y0 + ROW_H / 2} textAnchor="end">{t.months[m]}</text>
                {days.map((d, i) => {
                  const x = LEFT + i * (CW + G)
                  return (
                    <g key={d.date} className={`nc__day${d.date === today ? ' is-today' : ''}`}
                      onClick={!d.future && onPick ? () => onPick(d.date) : undefined}>
                      {PRAYERS.map((p, k) => {
                        const s = d.future ? 'future' : d.ex ? 'excused' : (d.st[k] || 'none')
                        return <rect key={p} className={`nc__k nc__k--${s}`} x={x} y={y0 + k * (CH + G)} width={CW} height={CH} rx={1} />
                      })}
                      {d.date === today && <rect className="nc__today" x={x - 1} y={y0 - 1.5} width={CW + 2} height={ROW_H + 3} rx={2} />}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>
      <ul className="nc__legend">
        <li><i className="nc__sw nc__k--prayed" /> {t.prayed}</li>
        <li><i className="nc__sw nc__k--qada" /> {t.qada}</li>
        <li><i className="nc__sw nc__k--excused" /> {t.excused}</li>
        <li><i className="nc__sw nc__k--none" /> {t.none}</li>
        <li className="nc__sum ui-num">{t.sum(data.prayed, year)}</li>
      </ul>
    </figure>
  )
}

export default memo(NurCarpet)
