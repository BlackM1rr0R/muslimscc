// ═══════════════════════════════════════════════════════
// /login və /signup — saytın istifadəçi hesabı (server/users.js, docs/USER-ACCOUNTS.md)
//
//   <LoginPage mode="login" | "signup" />
//
// • Giriş: e-poçt + şifrə, passkey (düymə + e-poçt sahəsində avtomatik doldurma —
//   autocomplete="username webauthn"), Google (rəsmi GIS düyməsi).
// • "Şifrəni unutmusunuz?" — səhifədə forma; cavab HƏMİŞƏ neytraldır (hesabın varlığı açılmır).
// • Qeydiyyat: 201 → daxil olub, hesab səhifəsinə; 202 → "e-poçtunuzu yoxlayın" (neytral).
// • ?next=/yol — girişdən sonra hara (yalnız saytın öz yolu, src/api/userAuth.js → safeNext).
// • ?reset=done — /account/reset-dən sonra "şifrə dəyişdirildi" mesajı; ?forgot=1 — bərpa forması.
// noindex (src/seo/routes.js), sitemap-a düşmür.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { shortName } from '../seo/meta'
import Icon from '../components/Icon'
import { AuthShell, AuthHead, AuthMessage, EmailField, PasswordField, useAuthText } from '../components/account/AuthUi'
import { useAuthUser, hasLoginHint } from '../api/userSession'
import {
  AuthError, MAX_NAME, errorKey, forgotPassword, googleLogin, login, passkeyAutofillAvailable, passkeyLogin,
  passkeySupported, passwordStrength, refreshMe, register, safeNext, validEmail,
} from '../api/userAuth'
import { GOOGLE_CLIENT_ID, renderGoogleButton, releaseGoogleButton } from '../utils/googleSignIn'

// İki addımlı yoxlamanın kod addımı (server/security.js) — yalnız 2FA açıq hesabda yüklənir
const TwoFactorStep = lazy(() => import('../components/account/TwoFactorStep'))

