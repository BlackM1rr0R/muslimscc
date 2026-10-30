import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { watchAdmin, signInAdmin, signOutAdmin, sendAdminPasswordReset } from '../firebase/auth'
import Icon, { BrandMark } from '../components/Icon'
import '../styles/AdminPage.css'

// Giriş — Firebase Authentication (e-poçt + parol). Admin olmaq üçün hesabda
// `admin: true` claim-i olmalıdır (server/scripts/set-admin.js).
// Mətnlərdə ox simvolu yoxdur — ox <Icon> ilədir (ərəbcədə güzgülənir)
const LABELS = {
  az: { title:'Admin paneli', sub:'Davam etmək üçün hesabınıza daxil olun', email:'E-poçt', password:'Şifrə', login:'Daxil ol', signingIn:'Yoxlanılır...', forgot:'Şifrəni unutmusunuz?', back:'Sayta qayıt', show:'Şifrəni göstər', hide:'Şifrəni gizlət',
    errCreds:'E-poçt və ya şifrə yanlışdır', errMany:'Çox cəhd edildi. Bir az sonra yenidən sınayın', errNet:'Şəbəkə xətası. İnternet bağlantısını yoxlayın', errNotAdmin:'Bu hesabın admin icazəsi yoxdur', errUnavailable:'Giriş xidməti qoşulmayıb', errUnknown:'Daxil olmaq alınmadı', errEmail:'Əvvəlcə e-poçt ünvanını yazın', resetSent:'Bu ünvanla hesab varsa, şifrəni yeniləmə linki e-poçtunuza göndərildi', hint:'Yalnız admin üçündür.' },
  en: { title:'Admin Panel', sub:'Sign in to your account to continue', email:'Email', password:'Password', login:'Sign in', signingIn:'Checking...', forgot:'Forgot your password?', back:'Back to the site', show:'Show password', hide:'Hide password',
    errCreds:'Incorrect email or password', errMany:'Too many attempts. Please try again later', errNet:'Network error. Check your internet connection', errNotAdmin:'This account does not have admin access', errUnavailable:'Sign-in service is not connected', errUnknown:'Could not sign in', errEmail:'Enter your email address first', resetSent:'If an account exists for this address, a password reset link has been sent', hint:'For admin only.' },
  ru: { title:'Админ-панель', sub:'Войдите в свой аккаунт, чтобы продолжить', email:'Эл. почта', password:'Пароль', login:'Войти', signingIn:'Проверка...', forgot:'Забыли пароль?', back:'Вернуться на сайт', show:'Показать пароль', hide:'Скрыть пароль',
    errCreds:'Неверная почта или пароль', errMany:'Слишком много попыток. Повторите позже', errNet:'Ошибка сети. Проверьте подключение к интернету', errNotAdmin:'У этого аккаунта нет прав администратора', errUnavailable:'Служба входа не подключена', errUnknown:'Не удалось войти', errEmail:'Сначала введите адрес почты', resetSent:'Если аккаунт с этим адресом существует, ссылка для сброса пароля отправлена', hint:'Только для администратора.' },
  ar: { title:'لوحة الإدارة', sub:'سجّل الدخول إلى حسابك للمتابعة', email:'البريد الإلكتروني', password:'كلمة المرور', login:'دخول', signingIn:'جارٍ التحقق...', forgot:'هل نسيت كلمة المرور؟', back:'العودة إلى الموقع', show:'إظهار كلمة المرور', hide:'إخفاء كلمة المرور',
    errCreds:'البريد الإلكتروني أو كلمة المرور غير صحيحة', errMany:'محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا', errNet:'خطأ في الشبكة. تحقق من اتصالك بالإنترنت', errNotAdmin:'هذا الحساب لا يملك صلاحية الإدارة', errUnavailable:'خدمة تسجيل الدخول غير متصلة', errUnknown:'تعذّر تسجيل الدخول', errEmail:'أدخل عنوان البريد الإلكتروني أولًا', resetSent:'إذا كان هناك حساب بهذا العنوان، فقد أُرسل رابط إعادة تعيين كلمة المرور', hint:'للمسؤولين فقط' },
  tr: { title:'Yönetim Paneli', sub:'Devam etmek için hesabınıza giriş yapın', email:'E-posta', password:'Şifre', login:'Giriş yap', signingIn:'Kontrol ediliyor...', forgot:'Şifrenizi mi unuttunuz?', back:'Siteye dön', show:'Şifreyi göster', hide:'Şifreyi gizle',
    errCreds:'E-posta veya şifre yanlış', errMany:'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin', errNet:'Ağ hatası. İnternet bağlantınızı kontrol edin', errNotAdmin:'Bu hesabın yönetici yetkisi yok', errUnavailable:'Giriş hizmeti bağlı değil', errUnknown:'Giriş yapılamadı', errEmail:'Önce e-posta adresinizi yazın', resetSent:'Bu adrese ait bir hesap varsa, şifre sıfırlama bağlantısı gönderildi', hint:'Sadece yöneticiler için.' },
}

