// ═══════════════════════════════════════════════════════
// BabyNamesPage (v6.6) — "Müsəlman uşaq adları" (/muslim-baby-names)
//
// • 125 ad (oğlan / qız): ərəbcə yazılış, həmin dildə yazılışı, mənası (yalnız dəqiq bilinən —
//   data/arabicNames.js), Quranda xüsusi ad kimi neçə dəfə keçir (Osmani mətnindən, ilk ayəyə keçid),
//   bu adı daşıyan səhabə (/sahaba), Allahın adına "qul" bildirən adlar.
// • Süzgəclər: cins, "Quranda keçir", "Səhabə adı", "Əbd-", axtarış (bütün yazılış variantları ilə).
// • Mənası uydurulmur: mənası mübahisəli və ya ərəb mənşəli olmayan adlarda "məna" sətri yoxdur.
// Statik HTML (SEO): scripts/seo-body.mjs → babyNamesBody. Stillər: src/styles/BabyNames.css
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { BABY_NAMES, nameIn, BEST_NAMES_HADITH } from '../data/babyNames'
import '../styles/BabyNames.css'

export const BABY_T = {
  az: { ey: 'Uşaq adları', title: 'Müsəlman uşaq adları və mənaları', lead: 'Peyğəmbərlərin, səhabələrin və gözəl mənalı ərəb adları: ərəbcə yazılışı, mənası, Quranda neçə dəfə keçdiyi və bu adı daşıyan səhabə.',
    how: 'Məna yalnız ərəb sözündən birbaşa gələn və dəqiq bilinən adlarda yazılıb. Mənası mübahisəli adlarda (məs. peyğəmbər adları) məna verilmir.',
    all: 'Hamısı', m: 'Oğlan', f: 'Qız', quran: 'Quranda keçən', sahaba: 'Səhabə adı', abd: 'Əbd- (Allahın qulu)', search: 'Ad axtar', found: n => `${n} ad`,
    meaning: 'Mənası', inQuran: n => `Quranda ${n} dəfə`, inQuranAs: 'xüsusi ad kimi', firstAyah: 'İlk ayə', comp: 'Səhabə', write: 'Ərəb xəttilə yaz', none: 'Bu süzgəclə ad tapılmadı.',
    lesson: 'Ad qoymağın hökmləri — əqiqə dərsi',
    src: 'Ərəbcə yazılış və mənalar — saytın ad lüğəti; Quranda sayı — saytın Osmani mətnindən avtomatik hesablanır.' },
  en: { ey: 'Baby names', title: 'Muslim baby names and meanings', lead: 'Names of prophets, Companions and Arabic names with beautiful meanings: Arabic spelling, meaning, how often the name occurs in the Quran and the Companion who bore it.',
    how: 'A meaning is given only for names that come directly from an Arabic word with a well-established meaning. Names whose meaning is disputed (e.g. names of prophets) have no meaning line.',
    all: 'All', m: 'Boy', f: 'Girl', quran: 'In the Quran', sahaba: 'Companion’s name', abd: 'Abd- (servant of Allah)', search: 'Search names', found: n => `${n} names`,
    meaning: 'Meaning', inQuran: n => `${n} times in the Quran`, inQuranAs: 'as a proper name', firstAyah: 'First ayah', comp: 'Companion', write: 'Write in Arabic calligraphy', none: 'No names match this filter.',
    lesson: 'Rulings on naming — the aqiqah lesson',
    src: 'Arabic spelling and meanings — the site’s name dictionary; Quran counts — computed automatically from the site’s Uthmani text.' },
  ru: { ey: 'Имена для детей', title: 'Мусульманские имена для детей и их значения', lead: 'Имена пророков, сподвижников и арабские имена с прекрасным значением: написание по-арабски, значение, сколько раз имя встречается в Коране и сподвижник, носивший его.',
    how: 'Значение указано только у имён, которые прямо происходят от арабского слова с точно известным смыслом. У имён со спорным значением (например, имён пророков) значение не приводится.',
    all: 'Все', m: 'Мальчик', f: 'Девочка', quran: 'Есть в Коране', sahaba: 'Имя сподвижника', abd: 'Абд- (раб Аллаха)', search: 'Поиск имени', found: n => `Имён: ${n}`,
    meaning: 'Значение', inQuran: n => `В Коране ${n} раз`, inQuranAs: 'как имя собственное', firstAyah: 'Первый аят', comp: 'Сподвижник', write: 'Написать арабской каллиграфией', none: 'По этому фильтру имён нет.',
    lesson: 'Правила выбора имени — урок об акыке',
    src: 'Арабское написание и значения — словарь имён сайта; число упоминаний в Коране — автоматически по османскому тексту сайта.' },
  ar: { ey: 'أسماء المواليد', title: 'أسماء إسلامية للمواليد ومعانيها', lead: 'أسماء الأنبياء والصحابة وأسماء عربية حسنة المعنى: الرسم العربي والمعنى وعدد ورود الاسم في القرآن والصحابي الذي حمله.',
    how: 'يُذكر المعنى للأسماء المشتقة مباشرة من كلمة عربية معروفة المعنى فقط، ولا يُذكر لما اختُلف في معناه كأسماء الأنبياء.',
    all: 'الكل', m: 'ولد', f: 'بنت', quran: 'ورد في القرآن', sahaba: 'اسم صحابي', abd: 'عبد (عبودية لله)', search: 'ابحث عن اسم', found: n => `${n} اسمًا`,
    meaning: 'المعنى', inQuran: n => `ورد في القرآن ${n} مرة`, inQuranAs: 'علمًا', firstAyah: 'أول آية', comp: 'صحابي', write: 'اكتبه بالخط العربي', none: 'لا توجد أسماء بهذا التصفية.',
    lesson: 'أحكام التسمية — درس العقيقة',
    src: 'الرسم والمعاني من معجم الأسماء في الموقع؛ وعدد الورود محسوب آليًا من نص المصحف العثماني في الموقع.' },
  tr: { ey: 'Bebek isimleri', title: 'Müslüman bebek isimleri ve anlamları', lead: 'Peygamberlerin, sahabelerin isimleri ve güzel anlamlı Arapça isimler: Arapça yazılışı, anlamı, Kur’an’da kaç kez geçtiği ve bu ismi taşıyan sahabe.',
    how: 'Anlam yalnızca doğrudan Arapça bir kelimeden gelen ve anlamı kesin bilinen isimlerde verilmiştir. Anlamı tartışmalı isimlerde (ör. peygamber isimleri) anlam verilmez.',
    all: 'Tümü', m: 'Erkek', f: 'Kız', quran: 'Kur’an’da geçen', sahaba: 'Sahabe ismi', abd: 'Abd- (Allah’ın kulu)', search: 'İsim ara', found: n => `${n} isim`,
    meaning: 'Anlamı', inQuran: n => `Kur’an’da ${n} kez`, inQuranAs: 'özel isim olarak', firstAyah: 'İlk ayet', comp: 'Sahabe', write: 'Arap hattıyla yaz', none: 'Bu filtreyle isim bulunamadı.',
    lesson: 'İsim koymanın hükümleri — akika dersi',
    src: 'Arapça yazılış ve anlamlar — sitenin isim sözlüğü; Kur’an’daki sayı — sitenin Osmanlı (Osmânî) metninden otomatik hesaplanır.' },
}

