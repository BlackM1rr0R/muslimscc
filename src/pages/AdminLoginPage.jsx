import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { adminLogin } from '../data/videos'
import Icon, { BrandMark } from '../components/Icon'
import '../styles/AdminPage.css'

// Mətnlərdə ox simvolu yoxdur — ox <Icon> ilədir (ərəbcədə güzgülənir)
const LABELS = {
  az: { title:'Admin paneli', sub:'Davam etmək üçün şifrəni daxil edin', password:'Şifrə', login:'Daxil ol', error:'Şifrə yanlışdır!', hint:'Yalnız admin üçündür. Şifrəni unutmusunuzsa, müraciət edin.', back:'Sayta qayıt', show:'Şifrəni göstər', hide:'Şifrəni gizlət' },
  en: { title:'Admin Panel', sub:'Enter password to continue', password:'Password', login:'Sign in', error:'Incorrect password!', hint:'For admin only. Contact support if forgotten.', back:'Back to the site', show:'Show password', hide:'Hide password' },
  ru: { title:'Админ-панель', sub:'Введите пароль для продолжения', password:'Пароль', login:'Войти', error:'Неверный пароль!', hint:'Только для администратора.', back:'Вернуться на сайт', show:'Показать пароль', hide:'Скрыть пароль' },
  ar: { title:'لوحة الإدارة', sub:'أدخل كلمة المرور للمتابعة', password:'كلمة المرور', login:'دخول', error:'كلمة المرور غير صحيحة!', hint:'للمسؤولين فقط', back:'العودة إلى الموقع', show:'إظهار كلمة المرور', hide:'إخفاء كلمة المرور' },
  tr: { title:'Yönetim Paneli', sub:'Devam etmek için şifre girin', password:'Şifre', login:'Giriş yap', error:'Şifre yanlış!', hint:'Sadece yöneticiler için.', back:'Siteye dön', show:'Şifreyi göster', hide:'Şifreyi gizle' },
}

export default function AdminLoginPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  // Hər yanlış cəhddə xəta qutusu yenidən "silkələnsin" (key dəyişir)
  const [errKey, setErrKey] = useState(0)
  const [reveal, setReveal] = useState(false)
  // Ardıcıl yanlış cəhdlərdə əvvəlki taymer yeni xətanı vaxtından əvvəl gizlədirdi
  const errTimer = useRef(0)
  useEffect(() => () => clearTimeout(errTimer.current), [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (adminLogin(password)) {
      setPage('admin')
    } else {
      setError(true)
      setErrKey(k => k + 1)
      clearTimeout(errTimer.current)
      errTimer.current = setTimeout(() => setError(false), 3000)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
      <div className="admin-login-card ui-card">
        <div className="admin-login-icon" aria-hidden="true"><BrandMark size={56} /></div>
        <h1 className="admin-login-title">{l.title}</h1>
        <p className="admin-login-sub">{l.sub}</p>

        {error && (
          <div key={errKey} className="admin-alert admin-alert--bad admin-login-error" role="alert">
            <Icon name="alert" size={18} /> {l.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="ui-field">
            <span className="ui-field__label">{l.password}</span>
            <span className="admin-login-input-wrap">
              <Icon name="shield" size={18} className="admin-login-input-icon" />
              <input
                type={reveal ? 'text' : 'password'}
                className="ui-input admin-login-input"
                placeholder={l.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={error || undefined}
                autoFocus
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

          <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block">
            <Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {l.login}
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
