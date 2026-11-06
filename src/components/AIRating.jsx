// ═══════════════════════════════════════════════════════
// AIRating — AI köməkçinin cavabına 👍 / 👎
//
// • 👍 — yalnız təşəkkür; heç yerə göndərilmir (məxfilik).
// • 👎 — səbəb seçilir (+ istəyə görə qeyd) və "Göndər"lə sual + cavab
//   mövcud "Səhv bildir" sisteminə yazılır: POST /api/feedback, kind:'ai'
//   (server/feedback.js). Admin paneldə Feedback bölməsində yoxlanılır.
//   Göndərməzdən əvvəl istifadəçiyə nəyin göndəriləcəyi yazılır.
// Dini məzmunda səhv cavab ciddi riskdir — bu, keyfiyyət nəzarətinin girişidir.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from './Icon'
import { apiFetch } from '../api/http'
import { aiReportText } from '../utils/aiReport'
import '../styles/AIRating.css'
import { pickUi } from '../utils/uiText'

export const RATING_TXT = {
  az: { good: 'Faydalı cavab', bad: 'Cavabda problem var', thanks: 'Təşəkkürlər!', why: 'Nə səhvdir?',
    reasons: { wrong: 'Səhv məlumat', source: 'Mənbə yoxdur və ya səhvdir', offtopic: 'Sual başa düşülməyib', other: 'Digər' },
    notePh: 'İstəsəniz, qısa izah yazın (məs. düzgün mənbə)', send: 'Göndər', cancel: 'Ləğv et',
    privacy: 'Yoxlanmaq üçün sualınız və bu cavab göndəriləcək. Şəxsi məlumat yazmayın.',
    sent: 'Göndərildi — cavab yoxlanılacaq. Təşəkkürlər!', fail: 'Göndərmək alınmadı. Bir az sonra yenidən cəhd edin.' },
  en: { good: 'Helpful answer', bad: 'Something is wrong', thanks: 'Thank you!', why: 'What is wrong?',
    reasons: { wrong: 'Incorrect information', source: 'Missing or wrong source', offtopic: 'Question was misunderstood', other: 'Other' },
    notePh: 'Optionally add a short note (e.g. the correct source)', send: 'Send', cancel: 'Cancel',
    privacy: 'Your question and this answer will be sent for review. Do not include personal details.',
    sent: 'Sent — the answer will be reviewed. Thank you!', fail: 'Could not send. Please try again a little later.' },
  ru: { good: 'Полезный ответ', bad: 'С ответом что-то не так', thanks: 'Спасибо!', why: 'Что не так?',
    reasons: { wrong: 'Неверные сведения', source: 'Нет источника или он неверный', offtopic: 'Вопрос понят неправильно', other: 'Другое' },
    notePh: 'При желании добавьте пояснение (например, верный источник)', send: 'Отправить', cancel: 'Отмена',
    privacy: 'Для проверки будут отправлены ваш вопрос и этот ответ. Не указывайте личные данные.',
    sent: 'Отправлено — ответ будет проверен. Спасибо!', fail: 'Не удалось отправить. Попробуйте чуть позже.' },
  ar: { good: 'إجابة مفيدة', bad: 'في الإجابة مشكلة', thanks: 'شكرًا لك!', why: 'ما الخطأ؟',
    reasons: { wrong: 'معلومة خاطئة', source: 'لا يوجد مصدر أو المصدر خاطئ', offtopic: 'لم يُفهم السؤال', other: 'أخرى' },
    notePh: 'يمكنك إضافة توضيح قصير (مثل المصدر الصحيح)', send: 'إرسال', cancel: 'إلغاء',
    privacy: 'سيُرسَل سؤالك وهذه الإجابة للمراجعة. لا تكتب معلومات شخصية.',
    sent: 'تم الإرسال — ستُراجَع الإجابة. شكرًا لك!', fail: 'تعذّر الإرسال. حاول بعد قليل.' },
  tr: { good: 'Faydalı cevap', bad: 'Cevapta sorun var', thanks: 'Teşekkürler!', why: 'Sorun ne?',
    reasons: { wrong: 'Yanlış bilgi', source: 'Kaynak yok veya yanlış', offtopic: 'Soru yanlış anlaşıldı', other: 'Diğer' },
    notePh: 'İsterseniz kısa bir açıklama yazın (ör. doğru kaynak)', send: 'Gönder', cancel: 'İptal',
    privacy: 'İnceleme için sorunuz ve bu cevap gönderilecek. Kişisel bilgi yazmayın.',
    sent: 'Gönderildi — cevap incelenecek. Teşekkürler!', fail: 'Gönderilemedi. Biraz sonra tekrar deneyin.' },
}
const REASONS = ['wrong', 'source', 'offtopic', 'other']

export default function AIRating({ question, answer, lang, compact = false }) {
  const t = pickUi(RATING_TXT, lang)
  // null | 'good' | 'form' | 'sending' | 'sent' | 'fail'
  const [state, setState] = useState(null)
  const [reason, setReason] = useState('wrong')
  const [note, setNote] = useState('')

  const send = async (e) => {
    e.preventDefault()
    setState('sending')
    try {
      await apiFetch('/api/feedback', { method: 'POST', body: {
        page: window.location.pathname, ref: 'ai', kind: 'ai', lang,
        text: aiReportText({ reason, note, question, answer }),
      } })
      setState('sent')
    } catch { setState('fail') }
  }

  if (state === 'good' || state === 'sent') {
    return <p className="air-done" role="status"><Icon name="check" size={14} /> {state === 'good' ? t.thanks : t.sent}</p>
  }
  return (
    <div className={`air${compact ? ' air--compact' : ''}`}>
      {(state === null) && (
        <div className="air-btns">
          <button type="button" className="air-btn" onClick={() => setState('good')} aria-label={t.good} title={t.good}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7" /></svg>
          </button>
          <button type="button" className="air-btn" onClick={() => setState('form')} aria-label={t.bad} title={t.bad}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-2-2v-4H5.5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 6.7 4H17" /></svg>
          </button>
        </div>
      )}
      {(state === 'form' || state === 'sending' || state === 'fail') && (
        <form className="air-form" onSubmit={send}>
          <fieldset className="air-reasons">
            <legend className="air-why">{t.why}</legend>
            {REASONS.map(r => (
              <label key={r} className="air-chip">
                <input type="radio" name="air-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                <span>{t.reasons[r]}</span>
              </label>
            ))}
          </fieldset>
          <textarea className="ui-input air-note" rows={2} maxLength={500} value={note} onChange={e => setNote(e.target.value)}
            placeholder={t.notePh} aria-label={t.notePh} />
          <p className="air-privacy"><Icon name="info" size={13} /> {t.privacy}</p>
          {state === 'fail' && <p className="air-fail" role="alert">{t.fail}</p>}
          <div className="air-actions">
            <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={state === 'sending'}>
              {state === 'sending' && <span className="ui-spin" aria-hidden="true" />}{t.send}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setState(null)}>{t.cancel}</button>
          </div>
        </form>
      )}
    </div>
  )
}
