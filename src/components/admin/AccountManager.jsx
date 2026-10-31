// ═══════════════════════════════════════════════════════
// Admin hesabı — "Şifrəni dəyiş" (POST /api/admin/password, server/auth.js)
//
// • Adi rejim: panelin "Hesab" bölməsi.
// • forced — hesab müvəqqəti şifrə ilə yaradılıb (admin-user.js create /
//   set-password): panel əvəzinə yalnız bu forma göstərilir; server də
//   şifrə dəyişənə qədər digər admin API-lərini bağlayır (403 must_change).
// Şifrə dəyişəndə digər cihazlardakı sessiyalar ləğv olunur, cari qalır.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, SectionTitle, AdminAlert } from './AdminUi'
import Icon from '../Icon'
import { changeAdminPassword, MIN_ADMIN_PASSWORD } from '../../api/adminAuth'

const LABELS = {
  az: { title:'Hesab', sub:'Admin hesabınızın təhlükəsizliyi', change:'Şifrəni dəyiş', signedInAs:'Daxil olan hesab', current:'Cari şifrə', next:'Yeni şifrə', confirm:'Yeni şifrə (təkrar)', hint:'Ən azı {n} simvol. Şifrə dəyişəndə digər cihazlardakı girişlər bağlanır.', save:'Şifrəni dəyiş', saving:'Yadda saxlanılır...', done:'Şifrə dəyişdirildi. Digər cihazlardakı girişlər bağlandı.', forcedTitle:'Müvəqqəti şifrəni dəyişin', forcedSub:'Hesabınız müvəqqəti şifrə ilə açılıb. Panelə keçmək üçün yeni şifrə təyin edin.', show:'Şifrələri göstər', hide:'Şifrələri gizlət', logout:'Çıxış',
    errMismatch:'Yeni şifrələr uyğun gəlmir', errWeak:'Yeni şifrə ən azı {n} simvol olmalıdır', errWrong:'Cari şifrə yanlışdır', errSame:'Yeni şifrə köhnəsindən fərqli olmalıdır', errMany:'Çox cəhd edildi. Bir az sonra yenidən sınayın', errSession:'Sessiya bitib — çıxıb yenidən daxil olun', errNet:'Şəbəkə xətası. İnternet bağlantısını yoxlayın', errUnknown:'Şifrəni dəyişmək alınmadı' },
  en: { title:'Account', sub:'Security of your admin account', change:'Change password', signedInAs:'Signed in as', current:'Current password', next:'New password', confirm:'New password (again)', hint:'At least {n} characters. Changing the password signs out your other devices.', save:'Change password', saving:'Saving...', done:'Password changed. Your other devices have been signed out.', forcedTitle:'Change your temporary password', forcedSub:'Your account was opened with a temporary password. Set a new password to continue to the panel.', show:'Show passwords', hide:'Hide passwords', logout:'Log out',
    errMismatch:'The new passwords do not match', errWeak:'The new password must be at least {n} characters', errWrong:'The current password is incorrect', errSame:'The new password must differ from the old one', errMany:'Too many attempts. Please try again later', errSession:'Session expired — sign out and sign in again', errNet:'Network error. Check your internet connection', errUnknown:'Could not change the password' },
  ru: { title:'Аккаунт', sub:'Безопасность аккаунта администратора', change:'Сменить пароль', signedInAs:'Вы вошли как', current:'Текущий пароль', next:'Новый пароль', confirm:'Новый пароль (ещё раз)', hint:'Не менее {n} символов. При смене пароля входы на других устройствах закрываются.', save:'Сменить пароль', saving:'Сохранение...', done:'Пароль изменён. Входы на других устройствах закрыты.', forcedTitle:'Смените временный пароль', forcedSub:'Аккаунт открыт с временным паролем. Чтобы перейти в панель, задайте новый пароль.', show:'Показать пароли', hide:'Скрыть пароли', logout:'Выход',
    errMismatch:'Новые пароли не совпадают', errWeak:'Новый пароль должен содержать не менее {n} символов', errWrong:'Текущий пароль неверен', errSame:'Новый пароль должен отличаться от старого', errMany:'Слишком много попыток. Повторите позже', errSession:'Сессия истекла — выйдите и войдите снова', errNet:'Ошибка сети. Проверьте подключение к интернету', errUnknown:'Не удалось сменить пароль' },
  ar: { title:'الحساب', sub:'أمان حساب الإدارة', change:'تغيير كلمة المرور', signedInAs:'الحساب المسجَّل', current:'كلمة المرور الحالية', next:'كلمة المرور الجديدة', confirm:'كلمة المرور الجديدة (مرة أخرى)', hint:'{n} حرفًا على الأقل. عند تغيير كلمة المرور يُغلق الدخول على الأجهزة الأخرى.', save:'تغيير كلمة المرور', saving:'جارٍ الحفظ...', done:'تم تغيير كلمة المرور، وأُغلق الدخول على الأجهزة الأخرى.', forcedTitle:'غيّر كلمة المرور المؤقتة', forcedSub:'فُتح حسابك بكلمة مرور مؤقتة. عيّن كلمة مرور جديدة للمتابعة إلى اللوحة.', show:'إظهار كلمات المرور', hide:'إخفاء كلمات المرور', logout:'خروج',
    errMismatch:'كلمتا المرور الجديدتان غير متطابقتين', errWeak:'يجب أن تتكون كلمة المرور الجديدة من {n} حرفًا على الأقل', errWrong:'كلمة المرور الحالية غير صحيحة', errSame:'يجب أن تختلف كلمة المرور الجديدة عن القديمة', errMany:'محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا', errSession:'انتهت الجلسة — سجّل الخروج ثم ادخل مجددًا', errNet:'خطأ في الشبكة. تحقق من اتصالك بالإنترنت', errUnknown:'تعذّر تغيير كلمة المرور' },
  tr: { title:'Hesap', sub:'Yönetici hesabınızın güvenliği', change:'Şifreyi değiştir', signedInAs:'Giriş yapılan hesap', current:'Mevcut şifre', next:'Yeni şifre', confirm:'Yeni şifre (tekrar)', hint:'En az {n} karakter. Şifre değişince diğer cihazlardaki oturumlar kapanır.', save:'Şifreyi değiştir', saving:'Kaydediliyor...', done:'Şifre değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.', forcedTitle:'Geçici şifrenizi değiştirin', forcedSub:'Hesabınız geçici bir şifreyle açıldı. Panele geçmek için yeni bir şifre belirleyin.', show:'Şifreleri göster', hide:'Şifreleri gizle', logout:'Çıkış',
    errMismatch:'Yeni şifreler eşleşmiyor', errWeak:'Yeni şifre en az {n} karakter olmalıdır', errWrong:'Mevcut şifre yanlış', errSame:'Yeni şifre eskisinden farklı olmalıdır', errMany:'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin', errSession:'Oturum sona erdi — çıkış yapıp yeniden giriş yapın', errNet:'Ağ hatası. İnternet bağlantınızı kontrol edin', errUnknown:'Şifre değiştirilemedi' },
}

