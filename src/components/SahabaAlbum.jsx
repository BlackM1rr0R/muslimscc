// ═══════════════════════════════════════════════════════
// SahabaAlbum (v8) — səhabə kartları albomu (/sahaba)
//
// • İstifadəçi səhabənin profilini oxuyanda (SahabePage → markSahabaSeen)
//   onun kartı albomda "açılır". Yaddaş: localStorage (utils/sahabaAlbum.js).
// • Açılmış kart: ərəbcə ad + yerli dildə ad, ləqəb (profilin faktında
//   dırnaq içində varsa), profil xülasəsinin BİRİNCİ CÜMLƏSİ hərfiyyən və
//   profilə keçid. Portret/üz YOXDUR — adın ərəbcə ilk hərfi medalyonda
//   (Aref Ruqaa xətti), rəng qrupa görə: xəlifə qızılı, qadın səhabə gül,
//   ravi göy, qalanları zümrüd.
// • Açılmamış kart: həndəsi naxışlı "möhürlü" arxa üz, nömrə və AD (solğun).
//   Adı gizlətmirik: tapmaca yox, növbəti oxunacaq səhabəni göstərən yol
//   xəritəsidir — kart özü profilə keçiddir, "kimdir?" sualı oxumağa çağırır.
// • Yeni açılan kart albom ekrana girəndə çevrilir (yalnız transform);
//   hərəkət azaldılıbsa — dərhal açıq. Mərhələ nişanı qazanılanda celebrate()
//   və kiçik bildiriş. Filtr: hamısı / toplananlar / hələ açılmayanlar.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { SAHABA, slugOf } from '../data/sahaba'
import { useReduced } from '../motion/reduced'
import { celebrate } from '../utils/celebrate'
import {
  ALBUM_EVENT, ALBUM_KEY, readAlbum, readMeta, writeMeta, progressOf, groupOf, badgesOf,
  newBadges, pendingReveals, firstSentence, laqabOf, arabicInitial,
} from '../utils/sahabaAlbum'
import '../styles/CalligraphyFonts.css'
import '../styles/SahabaAlbum.css'

const T = {
  az: {
    ey: 'Səhabələr', title: 'Səhabə kartları albomu',
    lead: 'Hər səhabənin profilini oxuduqca onun kartı albomunuzda açılır. Möhürlü karta toxunun — profil açılacaq. Albom yalnız bu cihazda saxlanır.',
    of: (a, b) => `${a} / ${b}`, collected: 'kart toplandı', filter: 'Filtr', fAll: 'Hamısı', fGot: 'Toplananlar', fNot: 'Hələ açılmayanlar',
    sealed: 'möhürlü kart', unlock: 'Oxu və aç', read: 'Profili oxu', badges: 'Nişanlar', badgeN: (n) => `${n} kart`, badgeAll: 'Albom tamamlandı',
    sets: { 'set:caliphs': 'Raşid xəlifələr', 'set:women': 'Qadın səhabələr', 'set:narrators': 'Hədis raviləri' },
    toast: 'Yeni nişan', empty: 'Bu filtrdə kart yoxdur.', note: 'Kartdakı cümlə səhabənin saytdakı profilinin ilk cümləsidir.',
  },
  en: {
    ey: 'Companions', title: 'Companions card album',
    lead: 'Each time you read a companion’s profile, their card opens in your album. Tap a sealed card to open the profile. The album is kept on this device only.',
    of: (a, b) => `${a} / ${b}`, collected: 'cards collected', filter: 'Filter', fAll: 'All', fGot: 'Collected', fNot: 'Not yet',
    sealed: 'sealed card', unlock: 'Read to unlock', read: 'Read profile', badges: 'Badges', badgeN: (n) => `${n} cards`, badgeAll: 'Album complete',
    sets: { 'set:caliphs': 'Rightly guided caliphs', 'set:women': 'Women companions', 'set:narrators': 'Hadith narrators' },
    toast: 'New badge', empty: 'No cards in this filter.', note: 'The sentence on each card is the first sentence of the companion’s profile on this site.',
  },
  ru: {
    ey: 'Сподвижники', title: 'Альбом карточек сподвижников',
    lead: 'Каждый раз, когда вы читаете биографию сподвижника, его карточка открывается в альбоме. Нажмите на запечатанную карточку — откроется биография. Альбом хранится только на этом устройстве.',
    of: (a, b) => `${a} / ${b}`, collected: 'карточек собрано', filter: 'Фильтр', fAll: 'Все', fGot: 'Собранные', fNot: 'Ещё закрытые',
    sealed: 'запечатанная карточка', unlock: 'Прочтите, чтобы открыть', read: 'Читать биографию', badges: 'Знаки', badgeN: (n) => `${n} карточек`, badgeAll: 'Альбом собран',
    sets: { 'set:caliphs': 'Праведные халифы', 'set:women': 'Сподвижницы', 'set:narrators': 'Передатчики хадисов' },
    toast: 'Новый знак', empty: 'В этом фильтре карточек нет.', note: 'Фраза на карточке — первое предложение биографии сподвижника на этом сайте.',
  },
  ar: {
    ey: 'الصحابة', title: 'ألبوم بطاقات الصحابة',
    lead: 'كلما قرأت سيرة صحابي انفتحت بطاقته في ألبومك. اضغط على البطاقة المختومة لتفتح السيرة. يُحفظ الألبوم على هذا الجهاز فقط.',
    of: (a, b) => `${a} / ${b}`, collected: 'بطاقة مجموعة', filter: 'تصفية', fAll: 'الكل', fGot: 'المجموعة', fNot: 'لم تُفتح بعد',
    sealed: 'بطاقة مختومة', unlock: 'اقرأ لتفتحها', read: 'اقرأ السيرة', badges: 'الأوسمة', badgeN: (n) => `${n} بطاقات`, badgeAll: 'اكتمل الألبوم',
    sets: { 'set:caliphs': 'الخلفاء الراشدون', 'set:women': 'الصحابيات', 'set:narrators': 'رواة الحديث' },
    toast: 'وسام جديد', empty: 'لا بطاقات في هذا التصنيف.', note: 'الجملة على كل بطاقة هي أول جملة من سيرة الصحابي في هذا الموقع.',
  },
  tr: {
    ey: 'Sahabeler', title: 'Sahabe kartları albümü',
    lead: 'Bir sahabenin hayatını okudukça kartı albümünüzde açılır. Mühürlü karta dokunun — hayatı açılacak. Albüm yalnızca bu cihazda saklanır.',
    of: (a, b) => `${a} / ${b}`, collected: 'kart toplandı', filter: 'Filtre', fAll: 'Tümü', fGot: 'Toplananlar', fNot: 'Henüz açılmayanlar',
    sealed: 'mühürlü kart', unlock: 'Oku ve aç', read: 'Hayatını oku', badges: 'Rozetler', badgeN: (n) => `${n} kart`, badgeAll: 'Albüm tamamlandı',
    sets: { 'set:caliphs': 'Râşid halifeler', 'set:women': 'Kadın sahabeler', 'set:narrators': 'Hadis ravileri' },
    toast: 'Yeni rozet', empty: 'Bu filtrede kart yok.', note: 'Karttaki cümle, sahabenin sitedeki hayat yazısının ilk cümlesidir.',
  },
}

