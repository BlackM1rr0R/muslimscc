// ═══════════════════════════════════════════════════════
// /visiting-the-sick — "Xəstəni ziyarət": fəzilət, ədəb, dualar + şəxsi ziyarət xatırlatmaları.
//
// Səhifə YENİ dini mətn yazmır: hamısı saytın məlumatından, mənbələri ilə —
//   • "Xəstənin fiqhi" dərsi (src/data/lessons/sick-fiqh.js): "visiting" bölməsi (hədislər, ədəb siyahısı,
//     ziyarət duaları, rüqyə/cənazə dərslərinə işarə) və "patience" bölməsindən iki hədis — LessonBlocks ilə.
//   • Hisnul-Müslim (public/data/hisn/<dil>.json): 51 — xəstəni ziyarətin fəziləti, 125 — bədəndə ağrı
//     hiss edən nə deyir; mətn + mənbə (localizeSource). 50-ci fəslin duaları dərsdə eynidir — keçid verilir.
// • Tibbi məsləhət YOXDUR (səhifədə açıq yazılır).
// • Ziyarət xatırlatmaları: utils/sickVisits (sick_visits_v1) — profilə aid, yalnız cihazda + E2E sinxron.
// Prerender = ilk render: dərs, Hisn və siyahı YALNIZ mount-dan sonra yüklənir/oxunur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import LessonBlocks from '../components/lesson/LessonBlocks'
import { useGuideSources, SpaLink, lessonHref } from '../components/lifeguide/GuideParts'
import { Confirm, Msg } from '../components/p3/p3Ui'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { dayLabel } from '../utils/dayLabel'
import { localizeSource } from '../utils/sourceNames'
import {
  readVisits, saveVisit, removeVisit, setVisited, sortVisits, visitState, localDay,
  SICK_KEY, SICK_EVENT, NAME_MAX, NOTE_MAX,
} from '../utils/sickVisits'
import { EVENT as PROFILE_EVENT } from '../utils/profileCore'
import '../styles/Account.css'
import '../styles/ReadTogether.css'
import '../styles/P3.css'
import '../styles/LessonsPage.css'
import '../styles/LifeGuides.css'
import '../styles/FamilyHalaqa.css'

