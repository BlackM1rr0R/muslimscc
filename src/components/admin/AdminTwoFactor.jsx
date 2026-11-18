// ═══════════════════════════════════════════════════════
// Admin paneli → "Hesab" → iki addımlı yoxlama (TOTP, server/auth.js → /api/admin/2fa/*, admin_totp)
// Qurulum: cari şifrə → QR + açar → kodla təsdiq → 10 ehtiyat kodu (bir dəfə). Bağlamaq: şifrə və ya kod.
// Telefon itəndə: serverdə `node scripts/admin-user.js totp-reset <e-poçt>` (docs/ACCOUNT-SECURITY.md).
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { SectionTitle, AdminAlert } from './AdminUi'
import Icon from '../Icon'
import QrImage from '../account/QrImage'
import { adminTwoFactorDisable, adminTwoFactorEnable, adminTwoFactorSetup } from '../../api/adminAuth'
import '../../styles/AccountSecurity.css'

const LABELS = {
  // lang-ok[user]: serverdəki əmrin adı (admin-user.js totp-reset) tərcümə olunmur
  az: { title:'İki addımlı yoxlama', on:'Açıqdır', off:'Bağlıdır', lead:'Şifrədən sonra kod tətbiqinin 6 rəqəmli kodu da soruşulur. Telefon itsə, serverdə admin-user.js totp-reset əmri ilə söndürülür.', enable:'Aç', pw:'Cari şifrə', next:'Davam et', scan:'Tətbiqlə QR kodu skan edin və ya açarı əl ilə yazın:', qrAlt:'Admin paneli üçün iki addımlı yoxlamanın QR kodu', code:'Tətbiqdəki 6 rəqəmli kod', confirm:'Təsdiqlə və aç', cancel:'Ləğv et', codesTitle:'Ehtiyat kodları (bir daha göstərilməyəcək)', saved:'Saxladım', disable:'Bağla', done:'İki addımlı yoxlama açıldı.', disabled:'İki addımlı yoxlama bağlandı.', errWrong:'Şifrə və ya kod yanlışdır', errCode:'Kod yanlışdır və ya vaxtı keçib', errMany:'Çox cəhd edildi. Bir az sonra yenidən sınayın', errUnknown:'Alınmadı' },
  en: { title:'Two-step verification', on:'On', off:'Off', lead:'After your password, the 6-digit code from an authenticator app is also required. If the phone is lost, turn it off on the server with the admin-user.js totp-reset command.', enable:'Turn on', pw:'Current password', next:'Continue', scan:'Scan the QR code with the app or type the key manually:', qrAlt:'Two-step verification QR code for the admin panel', code:'6-digit code from the app', confirm:'Confirm and turn on', cancel:'Cancel', codesTitle:'Backup codes (they will not be shown again)', saved:'I have saved them', disable:'Turn off', done:'Two-step verification is on.', disabled:'Two-step verification is off.', errWrong:'Wrong password or code', errCode:'The code is wrong or has expired', errMany:'Too many attempts. Please try again later', errUnknown:'Something went wrong' },
  // lang-ok: serverdəki əmrin adı (admin-user.js totp-reset) tərcümə olunmur
  ru: { title:'Двухэтапная проверка', on:'Включена', off:'Отключена', lead:'После пароля запрашивается ещё 6-значный код из приложения-аутентификатора. Если телефон потерян, отключите проверку на сервере командой admin-user.js totp-reset.', enable:'Включить', pw:'Текущий пароль', next:'Продолжить', scan:'Отсканируйте QR-код приложением или введите ключ вручную:', qrAlt:'QR-код двухэтапной проверки для админ-панели', code:'6-значный код из приложения', confirm:'Подтвердить и включить', cancel:'Отмена', codesTitle:'Резервные коды (больше не будут показаны)', saved:'Я сохранил коды', disable:'Отключить', done:'Двухэтапная проверка включена.', disabled:'Двухэтапная проверка отключена.', errWrong:'Неверный пароль или код', errCode:'Код неверный или устарел', errMany:'Слишком много попыток. Повторите позже', errUnknown:'Не получилось' },
  // lang-ok: serverdəki əmrin adı (admin-user.js totp-reset) tərcümə olunmur
  ar: { title:'التحقق بخطوتين', on:'مفعّل', off:'غير مفعّل', lead:'بعد كلمة المرور يُطلب أيضًا رمز من 6 أرقام من تطبيق المصادقة. إن فُقد الهاتف فأوقفه على الخادم بالأمر admin-user.js totp-reset.', enable:'تفعيل', pw:'كلمة المرور الحالية', next:'متابعة', scan:'امسح رمز QR بالتطبيق أو اكتب المفتاح يدويًا:', qrAlt:'رمز QR للتحقق بخطوتين في لوحة الإدارة', code:'الرمز المكوّن من 6 أرقام من التطبيق', confirm:'تأكيد وتفعيل', cancel:'إلغاء', codesTitle:'الرموز الاحتياطية (لن تُعرض مرة أخرى)', saved:'حفظتُها', disable:'إيقاف', done:'تم تفعيل التحقق بخطوتين.', disabled:'تم إيقاف التحقق بخطوتين.', errWrong:'كلمة المرور أو الرمز غير صحيح', errCode:'الرمز غير صحيح أو منتهي الصلاحية', errMany:'محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا', errUnknown:'لم تنجح العملية' },
  tr: { title:'İki adımlı doğrulama', on:'Açık', off:'Kapalı', lead:'Şifrenizden sonra doğrulama uygulamasının 6 haneli kodu da istenir. Telefon kaybolursa sunucuda admin-user.js totp-reset komutuyla kapatılır.', enable:'Aç', pw:'Mevcut şifre', next:'Devam et', scan:'QR kodunu uygulamayla tarayın veya anahtarı elle yazın:', qrAlt:'Yönetim paneli için iki adımlı doğrulama QR kodu', code:'Uygulamadaki 6 haneli kod', confirm:'Onayla ve aç', cancel:'Vazgeç', codesTitle:'Yedek kodlar (bir daha gösterilmeyecek)', saved:'Kaydettim', disable:'Kapat', done:'İki adımlı doğrulama açıldı.', disabled:'İki adımlı doğrulama kapatıldı.', errWrong:'Şifre veya kod yanlış', errCode:'Kod yanlış veya süresi dolmuş', errMany:'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin', errUnknown:'Olmadı' },
}

