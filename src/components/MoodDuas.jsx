// ═══════════════════════════════════════════════════════
// MoodDuas — "Necə hiss edirsən?" (/duas)
//
//   <MoodDuas lang="az" />
//
// • 10 hal (kədər, sıxıntı, qorxu, şübhə, qəzəb, borc, xəstəlik, sevinc,
//   peşmançılıq, qərarsızlıq) → Hisnul-Müslimin uyğun fəsilləri.
// • Mətn, tərcümə və mənbə YALNIZ public/data/hisn/<dil>.json-dandır (scripts/build-hisn.mjs,
//   5 dildə yoxlanılmış) — burada heç bir dua mətni yazılmır.
// • Hala toxunuş → dualar kart kimi açılır; "Hisnul-Müslimdə aç" — fəslin özü.
// Stillər: src/styles/MoodDuas.css
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { haptic } from '../hooks/useHaptic'
import Icon from './Icon'
import { pathFor } from '../seo/routes'
import '../styles/MoodDuas.css'

export const MOODS = [
  { id: 'sad', icon: 'moon', ch: [35, 54], l: { az: 'Kədərliyəm', en: 'Sad', ru: 'Грустно', tr: 'Hüzünlüyüm', ar: 'حزين' } },
  { id: 'anxious', icon: 'alert', ch: [36, 44, 47], l: { az: 'Sıxıntıdayam', en: 'Distressed', ru: 'Тревожно', tr: 'Sıkıntıdayım', ar: 'مكروب' } },
  { id: 'afraid', icon: 'shield', ch: [127, 31], l: { az: 'Qorxuram', en: 'Afraid', ru: 'Страшно', tr: 'Korkuyorum', ar: 'خائف' } },
  { id: 'doubt', icon: 'info', ch: [41, 46], l: { az: 'Şübhə və vəsvəsə', en: 'Doubt and whispers', ru: 'Сомнения и наущения', tr: 'Şüphe ve vesvese', ar: 'شك ووسوسة' } },
  { id: 'angry', icon: 'bolt', ch: [83], l: { az: 'Qəzəbliyəm', en: 'Angry', ru: 'Гнев', tr: 'Öfkeliyim', ar: 'غاضب' } },
  { id: 'debt', icon: 'zakat', ch: [42], l: { az: 'Borc dərdi', en: 'Burdened by debt', ru: 'Долги', tr: 'Borç derdi', ar: 'هم الدين' } },
  { id: 'ill', icon: 'drop', ch: [52, 50], l: { az: 'Xəstəyəm', en: 'Unwell', ru: 'Болен', tr: 'Hastayım', ar: 'مريض' } },
  { id: 'happy', icon: 'sparkle', ch: [124, 107, 123], l: { az: 'Sevinirəm', en: 'Joyful', ru: 'Радостно', tr: 'Seviniyorum', ar: 'مسرور' } },
  { id: 'regret', icon: 'refresh', ch: [130], l: { az: 'Peşmanam', en: 'Regretful', ru: 'Раскаиваюсь', tr: 'Pişmanım', ar: 'نادم' } },
  { id: 'unsure', icon: 'compass', ch: [27], l: { az: 'Qərar verə bilmirəm', en: 'Can’t decide', ru: 'Не могу решить', tr: 'Karar veremiyorum', ar: 'متردد' } },
]
const T = {
  az: { title: 'Necə hiss edirsən?', lead: 'Halına toxun — Hisnul-Müslimdən uyğun dualar açılsın.', open: 'Hisnul-Müslimdə aç', loading: 'Yüklənir…', err: 'Duaları yükləmək alınmadı.' },
  en: { title: 'How do you feel?', lead: 'Tap your state — the matching supplications from Hisn al-Muslim will open.', open: 'Open in Hisn al-Muslim', loading: 'Loading…', err: 'Could not load the supplications.' },
  ru: { title: 'Как вы себя чувствуете?', lead: 'Коснитесь своего состояния — откроются подходящие мольбы из «Хисн аль-муслим».', open: 'Открыть в «Хисн аль-муслим»', loading: 'Загрузка…', err: 'Не удалось загрузить мольбы.' },
  tr: { title: 'Nasıl hissediyorsun?', lead: 'Hâline dokun — Hısnu’l-Müslim’den uygun dualar açılsın.', open: 'Hısnu’l-Müslim’de aç', loading: 'Yükleniyor…', err: 'Dualar yüklenemedi.' },
  ar: { title: 'كيف تشعر؟', lead: 'المس حالك لتظهر الأدعية المناسبة من حصن المسلم.', open: 'افتح في حصن المسلم', loading: 'جارٍ التحميل…', err: 'تعذّر تحميل الأدعية.' },
}

export default function MoodDuas({ lang = 'az' }) {
  const t = T[lang] || T.az
  const [sel, setSel] = useState(null)
  const [hisn, setHisn] = useState(null) // null | 'err' | chapters[]

  useEffect(() => {
    if (!sel || hisn) return undefined
    let alive = true
    fetch(`/data/hisn/${lang}.json`).then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(j => { if (alive) setHisn(j?.chapters || j) })
      .catch(() => { if (alive) setHisn('err') })
    return () => { alive = false }
  }, [sel, hisn, lang])
  useEffect(() => { setHisn(null) }, [lang])

  const mood = MOODS.find(m => m.id === sel)
  const chapters = mood && Array.isArray(hisn) ? mood.ch.map(id => hisn.find(c => c.id === id)).filter(Boolean) : []

  return (
    <section className="ui-card md" aria-labelledby="md-title" data-testid="mood-duas">
      <h2 id="md-title" className="ui-title ui-title--sm">{t.title}</h2>
      <p className="md__lead">{t.lead}</p>
      <div className="md__moods" role="group" aria-label={t.title}>
        {MOODS.map((m, i) => (
          <button key={m.id} type="button" className={`md__mood md__mood--${i % 5}`} aria-pressed={sel === m.id}
            onClick={() => { haptic(8); setSel(s => (s === m.id ? null : m.id)) }}>
            <Icon name={m.icon} size={18} /> {m.l[lang] || m.l.en}
          </button>
        ))}
      </div>
      {mood && (
        <div className="md__panel" key={mood.id} aria-live="polite">
          {hisn === null && <p className="md__msg">{t.loading}</p>}
          {hisn === 'err' && <p className="md__msg" role="alert">{t.err}</p>}
          {chapters.map(c => (
            <article key={c.id} className="md__chap">
              <h3 className="md__ct">{c.title}</h3>
              {c.items.map((it, k) => (
                <div key={k} className="md__item">
                  <p className="md__ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
                  {lang !== 'ar' && it.text && <p className="md__tx">{it.text}</p>}
                  {it.src && <p className="md__src">{it.src}</p>}
                </div>
              ))}
              <a className="ui-link md__open" href={`${pathFor('hisn', lang)}#hs-${c.id}`}>{t.open} <Icon name="arrow" size={14} className="ui-flip-rtl" /></a>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