const LABELS = {
  az: {
    titleLogin: 'Hesaba daxil olun', subLogin: 'Xoş gördük! Davam etmək üçün daxil olun.',
    titleSignup: 'Hesab yaradın', subSignup: 'Pulsuzdur və bir dəqiqə çəkir.',
    name: 'Ad (istəyə bağlı)', nameHint: 'Yalnız hesabınızda görünür.',
    login: 'Daxil ol', signup: 'Hesab yarat', or: 'və ya', passkey: 'Passkey ilə daxil ol',
    forgot: 'Şifrəni unutmusunuz?', forgotTitle: 'Şifrəni bərpa edin',
    forgotLead: 'Hesabınızın e-poçtunu yazın — yeni şifrə təyin etmək üçün keçid göndərəcəyik.',
    send: 'Keçidi göndər', back: 'Girişə qayıt',
    forgotSent: 'Bu ünvanla hesab varsa, ona keçid olan məktub göndərdik. Gələnlər qutusunu və spam qovluğunu yoxlayın.',
    noAccount: 'Hesabınız yoxdur?', createOne: 'Hesab yaradın', haveAccount: 'Artıq hesabınız var?', signInLink: 'Daxil olun',
    checkTitle: 'E-poçtunuzu yoxlayın',
    checkText: 'Növbəti addımları {email} ünvanına göndərdik. Məktubu görmürsünüzsə, spam qovluğunu yoxlayın.',
    resetDone: 'Şifrəniz dəyişdirildi. Yeni şifrə ilə daxil olun.',
    perksTitle: 'Hesab nə verir',
    perks: [
      'Təhlükəsiz giriş: şifrə, passkey və ya Google',
      'Aktiv sessiyalarınızı görün və digər cihazlardakı girişləri bağlayın',
      'Məscid nümayəndələri üçün məscid məlumatlarının idarəsi — tezliklə',
    ],
    perksNote: 'Saytın bütün bölmələri hesabsız da pulsuz işləyir.',
    privacy: 'IP ünvanınızı və brauzerin tam məlumatını saxlamırıq.',
    legal: 'Hesab yaratmaqla istifadə şərtləri və məxfilik siyasəti ilə razılaşırsınız.',
    authMethods: 'Giriş üsulları',
  },
  en: {
    titleLogin: 'Sign in to your account', subLogin: 'Welcome back! Sign in to continue.',
    titleSignup: 'Create an account', subSignup: 'It is free and takes a minute.',
    name: 'Name (optional)', nameHint: 'Shown only in your account.',
    login: 'Sign in', signup: 'Create account', or: 'or', passkey: 'Sign in with a passkey',
    forgot: 'Forgot your password?', forgotTitle: 'Reset your password',
    forgotLead: 'Enter your account email and we will send you a link to set a new password.',
    send: 'Send link', back: 'Back to sign in',
    forgotSent: 'If an account exists for this address, we have sent it an email with a link. Check your inbox and spam folder.',
    noAccount: 'No account yet?', createOne: 'Create an account', haveAccount: 'Already have an account?', signInLink: 'Sign in',
    checkTitle: 'Check your email',
    checkText: 'We have sent the next steps to {email}. If you do not see the email, check your spam folder.',
    resetDone: 'Your password has been changed. Sign in with the new password.',
    perksTitle: 'What an account gives you',
    perks: [
      'Secure sign-in: password, passkey or Google',
      'See your active sessions and sign out other devices',
      'For mosque representatives: managing mosque information — coming soon',
    ],
    perksNote: 'Every section of the site stays free and works without an account.',
    privacy: 'We do not store your IP address or your full browser details.',
    legal: 'By creating an account you agree to the terms of use and the privacy policy.',
    authMethods: 'Sign-in methods',
  },
  ru: {
    titleLogin: 'Вход в аккаунт', subLogin: 'С возвращением! Войдите, чтобы продолжить.',
    titleSignup: 'Создайте аккаунт', subSignup: 'Это бесплатно и займёт минуту.',
    name: 'Имя (необязательно)', nameHint: 'Видно только в вашем аккаунте.',
    login: 'Войти', signup: 'Создать аккаунт', or: 'или', passkey: 'Войти с ключом доступа',
    forgot: 'Забыли пароль?', forgotTitle: 'Восстановление пароля',
    forgotLead: 'Введите почту аккаунта — мы пришлём ссылку, чтобы задать новый пароль.',
    send: 'Отправить ссылку', back: 'Вернуться ко входу',
    forgotSent: 'Если аккаунт с этим адресом существует, мы отправили на него письмо со ссылкой. Проверьте входящие и папку «Спам».',
    noAccount: 'Ещё нет аккаунта?', createOne: 'Создать аккаунт', haveAccount: 'Уже есть аккаунт?', signInLink: 'Войти',
    checkTitle: 'Проверьте почту',
    checkText: 'Мы отправили дальнейшие шаги на {email}. Если письма нет, проверьте папку «Спам».',
    resetDone: 'Пароль изменён. Войдите с новым паролем.',
    perksTitle: 'Что даёт аккаунт',
    perks: [
      'Безопасный вход: пароль, ключ доступа или Google',
      'Просмотр активных сеансов и выход на других устройствах',
      'Для представителей мечетей: управление информацией о мечети — скоро',
    ],
    perksNote: 'Все разделы сайта остаются бесплатными и работают без аккаунта.',
    // lang-ok[IP]: texniki termin (IP ünvanı) tərcümə olunmur
    privacy: 'Мы не храним ваш IP-адрес и полные данные браузера.',
    legal: 'Создавая аккаунт, вы соглашаетесь с условиями использования и политикой конфиденциальности.',
    authMethods: 'Способы входа',
  },
  tr: {
    titleLogin: 'Hesabınıza giriş yapın', subLogin: 'Tekrar hoş geldiniz! Devam etmek için giriş yapın.',
    titleSignup: 'Hesap oluşturun', subSignup: 'Ücretsizdir ve bir dakika sürer.',
    name: 'Ad (isteğe bağlı)', nameHint: 'Yalnızca hesabınızda görünür.',
    login: 'Giriş yap', signup: 'Hesap oluştur', or: 'veya', passkey: 'Geçiş anahtarıyla giriş yap',
    forgot: 'Şifrenizi mi unuttunuz?', forgotTitle: 'Şifrenizi sıfırlayın',
    forgotLead: 'Hesabınızın e-posta adresini yazın; yeni şifre belirlemeniz için bir bağlantı göndereceğiz.',
    send: 'Bağlantıyı gönder', back: 'Girişe dön',
    forgotSent: 'Bu adresle bir hesap varsa, ona bağlantı içeren bir e-posta gönderdik. Gelen kutunuzu ve spam klasörünü kontrol edin.',
    noAccount: 'Hesabınız yok mu?', createOne: 'Hesap oluşturun', haveAccount: 'Zaten hesabınız var mı?', signInLink: 'Giriş yapın',
    checkTitle: 'E-postanızı kontrol edin',
    checkText: 'Sonraki adımları {email} adresine gönderdik. E-postayı göremiyorsanız spam klasörünü kontrol edin.',
    resetDone: 'Şifreniz değiştirildi. Yeni şifrenizle giriş yapın.',
    perksTitle: 'Hesap size ne sağlar',
    perks: [
      'Güvenli giriş: şifre, geçiş anahtarı veya Google',
      'Etkin oturumlarınızı görün ve diğer cihazlardaki oturumları kapatın',
      'Cami temsilcileri için cami bilgilerinin yönetimi — yakında',
    ],
    perksNote: 'Sitenin tüm bölümleri hesapsız da ücretsiz çalışır.',
    privacy: 'IP adresinizi ve tarayıcınızın tüm bilgilerini saklamıyoruz.',
    legal: 'Hesap oluşturarak kullanım koşullarını ve gizlilik politikasını kabul etmiş olursunuz.',
    authMethods: 'Giriş yöntemleri',
  },
  ar: {
    titleLogin: 'تسجيل الدخول إلى حسابك', subLogin: 'مرحبًا بعودتك! سجّل الدخول للمتابعة.',
    titleSignup: 'أنشئ حسابًا', subSignup: 'مجاني ولا يستغرق سوى دقيقة.',
    name: 'الاسم (اختياري)', nameHint: 'يظهر في حسابك فقط.',
    login: 'دخول', signup: 'إنشاء الحساب', or: 'أو', passkey: 'الدخول بمفتاح المرور',
    forgot: 'هل نسيت كلمة المرور؟', forgotTitle: 'استعادة كلمة المرور',
    forgotLead: 'اكتب البريد الإلكتروني لحسابك وسنرسل إليك رابطًا لتعيين كلمة مرور جديدة.',
    send: 'أرسل الرابط', back: 'العودة إلى تسجيل الدخول',
    forgotSent: 'إن كان هناك حساب بهذا العنوان فقد أرسلنا إليه رسالة فيها رابط. تحقّق من صندوق الوارد ومجلد الرسائل غير المرغوب فيها.',
    noAccount: 'ليس لديك حساب؟', createOne: 'أنشئ حسابًا', haveAccount: 'لديك حساب بالفعل؟', signInLink: 'سجّل الدخول',
    checkTitle: 'تحقّق من بريدك الإلكتروني',
    checkText: 'أرسلنا الخطوات التالية إلى {email}. إن لم تجد الرسالة فتحقّق من مجلد الرسائل غير المرغوب فيها.',
    resetDone: 'تم تغيير كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.',
    perksTitle: 'ماذا يمنحك الحساب',
    perks: [
      'دخول آمن: بكلمة المرور أو مفتاح المرور أو Google',
      'اطّلع على جلساتك النشطة وأغلق الدخول على الأجهزة الأخرى',
      'لممثلي المساجد: إدارة معلومات المسجد — قريبًا',
    ],
    perksNote: 'تبقى جميع أقسام الموقع مجانية وتعمل دون حساب.',
    // lang-ok[IP]: texniki termin (IP ünvanı) tərcümə olunmur
    privacy: 'لا نحفظ عنوان IP الخاص بك ولا بيانات متصفحك الكاملة.',
    legal: 'بإنشاء حساب فإنك توافق على شروط الاستخدام وسياسة الخصوصية.',
    authMethods: 'طرق تسجيل الدخول',
  },
}