// Firebase xəta kodu → mətn açarı
function errKeyOf(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
    case 'auth/user-disabled':
      return 'errCreds'
    case 'auth/too-many-requests': return 'errMany'
    case 'auth/network-request-failed': return 'errNet'
    case 'unavailable': return 'errUnavailable'
    default: return 'errUnknown'
  }
}

export default function AdminLoginPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  // { tone:'bad'|'ok', key } — mətn dil dəyişəndə də düzgün qalsın deyə açar saxlanır
  const [msg, setMsg] = useState(null)
  // Hər yanlış cəhddə xəta qutusu yenidən "silkələnsin" (key dəyişir)
  const [errKey, setErrKey] = useState(0)
  const [reveal, setReveal] = useState(false)
  const mounted = useRef(true)
  // Effekt gövdəsində yenidən true: React StrictMode (dev) effekti iki dəfə
  // işlədir — əvvəl ilk təmizləmə ref-i həmişəlik false qoyurdu və giriş
  // xətası / "admin deyil" / sıfırlama mesajı heç vaxt göstərilmir,
  // düymə "Yoxlanılır..." vəziyyətində qalırdı
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Panelə keçid bir dəfə (giriş və onAuthStateChanged eyni anda xəbər verir)
  const navigated = useRef(false)
  const goAdmin = () => {
    if (navigated.current) return
    navigated.current = true
    setPage('admin')
  }

  // Artıq admin kimi daxil olubsa — birbaşa panelə
  useEffect(() => watchAdmin(({ status }) => {
    if (status === 'admin') goAdmin()
  }), [])

  const showError = (key) => {
    setMsg({ tone: 'bad', key })
    setErrKey(k => k + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!email.trim()) { showError('errEmail'); return }
    setBusy(true)
    setMsg(null)
    const res = await signInAdmin(email, password)
    if (!mounted.current) return
    setBusy(false)
    if (!res.ok) { showError(errKeyOf(res.code)); return }
    if (!res.admin) {
      // Hesab var, amma admin deyil — sessiyanı saxlama
      await signOutAdmin()
      showError('errNotAdmin')
      return
    }
    goAdmin()
  }

  const handleReset = async () => {
    if (!email.trim()) { showError('errEmail'); return }
    setBusy(true)
    const res = await sendAdminPasswordReset(email)
    if (!mounted.current) return
    setBusy(false)
    // Hesabın mövcudluğu açıqlanmır: "user-not-found" da uğur kimi göstərilir
    if (res.ok || res.code === 'auth/user-not-found') setMsg({ tone: 'ok', key: 'resetSent' })
    else showError(errKeyOf(res.code))
  }

  return (
    <div className="admin-login-page">
      <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
      <div className="admin-login-card ui-card">
        <div className="admin-login-icon" aria-hidden="true"><BrandMark size={56} /></div>
        <h1 className="admin-login-title">{l.title}</h1>
        <p className="admin-login-sub">{l.sub}</p>

        {msg && (
          <div
            key={msg.tone === 'bad' ? errKey : 'ok'}
            className={`admin-alert admin-alert--${msg.tone}${msg.tone === 'bad' ? ' admin-login-error' : ''}`}
            role={msg.tone === 'bad' ? 'alert' : 'status'}
          >
            <Icon name={msg.tone === 'bad' ? 'alert' : 'check'} size={18} /> {l[msg.key]}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form" aria-busy={busy || undefined}>
          <label className="ui-field">
            <span className="ui-field__label">{l.email}</span>
            <span className="admin-login-input-wrap">
              <Icon name="user" size={18} className="admin-login-input-icon" />
              <input
                type="email"
                name="email"
                className="ui-input admin-login-input"
                placeholder={l.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                inputMode="email"
                required
                autoFocus
              />
            </span>
          </label>

          <label className="ui-field">
            <span className="ui-field__label">{l.password}</span>
            <span className="admin-login-input-wrap">
              <Icon name="shield" size={18} className="admin-login-input-icon" />
              <input
                type={reveal ? 'text' : 'password'}
                name="password"
                className="ui-input admin-login-input"
                placeholder={l.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={msg?.tone === 'bad' || undefined}
                required
              />
              <button
                type="button"
                className="ui-icon-btn admin-login-reveal"
                onClick={() => setReveal(v => !v)}
                aria-label={reveal ? l.hide : l.show}
                aria-pressed={reveal}
              >
                <Icon name={reveal ? 'close' : 'eye'} size={18} />
              </button>
            </span>
          </label>

          <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block" disabled={busy}>
            <Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {busy ? l.signingIn : l.login}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={handleReset} disabled={busy}>
            {l.forgot}
          </button>
        </form>

        <div className="admin-login-hint">
          <p>{l.hint}</p>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setPage('home')}>
            <Icon name="arrow" size={16} className="ui-btn__icon admin-back-arrow" /> {l.back}
          </button>
        </div>
      </div>
    </div>
  )
}
