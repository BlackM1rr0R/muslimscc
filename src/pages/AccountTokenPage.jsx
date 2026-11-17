// ═══════════════════════════════════════════════════════
// /account/verify və /account/reset — e-poçt keçidləri (server/users.js → sendMail)
//
//   <AccountTokenPage mode="verify" | "reset" />
//
// Token URL FRAQMENTİNDƏdir (#token=…) — server loguna və Referer-ə düşmür. Səhifə onu
// ilk render-də oxuyur və DƏRHAL history.replaceState ilə ünvandan silir (tarixçədə,
// ekran görüntüsündə, paylaşılan linkdə qalmasın).
//   verify → POST /api/auth/verify { token }
//   reset  → yeni şifrə forması → POST /api/auth/reset { token, password } → /login?reset=done
// noindex (src/seo/routes.js).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import { AuthShell, AuthHead, AuthMessage, PasswordField, useAuthText } from '../components/account/AuthUi'
import { useAuthUser, hasLoginHint } from '../api/userSession'
import { errorKey, passwordStrength, readHashToken, refreshMe, resetPassword, setCurrentUser, verifyEmail } from '../api/userAuth'

const LABELS = {
  az: {
    verifyTitle: 'E-poçtun təsdiqi', verifying: 'E-poçt ünvanınız təsdiqlənir…',
    verified: 'E-poçt ünvanınız təsdiqləndi. Təşəkkür edirik!',
    toAccount: 'Hesabıma keç', toLogin: 'Girişə keç',
    resetTitle: 'Yeni şifrə təyin edin',
    resetLead: 'Hesabınız üçün yeni şifrə yazın. Bundan sonra bütün cihazlardakı girişlər bağlanacaq.',
    save: 'Şifrəni yadda saxla',
    noToken: 'Keçid natamamdır. Məktubdakı keçidi tam açın və ya yenisini istəyin.',
    requestNew: 'Yeni keçid istə',
  },
  en: {
    verifyTitle: 'Email confirmation', verifying: 'Confirming your email address…',
    verified: 'Your email address is confirmed. Thank you!',
    toAccount: 'Go to my account', toLogin: 'Go to sign in',
    resetTitle: 'Set a new password',
    resetLead: 'Enter a new password for your account. After that you will be signed out on all devices.',
    save: 'Save password',
    noToken: 'This link is incomplete. Open the full link from the email or request a new one.',
    requestNew: 'Request a new link',
  },
  ru: {
    verifyTitle: 'Подтверждение почты', verifying: 'Подтверждаем ваш адрес почты…',
    verified: 'Ваш адрес почты подтверждён. Спасибо!',
    toAccount: 'Перейти в аккаунт', toLogin: 'Перейти ко входу',
    resetTitle: 'Задайте новый пароль',
    resetLead: 'Введите новый пароль для аккаунта. После этого входы на всех устройствах будут закрыты.',
    save: 'Сохранить пароль',
    noToken: 'Ссылка неполная. Откройте полную ссылку из письма или запросите новую.',
    requestNew: 'Запросить новую ссылку',
  },
  tr: {
    verifyTitle: 'E-posta onayı', verifying: 'E-posta adresiniz onaylanıyor…',
    verified: 'E-posta adresiniz onaylandı. Teşekkür ederiz!',
    toAccount: 'Hesabıma git', toLogin: 'Girişe git',
    resetTitle: 'Yeni şifre belirleyin',
    resetLead: 'Hesabınız için yeni bir şifre yazın. Ardından tüm cihazlardaki oturumlar kapatılacak.',
    save: 'Şifreyi kaydet',
    noToken: 'Bağlantı eksik. E-postadaki bağlantının tamamını açın veya yeni bir bağlantı isteyin.',
    requestNew: 'Yeni bağlantı iste',
  },
  ar: {
    verifyTitle: 'تأكيد البريد الإلكتروني', verifying: 'جارٍ تأكيد بريدك الإلكتروني…',
    verified: 'تم تأكيد بريدك الإلكتروني. شكرًا لك!',
    toAccount: 'الانتقال إلى حسابي', toLogin: 'الانتقال إلى تسجيل الدخول',
    resetTitle: 'عيّن كلمة مرور جديدة',
    resetLead: 'اكتب كلمة مرور جديدة لحسابك. بعد ذلك سيُغلق الدخول على جميع الأجهزة.',
    save: 'حفظ كلمة المرور',
    noToken: 'الرابط غير مكتمل. افتح الرابط كاملًا من الرسالة أو اطلب رابطًا جديدًا.',
    requestNew: 'اطلب رابطًا جديدًا',
  },
}

