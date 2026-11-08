// ═══════════════════════════════════════════════════════
// HeroGreeting (v5.7) — ana səhifə hero-sunda şəxsi salam (hp-badge yerinə)
//
//   <HeroGreeting fallback="…" lang="az" />
//
// • Prerender və ilk kadr: adi nişan (fallback) — LCP və hidrasiya dəyişmir.
//   Brauzerdə: "Əssəlamu aleykum" + günün vaxtına görə arzu (canlı səmanın
//   fazası — html[data-sky], namaz vaxtlarına görə; yoxdursa cihazın saatı),
//   istəsəniz adınızla, və 5/5 namaz seriyası (≥ 2 gün olanda).
// • Ad yalnız bu cihazda saxlanır ('qm_name_v1'); "Adınız" ilə əlavə/dəyiş.
// • Sözlər bir-bir görünür (vau3.css → .hg-w, yalnız transform/opacity).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { partOfDay } from '../../utils/greeting'
import { loadSnapshot, loadHayd, computeStreak, toKey, PRAYER_SYNC_EVENT } from '../../utils/prayerTracker'

const NAME_KEY = 'qm_name_v1'
const T = {
  az: { salam: 'Əssəlamu aleykum', morning: 'Sabahınız xeyir', day: 'Gününüz xeyir', evening: 'Axşamınız xeyir', night: 'Gecəniz xeyrə qalsın', streak: '{n} gün 5/5', name: 'Adınız', save: 'Saxla', edit: 'Adı dəyiş' },
  en: { salam: 'Assalamu alaikum', morning: 'Good morning', day: 'Good day', evening: 'Good evening', night: 'Good night', streak: '{n} days 5/5', name: 'Your name', save: 'Save', edit: 'Change name' },
  ru: { salam: 'Ассаляму алейкум', morning: 'Доброе утро', day: 'Добрый день', evening: 'Добрый вечер', night: 'Доброй ночи', streak: '{n} дн. 5/5', name: 'Ваше имя', save: 'Сохранить', edit: 'Изменить имя' },
  ar: { salam: 'السلام عليكم', morning: 'صباح الخير', day: 'نهارك سعيد', evening: 'مساء الخير', night: 'تصبح على خير', streak: '{n} أيام 5/5', name: 'اسمك', save: 'حفظ', edit: 'غيّر الاسم' },
  tr: { salam: 'Esselamu aleyküm', morning: 'Günaydın', day: 'İyi günler', evening: 'İyi akşamlar', night: 'İyi geceler', streak: '{n} gün 5/5', name: 'Adınız', save: 'Kaydet', edit: 'Adı değiştir' },
}

function readName() { try { return (localStorage.getItem(NAME_KEY) || '').slice(0, 40) } catch { return '' } }

export default function HeroGreeting({ fallback, lang = 'az' }) {
  const t = pickUi(T, lang)
  const [st, setSt] = useState(null) // { part, streak, name }
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const load = () => {
      let streak = 0
      try { streak = computeStreak(loadSnapshot(), loadHayd()?.periods || [], toKey(), 400) } catch { /* */ }
      const sky = document.documentElement.dataset.sky || ''
      setSt({ part: partOfDay(sky, new Date().getHours()), streak, name: readName() })
    }
    load()
    // canlı səma fazası bir az sonra hesablanır (livingSky — boş vaxtda) — yenidən oxu
    const id = setTimeout(load, 1800)
    window.addEventListener(PRAYER_SYNC_EVENT, load)
    return () => { clearTimeout(id); window.removeEventListener(PRAYER_SYNC_EVENT, load) }
  }, [])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  if (!st) return <span className="ui-eyebrow hp-badge">{fallback}</span>

  const save = (e) => {
    e.preventDefault()
    const v = (inputRef.current?.value || '').replace(/[<>]/g, '').trim().slice(0, 40)
    try { if (v) localStorage.setItem(NAME_KEY, v); else localStorage.removeItem(NAME_KEY) } catch { /* */ }
    setSt(s => ({ ...s, name: v }))
    setEditing(false)
  }
  const words = `${t.salam}${st.name ? `, ${st.name}` : ''}!`.split(' ')
  return (
    <div className="hg" data-testid="hero-greeting">
      <p className="hg-hi" key={`${st.name}|${st.part}`}>
        {words.map((w, i) => <span key={i}><span className="hg-w" style={{ '--wi': i }}>{w}</span>{' '}</span>)}
        <span className="hg-w hg-part" style={{ '--wi': words.length }}>{t[st.part]}</span>
      </p>
      <div className="hg-meta">
        {st.streak >= 2 && <span className="hg-streak"><Icon name="bolt" size={14} /> {t.streak.replace('{n}', st.streak)}</span>}
        {editing ? (
          <form className="hg-form" onSubmit={save}>
            <input ref={inputRef} className="ui-input hg-input" defaultValue={st.name} maxLength={40} aria-label={t.name} placeholder={t.name}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }} />
            <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm">{t.save}</button>
          </form>
        ) : (
          <button type="button" className="hg-edit" onClick={() => setEditing(true)} data-testid="hg-edit">
            <Icon name={st.name ? 'edit' : 'user'} size={13} /> {st.name ? t.edit : t.name}
          </button>
        )}
      </div>
    </div>
  )
}
