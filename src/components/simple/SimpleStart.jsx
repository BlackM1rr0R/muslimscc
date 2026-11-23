// ═══════════════════════════════════════════════════════
// Ana səhifədə: istifadəçi bu cihazda "Saytı açanda sadə ekran açılsın" seçibsə (utils/simpleMode),
// sayt ANA SƏHİFƏDƏN açılanda bir dəfə /simple-a keçir (replace). Sayt daxilində ana səhifəyə
// qayıdanda (loqo, "Tam sayta keç") və başqa səhifədən açılıb sonra ana səhifəyə gələndə keçid olmur:
// yoxlama sənəd başına bir dəfədir və sənədin ilk ünvanına baxır (Navigation Timing).
// Heç nə render etmir; yaddaş yalnız mount-dan sonra oxunur (prerender ilə ilk render eyni).
// ═══════════════════════════════════════════════════════
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { pathFor, parsePath } from '../../seo/routes'
import { shouldStartSimple, documentPath } from '../../utils/simpleMode'

let checked = false
const isHome = (p) => { const r = parsePath(p); return r.known !== false && r.key === 'home' }

export default function SimpleStart({ lang }) {
  const navigate = useNavigate()
  useEffect(() => {
    if (checked) return
    checked = true
    if (shouldStartSimple(documentPath(), isHome)) navigate(pathFor('simple', lang), { replace: true })
    // Yalnız sənədin ilk ana səhifə açılışında
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
