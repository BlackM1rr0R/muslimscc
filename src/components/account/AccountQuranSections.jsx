// ═══════════════════════════════════════════════════════
// /account — ömürlük, cihazlar arası bölmələr (vB): Quran mozaikası (önizləmə), Quran dəftəri,
// xətm şəhadətnamələri, mənəvi səyahət kitabçası.
// Hamısı localStorage-dadır (quran_life_v1, quran_notes_v1, quran_khatm_certs_v1,
// muslim_cc_passport_v1) → hesabın şifrəli sinxronizasiyası onları özü daşıyır (utils/userBackup).
// AccountPage bu faylı tənbəl yükləyir; ağır hissələr (kətan) ekrana yaxınlaşanda qurulur.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import DeferRender from '../DeferRender'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { getSurahLocal } from '../../data/surahNamesAz'
import { SURAH_TABLE } from '../../data/mushafIndex'
import useQuranNotes from '../quran/useQuranNotes'

const QuranLifeMosaic = lazy(() => import('../quran/QuranLifeMosaic'))
const QuranNotes = lazy(() => import('../quran/QuranNotes'))
const KhatmCertificates = lazy(() => import('../quran/KhatmCertificates'))
const SpiritualPassport = lazy(() => import('../SpiritualPassport'))

const T = {
  az: {
    life: 'Ömürlük Quran mozaikası', lifeLead: 'Oxuduğunuz hər ayə — bütün cihazlarınızda, ömürlük.',
    notes: 'Quran dəftəri', notesLead: 'Ayələrə yazdığınız qeydlər və rəngli vurğular.',
    certs: 'Xətm şəhadətnamələri', certsLead: 'Tamamladığınız xətmlər və şəhadətnamələriniz.',
    ayah: (a) => `ayə ${a}`,
  },
  en: {
    life: 'Lifetime Quran mosaic', lifeLead: 'Every verse you have read, on all your devices, for a lifetime.',
    notes: 'Quran notebook', notesLead: 'Your notes and colour highlights on verses.',
    certs: 'Khatm certificates', certsLead: 'The khatms you have completed and their certificates.',
    ayah: (a) => `verse ${a}`,
  },
  ru: {
    life: 'Мозаика Корана на всю жизнь', lifeLead: 'Каждый прочитанный аят — на всех ваших устройствах, навсегда.',
    notes: 'Тетрадь по Корану', notesLead: 'Ваши заметки и цветные выделения к аятам.',
    certs: 'Сертификаты хатма', certsLead: 'Завершённые вами хатмы и их сертификаты.',
    ayah: (a) => `аят ${a}`,
  },
  ar: {
    life: 'فسيفساء القرآن مدى العمر', lifeLead: 'كل آية قرأتها، على كل أجهزتك، مدى العمر.',
    notes: 'الدفتر القرآني', notesLead: 'ملاحظاتك وتمييزاتك الملوّنة على الآيات.',
    certs: 'شهادات الختم', certsLead: 'الختمات التي أتممتها وشهاداتها.',
    ayah: (a) => `الآية ${a}`,
  },
  tr: {
    life: 'Ömür boyu Kur’an mozaiği', lifeLead: 'Okuduğunuz her ayet, tüm cihazlarınızda, ömür boyu.',
    notes: 'Kur’an defteri', notesLead: 'Ayetlere yazdığınız notlar ve renkli vurgular.',
    certs: 'Hatim belgeleri', certsLead: 'Tamamladığınız hatimler ve belgeleri.',
    ayah: (a) => `${a}. ayet`,
  },
}

/** Surənin adı (API-siz): az/ru/tr — yerli cədvəl, ar — ərəbcə, qalan — latın transliterasiyası */
export function staticSurahName(n, lang) {
  if (lang === 'ar') return SURAH_TABLE[n - 1]?.[4] || String(n)
  return getSurahLocal(n, lang)?.name || SURAH_TABLE[n - 1]?.[5] || String(n)
}

function Section({ icon, title, lead, id, children }) {
  return (
    <section className="ui-card acc-section" aria-labelledby={id}>
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

export default function AccountQuranSections({ lang = 'az', siteLang = lang }) {
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const { notes, remove } = useQuranNotes()
  const quranHref = useCallback((s, a) => `${pathFor('quran', siteLang, s)}${a ? `?a=${a}` : ''}`, [siteLang])
  const open = useCallback((s, a) => navigate(quranHref(s, a)), [navigate, quranHref])
  const nameOf = useCallback((s) => staticSurahName(s, lang), [lang])
  const labelOf = useCallback((s, a) => `${staticSurahName(s, lang)}${lang === 'ar' ? '، ' : ', '}${t.ayah(a)}`, [lang, t])
  const fb = (h) => <div style={{ minHeight: h }} />

  return (
    <>
      <Section icon="quran" title={t.life} lead={t.lifeLead} id="acc-life">
        <DeferRender height="360px" idle={false} rootMargin="300px 0px">
          <Suspense fallback={fb(360)}>
            <QuranLifeMosaic lang={lang} compact surahName={nameOf} hrefOf={quranHref} onOpen={open}
              moreHref={`${pathFor('quran', siteLang)}#life-mosaic`} onMore={() => navigate(`${pathFor('quran', siteLang)}#life-mosaic`)} />
          </Suspense>
        </DeferRender>
      </Section>
      <Section icon="edit" title={t.notes} lead={t.notesLead} id="acc-notes">
        <Suspense fallback={fb(120)}>
          <QuranNotes bare notes={notes} onRemove={remove} lang={lang} labelOf={labelOf} nameOf={nameOf} hrefOf={quranHref} onOpen={open} />
        </Suspense>
      </Section>
      <Section icon="sparkle" title={t.certs} lead={t.certsLead} id="acc-certs">
        <Suspense fallback={fb(120)}>
          <KhatmCertificates bare lang={lang} />
        </Suspense>
      </Section>
      <DeferRender height="700px" idle={false} rootMargin="300px 0px">
        <Suspense fallback={fb(700)}>
          <SpiritualPassport lang={lang} siteLang={siteLang} />
        </Suspense>
      </DeferRender>
    </>
  )
}
