import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { watchAdmin, signInAdmin } from '../api/adminAuth'
import Icon, { BrandMark } from '../components/Icon'
import '../styles/AdminPage.css'

// Giriş — öz serverimiz (POST /api/admin/login, server/auth.js): e-poçt + şifrə,
// HttpOnly cookie sessiyası. Admin hesabı serverdə yaradılır:
// server/scripts/admin-user.js create <e-poçt> (müvəqqəti şifrə — ilk girişdə
// panel onu dəyişdirməyi tələb edir). E-poçt xidməti YOXDUR: "Şifrəni
// unutmusunuz?" sıfırlama linki göndərmir — şifrəni serverdə dəyişməyi izah edir.
// Mətnlərdə ox simvolu yoxdur — ox <Icon> ilədir (ərəbcədə güzgülənir)
const LABELS = {
  az: { title:'Admin paneli', sub:'Davam etmək üçün hesabınıza daxil olun', email:'E-poçt', password:'Şifrə', login:'Daxil ol', signingIn:'Yoxlanılır...', forgot:'Şifrəni unutmusunuz?', back:'Sayta qayıt', show:'Şifrəni göstər', hide:'Şifrəni gizlət',
    // lang-ok: serverdəki əmrin və sənədin adı tərcümə olunmur
    errCreds:'E-poçt və ya şifrə yanlışdır', errMany:'Çox cəhd edildi. Bir az sonra yenidən sınayın', errNet:'Şəbəkə xətası. İnternet bağlantısını yoxlayın', errUnknown:'Daxil olmaq alınmadı', errEmail:'Əvvəlcə e-poçt ünvanını yazın', forgotInfo:'E-poçtla bərpa yoxdur. Şifrəni serverdə admin-user.js set-password əmri ilə dəyişin — admin sənədinə baxın (docs/FIREBASE-EXIT.md).', hint:'Yalnız admin üçündür.' },
  en: { title:'Admin Panel', sub:'Sign in to your account to continue', email:'Email', password:'Password', login:'Sign in', signingIn:'Checking...', forgot:'Forgot your password?', back:'Back to the site', show:'Show password', hide:'Hide password',
    errCreds:'Incorrect email or password', errMany:'Too many attempts. Please try again later', errNet:'Network error. Check your internet connection', errUnknown:'Could not sign in', errEmail:'Enter your email address first', forgotInfo:'There is no email recovery. Change the password on the server with the admin-user.js set-password command — see the admin docs (docs/FIREBASE-EXIT.md).', hint:'For admin only.' },
  ru: { title:'Админ-панель', sub:'Войдите в свой аккаунт, чтобы продолжить', email:'Эл. почта', password:'Пароль', login:'Войти', signingIn:'Проверка...', forgot:'Забыли пароль?', back:'Вернуться на сайт', show:'Показать пароль', hide:'Скрыть пароль',
    // lang-ok: serverdəki əmrin və sənədin adı tərcümə olunmur
    errCreds:'Неверная почта или пароль', errMany:'Слишком много попыток. Повторите позже', errNet:'Ошибка сети. Проверьте подключение к интернету', errUnknown:'Не удалось войти', errEmail:'Сначала введите адрес почты', forgotInfo:'Восстановления по почте нет. Смените пароль на сервере командой admin-user.js set-password — см. документацию администратора (docs/FIREBASE-EXIT.md).', hint:'Только для администратора.' },
  ar: { title:'لوحة الإدارة', sub:'سجّل الدخول إلى حسابك للمتابعة', email:'البريد الإلكتروني', password:'كلمة المرور', login:'دخول', signingIn:'جارٍ التحقق...', forgot:'هل نسيت كلمة المرور؟', back:'العودة إلى الموقع', show:'إظهار كلمة المرور', hide:'إخفاء كلمة المرور',
    // lang-ok: serverdəki əmrin və sənədin adı tərcümə olunmur
    errCreds:'البريد الإلكتروني أو كلمة المرور غير صحيحة', errMany:'محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا', errNet:'خطأ في الشبكة. تحقق من اتصالك بالإنترنت', errUnknown:'تعذّر تسجيل الدخول', errEmail:'أدخل عنوان البريد الإلكتروني أولًا', forgotInfo:'لا توجد استعادة عبر البريد. غيّر كلمة المرور على الخادم بالأمر admin-user.js set-password — راجع توثيق الإدارة (docs/FIREBASE-EXIT.md).', hint:'للمسؤولين فقط' },
  tr: { title:'Yönetim Paneli', sub:'Devam etmek için hesabınıza giriş yapın', email:'E-posta', password:'Şifre', login:'Giriş yap', signingIn:'Kontrol ediliyor...', forgot:'Şifrenizi mi unuttunuz?', back:'Siteye dön', show:'Şifreyi göster', hide:'Şifreyi gizle',
    // lang-ok: serverdəki əmrin və sənədin adı tərcümə olunmur
    errCreds:'E-posta veya şifre yanlış', errMany:'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin', errNet:'Ağ hatası. İnternet bağlantınızı kontrol edin', errUnknown:'Giriş yapılamadı', errEmail:'Önce e-posta adresinizi yazın', forgotInfo:'E-postayla kurtarma yok. Şifreyi sunucuda admin-user.js set-password komutuyla değiştirin — yönetici belgelerine bakın (docs/FIREBASE-EXIT.md).', hint:'Sadece yöneticiler için.' },
}

// api/adminAuth.js xəta kodu → mətn açarı
const ERR_KEY = { creds: 'errCreds', many: 'errMany', net: 'errNet' }
const errKeyOf = (code) => ERR_KEY[code] || 'errUnknown'

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

  // Panelə keçid bir dəfə (giriş və sessiya yoxlaması eyni anda xəbər verə bilər)
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
    // Müvəqqəti şifrədirsə panel özü "Şifrəni dəyiş" formasını göstərir
    goAdmin()
  }

  // E-poçt xidməti yoxdur — sıfırlama linki əvəzinə dürüst izah
  const handleReset = () => setMsg({ tone: 'note', key: 'forgotInfo' })

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
            <Icon name={msg.tone === 'bad' ? 'alert' : msg.tone === 'note' ? 'info' : 'check'} size={18} /> {l[msg.key]}
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