const errOf = (e) => (e && e.status === 429 ? 'errMany' : e && e.code === 'invalid_code' ? 'errCode' : e && e.code === 'wrong' ? 'errWrong' : 'errUnknown')

export default function AdminTwoFactor({ email = '', enabled = false, onChange }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang)
  const [step, setStep] = useState('idle')        // idle | password | setup | codes | disable
  const [pw, setPw] = useState('')
  const [code, setCode] = useState('')
  const [setup, setSetup] = useState(null)
  const [codes, setCodes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const cancel = () => { setStep('idle'); setPw(''); setCode(''); setSetup(null); setMsg(null) }
  const run = async (fn) => {
    setBusy(true); setMsg(null)
    try { await fn() } catch (e) { setMsg({ tone: 'bad', key: errOf(e) }) } finally { setBusy(false) }
  }
  const onPassword = (e) => { e.preventDefault(); run(async () => { setSetup(await adminTwoFactorSetup(pw)); setPw(''); setStep('setup') }) }
  const onConfirm = (e) => {
    e.preventDefault()
    run(async () => { setCodes(await adminTwoFactorEnable(code)); setCode(''); setSetup(null); setStep('codes'); setMsg({ tone: 'ok', key: 'done' }); onChange?.(true) })
  }
  const onDisable = (e) => {
    e.preventDefault()
    const v = code.trim()
    const body = pw ? { password: pw } : /^\d{6}$/.test(v) ? { code: v } : { backupCode: v }
    run(async () => { await adminTwoFactorDisable(body); cancel(); setMsg({ tone: 'ok', key: 'disabled' }); onChange?.(false) })
  }

  return (
    <div className="admin-section" data-testid="admin-2fa-card">
      <SectionTitle icon="key">{l.title} <span className={`ui-badge ${enabled ? 'ui-badge--ok' : 'ui-badge--outline'}`}>{enabled ? l.on : l.off}</span></SectionTitle>
      <p className="admin-section-lead">{l.lead}</p>

      {step === 'codes' && codes && (
        <div className="acc-sec-codes">
          <p className="admin-section-lead"><strong>{l.codesTitle}</strong></p>
          <ol className="acc-sec-codes__list" dir="ltr">{codes.map((c) => <li key={c}><code>{c}</code></li>)}</ol>
          <button type="button" className="admin-submit-btn" onClick={() => { setCodes(null); setStep('idle'); setMsg(null) }}>{l.saved}</button>
        </div>
      )}
      {step === 'idle' && !enabled && <button type="button" className="admin-submit-btn" onClick={() => setStep('password')}><Icon name="shield" /> {l.enable}</button>}
      {step === 'idle' && enabled && <button type="button" className="admin-cancel-btn" onClick={() => setStep('disable')}>{l.disable}</button>}

      {step === 'password' && (
        <form className="admin-form" onSubmit={onPassword} aria-busy={busy || undefined}>
          <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-2fa-pw">{l.pw}</label>
            <input id="adm-2fa-pw" type="password" className="admin-input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required autoFocus />
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={busy || !pw}>{l.next}</button>
            <button type="button" className="admin-cancel-btn" onClick={cancel}>{l.cancel}</button>
          </div>
        </form>
      )}
      {step === 'setup' && setup && (
        <form className="admin-form" onSubmit={onConfirm} aria-busy={busy || undefined}>
          <p className="admin-section-lead">{l.scan}</p>
          <div className="acc-sec-qrwrap">
            <QrImage text={setup.uri} alt={l.qrAlt} />
            <code className="acc-sec-secret" dir="ltr">{setup.secret.match(/.{1,4}/g).join(' ')}</code>
          </div>
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-2fa-code">{l.code}</label>
            <input id="adm-2fa-code" className="admin-input acc-sec-code" value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              inputMode="numeric" autoComplete="one-time-code" maxLength={6} dir="ltr" required />
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={busy || code.length !== 6}><Icon name="check" /> {l.confirm}</button>
            <button type="button" className="admin-cancel-btn" onClick={cancel}>{l.cancel}</button>
          </div>
        </form>
      )}
      {step === 'disable' && (
        <form className="admin-form" onSubmit={onDisable} aria-busy={busy || undefined}>
          <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-2fa-dpw">{l.pw}</label>
              <input id="adm-2fa-dpw" type="password" className="admin-input" value={pw} onChange={(e) => { setPw(e.target.value); setCode('') }} autoComplete="current-password" />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-2fa-dcode">{l.code}</label>
              <input id="adm-2fa-dcode" className="admin-input acc-sec-code" value={code} onChange={(e) => { setCode(e.target.value); setPw('') }} inputMode="text" autoComplete="one-time-code" maxLength={11} dir="ltr" />
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={busy || (!pw && !code.trim())}>{l.disable}</button>
            <button type="button" className="admin-cancel-btn" onClick={cancel}>{l.cancel}</button>
          </div>
        </form>
      )}
      {msg && <AdminAlert tone={msg.tone}>{l[msg.key]}</AdminAlert>}
    </div>
  )
}
