// ═══════════════════════════════════════════════════════
// /whats-new — "Yeniliklər" (D dəstəsi)
//
// Saytın son əlavələri tarix üzrə qruplaşdırılıb (ən yenisi yuxarıda): hər sətirdə ikon,
// başlıq, bir cümlə və bölməyə keçid. Siyahı src/data/whatsNew.js-dən, mətnlər
// components/whatsnew/whatsNewText.js-dən (5 dil; əlavə dillər lüğətlə).
// • Prerender = ilk render: siyahı statikdir. "Yeni" nişanı (hələ açılmamış yeni səhifə)
//   yalnız mount-dan sonra görünür (utils/whatsNewSeen — yaddaş və saat).
// • "Saytı kəşf et" düyməsi bələdçi turu açır (utils/tour → TourHost).
// • Tarix: utils/dayLabel — formatlayıcı dil üzrə bir dəfə; az ay adları əl ilə.
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon, { hasIcon } from '../components/Icon'
import { navGroupLabel, navGroupOf, navLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { isPlainClick } from '../components/PageLink'
import { pickUi } from '../utils/uiText'
import { dayLabel } from '../utils/dayLabel'
import { WHATS_NEW } from '../data/whatsNew'
import { WHATS_NEW_TEXT } from '../components/whatsnew/whatsNewText'
import { useNewBadges } from '../utils/whatsNewSeen'
import { openTour } from '../utils/tour'
import '../styles/WhatsNewPage.css'

const T = {
  az: {
    title: 'Yeniliklər',
    lead: 'Saytda son vaxtlar əlavə olunan bölmələr və funksiyalar — tarix sırası ilə, hər birinə keçidlə.',
    how: 'Menyuda «Yeni» nişanı olan bölmələri hələ açmamısınız. Açan kimi nişan götürülür — bu qeyd yalnız bu cihazda saxlanılır.',
    tourTitle: 'Burada nə edə bilərəm?',
    tourText: 'Bir dəqiqəlik tur axtarışı, menyunu, namaz vaxtlarını, Quranı, hesabı və əlçatanlıq ayarlarını göstərir.',
    tourBtn: 'Turu başlat',
    newPage: 'Yeni bölmə', feature: 'Yeni funksiya', isNew: 'Yeni', open: 'Aç', on: 'Harada',
    count: (n) => `Siyahıda ${n} yenilik`,
  },
  en: {
    title: 'What’s new',
    lead: 'Sections and features added to the site recently — in date order, each with a link.',
    how: 'Sections marked “New” in the menu are ones you have not opened yet. The mark goes once you open them — this is remembered only on this device.',
    tourTitle: 'What can I do here?',
    tourText: 'A one-minute tour shows search, the menu, prayer times, the Quran, your account and the accessibility settings.',
    tourBtn: 'Start the tour',
    newPage: 'New section', feature: 'New feature', isNew: 'New', open: 'Open', on: 'Where',
    count: (n) => (n === 1 ? '1 update in the list' : `${n} updates in the list`),
  },
  ru: {
    title: 'Что нового',
    lead: 'Разделы и функции, недавно добавленные на сайт, — по датам, у каждого есть ссылка.',
    how: 'Разделы с меткой «Новое» в меню вы ещё не открывали. Метка исчезает, как только вы их откроете, — это запоминается только на этом устройстве.',
    tourTitle: 'Что здесь можно делать?',
    tourText: 'Тур на одну минуту покажет поиск, меню, время намаза, Коран, аккаунт и настройки доступности.',
    tourBtn: 'Начать тур',
    newPage: 'Новый раздел', feature: 'Новая функция', isNew: 'Новое', open: 'Открыть', on: 'Где',
    count: (n) => `Обновлений в списке: ${n}`,
  },
  ar: {
    title: 'ما الجديد',
    lead: 'الأقسام والميزات المضافة إلى الموقع مؤخرًا — مرتبة بالتاريخ ولكل منها رابط.',
    how: 'الأقسام الموسومة بـ«جديد» في القائمة لم تفتحها بعد. تزول الشارة بمجرد فتحها — ويُحفظ ذلك على هذا الجهاز فقط.',
    tourTitle: 'ماذا يمكنني أن أفعل هنا؟',
    tourText: 'جولة مدتها دقيقة واحدة تعرّفك بالبحث والقائمة ومواقيت الصلاة والقرآن وحسابك وإعدادات إمكانية الوصول.',
    tourBtn: 'ابدأ الجولة',
    newPage: 'قسم جديد', feature: 'ميزة جديدة', isNew: 'جديد', open: 'افتح', on: 'أين',
    count: (n) => `عدد التحديثات في القائمة: ${n}`,
  },
  tr: {
    title: 'Yenilikler',
    lead: 'Siteye son zamanlarda eklenen bölümler ve özellikler — tarih sırasıyla, her birine bağlantıyla.',
    how: 'Menüde “Yeni” etiketi olan bölümleri henüz açmadınız. Açtığınız anda etiket kalkar — bu yalnızca bu cihazda hatırlanır.',
    tourTitle: 'Burada neler yapabilirim?',
    tourText: 'Bir dakikalık tur aramayı, menüyü, namaz vakitlerini, Kur’an’ı, hesabınızı ve erişilebilirlik ayarlarını gösterir.',
    tourBtn: 'Turu başlat',
    newPage: 'Yeni bölüm', feature: 'Yeni özellik', isNew: 'Yeni', open: 'Aç', on: 'Nerede',
    count: (n) => `Listede ${n} yenilik`,
  },
}

/** Sətirləri tarix üzrə qruplaşdır (data artıq tarix sırasındadır; yenə də sıralanır) */
function groupByDate(list) {
  const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const out = []
  for (const e of sorted) {
    const last = out[out.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else out.push({ date: e.date, items: [e] })
  }
  return out
}

export default function WhatsNewPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const fresh = useNewBadges()
  // Mətni olmayan sətir (səhvən) göstərilmir — unit test bunu yoxlayır
  const groups = useMemo(() => groupByDate(WHATS_NEW.filter((e) => WHATS_NEW_TEXT[e.id])), [])
  const total = groups.reduce((n, g) => n + g.items.length, 0)

  const go = (e, key) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    setPage?.(key)
  }

  return (
    <div className="wn-page">
      <header className="ui-page-hero ui-page-hero--split wn-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('whatsnew'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {t.how}</p>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card wn-tour" data-testid="wn-tour">
              <span className="ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="tour" /></span>
              <h2 className="wn-tour__title">{t.tourTitle}</h2>
              <p className="wn-tour__text">{t.tourText}</p>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={openTour} aria-haspopup="dialog">
                <Icon name="compass" size={16} className="ui-btn__icon" /> {t.tourBtn}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <p className="wn-count">{t.count(total)}</p>
          <ol className="wn-timeline">
            {groups.map((g) => {
              const hid = `wn-d-${g.date}`
              return (
                <li key={g.date} className="wn-day" aria-labelledby={hid}>
                  <h2 id={hid} className="wn-day__date">
                    <span className="wn-day__dot" aria-hidden="true" />
                    <time dateTime={g.date}>{dayLabel(g.date, lang)}</time>
                  </h2>
                  <ul className="wn-list">
                    {g.items.map((e) => {
                      const tx = WHATS_NEW_TEXT[e.id]
                      const href = pathFor(e.key, lang)
                      const isFresh = e.page && fresh.has(e.key)
                      const where = !e.page ? navLabel(e.key, lang) : ''
                      return (
                        <li key={e.id} className={`ui-card wn-item${isFresh ? ' is-fresh' : ''}`} data-testid={`wn-item-${e.id}`}>
                          <span className="ui-icon-tile wn-item__ic" aria-hidden="true">
                            <Icon name={hasIcon(e.icon) ? e.icon : 'sparkle'} />
                          </span>
                          <div className="wn-item__body">
                            <div className="wn-item__tags">
                              <span className={`ui-badge ${e.page ? 'ui-badge--brand' : 'ui-badge--outline'}`}>{e.page ? t.newPage : t.feature}</span>
                              {isFresh && <span className="ui-badge ui-badge--accent wn-item__new">{t.isNew}</span>}
                            </div>
                            <h3 className="wn-item__title">
                              <a href={href} onClick={(ev) => go(ev, e.key)}>{pickUi(tx.t, lang, 'en')}</a>
                            </h3>
                            <p className="wn-item__desc">{pickUi(tx.d, lang, 'en')}</p>
                            {where && <p className="wn-item__where"><span className="ui-sr-only">{t.on}: </span><Icon name={hasIcon(e.key) ? e.key : 'arrow'} size={14} /> {where}</p>}
                          </div>
                          <Icon name="chevron" size={18} className="ui-flip-rtl wn-item__chev" />
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    </div>
  )
}
