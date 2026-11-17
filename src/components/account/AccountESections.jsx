// ═══════════════════════════════════════════════════════
// /account — E mərhələsi: Ramazan albomu, ömürlük dua bağçası, məscid kolleksiyası, sədəqə hesabatı.
// Hamısı localStorage-dadır (ramadan_album_v1, dua_garden_v1, mosque_visits_v1, charity_log) →
// hesabın uçdan-uca şifrəli sinxronizasiyası onları özü daşıyır (utils/userBackup, utils/syncMergers).
// AccountPage bu faylı tənbəl yükləyir; hər bölmə ekrana yaxınlaşanda qurulur (DeferRender).
// ═══════════════════════════════════════════════════════
import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import DeferRender from '../DeferRender'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'

const RamadanAlbum = lazy(() => import('../ramadan/RamadanAlbum'))
const DuaGardenLife = lazy(() => import('../DuaGardenLife'))
const MosqueCollection = lazy(() => import('../mosque/MosqueCollection'))
const CharityReport = lazy(() => import('../charity/CharityReport'))

const T = {
  az: {
    album: 'Ramazan albomu', albumLead: 'Hər Ramazan bir fəsil: oruclar, Quran, zikr və dualar.',
    garden: 'Ömürlük dua bağçası', gardenLead: 'Qəbul olunan hər dua — bir çiçək; hər il — bir pillə.',
    mosques: 'Məscid kolleksiyam', mosquesLead: 'Ziyarət etdiyiniz məscidlər dünya xəritəsində.',
    charity: 'Sədəqə hesabatı', charityLead: 'İllik xülasə: aylar, Ramazan payı, PNG və CSV.',
    toRamadan: 'Ramazan səhifəsində aç',
  },
  en: {
    album: 'Ramadan album', albumLead: 'Every Ramadan is a chapter: fasts, Quran, dhikr and duas.',
    garden: 'Lifetime dua garden', gardenLead: 'Every answered dua is a flower; every year is a terrace.',
    mosques: 'My mosque collection', mosquesLead: 'The mosques you have visited, on a world map.',
    charity: 'Charity report', charityLead: 'A yearly summary: months, Ramadan’s share, PNG and CSV.',
    toRamadan: 'Open on the Ramadan page',
  },
  ru: {
    album: 'Альбом Рамадана', albumLead: 'Каждый Рамадан — глава: посты, Коран, зикр и дуа.',
    garden: 'Сад дуа на всю жизнь', gardenLead: 'Каждое принятое дуа — цветок, каждый год — терраса.',
    mosques: 'Моя коллекция мечетей', mosquesLead: 'Мечети, в которых вы побывали, на карте мира.',
    charity: 'Отчёт о садаке', charityLead: 'Годовая сводка: месяцы, доля Рамадана, PNG и CSV.',
    toRamadan: 'Открыть на странице Рамадана',
  },
  ar: {
    album: 'ألبوم رمضان', albumLead: 'كل رمضان فصل: الصيام والقرآن والذكر والدعاء.',
    garden: 'حديقة الدعاء مدى العمر', gardenLead: 'كل دعاء مستجاب زهرة، وكل سنة مدرّج.',
    mosques: 'مجموعتي من المساجد', mosquesLead: 'المساجد التي زرتها على خريطة العالم.',
    charity: 'تقرير الصدقة', charityLead: 'ملخص سنوي: الشهور ونصيب رمضان وملفا PNG وCSV.',
    toRamadan: 'افتح في صفحة رمضان',
  },
  tr: {
    album: 'Ramazan albümü', albumLead: 'Her Ramazan bir bölüm: oruçlar, Kur’an, zikir ve dualar.',
    garden: 'Ömür boyu dua bahçesi', gardenLead: 'Kabul edilen her dua bir çiçek, her yıl bir teras.',
    mosques: 'Cami koleksiyonum', mosquesLead: 'Ziyaret ettiğiniz camiler dünya haritasında.',
    charity: 'Sadaka raporu', charityLead: 'Yıllık özet: aylar, Ramazan payı, PNG ve CSV.',
    toRamadan: 'Ramazan sayfasında aç',
  },
}

function Section({ icon, title, lead, id, testId, children }) {
  return (
    <section className="ui-card acc-section" aria-labelledby={id} data-testid={testId}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name={icon} size={20} /></span>
        <div>
          <h2 className="acc-section__title" id={id}>{title}</h2>
          {lead && <p className="acc-section__lead">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

export default function AccountESections({ lang = 'az', siteLang = lang }) {
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const fb = (h) => <div style={{ minHeight: h }} />
  const go = (key, hash = '') => () => { navigate(`${pathFor(key, siteLang)}${hash}`); window.scrollTo(0, 0) }
  const href = (key, hash = '') => `${pathFor(key, siteLang)}${hash}`
  const onLink = (fn) => (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); fn() }
  return (
    <>
      <Section icon="ramadan" title={t.album} lead={t.albumLead} id="acc-ralbum" testId="acc-ramadan-album">
        <DeferRender height="380px" idle={false} rootMargin="300px 0px">
          <Suspense fallback={fb(380)}><RamadanAlbum lang={lang} compact /></Suspense>
        </DeferRender>
        <a className="ui-link acc-e-more" href={href('ramadan', '#ramadan-album')} onClick={onLink(go('ramadan', '#ramadan-album'))}>
          {t.toRamadan} <Icon name="arrow" size={14} className="ui-flip-rtl" />
        </a>
      </Section>
      <Section icon="duajournal" title={t.garden} lead={t.gardenLead} id="acc-dgarden" testId="acc-dua-garden">
        <DeferRender height="220px" idle={false} rootMargin="300px 0px">
          <Suspense fallback={fb(220)}>
            <DuaGardenLife lang={lang} compact moreHref={href('duajournal')} onMore={go('duajournal')} />
          </Suspense>
        </DeferRender>
      </Section>
      <Section icon="mosques" title={t.mosques} lead={t.mosquesLead} id="acc-mosques" testId="acc-mosques">
        <DeferRender height="420px" idle={false} rootMargin="300px 0px">
          <Suspense fallback={fb(420)}>
            <MosqueCollection lang={lang} compact moreHref={href('mosques', '#mosque-collection')} onMore={go('mosques', '#mosque-collection')} />
          </Suspense>
        </DeferRender>
      </Section>
      <Section icon="charity" title={t.charity} lead={t.charityLead} id="acc-charity" testId="acc-charity">
        <DeferRender height="420px" idle={false} rootMargin="300px 0px">
          <Suspense fallback={fb(420)}>
            <CharityReport lang={lang} compact moreHref={href('charity', '#charity-report')} onMore={go('charity', '#charity-report')} />
          </Suspense>
        </DeferRender>
      </Section>
    </>
  )
}