const pick = (o, lang) => (o && pickUi(o, lang, 'en')) || ''
const pad = (n) => String(n).padStart(2, '0')
const R = 30
const CIRC = 2 * Math.PI * R

function badgeLabel(b, u) {
  if (b.kind === 'all') return u.badgeAll
  if (b.kind === 'count') return u.badgeN(b.need)
  return u.sets[b.id] || b.id
}

export default function SahabaAlbum() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const rootRef = useRef(null)

  // Yaddaş yalnız brauzerdə oxunur (prerender/hidrasiya ilə uyğun qalsın)
  const [album, setAlbum] = useState({})
  const [meta, setMeta] = useState({ shown: [], ms: [] })
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState(false)
  const [revealed, setRevealed] = useState(() => new Set())
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const load = () => { setAlbum(readAlbum()); setMeta(readMeta()); setLoaded(true) }
    load()
    const onStorage = (e) => { if (!e.key || e.key.startsWith(ALBUM_KEY)) load() }
    window.addEventListener(ALBUM_EVENT, load)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(ALBUM_EVENT, load); window.removeEventListener('storage', onStorage) }
  }, [])

  // Albom ekrana girəndə (çevrilmə və təbrik yalnız görünəndə)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined }
    const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { setVisible(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const cards = useMemo(() => SAHABA.map((s, i) => {
    const slug = slugOf(s)
    const name = pick(s.name, lang)
    return {
      s, slug, no: i + 1, group: groupOf(s), name, ar: s.name.ar,
      local: lang === 'ar' ? '' : name,
      role: pick(s.title, lang),
      laqab: laqabOf(s, lang, pick),
      fact: firstSentence(pick(s.bio, lang)),
      href: pathFor('sahaba', lang, slug),
    }
  }), [lang])
  const slugs = useMemo(() => cards.map(c => c.slug), [cards])

  // Yeni açılan kartlar — çevrilmə
  const pending = useMemo(() => pendingReveals(album, meta.shown, slugs), [album, meta.shown, slugs])
  useEffect(() => {
    if (!loaded || !pending.length) return undefined
    if (reduced) { setMeta(writeMeta({ ...meta, shown: [...meta.shown, ...pending] })); return undefined }
    if (!visible || document.visibilityState === 'hidden') return undefined
    const t1 = setTimeout(() => setRevealed(new Set(pending)), 380)
    const t2 = setTimeout(() => {
      setMeta(m => writeMeta({ ...m, shown: [...m.shown, ...pending] }))
      setRevealed(new Set())
    }, 380 + pending.length * 140 + 1000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [loaded, pending, reduced, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  // Nişanlar və təbrik
  const badges = useMemo(() => badgesOf(album, SAHABA, slugOf), [album])
  useEffect(() => {
    if (!loaded || !visible) return undefined
    const fresh = newBadges(badges, meta.ms)
    if (!fresh.length) return undefined
    const t = setTimeout(() => {
      setMeta(m => writeMeta({ ...m, ms: [...m.ms, ...fresh.map(b => b.id)] }))
      const top = fresh.find(b => b.kind === 'all') || fresh[fresh.length - 1]
      setToast(fresh.map(b => badgeLabel(b, u)).join(' · '))
      celebrate({ size: top.kind === 'all' ? 'big' : 'medium' })
    }, reduced ? 0 : 380 + pending.length * 140 + 700)
    return () => clearTimeout(t)
  }, [loaded, visible, badges, meta.ms]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  const { seen, total, pct } = progressOf(album, slugs)
  const shown = cards.filter(c => (filter === 'all' ? true : filter === 'got' ? album[c.slug] : !album[c.slug]))
  const filters = [
    { key: 'all', label: u.fAll, n: total },
    { key: 'got', label: u.fGot, n: seen },
    { key: 'not', label: u.fNot, n: total - seen },
  ]
  const pendIdx = new Map(pending.map((s, i) => [s, i]))

  return (
    <section ref={rootRef} className="ui-card sa" data-testid="sahaba-album" data-collected={seen}>
      <div className="sa__head">
        <div className="sa__intro">
          <span className="ui-eyebrow">{u.ey}</span>
          <h2 className="sa__title">{u.title}</h2>
          <p className="sa__lead">{u.lead}</p>
        </div>
        <div className="sa__ring" role="img" aria-label={`${u.of(seen, total)} ${u.collected}`}>
          <svg viewBox="0 0 72 72" aria-hidden="true" focusable="false">
            <circle className="sa__ring-bg" cx="36" cy="36" r={R} />
            <circle className="sa__ring-fg" cx="36" cy="36" r={R} strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct / 100)} />
          </svg>
          <span className="sa__ring-num" aria-hidden="true"><b>{seen}</b><small>/{total}</small></span>
        </div>
      </div>

      <ul className="sa__badges" aria-label={u.badges}>
        {badges.map(b => (
          <li key={b.id} className={`sa__badge${b.done ? ' is-done' : ''}`} data-badge={b.id}>
            <span className="sa__badge-star" aria-hidden="true" />
            <span className="sa__badge-name">{badgeLabel(b, u)}</span>
            <span className="sa__badge-n">{u.of(b.have, b.need)}</span>
          </li>
        ))}
      </ul>

      <div className="sa__filters" role="group" aria-label={u.filter}>
        {filters.map(f => (
          <button key={f.key} type="button" className="ui-chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label} <span className="sa__chip-n">{f.n}</span>
          </button>
        ))}
      </div>

      {shown.length ? (
        <ul className="sa__grid">
          {shown.map(c => {
            const isSeen = Boolean(album[c.slug])
            const waiting = pendIdx.has(c.slug)
            const open = isSeen && (!waiting || revealed.has(c.slug) || reduced)
            const anim = waiting && !reduced
            return (
              <li key={c.slug} className={`sa-card sa-card--${c.group}`} data-slug={c.slug} data-seen={isSeen ? '1' : '0'}>
                <a className="sa-card__link" href={c.href} aria-label={isSeen ? undefined : `${c.name} — ${u.sealed}`}>
                  <span className={`sa-card__inner${open ? ' is-open' : ''}${anim ? ' is-reveal' : ''}`}
                    style={anim ? { '--sa-d': `${pendIdx.get(c.slug) * 140}ms` } : undefined}>
                    <span className="sa-face sa-face--back" aria-hidden={open ? 'true' : undefined}>
                      <span className="sa-face__no">№ {pad(c.no)}</span>
                      <span className="sa-seal" aria-hidden="true"><span>{c.no}</span></span>
                      <span className="sa-face__ghost">{c.name}</span>
                      <span className="sa-face__hint">{u.unlock}</span>
                    </span>
                    {isSeen && (
                      <span className="sa-face sa-face--front" aria-hidden={open ? undefined : 'true'}>
                        <span className="sa-face__top">
                          <span className="sa-medal" aria-hidden="true"><span lang="ar">{arabicInitial(c.ar)}</span></span>
                          <span className="sa-face__no sa-face__no--front">№ {pad(c.no)}</span>
                        </span>
                        <span className="sa-face__ar" lang="ar" dir="rtl">{c.ar}</span>
                        {c.local && <span className="sa-face__name">{c.local}</span>}
                        <span className="sa-face__role">{c.laqab ? `«${c.laqab}» · ${c.role}` : c.role}</span>
                        <span className="sa-face__fact">{c.fact}</span>
                        <span className="sa-face__more">{u.read}</span>
                      </span>
                    )}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      ) : <p className="sa__empty">{u.empty}</p>}

      <p className="sa__note">{u.note}</p>
      <div className="sa__live" role="status">
        {toast && (
          <div className="sa__toast">
            <span className="sa__badge-star" aria-hidden="true" />
            <span><b>{u.toast}:</b> {toast}</span>
          </div>
        )}
      </div>
    </section>
  )
}