const ERR_KEY = { wrong:'errWrong', weak:'errWeak', same:'errSame', many:'errMany', session:'errSession', net:'errNet' }

// Ərəbcədə rəqəm ərəb-hind yazılışı ilə
const num = (n, lang) => (lang === 'ar' ? n.toLocaleString('ar-EG') : String(n))

export default function AccountManager({ email = '', forced = false, onChanged, onLogout }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const fill = (s) => s.replace('{n}', num(MIN_ADMIN_PASSWORD, lang))

  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [reveal, setReveal] = useState(false)
  const [busy, setBusy] = useState(false)
  // { tone, key } — mətn dil dəyişəndə də düzgün qalsın deyə açar saxlanır
  const [msg, setMsg] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setMsg(null)
    if (form.next.length < MIN_ADMIN_PASSWORD) { setMsg({ tone: 'bad', key: 'errWeak' }); return }
    if (form.next !== form.confirm) { setMsg({ tone: 'bad', key: 'errMismatch' }); return }
    setBusy(true)
    const res = await changeAdminPassword(form.current, form.next)
    setBusy(false)
    if (!res.ok) { setMsg({ tone: 'bad', key: ERR_KEY[res.code] || 'errUnknown' }); return }
    setForm({ current: '', next: '', confirm: '' })
    setMsg({ tone: 'ok', key: 'done' })
    onChanged?.()
  }

  const type = reveal ? 'text' : 'password'

  return (
    <div>
      <AdminHeader icon="shield" title={forced ? l.forcedTitle : l.title} sub={forced ? l.forcedSub : l.sub}>
        {forced && onLogout && (
          <button type="button" className="admin-cancel-btn" onClick={onLogout}>
            <Icon name="enter" className="admin-back-arrow" /> {l.logout}
          </button>
        )}
      </AdminHeader>

      <div className="admin-section" data-reveal>
        <SectionTitle icon="shield">{l.change}</SectionTitle>
        {email && <p className="admin-section-lead">{l.signedInAs}: <bdi>{email}</bdi></p>}

        <form onSubmit={handleSubmit} className="admin-form" aria-busy={busy || undefined}>
          {/* Parol menecerləri üçün gizli istifadəçi adı sahəsi */}
          <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-account-current">{l.current}</label>
            <input id="adm-account-current" type={type} className="admin-input" value={form.current}
              onChange={set('current')} autoComplete="current-password" required />
          </div>
          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-account-next">{l.next}</label>
              <input id="adm-account-next" type={type} className="admin-input" value={form.next}
                onChange={set('next')} autoComplete="new-password" minLength={MIN_ADMIN_PASSWORD} maxLength={1024}
                aria-describedby="adm-account-hint" required />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-account-confirm">{l.confirm}</label>
              <input id="adm-account-confirm" type={type} className="admin-input" value={form.confirm}
                onChange={set('confirm')} autoComplete="new-password" minLength={MIN_ADMIN_PASSWORD} maxLength={1024} required />
            </div>
          </div>
          <p id="adm-account-hint" className="admin-hint">{fill(l.hint)}</p>

          {msg && <AdminAlert tone={msg.tone}>{fill(l[msg.key])}</AdminAlert>}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={busy}>
              <Icon name="check" /> {busy ? l.saving : l.save}
            </button>
            <button type="button" className="admin-cancel-btn" onClick={() => setReveal(v => !v)} aria-pressed={reveal}>
              <Icon name={reveal ? 'close' : 'eye'} /> {reveal ? l.hide : l.show}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
