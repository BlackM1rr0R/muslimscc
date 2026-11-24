// ═══════════════════════════════════════════════════════
// Admin paneli — saytın istifadəçi hesabı ilə giriş (SSO, server/adminSso.js)
//
// • AdminSiteGate: hesabın panel rolu var, amma panel hələ açılmır (məlumat yüklənmir):
//   need2fa — iki addımlı yoxlama bağlıdır → hesabın "İki addımlı yoxlama" bölməsinə keçid;
//   needReauth — 2FA açıqdır, bu giriş ondan əvvəl olub → çıxış + yenidən giriş;
//   hold — hesab qorunma rejimindədir → hesab səhifəsi.
// • SiteAccountNote: "Hesab və şifrə" bölməsi sayt hesabı üçün — şifrə/2FA /account-dadır.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pathFor } from '../../seo/routes'
import { pickUi } from '../../utils/uiText'
import { logoutUser } from '../../api/userSession'
import Icon from '../Icon'

export const SITE_GATE_STATUSES = new Set(['need2fa', 'needReauth', 'hold'])

const LABELS = {
  az: {
    need2faTitle: 'İdarə panelindən istifadə üçün iki addımlı yoxlamanı açın',
    need2faText: 'Sayt hesabınızın panel rolu var. Təhlükəsizlik üçün panel yalnız bu hesabda iki addımlı yoxlama (telefondakı kod tətbiqi) açıq olanda açılır. Onu hesabınızın təhlükəsizlik bölməsində bir neçə dəqiqəyə qurmaq olar.',
    need2faBtn: 'İki addımlı yoxlamanı qur',
    reauthTitle: 'Yenidən daxil olun',
    reauthText: 'İki addımlı yoxlama açıqdır, amma bu cihazdakı giriş ondan əvvəl edilib. Çıxıb yenidən daxil olun (tətbiqdəki kodla və ya passkey ilə) — sonra panel açılacaq.',
    reauthBtn: 'Çıxış və yenidən giriş',
    holdTitle: 'Hesab qorunma rejimindədir',
    holdText: 'Hesabınız qorunma rejimindədir. Rejim açılana qədər idarə paneli bağlıdır — ətraflı hesab səhifəsində.',
    holdBtn: 'Hesabıma keç',
    back: 'Sayta qayıt',
    siteTitle: 'Sayt hesabı ilə daxil olmusunuz',
    siteText: 'Panelə saytdakı hesabınızla daxil olmusunuz. Şifrəni, iki addımlı yoxlamanı və aktiv sessiyaları hesab səhifəsində idarə edin.',
    siteBtn: 'Hesabın təhlükəsizliyi',
  },
  en: {
    need2faTitle: 'Enable two-step verification to use the admin panel',
    need2faText: 'Your site account has a panel role. For safety, the panel opens only when two-step verification (an authenticator app on your phone) is turned on for this account. You can set it up in a few minutes in your account’s security section.',
    need2faBtn: 'Set up two-step verification',
    reauthTitle: 'Sign in again',
    reauthText: 'Two-step verification is on, but this device signed in before it was turned on. Sign out and sign in again (with the code from your app or a passkey) — then the panel will open.',
    reauthBtn: 'Sign out and sign in again',
    holdTitle: 'Your account is on security hold',
    holdText: 'Your account is on security hold. The admin panel stays closed until the hold is lifted — see your account page for details.',
    holdBtn: 'Go to my account',
    back: 'Back to the site',
    siteTitle: 'Signed in with your site account',
    siteText: 'You opened the panel with your site account. Manage your password, two-step verification and active sessions on your account page.',
    siteBtn: 'Account security',
  },
  ru: {
    need2faTitle: 'Включите двухэтапную проверку, чтобы пользоваться админ-панелью',
    need2faText: 'У вашего аккаунта на сайте есть роль в панели. Ради безопасности панель открывается, только если в этом аккаунте включена двухэтапная проверка (приложение для кодов на телефоне). Её можно настроить за несколько минут в разделе безопасности аккаунта.',
    need2faBtn: 'Настроить двухэтапную проверку',
    reauthTitle: 'Войдите заново',
    reauthText: 'Двухэтапная проверка включена, но вход на этом устройстве был выполнен до её включения. Выйдите и войдите снова (с кодом из приложения или ключом доступа) — после этого панель откроется.',
    reauthBtn: 'Выйти и войти заново',
    holdTitle: 'Аккаунт в режиме защиты',
    holdText: 'Ваш аккаунт находится в режиме защиты. Пока режим не снят, админ-панель закрыта — подробности на странице аккаунта.',
    holdBtn: 'Перейти в аккаунт',
    back: 'Вернуться на сайт',
    siteTitle: 'Вы вошли с аккаунтом сайта',
    siteText: 'Вы открыли панель с аккаунтом сайта. Пароль, двухэтапную проверку и активные сеансы меняйте на странице аккаунта.',
    siteBtn: 'Безопасность аккаунта',
  },
  tr: {
    need2faTitle: 'Yönetim panelini kullanmak için iki adımlı doğrulamayı açın',
    need2faText: 'Site hesabınızın bir panel rolü var. Güvenlik için panel yalnızca bu hesapta iki adımlı doğrulama (telefondaki kod uygulaması) açıkken açılır. Hesabınızın güvenlik bölümünde birkaç dakikada kurabilirsiniz.',
    need2faBtn: 'İki adımlı doğrulamayı kur',
    reauthTitle: 'Yeniden giriş yapın',
    reauthText: 'İki adımlı doğrulama açık, ancak bu cihazdaki giriş ondan önce yapılmış. Çıkış yapıp yeniden giriş yapın (uygulamadaki kodla veya geçiş anahtarıyla) — ardından panel açılacak.',
    reauthBtn: 'Çıkış yap ve yeniden giriş yap',
    holdTitle: 'Hesap koruma modunda',
    holdText: 'Hesabınız koruma modunda. Mod kaldırılana kadar yönetim paneli kapalıdır — ayrıntılar hesap sayfanızda.',
    holdBtn: 'Hesabıma git',
    back: 'Siteye dön',
    siteTitle: 'Site hesabınızla giriş yaptınız',
    siteText: 'Paneli site hesabınızla açtınız. Şifrenizi, iki adımlı doğrulamayı ve etkin oturumları hesap sayfanızda yönetin.',
    siteBtn: 'Hesap güvenliği',
  },
  ar: {
    need2faTitle: 'فعّل التحقق بخطوتين لاستخدام لوحة الإدارة',
    need2faText: 'لحسابك في الموقع دور في اللوحة. حفاظًا على الأمان لا تُفتح اللوحة إلا إذا كان التحقق بخطوتين (تطبيق الرموز على هاتفك) مفعّلًا في هذا الحساب. يمكنك إعداده في دقائق من قسم الأمان في حسابك.',
    need2faBtn: 'إعداد التحقق بخطوتين',
    reauthTitle: 'سجّل الدخول من جديد',
    reauthText: 'التحقق بخطوتين مفعّل، لكن تسجيل الدخول على هذا الجهاز تمّ قبل تفعيله. سجّل الخروج ثم ادخل من جديد (برمز التطبيق أو بمفتاح المرور) — وبعدها تُفتح اللوحة.',
    reauthBtn: 'الخروج ثم الدخول من جديد',
    holdTitle: 'الحساب في وضع الحماية',
    holdText: 'حسابك في وضع الحماية. تبقى لوحة الإدارة مغلقة حتى يُرفع هذا الوضع — التفاصيل في صفحة حسابك.',
    holdBtn: 'الانتقال إلى حسابي',
    back: 'العودة إلى الموقع',
    siteTitle: 'دخلت بحساب الموقع',
    siteText: 'فتحت اللوحة بحسابك في الموقع. أدِر كلمة المرور والتحقق بخطوتين والجلسات النشطة من صفحة حسابك.',
    siteBtn: 'أمان الحساب',
  },
}

