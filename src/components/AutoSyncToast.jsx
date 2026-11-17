// ═══════════════════════════════════════════════════════
// AutoSyncToast — avtomatik sinxronizasiyanın nəticəsi (utils/autoSync → 'qm-autosync')
// • pulled — başqa cihazdan yeni məlumat gəldi → "Yenilə" (səhifə yenidən oxusun)
// • conflict — hər iki cihaz dəyişib → heç nə yazılmayıb; ehtiyat nüsxə pəncərəsində seçmək
// pushed / error — səssiz (göstərilmir). Bütün sayt üçün (App.jsx).
//
// Hesaba bağlı sinxronizasiya (utils/accountSync — TƏNBƏL, yalnız daxil olmuş istifadəçidə və
// bu cihaz hələ hesaba qoşulmayıbsa yüklənir) → 'mcc-acctsync':
// • restored — məlumat hesabdan bərpa olundu → "Yenilə"
// • needCode — yeni cihazda bərpa kodu lazımdır → yumşaq xatırlatma (sessiyada bir dəfə) + "Hesabım"
// • choose   — bu cihazda da məlumat var → "Hesabım"-da seçmək
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import { startAutoSync } from '../utils/autoSync'
import { useAuthUser, safeStorage } from '../api/userSession'
import { pathFor } from '../seo/routes'
import '../styles/OfflinePack.css'
import { pickUi } from '../utils/uiText'

const T = {
  az: {
    pulled: 'Başqa cihazdan yeni məlumat gəldi.', reload: 'Yenilə', conflict: 'Sinxronizasiya: hər iki cihazda dəyişiklik var — «Ehtiyat nüsxə» bölməsində hansını saxlayacağınızı seçin.', close: 'Bağla',
    restored: 'Tərəqqiniz hesabınızdan bərpa olundu.', needCode: 'Sinxronlanmış məlumatınızı bu cihazda açmaq üçün bərpa kodunu daxil edin.', choose: 'Bu cihazda da məlumat var — hesab səhifəsində hansını saxlayacağınızı seçin.', open: 'Hesabım',
  },
  en: {
    pulled: 'New data arrived from another device.', reload: 'Reload', conflict: 'Sync: both devices have changes — choose which to keep under “Backup”.', close: 'Close',
    restored: 'Your progress was restored from your account.', needCode: 'Enter your recovery code to unlock your synced data on this device.', choose: 'This device has data too — choose what to keep on your account page.', open: 'My account',
  },
  ru: {
    pulled: 'Пришли новые данные с другого устройства.', reload: 'Обновить', conflict: 'Синхронизация: изменения на обоих устройствах — выберите, что сохранить, в разделе «Резервная копия».', close: 'Закрыть',
    restored: 'Ваш прогресс восстановлен из аккаунта.', needCode: 'Введите код восстановления, чтобы открыть синхронизированные данные на этом устройстве.', choose: 'На этом устройстве тоже есть данные — выберите, что оставить, на странице аккаунта.', open: 'Мой аккаунт',
  },
  tr: {
    pulled: 'Başka cihazdan yeni veri geldi.', reload: 'Yenile', conflict: 'Senkronizasyon: iki cihazda da değişiklik var — «Yedek» bölümünde hangisini tutacağınızı seçin.', close: 'Kapat',
    restored: 'İlerlemeniz hesabınızdan geri yüklendi.', needCode: 'Eşitlenen verilerinizi bu cihazda açmak için kurtarma kodunuzu girin.', choose: 'Bu cihazda da veri var — hangisinin kalacağını hesap sayfasında seçin.', open: 'Hesap ayarları',
  },
  ar: {
    pulled: 'وصلت بيانات جديدة من جهاز آخر.', reload: 'حدّث', conflict: 'المزامنة: يوجد تغيير على الجهازين — اختر ما تحتفظ به في قسم «النسخة الاحتياطية».', close: 'إغلاق',
    restored: 'استُعيد تقدّمك من حسابك.', needCode: 'أدخل رمز الاستعادة لفتح بياناتك المتزامنة على هذا الجهاز.', choose: 'على هذا الجهاز بيانات أيضًا — اختر ما تبقيه في صفحة الحساب.', open: 'حسابي',
  },
}

const readJson = (k) => { try { return JSON.parse(safeStorage()?.getItem(k) || 'null') } catch { return null } }
const onAccountPage = () => { try { return /\/account\/?$/.test(window.location.pathname) } catch { return false } }
const NEED_SEEN = 'mcc_acct_needcode_seen'

export default function AutoSyncToast() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const { status, user } = useAuthUser()
  const [kind, setKind] = useState(null)
  useEffect(() => {
    startAutoSync()
    const on = (e) => { const k = e.detail?.type; if (k === 'pulled' || k === 'conflict') setKind(k) }
    const onAcct = (e) => {
      const k = e.detail?.status
      if (k === 'restored') { setKind('restored'); return }
      if ((k === 'needCode' || k === 'choose') && !onAccountPage()) {
        if (k === 'needCode') {
          try { if (sessionStorage.getItem(NEED_SEEN)) return; sessionStorage.setItem(NEED_SEEN, '1') } catch { /* */ }
        }
        setKind(k)
      }
    }
    window.addEventListener('qm-autosync', on)
    window.addEventListener('mcc-acctsync', onAcct)
    return () => { window.removeEventListener('qm-autosync', on); window.removeEventListener('mcc-acctsync', onAcct) }
  }, [])

  // Daxil olmuş istifadəçi, bu cihaz hələ hesaba qoşulmayıb → hesab sinxronizasiyasını yoxla (tənbəl modul)
  const uid = status === 'user' && user ? user.id : null
  useEffect(() => {
    if (!uid) return undefined
    const s = readJson('muslim_cc_sync'), st = readJson('mcc_acct_sync')
    if (s?.acct === uid && st?.uid === uid && st.status === 'linked') return undefined
    const timer = setTimeout(() => {
      import('../utils/accountSync').then((m) => m.reconcile(user)).catch(() => {})
    }, 2500)
    return () => clearTimeout(timer)
  // user obyekti hər /me-də yenilənir — yalnız istifadəçi dəyişəndə
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  if (!kind) return null
  const text = t[kind]
  const toAccount = kind === 'needCode' || kind === 'choose'
  const goAccount = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault(); setKind(null); navigate(pathFor('account', siteLang))
  }
  return (
    <div className="ob ob--sync" role="status" data-testid="autosync-toast" data-kind={kind}>
      <span>{text}</span>
      {(kind === 'pulled' || kind === 'restored') && <button type="button" className="ob__btn" onClick={() => window.location.reload()}>{t.reload}</button>}
      {toAccount && <a className="ob__btn" href={pathFor('account', siteLang)} onClick={goAccount}>{t.open}</a>}
      <button type="button" className="ob__x" onClick={() => setKind(null)} aria-label={t.close}><Icon name="close" size={14} /></button>
    </div>
  )
}
