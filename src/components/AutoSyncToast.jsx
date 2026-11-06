// ═══════════════════════════════════════════════════════
// AutoSyncToast — avtomatik sinxronizasiyanın nəticəsi (utils/autoSync → 'qm-autosync')
// • pulled — başqa cihazdan yeni məlumat gəldi → "Yenilə" (səhifə yenidən oxusun)
// • conflict — hər iki cihaz dəyişib → heç nə yazılmayıb; ehtiyat nüsxə pəncərəsində seçmək
// pushed / error — səssiz (göstərilmir). Bütün sayt üçün (App.jsx).
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import { startAutoSync } from '../utils/autoSync'
import '../styles/OfflinePack.css'
import { pickUi } from '../utils/uiText'

const T = {
  az: { pulled: 'Başqa cihazdan yeni məlumat gəldi.', reload: 'Yenilə', conflict: 'Sinxronizasiya: hər iki cihazda dəyişiklik var — «Ehtiyat nüsxə» bölməsində hansını saxlayacağınızı seçin.', close: 'Bağla' },
  en: { pulled: 'New data arrived from another device.', reload: 'Reload', conflict: 'Sync: both devices have changes — choose which to keep under “Backup”.', close: 'Close' },
  ru: { pulled: 'Пришли новые данные с другого устройства.', reload: 'Обновить', conflict: 'Синхронизация: изменения на обоих устройствах — выберите, что сохранить, в разделе «Резервная копия».', close: 'Закрыть' },
  tr: { pulled: 'Başka cihazdan yeni veri geldi.', reload: 'Yenile', conflict: 'Senkronizasyon: iki cihazda da değişiklik var — «Yedek» bölümünde hangisini tutacağınızı seçin.', close: 'Kapat' },
  ar: { pulled: 'وصلت بيانات جديدة من جهاز آخر.', reload: 'حدّث', conflict: 'المزامنة: يوجد تغيير على الجهازين — اختر ما تحتفظ به في قسم «النسخة الاحتياطية».', close: 'إغلاق' },
}

export default function AutoSyncToast() {
  const { lang } = useLang()
  const t = pickUi(T, lang)
  const [kind, setKind] = useState(null)
  useEffect(() => {
    startAutoSync()
    const on = (e) => { const k = e.detail?.type; if (k === 'pulled' || k === 'conflict') setKind(k) }
    window.addEventListener('qm-autosync', on)
    return () => window.removeEventListener('qm-autosync', on)
  }, [])
  if (!kind) return null
  return (
    <div className="ob ob--sync" role="status" data-testid="autosync-toast">
      <span>{kind === 'pulled' ? t.pulled : t.conflict}</span>
      {kind === 'pulled' && <button type="button" className="ob__btn" onClick={() => window.location.reload()}>{t.reload}</button>}
      <button type="button" className="ob__x" onClick={() => setKind(null)} aria-label={t.close}><Icon name="close" size={14} /></button>
    </div>
  )
}
