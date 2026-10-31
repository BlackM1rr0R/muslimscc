import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import { apiFetch } from '../api/http'
import '../styles/ReportErrorButton.css'

/* ══════════════════════════════════════════════════════════════════
   "Səhv bildir" — məzmun səhvini (tərcümə, mənbə, hədis, mətn) bildirmək.
   Bildiriş serverə gedir (server/feedback.js → POST /api/feedback) və
   admin panelində "Bildirişlər" bölməsində görünür. IP/cookie saxlanmır;
   əlaqə məlumatı könüllüdür.
   Quruluş: düymə (ReportErrorButton) yalnız hadisə göndərir — dialoqun
   özü bütün sayt üçün BİR dənədir (ReportErrorHost, App.jsx-də tənbəl
   yüklənir), 1250 hədis kartının hər birində dialoq yaranmasın.
   props: refText — nəyə aid olduğu (məs. "Buxari 1", "2:255", dərsin adı)
          kind    — susmaya görə seçilən növ; compact — yalnız ikon
   ══════════════════════════════════════════════════════════════════ */

const T = {
  az: {
    btn: 'Səhv bildir', title: 'Səhv bildirin', about: 'Aid olduğu', kind: 'Növü', text: 'Nə səhvdir?',
    textPh: 'Səhvi və düzgün variantı yazın (mümkünsə mənbə ilə).', contact: 'Əlaqə (könüllü)', contactPh: 'E-poçt və ya Telegram — cavab istəyirsinizsə',
    send: 'Göndər', cancel: 'Ləğv et', sending: 'Göndərilir…', thanks: 'Təşəkkür edirik! Bildirişiniz yoxlanılacaq.',
    error: 'Göndərmək alınmadı. Bir az sonra yenidən cəhd edin.', limit: 'Çox bildiriş göndərildi. 10 dəqiqədən sonra yenidən cəhd edin.',
    short: 'Ən azı bir neçə söz yazın.', privacy: 'IP ünvanınız və cihaz məlumatınız saxlanmır.',
    kinds: { text: 'Mətn səhvi', translation: 'Tərcümə', source: 'Mənbə / istinad', hadith: 'Hədisin səhihliyi', design: 'Görünüş / texniki', other: 'Digər' },
  },
  en: {
    btn: 'Report an error', title: 'Report an error', about: 'About', kind: 'Type', text: 'What is wrong?',
    textPh: 'Describe the error and the correct version (with a source if possible).', contact: 'Contact (optional)', contactPh: 'Email or Telegram — if you want a reply',
    send: 'Send', cancel: 'Cancel', sending: 'Sending…', thanks: 'Thank you! Your report will be reviewed.',
    error: 'Could not send. Please try again a little later.', limit: 'Too many reports sent. Please try again in 10 minutes.',
    short: 'Please write at least a few words.', privacy: 'Your IP address and device details are not stored.',
    kinds: { text: 'Text error', translation: 'Translation', source: 'Source / reference', hadith: 'Hadith authenticity', design: 'Display / technical', other: 'Other' },
  },
  ru: {
    btn: 'Сообщить об ошибке', title: 'Сообщить об ошибке', about: 'К чему относится', kind: 'Тип', text: 'Что не так?',
    textPh: 'Опишите ошибку и верный вариант (по возможности с источником).', contact: 'Контакт (необязательно)', contactPh: 'Эл. почта или Телеграм — если нужен ответ',
    send: 'Отправить', cancel: 'Отмена', sending: 'Отправка…', thanks: 'Спасибо! Ваше сообщение будет проверено.',
    error: 'Не удалось отправить. Попробуйте чуть позже.', limit: 'Слишком много сообщений. Попробуйте через 10 минут.',
    short: 'Напишите хотя бы несколько слов.', privacy: 'Ваш сетевой адрес и данные устройства не сохраняются.',
    kinds: { text: 'Ошибка в тексте', translation: 'Перевод', source: 'Источник / ссылка', hadith: 'Достоверность хадиса', design: 'Отображение / техника', other: 'Другое' },
  },
  ar: {
    btn: 'الإبلاغ عن خطأ', title: 'الإبلاغ عن خطأ', about: 'يتعلق بـ', kind: 'النوع', text: 'ما الخطأ؟',
    textPh: 'صف الخطأ والصواب (مع المصدر إن أمكن).', contact: 'وسيلة تواصل (اختياري)', contactPh: 'بريد إلكتروني أو تيليجرام إن أردت ردًا',
    send: 'إرسال', cancel: 'إلغاء', sending: 'جارٍ الإرسال…', thanks: 'جزاك الله خيرًا! ستتم مراجعة بلاغك.',
    error: 'تعذّر الإرسال. حاول مرة أخرى بعد قليل.', limit: 'أرسلت بلاغات كثيرة. حاول بعد 10 دقائق.',
    short: 'اكتب بضع كلمات على الأقل.', privacy: 'لا نحفظ عنوان الشبكة الخاص بك ولا بيانات جهازك.',
    kinds: { text: 'خطأ في النص', translation: 'الترجمة', source: 'المصدر / الإحالة', hadith: 'صحة الحديث', design: 'العرض / تقني', other: 'أخرى' },
  },
  tr: {
    btn: 'Hata bildir', title: 'Hata bildirin', about: 'İlgili olduğu', kind: 'Türü', text: 'Hata nedir?',
    textPh: 'Hatayı ve doğrusunu yazın (mümkünse kaynakla).', contact: 'İletişim (isteğe bağlı)', contactPh: 'E-posta veya Telegram — cevap isterseniz',
    send: 'Gönder', cancel: 'Vazgeç', sending: 'Gönderiliyor…', thanks: 'Teşekkürler! Bildiriminiz incelenecek.',
    error: 'Gönderilemedi. Biraz sonra tekrar deneyin.', limit: 'Çok fazla bildirim gönderildi. 10 dakika sonra tekrar deneyin.',
    short: 'Lütfen en az birkaç kelime yazın.', privacy: 'IP adresiniz ve cihaz bilgileriniz saklanmaz.',
    kinds: { text: 'Metin hatası', translation: 'Çeviri', source: 'Kaynak / atıf', hadith: 'Hadisin sıhhati', design: 'Görünüm / teknik', other: 'Diğer' },
  },
}
const KINDS = ['text', 'translation', 'source', 'hadith', 'design', 'other']

