// ═══════════════════════════════════════════════════════
// Admin panelinin ortaq təqdimat hissələri (dizayn v2)
//
// Niyə: 15 idarəedici eyni başlığı, bölmə başlığını, boş vəziyyəti, dil
// sekmələrini və "yadda saxlandı" bildirişini öz inline stili və emojisi
// ilə təkrarlayırdı (göy qurşağı qradiyentlər). İndi hamısı buradandır:
// rəng yalnız tokenlərdən (AdminPage.css), ikonlar Icon.jsx-dən.
// Funksionallıq dəyişmir — yalnız görünüş.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import Icon from '../Icon'

/** Hər idarəedicinin başlığı: ikon kafeli + <h1> + alt yazı + (istəyə görə) əməllər.
 *  Səhifədə eyni anda bir tab göstərilir — deməli bir <h1>. */
export function AdminHeader({ icon, title, sub, children }) {
  return (
    <header className="admin-header" data-reveal="fade">
      <div className="admin-header-left">
        <span className="ui-icon-tile ui-icon-tile--lg admin-badge" aria-hidden="true"><Icon name={icon} /></span>
        <div className="admin-header-info">
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
      </div>
      {children && <div className="admin-header-actions">{children}</div>}
    </header>
  )
}

/** Bölmə başlığı (h2) — kiçik ikon kafeli ilə */
export function SectionTitle({ icon, children, tone }) {
  return (
    <h2 className="admin-section-title">
      <span className={`ui-icon-tile ui-icon-tile--sm${tone ? ` ui-icon-tile--${tone}` : ''}`} aria-hidden="true"><Icon name={icon} /></span>
      <span>{children}</span>
    </h2>
  )
}

/** Boş / yüklənir vəziyyəti */
export function AdminEmpty({ icon = 'list', children, busy = false }) {
  return (
    <div className={`admin-empty${busy ? ' is-busy' : ''}`} role={busy ? 'status' : undefined} aria-busy={busy || undefined}>
      <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral admin-empty-icon" aria-hidden="true"><Icon name={icon} /></span>
      <p>{children}</p>
    </div>
  )
}

/** Xəbərdarlıq kartı (başlıq + izah) */
export function AdminNotice({ title, text }) {
  return (
    <div className="admin-section admin-notice" role="status">
      <span className="ui-icon-tile ui-icon-tile--lg admin-notice-icon" aria-hidden="true"><Icon name="alert" /></span>
      <h2 className="admin-notice-title">{title}</h2>
      {text && <p className="admin-notice-text">{text}</p>}
    </div>
  )
}

/** Formun içindəki dil sekmələri (seqment idarəsi) */
const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
export function LangTabs({ value, onChange, className = '' }) {
  return (
    <div className={`admin-lang-tabs ${className}`} role="group" aria-label="AZ · EN · RU · AR · TR">
      {LANGS.map(L => (
        <button
          key={L}
          type="button"
          className={`admin-lang-tab ${value === L ? 'active' : ''}`}
          aria-pressed={value === L}
          onClick={() => onChange(L)}
        >
          {L.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

/** Vəziyyət sətri (uğur / xəta / xəbərdarlıq / məlumat) */
const ALERT_ICON = { ok: 'check', bad: 'alert', warn: 'alert', note: 'info' }
export function AdminAlert({ tone = 'bad', children, className = '' }) {
  return (
    <div className={`admin-alert admin-alert--${tone} ${className}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <Icon name={ALERT_ICON[tone] || 'info'} size={18} />
      <span>{children}</span>
    </div>
  )
}

/**
 * Üzən bildiriş ("Yadda saxlandı!") — ekranın aşağısında qısa müddət görünür.
 * message boşdursa gizlidir; açılış/bağlanış yalnız transform/opacity ilə.
 */
export function AdminToast({ message, tone = 'ok' }) {
  // Bağlanış animasiyası üçün son mətni bir müddət saxla
  const [shown, setShown] = useState(message)
  useEffect(() => {
    if (message) { setShown(message); return undefined }
    const t = setTimeout(() => setShown(''), 260)
    return () => clearTimeout(t)
  }, [message])
  // Saytın ortaq üzən kartı (ui.css → .ui-toast): uğur — zümrüd, xəta — qırmızı xətt
  return (
    <div role="status" aria-live="polite">
      {shown && (
        <div
          className={`ui-toast admin-toast${message ? '' : ' is-leaving'}`}
          style={{ '--toast-accent': tone === 'ok' ? 'var(--ok)' : 'var(--bad)' }}
        >
          <span className={`ui-toast__icon admin-toast-icon admin-toast-icon--${tone}`} aria-hidden="true">
            <Icon name={tone === 'ok' ? 'check' : 'alert'} strokeWidth={2.2} />
          </span>
          <div className="ui-toast__body">
            <strong className="ui-toast__title">{shown}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

/** Yadda saxlamaq alınmadı (5 dil) — saxlama xətası üçün */
export const SAVE_FAILED = {
  az: 'Yadda saxlamaq alınmadı. Yenidən cəhd edin.',
  en: 'Couldn’t save. Please try again.',
  ru: 'Не удалось сохранить. Попробуйте ещё раз.',
  ar: 'تعذّر الحفظ. حاول مرة أخرى.',
  tr: 'Kaydedilemedi. Lütfen tekrar deneyin.',
}

/** Açıq/bağlı açarı (checkbox üzərində — klaviatura və ekran oxuyucusu üçün əsl input) */
export function AdminSwitch({ label, checked, onChange, id }) {
  return (
    <label className="admin-switch-row" htmlFor={id}>
      <span className="admin-switch-label">{label}</span>
      <span className="admin-switch">
        <input id={id} type="checkbox" role="switch" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="admin-switch-track" aria-hidden="true"><span className="admin-switch-thumb" /></span>
      </span>
    </label>
  )
}

/** Elan növlərinin semantik tonu və ikonu (data-dakı hex rənglər əvəzinə) */
export const ANN_TONE = {
  info:     { tone: 'note',  icon: 'info' },
  urgent:   { tone: 'bad',   icon: 'alert' },
  event:    { tone: 'brand', icon: 'calendar' },
  success:  { tone: 'ok',    icon: 'sparkle' },
  reminder: { tone: 'warn',  icon: 'bell' },
}

/** Təqvim hadisə növlərinin ikonu */
export const EVENT_ICON = { major: 'star', sunnah: 'dhikr', night: 'moonStar', hajj: 'hajjguide', fast: 'sunrise' }