/** Fraqmenti ünvandan sil (router-in history.state açarı saxlanır). */
function stripHash() {
  try {
    if (!window.location.hash) return
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  } catch { /* köhnə brauzer */ }
}

export default function AccountTokenPage({ mode = 'verify' }) {
  const { lang, siteLang = lang } = useLang()
  const l = pickUi(LABELS, lang)
  const { t, errText } = useAuthText()
  const navigate = useNavigate()
  const auth = useAuthUser()
  const isReset = mode === 'reset'

  // Token yalnız bir dəfə — ilk render-də (sonra ünvandan silinir)
  const [token] = useState(() => (typeof window === 'undefined' ? '' : readHashToken(window.location.hash)))
  useEffect(() => { stripHash() }, [])

  const [state, setState] = useState(token ? (isReset ? 'form' : 'working') : 'missing')   // working | ok | error | missing | form
  const [msg, setMsg] = useState(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const seq = useRef(0)
  const started = useRef(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const show = (tone, text) => setMsg({ tone, text, seq: ++seq.current })

  // verify: avtomatik (StrictMode-da effekt iki dəfə işləsə də sorğu bir dəfə gedir — token birdəfəlikdir)
  useEffect(() => {
    if (isReset || !token || started.current) return
    started.current = true
    verifyEmail(token).then(() => {
      if (!alive.current) return
      setState('ok')
      if (hasLoginHint()) refreshMe().catch(() => {})
    }).catch((e) => {
      if (!alive.current) return
      setState('error')
      show('bad', errText(errorKey(e)))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onReset = async (e) => {
    e.preventDefault()
    if (busy) return
    if (passwordStrength(password).short) { show('bad', errText('errWeak')); return }
    setBusy(true)
    setMsg(null)
    try {
      await resetPassword(token, password)
      // Server bütün sessiyaları ləğv etdi — klientdə də "daxil olub" ipucu silinsin
      setCurrentUser(null)
      navigate(`${pathFor('login', siteLang)}?reset=done`, { replace: true })
    } catch (err) {
      if (!alive.current) return
      const k = errorKey(err)
      if (k === 'errToken') setState('error')
      show('bad', errText(k))
    } finally {
      if (alive.current) setBusy(false)
    }
  }

  const link = (key, query = '') => (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(pathFor(key, siteLang) + query)
  }
  const signedIn = auth.status === 'user' || auth.status === 'unknown'

  if (isReset && state === 'form') {
    return (
      <AuthShell>
        <AuthHead icon="key" title={l.resetTitle} sub={l.resetLead} />
        <AuthMessage msg={msg} />
        <form className="acc-form" onSubmit={onReset} noValidate aria-busy={busy || undefined}>
          <PasswordField label={t.newPassword} value={password} onChange={setPassword} autoComplete="new-password" withHint autoFocus
            invalid={msg?.tone === 'bad'} />
          <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block" disabled={busy}>
            <Icon name="check" className="ui-btn__icon" /> {busy ? t.busy : l.save}
          </button>
        </form>
      </AuthShell>
    )
  }

  const title = isReset ? l.resetTitle : l.verifyTitle
  const icon = state === 'ok' ? 'check' : state === 'working' ? 'mail' : 'alert'
  return (
    <AuthShell>
      <AuthHead icon={icon} title={title} />
      {state === 'working' && <p className="acc-lead" role="status" aria-live="polite">{l.verifying}</p>}
      {state === 'ok' && <AuthMessage msg={{ tone: 'ok', text: l.verified }} />}
      {state === 'missing' && <AuthMessage msg={{ tone: 'bad', text: l.noToken }} />}
      {state === 'error' && <AuthMessage msg={msg} />}
      {state !== 'working' && (
        <div className="acc-actions">
          {state === 'ok' && (
            signedIn
              ? <a className="ui-btn ui-btn--primary ui-btn--block" href={pathFor('account', siteLang)} onClick={link('account')}>{l.toAccount}</a>
              : <a className="ui-btn ui-btn--primary ui-btn--block" href={pathFor('login', siteLang)} onClick={link('login')}>{l.toLogin}</a>
          )}
          {state !== 'ok' && (
            isReset
              ? <a className="ui-btn ui-btn--primary ui-btn--block" href={`${pathFor('login', siteLang)}?forgot=1`} onClick={link('login', '?forgot=1')}>{l.requestNew}</a>
              : <a className="ui-btn ui-btn--primary ui-btn--block" href={pathFor(signedIn ? 'account' : 'login', siteLang)} onClick={link(signedIn ? 'account' : 'login')}>{signedIn ? l.toAccount : l.toLogin}</a>
          )}
        </div>
      )}
    </AuthShell>
  )
}