export const SV = {
  az: {
    title: 'Xəstəni ziyarət',
    lead: 'Xəstəni ziyarət etməyin fəziləti, ədəbi və duaları — saytın dərsindən və Hisnul-Müslimdən, mənbələri ilə. Kimi ziyarət etmək istədiyinizi də burada qeyd edə bilərsiniz.',
    medical: 'Bu səhifə tibbi məsləhət deyil. Sağlamlıq məsələlərində həkimin tövsiyəsinə əməl edin.',
    virtue: 'Ziyarətin fəziləti', etiquette: 'Ziyarətin ədəbi', duas: 'Ziyarət zamanı dualar', forSick: 'Xəstənin özü üçün',
    fromHisn: 'Hisnul-Müslimdən', openHisn: 'Hisnul-Müslimdə aç', hisn50: 'Hisnul-Müslimdə: xəstəni ziyarət edərkən dua',
    openLesson: 'Dərsdə oxu', loading: 'Yüklənir…', loadError: 'Mətn yüklənmədi. Dərsin özünü açın.',
    ruqyah: 'Dərs: Şəri rüqyə', lessonAll: 'Dərs: Xəstənin fiqhi',
    scholar: 'Bu səhifədəki bütün dini məzmun saytın dərsindən və Hisnul-Müslimdən olduğu kimi, mənbələri ilə götürülüb. Öz vəziyyətinizlə bağlı sual üçün etibarlı alimə müraciət edin.',
    list: 'Ziyarət etmək istədiklərim', privacy: 'Siyahı yalnız bu cihazda (və hesabınızın uçdan-uca şifrəli sinxronizasiyasında) saxlanılır. Serverə oxunaqlı heç nə getmir.',
    empty: 'Siyahı hələ boşdur.', add: 'Ziyarət əlavə et', edit: 'Redaktə et', save: 'Yadda saxla', cancel: 'Ləğv et',
    del: 'Sil', delAsk: 'Silinsin?', yes: 'Bəli, sil',
    name: 'Kimi ziyarət edəcəksiniz', namePh: 'məs. Leyla xala', date: 'Ziyarət günü', note: 'Qeyd (istəyə bağlı)', notePh: 'məs. xəstəxana, 12-ci otaq',
    needName: 'Adı yazın.', needDate: 'Günü seçin.', full: 'Siyahı doludur.', saved: 'Yadda saxlanıldı.', removed: 'Silindi.',
    visited: 'Ziyarət etdim', today: 'Bu gün', soon: 'Yaxın günlərdə', past: 'Günü keçib', doneTag: 'Ziyarət edildi',
    markedVisited: 'Ziyarət edildi kimi işarələndi.', unmarked: 'İşarə götürüldü.',
  },
  en: {
    title: 'Visiting the sick',
    lead: 'The virtue, etiquette and duas of visiting the sick — from the site’s lesson and Hisn al-Muslim, with their sources. You can also note here whom you would like to visit.',
    medical: 'This page is not medical advice. For health matters, follow your doctor’s advice.',
    virtue: 'The virtue of visiting', etiquette: 'Etiquette of the visit', duas: 'Duas during the visit', forSick: 'For the one who is ill',
    fromHisn: 'From Hisn al-Muslim', openHisn: 'Open in Hisn al-Muslim', hisn50: 'In Hisn al-Muslim: the dua when visiting the sick',
    openLesson: 'Read in the lesson', loading: 'Loading…', loadError: 'The text could not be loaded. Open the lesson itself.',
    ruqyah: 'Lesson: Shar‘i ruqyah', lessonAll: 'Lesson: Rulings for the sick',
    scholar: 'All religious content on this page is quoted as it is from the site’s lesson and Hisn al-Muslim, with its sources. For a question about your own situation, ask a trusted scholar.',
    list: 'People I want to visit', privacy: 'The list is stored only on this device (and in your account’s end-to-end encrypted sync). Nothing readable is sent to the server.',
    empty: 'The list is empty for now.', add: 'Add a visit', edit: 'Edit', save: 'Save', cancel: 'Cancel',
    del: 'Delete', delAsk: 'Delete it?', yes: 'Yes, delete',
    name: 'Whom will you visit', namePh: 'e.g. Aunt Leyla', date: 'Day of the visit', note: 'Note (optional)', notePh: 'e.g. hospital, room 12',
    needName: 'Please enter a name.', needDate: 'Please choose a day.', full: 'The list is full.', saved: 'Saved.', removed: 'Deleted.',
    visited: 'I visited', today: 'Today', soon: 'In the coming days', past: 'The day has passed', doneTag: 'Visited',
    markedVisited: 'Marked as visited.', unmarked: 'Mark removed.',
  },
  ru: {
    title: 'Посещение больного',
    lead: 'Достоинство, этикет и дуа посещения больного — из урока сайта и «Крепости мусульманина», с источниками. Здесь же можно отметить, кого вы хотите навестить.',
    medical: 'Эта страница — не медицинский совет. В вопросах здоровья следуйте рекомендациям врача.',
    virtue: 'Достоинство посещения', etiquette: 'Этикет посещения', duas: 'Дуа во время посещения', forSick: 'Для самого больного',
    fromHisn: 'Из «Крепости мусульманина»', openHisn: 'Открыть в «Крепости мусульманина»', hisn50: 'В «Крепости мусульманина»: дуа при посещении больного',
    openLesson: 'Читать в уроке', loading: 'Загрузка…', loadError: 'Текст не загрузился. Откройте сам урок.',
    ruqyah: 'Урок: Шариатская рукья', lessonAll: 'Урок: Фикх больного',
    scholar: 'Всё религиозное содержание этой страницы приведено дословно из урока сайта и «Крепости мусульманина» вместе с источниками. С вопросом о своей ситуации обратитесь к надёжному учёному.',
    list: 'Кого я хочу навестить', privacy: 'Список хранится только на этом устройстве (и в сквозной зашифрованной синхронизации аккаунта). На сервер не уходит ничего в читаемом виде.',
    empty: 'Список пока пуст.', add: 'Добавить посещение', edit: 'Изменить', save: 'Сохранить', cancel: 'Отмена',
    del: 'Удалить', delAsk: 'Удалить?', yes: 'Да, удалить',
    name: 'Кого вы навестите', namePh: 'напр. тётя Лейла', date: 'День посещения', note: 'Заметка (необязательно)', notePh: 'напр. больница, палата 12',
    needName: 'Введите имя.', needDate: 'Выберите день.', full: 'Список заполнен.', saved: 'Сохранено.', removed: 'Удалено.',
    visited: 'Я навестил(а)', today: 'Сегодня', soon: 'В ближайшие дни', past: 'День прошёл', doneTag: 'Навещено',
    markedVisited: 'Отмечено как навещённое.', unmarked: 'Отметка снята.',
  },
  tr: {
    title: 'Hasta ziyareti',
    lead: 'Hasta ziyaretinin fazileti, adabı ve duaları — sitenin dersinden ve Hısnu’l-Müslim’den, kaynaklarıyla. Kimi ziyaret etmek istediğinizi de burada not edebilirsiniz.',
    medical: 'Bu sayfa tıbbi tavsiye değildir. Sağlık konularında doktorunuzun tavsiyesine uyun.',
    virtue: 'Ziyaretin fazileti', etiquette: 'Ziyaretin adabı', duas: 'Ziyarette okunan dualar', forSick: 'Hastanın kendisi için',
    fromHisn: 'Hısnu’l-Müslim’den', openHisn: 'Hısnu’l-Müslim’de aç', hisn50: 'Hısnu’l-Müslim’de: hasta ziyaretinde dua',
    openLesson: 'Derste oku', loading: 'Yükleniyor…', loadError: 'Metin yüklenemedi. Dersin kendisini açın.',
    ruqyah: 'Ders: Şer‘î rukye', lessonAll: 'Ders: Hastanın fıkhı',
    scholar: 'Bu sayfadaki tüm dinî içerik sitenin dersinden ve Hısnu’l-Müslim’den olduğu gibi, kaynaklarıyla alınmıştır. Kendi durumunuzla ilgili bir soru için güvenilir bir âlime danışın.',
    list: 'Ziyaret etmek istediklerim', privacy: 'Liste yalnızca bu cihazda (ve hesabınızın uçtan uca şifreli eşitlemesinde) saklanır. Sunucuya okunabilir hiçbir şey gitmez.',
    empty: 'Liste şimdilik boş.', add: 'Ziyaret ekle', edit: 'Düzenle', save: 'Kaydet', cancel: 'Vazgeç',
    del: 'Sil', delAsk: 'Silinsin mi?', yes: 'Evet, sil',
    name: 'Kimi ziyaret edeceksiniz', namePh: 'ör. Leyla teyze', date: 'Ziyaret günü', note: 'Not (isteğe bağlı)', notePh: 'ör. hastane, 12 numaralı oda',
    needName: 'Lütfen bir ad yazın.', needDate: 'Lütfen bir gün seçin.', full: 'Liste dolu.', saved: 'Kaydedildi.', removed: 'Silindi.',
    visited: 'Ziyaret ettim', today: 'Bugün', soon: 'Önümüzdeki günlerde', past: 'Günü geçti', doneTag: 'Ziyaret edildi',
    markedVisited: 'Ziyaret edildi olarak işaretlendi.', unmarked: 'İşaret kaldırıldı.',
  },
  ar: {
    title: 'عيادة المريض',
    lead: 'فضل عيادة المريض وآدابها وأدعيتها — من درس الموقع ومن حصن المسلم مع مصادرها. ويمكنك أن تدوّن هنا من تريد زيارته.',
    medical: 'هذه الصفحة ليست نصيحة طبية. في أمور الصحة اتّبع إرشادات الطبيب.',
    virtue: 'فضل العيادة', etiquette: 'آداب الزيارة', duas: 'الدعاء عند الزيارة', forSick: 'للمريض نفسه',
    fromHisn: 'من حصن المسلم', openHisn: 'افتح في حصن المسلم', hisn50: 'في حصن المسلم: الدعاء للمريض في عيادته',
    openLesson: 'اقرأ في الدرس', loading: 'جارٍ التحميل…', loadError: 'تعذّر تحميل النص. افتح الدرس نفسه.',
    ruqyah: 'درس: الرقية الشرعية', lessonAll: 'درس: أحكام المريض',
    scholar: 'كل المحتوى الشرعي في هذه الصفحة منقول كما هو من درس الموقع ومن حصن المسلم مع مصادره. ولسؤال عن حالتك الخاصة اسأل عالمًا موثوقًا.',
    list: 'من أريد زيارتهم', privacy: 'تُحفظ القائمة على هذا الجهاز فقط (وفي المزامنة المشفّرة من طرف إلى طرف في حسابك). لا يُرسَل إلى الخادم شيء مقروء.',
    empty: 'القائمة فارغة حاليًا.', add: 'أضف زيارة', edit: 'تعديل', save: 'حفظ', cancel: 'إلغاء',
    del: 'حذف', delAsk: 'هل يُحذف؟', yes: 'نعم، احذف',
    name: 'من ستزور', namePh: 'مثل: الخالة ليلى', date: 'يوم الزيارة', note: 'ملاحظة (اختياري)', notePh: 'مثل: المستشفى، الغرفة 12',
    needName: 'يرجى كتابة الاسم.', needDate: 'يرجى اختيار اليوم.', full: 'القائمة ممتلئة.', saved: 'تم الحفظ.', removed: 'تم الحذف.',
    visited: 'زرته', today: 'اليوم', soon: 'في الأيام القادمة', past: 'مضى اليوم', doneTag: 'تمت الزيارة',
    markedVisited: 'عُلِّمت كزيارة تمت.', unmarked: 'أُزيلت العلامة.',
  },
}