const PERK_ICONS = ['shield', 'device', 'mosques']

/**
 * Girişdən sonra hesaba bağlı şifrəli sinxronizasiya (utils/accountSync — tənbəl chunk).
 * Gözlənilmir: səhifə keçidi dərhal olur, nəticə AutoSyncToast / hesab səhifəsində görünür.
 * Şifrə yalnız brauzerdə açar törətmək üçün ötürülür (serverə əvvəlki kimi yalnız girişdə gedir).
 */
function startAccountSync(user, opts) {
  if (!user) return
  import('../utils/accountSync').then((m) => m.afterLogin(user, opts)).catch(() => {})
}

/** Rəsmi Google düyməsi (GIS iframe). Skript yüklənməsə — heç nə göstərmir. */
function GoogleButton({ text, onCredential }) {
  const { siteLang, lang, dark } = useLang()
  const ref = useRef(null)
  const cbRef = useRef(onCredential)
  cbRef.current = onCredential
  const cb = useCallback((c) => cbRef.current(c), [])
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    const el = ref.current
    renderGoogleButton(el, { onCredential: cb, text, dark: Boolean(dark), locale: siteLang || lang, width: el ? el.clientWidth - 20 : 320 })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false; releaseGoogleButton(cb) }
  }, [cb, text, dark, siteLang, lang])
  if (failed) return null
  return <div className="acc-google" ref={ref} data-testid="google-button" />
}