/** Panel rolu var, amma panel açılmır: bələdçi ekranı (heç bir panel məlumatı yüklənmir). */
export function AdminSiteGate({ status, setPage }) {
  const { lang, siteLang = lang } = useLang()
  const l = pickUi(LABELS, lang)
  const [busy, setBusy] = useState(false)
  const account = pathFor('account', siteLang)
  const kind = status === 'needReauth' ? 'reauth' : status === 'hold' ? 'hold' : 'need2fa'
  const reauth = async () => {
    setBusy(true)
    try { await logoutUser() } catch { /* ipucu onsuz da silindi */ }
    setPage('login')
  }
  return (
    <section className="admin-section admin-notice admin-site-gate" data-testid="admin-site-gate" data-gate={status}>
      <span className="ui-icon-tile ui-icon-tile--lg admin-notice-icon" aria-hidden="true"><Icon name={kind === 'reauth' ? 'enter' : 'shield'} /></span>
      <h1 className="admin-notice-title">{l[`${kind}Title`]}</h1>
      <p className="admin-notice-text">{l[`${kind}Text`]}</p>
      <p className="admin-site-gate__actions">
        {kind === 'reauth'
          ? <button type="button" className="ui-btn ui-btn--primary" onClick={reauth} disabled={busy}>{l.reauthBtn}</button>
          : <a className="ui-btn ui-btn--primary" href={kind === 'need2fa' ? `${account}#acc-2fa` : account}>{l[`${kind}Btn`]}</a>}
        <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setPage('home')}>{l.back}</button>
      </p>
    </section>
  )
}

/** "Hesab və şifrə" bölməsi — sayt hesabı ilə daxil olanda (panelin öz şifrəsi/2FA-sı yoxdur). */
export function SiteAccountNote({ email }) {
  const { lang, siteLang = lang } = useLang()
  const l = pickUi(LABELS, lang)
  return (
    <section className="admin-section admin-notice" data-testid="admin-site-account">
      <span className="ui-icon-tile ui-icon-tile--lg admin-notice-icon" aria-hidden="true"><Icon name="user" /></span>
      <h1 className="admin-notice-title">{l.siteTitle}</h1>
      {email && <p className="admin-notice-text"><bdi>{email}</bdi></p>}
      <p className="admin-notice-text">{l.siteText}</p>
      <p className="admin-site-gate__actions">
        <a className="ui-btn ui-btn--secondary" href={`${pathFor('account', siteLang)}#acc-2fa`}>{l.siteBtn}</a>
      </p>
    </section>
  )
}

/** Yan menyunun düyməsi (sayt hesabı ilə): "Çıxış" əvəzinə "Sayta qayıt" — sayt hesabından çıxış saytın menyusundadır */
export const siteBackLabel = (lang) => pickUi(LABELS, lang).back