// Dərs blokları (indekslər tests/unit/sick-visit.test.js-də yoxlanılır) və Hisn fəsilləri
export const SICK_PARTS = [
  { id: 'virtue', icon: 'sparkle', ex: [{ s: 'sick-fiqh', sec: 'visiting', b: [0, 1, 2] }], hisn: [51] },
  { id: 'etiquette', icon: 'list', ex: [{ s: 'sick-fiqh', sec: 'visiting', b: [3] }] },
  { id: 'duas', icon: 'duas', ex: [{ s: 'sick-fiqh', sec: 'visiting', b: [4, 5, 6] }], hisnLink: 50 },
  { id: 'forSick', icon: 'leaf', ex: [{ s: 'sick-fiqh', sec: 'patience', b: [1, 2] }], hisn: [125] },
]

const EMPTY = { id: '', n: '', d: '', no: '' }

function HisnChapter({ ch, lang }) {
  return (
    <div className="lg-ev__part lg-hisn">
      <p className="lg-hisn__title">{ch.title}</p>
      {ch.items.map((it, i) => (
        <figure key={i} className="ui-card ls-dua lg-hisn__item">
          <p className="ls-dua__ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
          {lang !== 'ar' && it.text && <p className="ls-dua__text">{it.text}</p>}
          {it.src && <figcaption className="ls-dua__src"><cite dir="auto">{localizeSource(it.src, lang)}</cite></figcaption>}
        </figure>
      ))}
    </div>
  )
}