const EVT = 'mcc-report'

/** Dialoqu aç (istənilən yerdən): openReport({ refText, kind }) */
export function openReport(detail = {}) {
  window.dispatchEvent(new CustomEvent(EVT, { detail }))
}

/** Yüngül düymə — klikdə ortaq dialoqu açır. */
export default function ReportErrorButton({ refText = '', kind = 'text', compact = false, className = '' }) {
  const { lang } = useLang()
  const L = T[lang] || T.en
  return (
    <button type="button" className={`${compact ? 'ui-icon-btn' : 'ui-btn ui-btn--ghost ui-btn--sm'} rep-btn ${className}`}
      onClick={(e) => openReport({ refText, kind, opener: e.currentTarget })}
      aria-label={compact ? L.btn : undefined} title={compact ? L.btn : undefined}>
      <Icon name="alert" size={compact ? 16 : 18} className={compact ? undefined : 'ui-btn__icon'} />{!compact && ` ${L.btn}`}
    </button>
  )
}

/** Bütün sayt üçün tək dialoq (App.jsx-də bir dəfə). */
export function ReportErrorHost() {
  const { lang } = useLang()
  const L = T[lang] || T.en
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [refText, setRefText] = useState('')
  const [kind, setKind] = useState('text')
  const [text, setText] = useState('')
  const [contact, setContact] = useState('')
  const [state, setState] = useState('idle')   // idle | sending | done | error | limit | short
  const dlg = useRef(null)
  const opener = useRef(null)
  const id = useId()

  useEffect(() => {
    const on = (e) => {
      const d = e.detail || {}
      opener.current = d.opener || document.activeElement
      setRefText(String(d.refText || ''))
      setKind(KINDS.includes(d.kind) ? d.kind : 'text')
      setState(s => (s === 'done' ? 'idle' : s))
      setOpen(true)
    }
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [])

  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (open && !d.open) { try { d.showModal() } catch { d.setAttribute('open', '') } }
    if (!open && d.open) d.close()
  }, [open])

  const close = () => {
    setOpen(false)
    if (state === 'done') { setText(''); setContact(''); setState('idle') }
    try { opener.current?.focus?.() } catch { /* */ }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (text.trim().length < 5) { setState('short'); return }
    setState('sending')
    try {
      await apiFetch('/api/feedback', { method: 'POST', body: { page: location.pathname, ref: refText.slice(0, 200), kind, text: text.trim(), lang, contact: contact.trim() } })
      setState('done')
    } catch (err) {
      setState(err?.status === 429 ? 'limit' : 'error')
    }
  }

  return (
    <dialog ref={dlg} className="rep-dlg" aria-labelledby={`${id}-t`} onClose={() => setOpen(false)} onCancel={close}
      onClick={(e) => { if (e.target === dlg.current) close() }}>
      {open && (
        <form className="rep-form" onSubmit={submit} method="dialog">
          <div className="rep-head">
            <h2 id={`${id}-t`} className="rep-title">{L.title}</h2>
            <button type="button" className="ui-icon-btn" onClick={close} aria-label={L.cancel}><Icon name="close" size={18} /></button>
          </div>
          {state === 'done' ? (
            <div className="rep-done" role="status">
              <span className="ui-icon-tile ui-icon-tile--lg"><Icon name="check" /></span>
              <p>{L.thanks}</p>
              <button type="button" className="ui-btn ui-btn--primary" onClick={close}>OK</button>
            </div>
          ) : (
            <>
              {refText && <p className="rep-ref"><span>{L.about}:</span> <bdi>{refText}</bdi></p>}
              <label className="ui-field">
                <span className="ui-field__label">{L.kind}</span>
                <select className="ui-input ui-select" value={kind} onChange={e => setKind(e.target.value)}>
                  {KINDS.map(k => <option key={k} value={k}>{L.kinds[k]}</option>)}
                </select>
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{L.text}</span>
                <textarea className="ui-input rep-text" rows={5} maxLength={2000} required value={text}
                  placeholder={L.textPh} onChange={e => { setText(e.target.value); if (state === 'short') setState('idle') }} />
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{L.contact}</span>
                <input className="ui-input" type="text" maxLength={200} value={contact} placeholder={L.contactPh}
                  onChange={e => setContact(e.target.value)} autoComplete="email" />
              </label>
              <p className="rep-privacy"><Icon name="shield" size={14} /> {L.privacy}</p>
              {['error', 'limit', 'short'].includes(state) && <p className="rep-err" role="alert">{L[state]}</p>}
              <div className="rep-actions">
                <button type="button" className="ui-btn ui-btn--secondary" onClick={close}>{L.cancel}</button>
                <button type="submit" className="ui-btn ui-btn--primary" disabled={state === 'sending'}>
                  <Icon name="send" className="ui-btn__icon" /> {state === 'sending' ? L.sending : L.send}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </dialog>
  )
}