const fold = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ə/g, 'e').replace(/ı/g, 'i')

export default function BabyNamesPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(BABY_T, lang)
  const [gender, setGender] = useState('all')
  const [flag, setFlag] = useState(null)
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const fq = fold(q.trim())
    return BABY_NAMES.filter(n => (gender === 'all' || n.gender === gender)
      && (!flag || (flag === 'quran' ? n.quran : flag === 'sahaba' ? n.sahaba.length : n.abd))
      && (!fq || n.ar.includes(q.trim()) || n.variants.some(v => fold(v).includes(fq))))
  }, [gender, flag, q])
  const chip = (on, label, onClick, id) => <button type="button" className={`bn-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={onClick} data-testid={id}>{label}</button>

  return (
    <div className="bn-page">
      <header className="ui-page-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.ey} />
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{t.ey}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {t.how}</p>
          </div>
        </div>
      </header>
      <section className="ui-section ui-section--tight">
        <div className="ui-container bn">
          <blockquote className="bn-advice" data-testid="bn-hadith">
            <p className="ui-arabic bn-advice__ar" lang="ar" dir="rtl">{BEST_NAMES_HADITH.ar}</p>
            {lang !== 'ar' && <p>{BEST_NAMES_HADITH.text[lang] || BEST_NAMES_HADITH.text.en}</p>}
            <footer>{BEST_NAMES_HADITH.src[lang] || BEST_NAMES_HADITH.src.en} · <a className="ui-link" href={pathFor('learn', lang, 'aqiqah')}>{t.lesson}</a></footer>
          </blockquote>
          <div className="bn-filters">
            <div className="bn-row" role="group" aria-label={t.ey}>
              {chip(gender === 'all', t.all, () => setGender('all'), 'bn-all')}
              {chip(gender === 'm', t.m, () => setGender('m'), 'bn-m')}
              {chip(gender === 'f', t.f, () => setGender('f'), 'bn-f')}
            </div>
            <div className="bn-row" role="group" aria-label={t.ey}>
              {chip(flag === 'quran', t.quran, () => setFlag(f => (f === 'quran' ? null : 'quran')), 'bn-quran')}
              {chip(flag === 'sahaba', t.sahaba, () => setFlag(f => (f === 'sahaba' ? null : 'sahaba')), 'bn-sahaba')}
              {chip(flag === 'abd', t.abd, () => setFlag(f => (f === 'abd' ? null : 'abd')), 'bn-abd')}
            </div>
            <label className="bn-search"><Icon name="search" size={16} />
              <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} data-testid="bn-q" />
            </label>
            <span className="bn-count ui-num" aria-live="polite" data-testid="bn-count">{t.found(list.length)}</span>
          </div>
          {list.length === 0 ? <p className="bn-none">{t.none}</p> : (
            <ul className="bn-grid">
              {list.map(n => {
                const [s, a] = n.quran ? n.quran.ref.split(':').map(Number) : []
                return (
                  <li key={n.id} className={`bn-card bn-card--${n.gender} ui-card`} data-testid="bn-card" data-id={n.id}>
                    <div className="bn-card__top">
                      <span className="bn-card__ar ui-arabic" lang="ar" dir="rtl">{n.ar}</span>
                      {lang !== 'ar' && <b className="bn-card__name">{nameIn(n, lang)}</b>}
                      <span className="bn-card__g">{n.gender === 'm' ? t.m : t.f}</span>
                    </div>
                    {n.meaning && <p className="bn-card__mean"><span>{t.meaning}:</span> {pickUi(n.meaning, lang)}</p>}
                    <div className="bn-card__tags">
                      {n.quran && <a className="bn-tag bn-tag--q" href={`${pathFor('quran', lang, s)}?a=${a}`} title={`${t.firstAyah}: ${n.quran.ref}`}><Icon name="quran" size={13} /> {t.inQuran(n.quran.count)} <span className="bn-tag__sub">({t.inQuranAs})</span></a>}
                      {n.sahaba.map(slug => <a key={slug} className="bn-tag bn-tag--s" href={pathFor('sahaba', lang, slug)}><Icon name="user" size={13} /> {t.comp}</a>)}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <a className="ui-link bn-write" href={pathFor('namecalligraphy', lang)}>{t.write} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" /></a>
          <p className="bn-src">{t.src}</p>
        </div>
      </section>
    </div>
  )
}