export default function SickVisitPage({ setPage }) {
  const { lang, siteLang } = useLang()
  const t = pickUi(SV, lang, 'en')
  const pl = siteLang || lang
  const src = useGuideSources(['sick-fiqh'], lang, true)
  const [data, setData] = useState({ v: 1, l: [] })     // prerender = boş; mount-dan sonra oxunur
  const [today, setToday] = useState('')
  const [form, setForm] = useState(null)
  const [msg, setMsg] = useState(null)
  const [live, setLive] = useState('')

  const load = useCallback(() => setData(readVisits()), [])
  useEffect(() => {
    load()
    setToday(localDay())
    const onStorage = (e) => { if (!e.key || e.key === SICK_KEY || e.key.endsWith(`:${SICK_KEY}`)) load() }
    window.addEventListener(SICK_EVENT, load)
    window.addEventListener(PROFILE_EVENT, load)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(SICK_EVENT, load); window.removeEventListener(PROFILE_EVENT, load); window.removeEventListener('storage', onStorage) }
  }, [load])

  const startAdd = () => { setForm({ ...EMPTY, d: today || localDay() }); setMsg(null) }
  const startEdit = (v) => { setForm({ id: v.id, n: v.n, d: v.d, no: v.no || '' }); setMsg(null) }
  const onSave = (e) => {
    e.preventDefault()
    if (!form.n.trim()) { setMsg({ tone: 'bad', text: t.needName }); document.getElementById('sv-name')?.focus(); return }
    if (!form.d) { setMsg({ tone: 'bad', text: t.needDate }); document.getElementById('sv-date')?.focus(); return }
    const prev = form.id ? data.l.find((x) => x.id === form.id) : null
    const r = saveVisit({ id: form.id || undefined, n: form.n, d: form.d, no: form.no, x: prev?.x })
    if (!r.ok) { setMsg({ tone: 'bad', text: r.full ? t.full : t.needDate }); return }
    setData(r.data); setForm(null); setMsg({ tone: 'ok', text: t.saved })
    requestAnimationFrame(() => document.getElementById('sv-add')?.focus())
  }
  const onVisited = (id, on) => { setData(setVisited(id, on)); setLive(on ? t.markedVisited : t.unmarked) }

  const tag = (s) => (s === 'today' ? t.today : s === 'soon' ? t.soon : s === 'past' ? t.past : s === 'done' ? t.doneTag : '')
  const list = sortVisits(data.l)

  return (
    <div className="lg-page hq-page sv-page">
      <header className="ui-page-hero lg-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('sickvisit'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {t.medical}</p>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow">
          <p className="ui-sr-only" role="status" aria-live="polite">{live}</p>

          {SICK_PARTS.map((part) => (
            <section key={part.id} className="ui-card hq-card sv-section" aria-labelledby={`sv-${part.id}-h`} data-testid={`sv-${part.id}`}>
              <h2 className="hq-card__title" id={`sv-${part.id}-h`}><Icon name={part.icon} size={18} /> {t[part.id]}</h2>
              {part.ex.map((e) => {
                const sec = src.lessons[e.s]?.[e.sec]
                const blocks = sec ? e.b.map((i) => sec.blocks[i]).filter(Boolean) : null
                return (
                  <div key={`${e.s}-${e.sec}`} className="lg-ev__part">
                    {blocks ? <LessonBlocks blocks={blocks} lang={lang} />
                      : <p className="hq-wait">{src.failed ? t.loadError : t.loading}</p>}
                    <p className="hq-more"><SpaLink className="ui-link" href={lessonHref(e.s, e.sec, pl)}>{t.openLesson}{sec ? ` — ${pickUi(sec.title, lang, 'en')}` : ''}</SpaLink></p>
                  </div>
                )
              })}
              {(part.hisn || []).map((id) => {
                const ch = src.hisn?.get(id)
                return (
                  <div key={id} data-testid={`sv-hisn-${id}`}>
                    <p className="hq-src"><Icon name="hisn" size={14} /> {t.fromHisn}</p>
                    {ch ? <HisnChapter ch={ch} lang={lang} /> : <p className="hq-wait">{src.failed ? t.loadError : t.loading}</p>}
                    <p className="hq-more"><SpaLink className="ui-link" href={`${pathFor('hisn', pl)}#hs-${id}`}>{t.openHisn}</SpaLink></p>
                  </div>
                )
              })}
              {part.hisnLink && (
                <p className="hq-more"><SpaLink className="ui-link" href={`${pathFor('hisn', pl)}#hs-${part.hisnLink}`}>{t.hisn50}</SpaLink></p>
              )}
            </section>
          ))}

          <ul className="lg-links">
            <li><SpaLink href={lessonHref('sick-fiqh', null, pl)} className="ui-chip lg-link"><Icon name="learn" size={16} /> {t.lessonAll}</SpaLink></li>
            <li><SpaLink href={lessonHref('ruqyah', null, pl)} className="ui-chip lg-link"><Icon name="learn" size={16} /> {t.ruqyah}</SpaLink></li>
          </ul>
          <aside className="ui-callout lg-scholar">
            <Icon name="learn" />
            <p>{t.scholar}</p>
          </aside>

          <section className="ui-card hq-card sv-section" aria-labelledby="sv-list-h" data-testid="sv-list">
            <h2 className="hq-card__title" id="sv-list-h"><Icon name="calendar" size={18} /> {t.list}</h2>
            <p className="rt-note"><Icon name="lock" size={16} /> {t.privacy}</p>
            {list.length === 0 && !form && <p className="rt-note" data-testid="sv-empty">{t.empty}</p>}
            {list.length > 0 && (
              <ul className="sv-list">
                {list.map((v) => {
                  const st = today ? visitState(v, today) : ''
                  const cb = `sv-x-${v.id}`
                  return (
                    <li key={v.id} className={`sv-item${st === 'today' ? ' is-today' : ''}${v.x ? ' is-done' : ''}`} data-testid="sv-item">
                      <div className="sv-item__head">
                        <span className="sv-item__name"><bdi>{v.n}</bdi></span>
                        <span className="sv-item__date ui-num">{dayLabel(v.d, lang)}</span>
                        {tag(st) && <span className={`ui-badge${st === 'today' ? ' ui-badge--brand' : ''}`} data-testid="sv-tag">{tag(st)}</span>}
                      </div>
                      {v.no && <p className="sv-item__note" dir="auto">{v.no}</p>}
                      <label className="lg-check lg-check--plain" htmlFor={cb}>
                        <input id={cb} type="checkbox" checked={Boolean(v.x)} onChange={(e) => onVisited(v.id, e.target.checked)} data-testid="sv-visited" />
                        <span>{t.visited}</span>
                      </label>
                      <div className="p3-row">
                        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => startEdit(v)}><Icon name="edit" className="ui-btn__icon" /> {t.edit}</button>
                        <Confirm label={t.del} ask={t.delAsk} yes={t.yes} cancel={t.cancel} onYes={() => { setData(removeVisit(v.id)); setLive(t.removed) }} testId="sv-del" />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {!form && <div><button id="sv-add" type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={startAdd} data-testid="sv-add"><Icon name="plus" className="ui-btn__icon" /> {t.add}</button></div>}
            {form && (
              <form className="acc-form sv-form" onSubmit={onSave} noValidate data-testid="sv-form">
                <div className="ui-field">
                  <label className="ui-field__label" htmlFor="sv-name">{t.name}</label>
                  <input id="sv-name" className="ui-input" dir="auto" maxLength={NAME_MAX} value={form.n} placeholder={t.namePh} autoComplete="off" onChange={(e) => setForm((f) => ({ ...f, n: e.target.value }))} />
                </div>
                <div className="ui-field">
                  <label className="ui-field__label" htmlFor="sv-date">{t.date}</label>
                  <input id="sv-date" className="ui-input" type="date" dir="ltr" value={form.d} onChange={(e) => setForm((f) => ({ ...f, d: e.target.value }))} />
                </div>
                <div className="ui-field">
                  <label className="ui-field__label" htmlFor="sv-note">{t.note}</label>
                  <textarea id="sv-note" className="ui-input" rows={2} dir="auto" maxLength={NOTE_MAX} value={form.no} placeholder={t.notePh} onChange={(e) => setForm((f) => ({ ...f, no: e.target.value }))} />
                </div>
                <div className="p3-row">
                  <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="sv-save"><Icon name="check" className="ui-btn__icon" /> {t.save}</button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setForm(null); setMsg(null) }}>{t.cancel}</button>
                </div>
              </form>
            )}
            <Msg msg={msg} />
          </section>
        </div>
      </section>
    </div>
  )
}