export default function LoginPage({ mode = 'login' }) {
  const { lang, siteLang = lang } = useLang()
  const l = pickUi(LABELS, lang)
  const { t, errText } = useAuthText()
  const navigate = useNavigate()
  const location = useLocation()
  const isSignup = mode === 'signup'
  const params = new URLSearchParams(location.search)
  const nextPath = safeNext(params.get('next'), pathFor('account', siteLang))

  // ?forgot=1 — birbaşa "şifrəni bərpa et" forması (/account/reset-də köhnə keçiddən gələndə)
  const [view, setView] = useState(() => (!isSignup && params.get('forgot') === '1' ? 'forgot' : 'form'))   // 'form' | 'forgot' | 'checkEmail'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(() => (params.get('reset') === 'done' ? { tone: 'ok', text: null, key: 'resetDone' } : null))
  const [invalid, setInvalid] = useState('')       // 'email' | 'password' | ''
  const [twoFa, setTwoFa] = useState(null)          // { ticket, password? } — şifrə/Google düzdür, kod gözlənilir
  const seq = useRef(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const show = (tone, text, title) => setMsg({ tone, text, title, seq: ++seq.current })
  const fail = (e) => {
    const k = errorKey(e)
    if (k === 'cancelled') { setMsg(null); return }
    setInvalid(k === 'errCreds' || k === 'errWeak' ? 'password' : '')
    show('bad', errText(k))
  }

  // Artıq daxil olubsa (və ya giriş indicə alındısa) — hədəf səhifəyə
  const auth = useAuthUser()
  useEffect(() => { if (hasLoginHint()) refreshMe().catch(() => {}) }, [])
  // J8: yeni hesab → /account-da istəyə bağlı "kunya" addımı (?welcome=1)
  const justSignedUp = useRef(false)
  useEffect(() => {
    if (auth.status !== 'user') return
    const acc = pathFor('account', siteLang)
    navigate(justSignedUp.current && nextPath === acc ? `${acc}?welcome=1` : nextPath, { replace: true })
  // nextPath query-dən gəlir — yalnız vəziyyət dəyişəndə
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status])

  // Passkey avtomatik doldurma (e-poçt sahəsinin təklif siyahısında). Səssiz: istifadəçi
  // passkey seçməsə heç nə olmur; düyməyə basanda kitabxana bu gözləməni özü ləğv edir.
  const passkeyOk = !isSignup && passkeySupported()
  useEffect(() => {
    if (!passkeyOk || view !== 'form') return undefined
    let on = true
    let started = false
    const timer = setTimeout(async () => {
      if (!(await passkeyAutofillAvailable()) || !on) return
      started = true
      try {
        let prf = null
        const u = await passkeyLogin({ autofill: true, onPrf: (p) => { prf = p }, lang })
        startAccountSync(u, { prf })
      } catch (e) {
        if (on && e instanceof AuthError && e.code === 'passkey_failed') show('bad', errText('errPasskey'))
      }
    }, 400)
    return () => {
      on = false
      clearTimeout(timer)
      if (started) import('@simplewebauthn/browser').then(m => m.WebAuthnAbortService.cancelCeremony()).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passkeyOk, view])

  const run = async (fn) => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    setInvalid('')
    try { await fn() } catch (e) { if (alive.current) fail(e) } finally { if (alive.current) setBusy(false) }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!validEmail(email)) { setInvalid('email'); show('bad', t.errEmail); return }
    if (isSignup) {
      if (passwordStrength(password, email).short) { setInvalid('password'); show('bad', errText('errWeak')); return }
      run(async () => {
        const r = await register({ email, password, displayName: name, lang })
        if (r.checkEmail) { if (alive.current) setView('checkEmail') } else { justSignedUp.current = true; startAccountSync(r.user, { password }) }
      })
    } else {
      run(async () => {
        const u = await login(email, password, lang)
        if (u && u.twoFactor) { if (alive.current) setTwoFa({ ticket: u.ticket, password }); return }
        startAccountSync(u, { password })
      })
    }
  }

  const onForgot = (e) => {
    e.preventDefault()
    if (!validEmail(email)) { setInvalid('email'); show('bad', t.errEmail); return }
    run(async () => {
      await forgotPassword(email, lang)
      if (alive.current) show('ok', l.forgotSent)
    })
  }

  const onGoogle = (credential) => run(async () => {
    const r = await googleLogin(credential, lang)
    if (r.twoFactor) { if (alive.current) setTwoFa({ ticket: r.ticket }); return }
    if (r.created) justSignedUp.current = true
    startAccountSync(r.user)
  })
  const onPasskey = () => run(async () => {
    let prf = null
    const u = await passkeyLogin({ onPrf: (p) => { prf = p }, lang })
    startAccountSync(u, { prf })
  })

  const go = (key) => (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    const q = params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''
    navigate(pathFor(key, siteLang) + q)
  }

  const shownMsg = msg && msg.key ? { ...msg, text: l[msg.key] } : msg

  const aside = (
    <aside className="acc-aside" aria-labelledby="acc-perks-title">
      <h2 className="acc-aside__title" id="acc-perks-title">{l.perksTitle}</h2>
      <ul className="acc-perks">
        {l.perks.map((p, i) => (
          <li key={i}><span className="ui-icon-tile ui-icon-tile--sm"><Icon name={PERK_ICONS[i]} size={16} /></span><span>{p}</span></li>
        ))}
      </ul>
      <p className="acc-aside__note"><Icon name="info" size={16} /> {l.perksNote}</p>
      <p className="acc-aside__note"><Icon name="lock" size={16} /> {l.privacy}</p>
    </aside>
  )

  if (twoFa) {
    return (
      <AuthShell aside={aside}>
        <Suspense fallback={<div className="spinner-wrap" role="status"><div className="spinner" /></div>}>
          <TwoFactorStep ticket={twoFa.ticket}
            onDone={(u) => startAccountSync(u, twoFa.password ? { password: twoFa.password } : undefined)}
            onCancel={(k) => { setTwoFa(null); setPassword(''); if (k) show('bad', errText(k)); else setMsg(null) }} />
        </Suspense>
      </AuthShell>
    )
  }

  if (view === 'checkEmail') {
    return (
      <AuthShell aside={aside}>
        <AuthHead icon="mail" title={l.checkTitle} />
        <p className="acc-lead" role="status">{l.checkText.replace('{email}', email.trim())}</p>
        <a className="ui-btn ui-btn--secondary ui-btn--block" href={pathFor('login', siteLang)} onClick={go('login')}>
          {l.back}
        </a>
      </AuthShell>
    )
  }

  if (view === 'forgot') {
    return (
      <AuthShell aside={aside}>
        <AuthHead icon="key" title={l.forgotTitle} sub={l.forgotLead} />
        <AuthMessage msg={shownMsg} />
        <form className="acc-form" onSubmit={onForgot} noValidate aria-busy={busy || undefined}>
          <EmailField label={t.email} value={email} onChange={setEmail} autoComplete="email" invalid={invalid === 'email'} autoFocus />
          <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block" disabled={busy}>
            <Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {busy ? t.busy : l.send}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm acc-linkbtn" onClick={() => { setView('form'); setMsg(null) }}>
            {l.back}
          </button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell aside={aside}>
      <AuthHead title={isSignup ? l.titleSignup : l.titleLogin} sub={isSignup ? l.subSignup : l.subLogin} />
      <AuthMessage msg={shownMsg} />

      {(GOOGLE_CLIENT_ID || passkeyOk) && (
        <>
          <div className="acc-methods" role="group" aria-label={l.authMethods}>
            {GOOGLE_CLIENT_ID && <GoogleButton text={isSignup ? 'signup_with' : 'signin_with'} onCredential={onGoogle} />}
            {passkeyOk && (
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--lg ui-btn--block acc-passkey" onClick={onPasskey} disabled={busy}>
                <Icon name="key" className="ui-btn__icon" /> {l.passkey}
              </button>
            )}
          </div>
          <div className="acc-or" aria-hidden="true"><span>{l.or}</span></div>
        </>
      )}

      <form className="acc-form" onSubmit={onSubmit} noValidate aria-busy={busy || undefined}>
        <EmailField
          label={t.email}
          value={email}
          onChange={setEmail}
          autoComplete={isSignup ? 'email' : 'username webauthn'}
          invalid={invalid === 'email'}
        />
        {isSignup && (
          <div className="ui-field acc-field">
            <label className="ui-field__label" htmlFor="acc-name">{l.name}</label>
            <span className="acc-input-wrap">
              <Icon name="user" size={18} className="acc-input-icon" />
              <input id="acc-name" name="name" className="ui-input acc-input" value={name} onChange={(e) => setName(e.target.value)}
                autoComplete="nickname" maxLength={MAX_NAME} aria-describedby="acc-name-hint" />
            </span>
            <span className="ui-field__hint" id="acc-name-hint">{l.nameHint}</span>
          </div>
        )}
        <PasswordField
          label={t.password}
          value={password}
          onChange={setPassword}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          withHint={isSignup}
          email={email}
          invalid={invalid === 'password'}
        />
        {!isSignup && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm acc-forgot" onClick={() => { setView('forgot'); setMsg(null); setInvalid('') }}>
            {l.forgot}
          </button>
        )}
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block" disabled={busy}>
          <Icon name={isSignup ? 'user' : 'enter'} className="ui-btn__icon ui-flip-rtl" /> {busy ? t.busy : (isSignup ? l.signup : l.login)}
        </button>
        {isSignup && (
          <p className="acc-legal">
            {l.legal}{' '}
            <a className="ui-link" href={pathFor('terms', siteLang)}>{shortName('terms', lang)}</a>
            {' · '}
            <a className="ui-link" href={pathFor('privacy', siteLang)}>{shortName('privacy', lang)}</a>
          </p>
        )}
      </form>

      <p className="acc-switch">
        {isSignup ? l.haveAccount : l.noAccount}{' '}
        <a className="ui-link" href={pathFor(isSignup ? 'login' : 'signup', siteLang)} onClick={go(isSignup ? 'login' : 'signup')}>
          {isSignup ? l.signInLink : l.createOne}
        </a>
      </p>
    </AuthShell>
  )
}
