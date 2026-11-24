// ═══════════════════════════════════════════════════════════
// Statistikadan çıxarılmış günlər (bot hücumu) haqqında qeyd — admin paneli.
// Mənbə: GET /api/admin/analytics → excluded: [{ day, reason, views, visitors }]
// (server/analytics.js; gün server/scripts/analytics-exclude.js ilə işarələnir).
// Həmin günlər cəmlərdə, qrafikdə (0) və siyahılarda sayılmır; burada qeydə
// alınmış xam rəqəmlər şəffaflıq üçün göstərilir. Köhnə serverdə "excluded" yoxdur → heç nə.
// ═══════════════════════════════════════════════════════════
import { useMemo } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { AdminAlert } from './AdminUi'

const LABELS = {
  az: { lead: 'Bot hücumu — sayılmır. Bu günlər cəmlərə, qrafikə və siyahılara daxil edilməyib:', rec: (v, u) => `${v} baxış, ${u} “ziyarətçi” qeydə alınıb` },
  en: { lead: 'Bot attack — not counted. These days are left out of the totals, the chart and the lists:', rec: (v, u) => `${v} views and ${u} “visitors” were recorded` },
  ru: { lead: 'Атака ботов — не учитывается. Эти дни исключены из итогов, графика и списков:', rec: (v, u) => `записано просмотров: ${v}, «посетителей»: ${u}` },
  ar: { lead: 'هجوم روبوتات — لا يُحتسب. استُبعدت هذه الأيام من المجاميع والرسم البياني والقوائم:', rec: (v, u) => `سُجّلت ${v} مشاهدة و${u} «زائر»` },
  tr: { lead: 'Bot saldırısı — sayılmıyor. Bu günler toplamlara, grafiğe ve listelere dahil edilmedi:', rec: (v, u) => `${v} görüntüleme ve ${u} “ziyaretçi” kaydedildi` },
}

/** lists — bir neçə cavabın excluded massivləri (məs. indiki + əvvəlki dövr); gün üzrə birləşdirilir */
export default function ExcludedDaysNote({ lists }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang)
  const days = useMemo(() => {
    const m = new Map()
    for (const list of lists || []) {
      if (!Array.isArray(list)) continue
      for (const r of list) if (r && typeof r.day === 'string' && !m.has(r.day)) m.set(r.day, r)
    }
    return [...m.values()].sort((a, b) => (a.day < b.day ? -1 : 1))
  }, [lists])
  const fmt = useMemo(() => {
    const loc = lang === 'az' ? 'az-Latn' : lang
    let d, n
    try { d = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) } catch { d = null }
    try { n = new Intl.NumberFormat(loc) } catch { n = null }
    return {
      day: (s) => (d ? d.format(new Date(s + 'T12:00:00Z')) : s),
      num: (v) => (n ? n.format(Number(v) || 0) : String(Number(v) || 0)),
    }
  }, [lang])
  if (!days.length) return null
  return (
    <AdminAlert tone="warn" className="an-excluded">
      {l.lead}{' '}
      {days.map((r, i) => (
        <span key={r.day} title={r.reason || undefined}>
          {i ? '; ' : ''}<time dateTime={r.day}>{fmt.day(r.day)}</time> ({l.rec(fmt.num(r.views), fmt.num(r.visitors))})
        </span>
      ))}
    </AdminAlert>
  )
}
