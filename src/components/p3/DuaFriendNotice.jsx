// ═══════════════════════════════════════════════════════
// "Kimsə sizin üçün dua etdi" — gizli dua dostunun gələn qutusu, saytın istənilən səhifəsində (App.jsx, boş vaxtda).
// Serverə YALNIZ bu cihazda "qoşulub" ipucu (api/p3 → mcc_dua_friend) və giriş ipucu varsa, sessiyada bir dəfə
// soruşulur. Bağlayanda oxunmuş sayılır (POST /seen); öz səhifəsində göstərilmir. Bildiriş növbəsi — promptCoordinator.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor, parsePath } from '../../seo/routes'
import { usePromptSlot, wasShownThisSession, engagedMs } from '../../utils/promptCoordinator'
import { hasLoginHint } from '../../api/userSession'
import { getDuaFriend, seenDuaFriend, hasDuaFriendHint, setDuaFriendHint } from '../../api/p3'
import Icon from '../Icon'

const T = {
  az: { today: 'Bu gün kimsə sizin üçün dua etdi', some: 'Kimsə sizin üçün dua etdi', open: 'Gizli dua dostu', close: 'Bağla' },
  en: { today: 'Someone made dua for you today', some: 'Someone made dua for you', open: 'Secret dua friend', close: 'Close' },
  ru: { today: 'Сегодня кто-то сделал дуа за вас', some: 'Кто-то сделал дуа за вас', open: 'Тайный друг по дуа', close: 'Закрыть' },
  ar: { today: 'دعا لك أحدهم اليوم', some: 'دعا لك أحدهم', open: 'صديق الدعاء الخفي', close: 'إغلاق' },
  tr: { today: 'Bugün biri sizin için dua etti', some: 'Biri sizin için dua etti', open: 'Gizli dua arkadaşı', close: 'Kapat' },
}
const ID = 'duafriend'
const SESSION_KEY = 'mcc_df_checked'

export default function DuaFriendNotice() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const { pathname } = useLocation()
  const onOwnPage = parsePath(pathname)?.key === 'duafriend'
  const [info, setInfo] = useState(null)   // null | { today: boolean }
  useEffect(() => {
    if (!hasDuaFriendHint() || !hasLoginHint() || wasShownThisSession(ID)) return
    try { if (sessionStorage.getItem(SESSION_KEY)) return; sessionStorage.setItem(SESSION_KEY, '1') } catch { /* */ }
    getDuaFriend().then((r) => {
      if (!r?.joined) { setDuaFriendHint(false); return }
      if (r.inbox?.length) setInfo({ today: Boolean(r.pair?.forMeToday) })
    }).catch(() => {})
  }, [])
  const [shown, hide] = usePromptSlot(ID, () => engagedMs() >= 3000, { enabled: Boolean(info) && !onOwnPage })
  if (!shown || !info) return null
  const close = () => { hide(); setInfo(null); seenDuaFriend().catch(() => {}) }
  return (
    <div className="ui-toast p3-toast" role="status" aria-live="polite" data-testid="df-notice">
      <span className="ui-toast__icon" aria-hidden="true"><Icon name="sparkle" /></span>
      <div className="ui-toast__body">
        <span className="ui-toast__eyebrow">{t.open}</span>
        <strong className="ui-toast__title">{info.today ? t.today : t.some}</strong>
        <div className="ui-toast__actions">
          <a className="ui-link" href={pathFor('duafriend', siteLang)} onClick={() => { hide(); setInfo(null) }}>
            {t.open} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" />
          </a>
        </div>
      </div>
      <button type="button" className="ui-toast__close" onClick={close} aria-label={t.close} title={t.close}><Icon name="close" size={18} /></button>
    </div>
  )
}
