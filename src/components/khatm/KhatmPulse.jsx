// ═══════════════════════════════════════════════════════
// Ana səhifə: "İndi N nəfər dünya xətmini oxuyur" → /khatm
// SSE AÇMIR: boş vaxtda bir dəfə keşlənmiş toplu rəqəm (GET /api/khatm/stats, Cache-Control qısa).
// HomePage-də DeferRender içində tənbəl yüklənir. Sorğu alınmasa — heç nə göstərilmir.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { whenIdle } from '../../utils/idle'
import { isPlainClick } from '../PageLink'
import { khatmStats } from '../../api/khatm'
import { KT } from './khatmText'
import '../../styles/KhatmPulse.css'

export default function KhatmPulse({ lang, siteLang = lang, onNavigate }) {
  const t = pickUi(KT, lang, 'en')
  const [s, setS] = useState(null)
  useEffect(() => {
    let alive = true
    whenIdle({ delay: 600 }).then(() => khatmStats()).then((v) => { if (alive && v && Number.isInteger(v.roundNo)) setS(v) }).catch(() => {})
    return () => { alive = false }
  }, [])
  if (!s) return null
  const text = s.active > 0 ? t.pulse(s.active) : t.pulseIdle(s.roundNo, s.readCount)
  return (
    <a className="ktp" href={pathFor('khatm', siteLang)} data-testid="khatm-pulse"
      onClick={(e) => { if (onNavigate && isPlainClick(e)) { e.preventDefault(); onNavigate('khatm') } }}>
      <span className="ktp__dot" aria-hidden="true" />
      <span className="ui-num">{text}</span>
    </a>
  )
}
