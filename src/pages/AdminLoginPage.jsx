import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { adminLogin } from '../data/videos'
import '../styles/AdminPage.css'

const LABELS = {
  az: { title:'Admin Panel', sub:'Davam etmək üçün şifrəni daxil edin', password:'Şifrə', login:'Giriş', error:'Şifrə yanlışdır!', hint:'Yalnız admin üçündür. Şifrəni unutmusunuzsa, müraciət edin.', back:'← Geri qayıt' },
  en: { title:'Admin Panel', sub:'Enter password to continue', password:'Password', login:'Login', error:'Incorrect password!', hint:'For admin only. Contact support if forgotten.', back:'← Back' },
  ru: { title:'Админ Панель', sub:'Введите пароль для продолжения', password:'Пароль', login:'Войти', error:'Неверный пароль!', hint:'Только для администратора.', back:'← Назад' },
  ar: { title:'لوحة الإدارة', sub:'أدخل كلمة المرور للمتابعة', password:'كلمة المرور', login:'دخول', error:'!كلمة المرور غير صحيحة', hint:'للمسؤولين فقط', back:'رجوع →' },
  tr: { title:'Yönetim Paneli', sub:'Devam etmek için şifre girin', password:'Şifre', login:'Giriş', error:'Şifre yanlış!', hint:'Sadece yöneticiler için.', back:'← Geri' },
}

export default function AdminLoginPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (adminLogin(password)) {
      setPage('admin')
    } else {
      setError(true)
      setTimeout(() => setError(false), 3000)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card anim-scaleIn">
        <div className="admin-login-icon">🔐</div>
        <h1 className="admin-login-title">{l.title}</h1>
        <p className="admin-login-sub">{l.sub}</p>

        {error && (
          <div className="admin-login-error">
            <span>⚠️</span> {l.error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-login-input-wrap">
            <span className="admin-login-input-icon">🔑</span>
            <input
              type="password"
              className="admin-login-input"
              placeholder={l.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          <button type="submit" className="admin-login-btn">
            <span>🚀</span> {l.login}
          </button>
        </form>

        <div className="admin-login-hint">
          <div>{l.hint}</div>
          <button
            type="button"
            onClick={() => setPage('home')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              marginTop: 10,
            }}
          >
            {l.back}
          </button>
        </div>
      </div>
    </div>
  )
}
