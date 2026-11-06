// ═══════════════════════════════════════════════════════
// OfflineBadge — internet yoxdursa ekranın altında kiçik nişan (bütün sayt, App.jsx)
// "online"/"offline" hadisələri; yenidən qoşulanda nişan itir. Stillər: OfflinePack.css (.ob)
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/OfflinePack.css'
import { pickUi } from '../utils/uiText'

const T = {
  az: 'İnternet yoxdur — saxlanmış məzmun göstərilir',
  en: 'You are offline — showing saved content',
  ru: 'Нет интернета — показано сохранённое',
  tr: 'İnternet yok — kaydedilmiş içerik gösteriliyor',
  ar: 'لا يوجد اتصال — يُعرض المحتوى المحفوظ',
}

export default function OfflineBadge() {
  const { lang } = useLang()
  const [off, setOff] = useState(false)
  useEffect(() => {
    const upd = () => setOff(navigator.onLine === false)
    upd()
    window.addEventListener('online', upd)
    window.addEventListener('offline', upd)
    return () => { window.removeEventListener('online', upd); window.removeEventListener('offline', upd) }
  }, [])
  if (!off) return null
  return <div className="ob" role="status" data-testid="offline-badge">{pickUi(T, lang)}</div>
}
