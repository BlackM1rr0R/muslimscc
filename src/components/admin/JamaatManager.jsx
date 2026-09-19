// ═══ ADMIN — Camaat (iqamə) və cümə namazı vaxtları ═══
// Firestore: singletons/jamaat → { jamaat:{fajr,dhuhr,asr,maghrib,isha}, jumua:{time, khutbahLang:{az,en,ru,tr,ar}} }
// Hər qayda: "HH:MM" (sabit vaxt), "+N" (azandan N dəqiqə sonra), "-" (bu
// namazın camaat vaxtını gizlə) və ya boş.
// Doldurulmuş Firestore dəyəri src/config/mosque.js-dəki dəyəri üstələyir;
// boş qalsa, fayldakı dəyər istifadə olunur (bax: useMosqueTimes → mergeRules).
// "-" isə fayla QAYITMIR — həmin namazın camaat vaxtı ümumiyyətlə göstərilmir.
// Önbaxış üçün azan vaxtları saytın özü ilə EYNİ mənbədən gəlir (useMosqueTimes).
import { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '../../contexts/LangContext'
import { subscribeToJamaat, saveJamaat } from '../../data/adminContent'
import { isFirebaseConfigured } from '../../firebase/config'
import { LANGS, MOSQUE, filled, jamaatTime, missingMosqueFields } from '../../config/mosque'
import useMosqueTimes, { PRAYER_NAMES } from '../../hooks/useMosqueTimes'
import '../../styles/JamaatManager.css'

const LABELS = {
  az: {
    title:'Camaat vaxtları', sub:'Camaat (iqamə) və cümə namazı vaxtları — saytda və mobil tətbiqdə göstərilir',
    formatTitle:'Necə yazmalı?',
    fmtFixed:'sabit vaxt (hər gün eyni)',
    fmtOffset:'azandan 15 dəqiqə sonra (azan vaxtı dəyişdikcə özü dəyişir)',
    fmtHide:'bu namazın camaat vaxtı göstərilmir, yalnız hesablanmış azan vaxtı çıxır',
    fmtEmptyKey:'boş',
    fmtEmpty:'fayldakı qayda tətbiq olunur (MOSQUE.jamaat / MOSQUE.jumua)',
    dailyTitle:'Gündəlik camaat vaxtları', adhan:'Azan', jamaat:'Camaat',
    invalid:'Yanlış format — nümunə: 05:30 və ya +15',
    beforeAdhan:'Diqqət: bu vaxt bugünkü azandan əvvəldir',
    fromConfig:'Fayldan', notShown:'göstərilmir',
    jumuaTitle:'Cümə namazı', jumuaTime:'Cümə namazının vaxtı', jumuaShort:'Cümə',
    jumuaHint:'Cümə namazı zöhr vaxtında qılınır. "+N" zöhr azanından hesablanır.',
    khutbahLang:'Xütbənin dili', khutbahHint:'Məs.: "Azərbaycan dilində". Hər dil üçün ayrıca yazın.',
    previewNote:'Bugünkü hesablanmış azan vaxtları (aladhan.com)',
    bakuNote:'Vaxtlar Bakı üçün hesablanır — Qaraçuxurla fərq 1 dəqiqədən azdır.',
    adhanLoading:'Azan vaxtları yüklənir…',
    adhanFail:'Azan vaxtları yüklənmədi — "+N" qaydalarının nəticəsi göstərilə bilmir.',
    retry:'Yenidən yoxla',
    clear:'Sıfırla', clearConfirm:'Bu səhifədəki dəyərlər silinsin? "Yadda saxla" basılandan sonra fayldakı vaxtlar (MOSQUE.jamaat, MOSQUE.jumua) tətbiq olunacaq.',
    save:'Yadda saxla', saving:'Saxlanılır…', saved:'Yadda saxlandı!',
    unsaved:'Yadda saxlanmamış dəyişikliklər var', fixErrors:'Əvvəlcə yanlış sahələri düzəldin',
    loading:'Yüklənir…', lastUpdated:'Son yeniləmə',
    notConfigured:'Firebase qoşulmayıb — buradan yadda saxlamaq mümkün deyil.',
    notConfiguredHint:'Camaat vaxtlarını bu faylda da yaza bilərsiniz:',
    saveError:'Yadda saxlamaq alınmadı', permissionHint:'Firestore qaydaları yazmağa icazə vermir — FIREBASE_SETUP.md faylına baxın.',
    missingTitle:'Faylda doldurulmamış məscid məlumatları',
    editedIn:'Bu sahələr bu faylda redaktə olunur:', mobileCopy:'mobil surəti:',
    hiddenNote:'Boş sahələr ziyarətçiyə göstərilmir.',
    missingNone:'Bütün əsas sahələr doldurulub.',
    alsoHere:'bu səhifədən də təyin oluna bilər', setHere:'bu səhifədə təyin edilib',
    fields:{ address:'Ünvan', geo:'Dəqiq koordinat', mapUrl:'Google Maps linki', phone:'Telefon', imam:'İmamın adı', jamaat:'Camaat vaxtları', jumua:'Cümə vaxtı', history:'Tarixçə', services:'Xidmətlər', iban:'İanə rekvizitləri (IBAN)', social:'Sosial şəbəkələr' },
  },
  en: {
    title:'Congregation times', sub:'Congregational (iqamah) and Friday prayer times — shown on the website and in the mobile app',
    formatTitle:'How to enter',
    fmtFixed:'fixed time (same every day)',
    fmtOffset:'15 minutes after the adhan (follows the adhan automatically)',
    fmtHide:'no congregation time is shown for this prayer, only the calculated adhan time',
    fmtEmptyKey:'empty',
    fmtEmpty:'the rule from the config file is used (MOSQUE.jamaat / MOSQUE.jumua)',
    dailyTitle:'Daily congregation times', adhan:'Adhan', jamaat:'Congregation',
    invalid:'Invalid format — e.g. 05:30 or +15',
    beforeAdhan:'Note: this time is before today’s adhan',
    fromConfig:'From file', notShown:'not shown',
    jumuaTitle:'Friday prayer', jumuaTime:'Friday prayer time', jumuaShort:'Jumu’ah',
    jumuaHint:'Friday prayer is held at Dhuhr time. "+N" is counted from the Dhuhr adhan.',
    khutbahLang:'Khutbah language', khutbahHint:'E.g. "In Azerbaijani". Write it separately for each language.',
    previewNote:'Today’s calculated adhan times (aladhan.com)',
    bakuNote:'Times are calculated for Baku — the difference to Garachukhur is under 1 minute.',
    adhanLoading:'Loading adhan times…',
    adhanFail:'Could not load adhan times — results of "+N" rules cannot be previewed.',
    retry:'Try again',
    clear:'Reset', clearConfirm:'Clear the values on this page? After you press "Save", the times from the config file (MOSQUE.jamaat, MOSQUE.jumua) will apply.',
    save:'Save', saving:'Saving…', saved:'Saved!',
    unsaved:'You have unsaved changes', fixErrors:'Fix the invalid fields first',
    loading:'Loading…', lastUpdated:'Last updated',
    notConfigured:'Firebase is not connected — saving from here is not possible.',
    notConfiguredHint:'You can also enter congregation times in this file:',
    saveError:'Could not save', permissionHint:'Firestore rules do not allow writing — see FIREBASE_SETUP.md.',
    missingTitle:'Mosque details still empty in the config file',
    editedIn:'These fields are edited in this file:', mobileCopy:'mobile copy:',
    hiddenNote:'Empty fields are not shown to visitors.',
    missingNone:'All key fields are filled in.',
    alsoHere:'can also be set on this page', setHere:'set on this page',
    fields:{ address:'Address', geo:'Exact coordinates', mapUrl:'Google Maps link', phone:'Phone', imam:'Imam’s name', jamaat:'Congregation times', jumua:'Friday prayer time', history:'History', services:'Services', iban:'Donation details (IBAN)', social:'Social media' },
  },
  ru: {
    title:'Время джамаата', sub:'Время коллективных (икама) и пятничной молитв — показывается на сайте и в приложении',
    formatTitle:'Как заполнять',
    fmtFixed:'фиксированное время (каждый день одинаково)',
    fmtOffset:'через 15 минут после азана (меняется вместе с азаном)',
    fmtHide:'время джамаата для этого намаза не показывается, только расчётное время азана',
    fmtEmptyKey:'пусто',
    fmtEmpty:'используется правило из файла конфигурации (MOSQUE.jamaat / MOSQUE.jumua)',
    dailyTitle:'Ежедневное время джамаата', adhan:'Азан', jamaat:'Джамаат',
    invalid:'Неверный формат — например, 05:30 или +15',
    beforeAdhan:'Внимание: это время раньше сегодняшнего азана',
    fromConfig:'Из файла', notShown:'не показывается',
    jumuaTitle:'Пятничная молитва', jumuaTime:'Время пятничной молитвы', jumuaShort:'Джума',
    jumuaHint:'Пятничная молитва совершается во время зухра. «+N» отсчитывается от азана зухра.',
    khutbahLang:'Язык хутбы', khutbahHint:'Например: «на азербайджанском». Заполните для каждого языка отдельно.',
    previewNote:'Сегодняшнее расчётное время азана (aladhan.com)',
    bakuNote:'Время рассчитано для Баку — разница с Карачухуром менее 1 минуты.',
    adhanLoading:'Загрузка времени азана…',
    adhanFail:'Не удалось загрузить время азана — результат правил «+N» показать нельзя.',
    retry:'Повторить',
    clear:'Сбросить', clearConfirm:'Очистить значения на этой странице? После нажатия «Сохранить» будет применено время из файла конфигурации (MOSQUE.jamaat, MOSQUE.jumua).',
    save:'Сохранить', saving:'Сохранение…', saved:'Сохранено!',
    unsaved:'Есть несохранённые изменения', fixErrors:'Сначала исправьте неверные поля',
    loading:'Загрузка…', lastUpdated:'Обновлено',
    notConfigured:'Firebase не подключён — сохранить отсюда невозможно.',
    notConfiguredHint:'Время джамаата можно указать и в этом файле:',
    saveError:'Не удалось сохранить', permissionHint:'Правила Firestore запрещают запись — см. FIREBASE_SETUP.md.',
    missingTitle:'Незаполненные данные мечети в файле конфигурации',
    editedIn:'Эти поля редактируются в файле:', mobileCopy:'копия для приложения:',
    hiddenNote:'Пустые поля посетителям не показываются.',
    missingNone:'Все основные поля заполнены.',
    alsoHere:'можно задать и на этой странице', setHere:'задано на этой странице',
    fields:{ address:'Адрес', geo:'Точные координаты', mapUrl:'Ссылка Google Maps', phone:'Телефон', imam:'Имя имама', jamaat:'Время джамаата', jumua:'Время джумы', history:'История', services:'Услуги', iban:'Реквизиты для пожертвований (IBAN)', social:'Соцсети' },
  },
  ar: {
    title:'أوقات الجماعة', sub:'أوقات صلاة الجماعة (الإقامة) وصلاة الجمعة — تظهر في الموقع والتطبيق',
    formatTitle:'طريقة الإدخال',
    fmtFixed:'وقت ثابت (نفسه كل يوم)',
    fmtOffset:'بعد الأذان بـ 15 دقيقة (يتغيّر تلقائيًا مع الأذان)',
    fmtHide:'لا يظهر وقت الجماعة لهذه الصلاة، ويظهر وقت الأذان المحسوب فقط',
    fmtEmptyKey:'فارغ',
    fmtEmpty:'تُستخدم القاعدة من ملف الإعدادات (\u2066MOSQUE.jamaat / MOSQUE.jumua\u2069)',
    dailyTitle:'أوقات الجماعة اليومية', adhan:'الأذان', jamaat:'الجماعة',
    invalid:'صيغة غير صحيحة — مثال: 05:30 أو \u2066+15\u2069',
    beforeAdhan:'تنبيه: هذا الوقت قبل أذان اليوم',
    fromConfig:'من الملف', notShown:'لا يظهر',
    jumuaTitle:'صلاة الجمعة', jumuaTime:'وقت صلاة الجمعة', jumuaShort:'الجمعة',
    jumuaHint:'تُصلّى الجمعة في وقت الظهر. تُحسب "\u2066+N\u2069" من أذان الظهر.',
    khutbahLang:'لغة الخطبة', khutbahHint:'مثال: "باللغة الأذربيجانية". اكتبها لكل لغة على حدة.',
    previewNote:'أوقات الأذان المحسوبة لليوم (aladhan.com)',
    bakuNote:'الأوقات محسوبة لمدينة باكو — الفرق مع قاراچوخور أقل من دقيقة.',
    adhanLoading:'جارٍ تحميل أوقات الأذان…',
    adhanFail:'تعذّر تحميل أوقات الأذان — لا يمكن معاينة نتائج قواعد "\u2066+N\u2069".',
    retry:'أعد المحاولة',
    clear:'إعادة تعيين', clearConfirm:'هل تريد مسح القيم في هذه الصفحة؟ بعد الضغط على "حفظ" ستُطبَّق الأوقات من ملف الإعدادات (\u2066MOSQUE.jamaat, MOSQUE.jumua\u2069).',
    save:'حفظ', saving:'جارٍ الحفظ…', saved:'تم الحفظ!',
    unsaved:'توجد تغييرات غير محفوظة', fixErrors:'صحّح الحقول غير الصحيحة أولًا',
    loading:'جارٍ التحميل…', lastUpdated:'آخر تحديث',
    notConfigured:'Firebase غير متصل — لا يمكن الحفظ من هنا.',
    notConfiguredHint:'يمكنك أيضًا كتابة أوقات الجماعة في هذا الملف:',
    saveError:'تعذّر الحفظ', permissionHint:'قواعد Firestore لا تسمح بالكتابة — راجع FIREBASE_SETUP.md.',
    missingTitle:'بيانات المسجد غير المعبأة في ملف الإعدادات',
    editedIn:'تُحرَّر هذه الحقول في هذا الملف:', mobileCopy:'نسخة التطبيق:',
    hiddenNote:'الحقول الفارغة لا تظهر للزوار.',
    missingNone:'جميع الحقول الأساسية معبأة.',
    alsoHere:'يمكن تحديده في هذه الصفحة أيضًا', setHere:'محدد في هذه الصفحة',
    fields:{ address:'العنوان', geo:'الإحداثيات الدقيقة', mapUrl:'رابط خرائط Google', phone:'الهاتف', imam:'اسم الإمام', jamaat:'أوقات الجماعة', jumua:'وقت الجمعة', history:'تاريخ المسجد', services:'الخدمات', iban:'بيانات التبرع (IBAN)', social:'وسائل التواصل الاجتماعي' },
  },
  tr: {
    title:'Cemaat vakitleri', sub:'Cemaat (ikamet) ve cuma namazı vakitleri — sitede ve mobil uygulamada gösterilir',
    formatTitle:'Nasıl yazılır?',
    fmtFixed:'sabit saat (her gün aynı)',
    fmtOffset:'ezandan 15 dakika sonra (ezan vaktiyle birlikte değişir)',
    fmtHide:'bu namazın cemaat vakti gösterilmez, yalnızca hesaplanan ezan vakti görünür',
    fmtEmptyKey:'boş',
    fmtEmpty:'yapılandırma dosyasındaki kural kullanılır (MOSQUE.jamaat / MOSQUE.jumua)',
    dailyTitle:'Günlük cemaat vakitleri', adhan:'Ezan', jamaat:'Cemaat',
    invalid:'Geçersiz biçim — örnek: 05:30 veya +15',
    beforeAdhan:'Dikkat: bu saat bugünkü ezandan önce',
    fromConfig:'Dosyadan', notShown:'gösterilmez',
    jumuaTitle:'Cuma namazı', jumuaTime:'Cuma namazı vakti', jumuaShort:'Cuma',
    jumuaHint:'Cuma namazı öğle vaktinde kılınır. "+N" öğle ezanından itibaren hesaplanır.',
    khutbahLang:'Hutbe dili', khutbahHint:'Örnek: "Azerbaycan Türkçesiyle". Her dil için ayrı yazın.',
    previewNote:'Bugünün hesaplanan ezan vakitleri (aladhan.com)',
    bakuNote:'Vakitler Bakü için hesaplanır — Karaçuhur ile fark 1 dakikadan azdır.',
    adhanLoading:'Ezan vakitleri yükleniyor…',
    adhanFail:'Ezan vakitleri yüklenemedi — "+N" kurallarının sonucu gösterilemiyor.',
    retry:'Tekrar dene',
    clear:'Sıfırla', clearConfirm:'Bu sayfadaki değerler silinsin mi? "Kaydet"e bastıktan sonra yapılandırma dosyasındaki vakitler (MOSQUE.jamaat, MOSQUE.jumua) uygulanır.',
    save:'Kaydet', saving:'Kaydediliyor…', saved:'Kaydedildi!',
    unsaved:'Kaydedilmemiş değişiklikler var', fixErrors:'Önce hatalı alanları düzeltin',
    loading:'Yükleniyor…', lastUpdated:'Son güncelleme',
    notConfigured:'Firebase bağlı değil — buradan kaydetmek mümkün değil.',
    notConfiguredHint:'Cemaat vakitlerini bu dosyaya da yazabilirsiniz:',
    saveError:'Kaydedilemedi', permissionHint:'Firestore kuralları yazmaya izin vermiyor — FIREBASE_SETUP.md dosyasına bakın.',
    missingTitle:'Yapılandırma dosyasında boş olan cami bilgileri',
    editedIn:'Bu alanlar şu dosyada düzenlenir:', mobileCopy:'mobil kopyası:',
    hiddenNote:'Boş alanlar ziyaretçilere gösterilmez.',
    missingNone:'Tüm temel alanlar dolu.',
    alsoHere:'bu sayfadan da ayarlanabilir', setHere:'bu sayfada ayarlandı',
    fields:{ address:'Adres', geo:'Kesin koordinatlar', mapUrl:'Google Maps bağlantısı', phone:'Telefon', imam:'İmamın adı', jamaat:'Cemaat vakitleri', jumua:'Cuma vakti', history:'Tarihçe', services:'Hizmetler', iban:'Bağış bilgileri (IBAN)', social:'Sosyal medya' },
  },
}

// Camaat vaxtı olan namazlar (günəşin doğuşu daxil deyil)
const JAMAAT_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// missingMosqueFields() açarı → LABELS.fields açarı
const FIELD_KEYS = {
  'MOSQUE.address': 'address',
  'MOSQUE.geo': 'geo',
  'MOSQUE.mapUrl': 'mapUrl',
  'MOSQUE.phone': 'phone',
  'MOSQUE.imam.name': 'imam',
  'MOSQUE.jamaat': 'jamaat',
  'MOSQUE.jumua.time': 'jumua',
  'MOSQUE.history': 'history',
  'MOSQUE.services': 'services',
  'MOSQUE.donation.iban': 'iban',
  'MOSQUE.social': 'social',
}

const DATE_LOCALES = { az:'az-AZ', en:'en-GB', ru:'ru-RU', ar:'ar-u-nu-latn', tr:'tr-TR' }

const pad = (n) => String(n).padStart(2, '0')
const str = (v) => (typeof v === 'string' ? v : '')
const prayerName = (key, lang) => PRAYER_NAMES[key]?.[lang] || PRAYER_NAMES[key]?.az || key

/** Boş forma */
function emptyForm() {
  return {
    jamaat: Object.fromEntries(JAMAAT_KEYS.map(k => [k, ''])),
    jumua: { time: '', khutbahLang: Object.fromEntries(LANGS.map(L => [L, ''])) },
  }
}

/** Firestore sənədini (və ya null) formaya çevir — natamam sənədlərə dözümlü */
function toForm(doc) {
  const j = doc?.jamaat || {}
  const u = doc?.jumua || {}
  const k = u.khutbahLang || {}
  return {
    jamaat: Object.fromEntries(JAMAAT_KEYS.map(key => [key, str(j[key])])),
    jumua: { time: str(u.time), khutbahLang: Object.fromEntries(LANGS.map(L => [L, str(k[L])])) },
  }
}

// "Göstərmə" işarəsi — useMosqueTimes.js-dəki HIDE_RULE ilə eyni
const HIDE_RULE = '-'
const isHideRule = (v) => /^[-–—]$/.test(str(v).trim())

/** Qaydanı səliqəyə sal: "5:30" → "05:30", "+015" → "+15", "—" → "-", boşluqları sil */
function normalizeRule(v) {
  const s = str(v).trim()
  if (isHideRule(s)) return HIDE_RULE
  const hm = s.match(/^(\d{1,2}):(\d{2})$/)
  if (hm) return `${pad(hm[1])}:${hm[2]}`
  const off = s.match(/^\+(\d{1,3})$/)
  if (off) return `+${Number(off[1])}`
  return s
}

function normalizeForm(f) {
  return {
    jamaat: Object.fromEntries(JAMAAT_KEYS.map(k => [k, normalizeRule(f.jamaat[k])])),
    jumua: {
      time: normalizeRule(f.jumua.time),
      khutbahLang: Object.fromEntries(LANGS.map(L => [L, str(f.jumua.khutbahLang[L]).trim()])),
    },
  }
}

/** Qayda düzgündürmü? Boş (fayldakı qayda) və "-" (gizlə) də düzgündür. */
function isValidRule(v) {
  const s = str(v).trim()
  if (!s || isHideRule(s)) return true
  const hm = s.match(/^(\d{1,2}):(\d{2})$/)
  if (hm) return Number(hm[1]) <= 23 && Number(hm[2]) <= 59
  return /^\+\d{1,3}$/.test(s)
}

const isFixedRule = (v) => /^\d{1,2}:\d{2}$/.test(str(v).trim())
const toMin = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

/** Effektiv qayda: doldurulmuş forma dəyəri fayldakını üstələyir (useMosqueTimes ilə eyni qayda);
 *  "-" fayla qayıtmır — camaat vaxtı göstərilmir */
function effective(formValue, configValue) {
  if (isHideRule(formValue)) return { rule: '', fromConfig: false }
  if (filled(formValue)) return { rule: formValue.trim(), fromConfig: false }
  if (filled(configValue)) return { rule: configValue.trim(), fromConfig: true }
  return { rule: '', fromConfig: false }
}

/** Bir sətirin önbaxışı: nəticə vaxtı, xəbərdarlıq və mənbə */
function previewFor(formValue, configValue, adhanTime) {
  const eff = effective(formValue, configValue)
  if (!eff.rule || !isValidRule(eff.rule)) return { ...eff, time: '', warn: false, needsAdhan: false }
  const time = jamaatTime(eff.rule, adhanTime)
  const needsAdhan = !time && !isFixedRule(eff.rule)
  const warn = Boolean(time && adhanTime && isFixedRule(eff.rule) && toMin(time) < toMin(adhanTime))
  return { ...eff, time, warn, needsAdhan }
}

export default function JamaatManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const configured = isFirebaseConfigured()

  // Bugünkü hesablanmış azan vaxtları — saytın göstərdiyi ilə eyni (Bakı saat qurşağı, keş)
  const times = useMosqueTimes()
  const adhan = useMemo(
    () => Object.fromEntries(times.prayers.map(p => [p.key, p.adhan])),
    [times.prayers],
  )
  const adhanState = times.prayers.length ? 'ok' : times.error ? 'error' : 'loading'

  const [form, setForm] = useState(emptyForm)
  const [savedForm, setSavedForm] = useState(emptyForm)
  const [loading, setLoading] = useState(configured)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  // Redaktə olunmamış formanı izlə — canlı yeniləmə admin yazdığını silməsin
  const dirtyRef = useRef(false)
  const savedTimer = useRef(null)

  // Firestore-dan cari dəyərləri canlı oxu. getJamaat() xətada da null qaytarır
  // (məs. offline) — canlı abunə isə bağlantı bərpa olanda real sənədi gətirir,
  // beləcə boş forma təsadüfən mövcud vaxtların üzərinə yazılmır.
  // Sənəd yüklənənə qədər forma bağlıdır (fieldset disabled).
  useEffect(() => {
    if (!configured) return undefined
    const unsubscribe = subscribeToJamaat((doc) => {
      const f = toForm(doc)
      setSavedForm(normalizeForm(f))
      if (!dirtyRef.current) setForm(f)
      const ts = doc?.updatedAt
      if (typeof ts?.toDate === 'function') setUpdatedAt(ts.toDate())
      setLoading(false)
    })
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [configured])

  // "Yadda saxlandı" taymeri komponent bağlananda təmizlənsin
  useEffect(() => () => clearTimeout(savedTimer.current), [])

  const normalized = useMemo(() => normalizeForm(form), [form])
  const dirty = JSON.stringify(normalized) !== JSON.stringify(savedForm)
  useEffect(() => { dirtyRef.current = dirty }, [dirty])

  const invalid = useMemo(() => {
    const bad = {}
    JAMAAT_KEYS.forEach((k) => { if (!isValidRule(form.jamaat[k])) bad[k] = true })
    if (!isValidRule(form.jumua.time)) bad.jumua = true
    return bad
  }, [form])
  const hasErrors = Object.keys(invalid).length > 0

  const setRule = (key, value) => {
    setForm((f) => ({ ...f, jamaat: { ...f.jamaat, [key]: value } }))
  }
  const setJumuaTime = (value) => {
    setForm((f) => ({ ...f, jumua: { ...f.jumua, time: value } }))
  }
  const setKhutbah = (L, value) => {
    setForm((f) => ({ ...f, jumua: { ...f.jumua, khutbahLang: { ...f.jumua.khutbahLang, [L]: value } } }))
  }

  const handleClear = () => {
    if (window.confirm(l.clearConfirm)) {
      setForm(emptyForm())
      setError('')
    }
  }

  const handleSave = async () => {
    if (!configured || hasErrors || saving) return
    setError('')
    setSaving(true)
    try {
      const data = normalizeForm(form)
      await saveJamaat({ jamaat: data.jamaat, jumua: data.jumua })
      dirtyRef.current = false
      setForm(data)
      setSavedForm(data)
      setUpdatedAt(new Date())
      setSaved(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      const msg = e?.message || String(e)
      setError(/permission|insufficient/i.test(msg) ? `${l.saveError}: ${l.permissionHint}` : `${l.saveError}: ${msg}`)
    }
    setSaving(false)
  }

  const missing = missingMosqueFields()
  const savedHasJamaat = filled(savedForm.jamaat)
  const savedHasJumua = filled(savedForm.jumua.time)
  const disabled = !configured || loading || saving

  // Nəticə: "Camaat 05:27"; azan hələ yüklənməyibsə "…", yüklənmədisə qaydanın özü
  const resultNode = (p, prefix) => {
    if (p.time) {
      return (
        <span className="jm-result-chip">
          {prefix} <b dir="ltr">{p.time}</b>
        </span>
      )
    }
    if (p.needsAdhan) {
      return adhanState === 'error'
        ? <span className="jm-result-muted"><code dir="ltr">{p.rule}</code></span>
        : <span className="jm-result-muted">…</span>
    }
    return <span className="jm-result-muted">{l.notShown}</span>
  }

  // Bir namaz sətiri (gündəlik və cümə üçün ortaq)
  const renderRow = ({ id, label, adhanLabel, adhanTime, value, onChange, configValue, bad, prefix, placeholder }) => {
    const p = previewFor(value, configValue, adhanTime)
    const msgId = `jm-msg-${id}`
    return (
      <div key={id} className={`jm-row${bad ? ' jm-row-invalid' : ''}`}>
        <div className="jm-row-name">
          <label htmlFor={`jm-${id}`} className="jm-name">{label}</label>
          {adhanTime && <span className="jm-adhan">{adhanLabel} <b dir="ltr">{adhanTime}</b></span>}
        </div>
        <input
          id={`jm-${id}`}
          type="text"
          className="admin-input jm-input"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={6}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={bad ? 'true' : 'false'}
          aria-describedby={msgId}
        />
        <div className="jm-result">{!bad && resultNode(p, prefix)}</div>
        <div id={msgId} className="jm-msgs" aria-live="polite">
          {bad && <span className="jm-msg jm-msg-error">{l.invalid}</span>}
          {!bad && p.warn && <span className="jm-msg jm-msg-warn">{l.beforeAdhan}</span>}
          {!bad && p.fromConfig && <span className="jm-msg">{l.fromConfig}: <code dir="ltr">{p.rule}</code></span>}
        </div>
      </div>
    )
  }

  return (
    <div className="jm">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge">🕌</div>
          <div className="admin-header-info"><h1>{l.title}</h1><p>{l.sub}</p></div>
        </div>
      </div>

      {!configured && (
        <div className="jm-box jm-box-warn" role="status">
          <strong>⚠️ {l.notConfigured}</strong>
          <p>
            {l.notConfiguredHint} <code dir="ltr">src/config/mosque.js</code> → <code dir="ltr">MOSQUE.jamaat</code>, <code dir="ltr">MOSQUE.jumua</code>
            {' '}({l.mobileCopy} <code dir="ltr">mobile/src/config/mosque.js</code>)
          </p>
        </div>
      )}

      {/* Format izahı */}
      <div className="jm-box jm-box-help">
        <strong>{l.formatTitle}</strong>
        <ul>
          <li><code dir="ltr">05:30</code> — {l.fmtFixed}</li>
          <li><code dir="ltr">+15</code> — {l.fmtOffset}</li>
          <li><code dir="ltr">-</code> — {l.fmtHide}</li>
          <li><code className="jm-code-word">{l.fmtEmptyKey}</code> — {l.fmtEmpty}</li>
        </ul>
      </div>

      <fieldset className="jm-fieldset" disabled={disabled}>
        {/* Gündəlik camaat vaxtları */}
        <div className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-title-icon">🕰️</span>
            {l.dailyTitle}
          </h2>

          <div className="jm-adhan-note" aria-live="polite">
            {adhanState === 'loading' && l.adhanLoading}
            {adhanState === 'ok' && <>{l.previewNote} · <span dir="ltr" className="jm-nowrap">{times.date}</span></>}
            {adhanState === 'error' && (
              <>
                {l.adhanFail}{' '}
                <button type="button" className="jm-link-btn" onClick={times.reload}>{l.retry}</button>
              </>
            )}
            {adhanState === 'ok' && !times.exact && <span className="jm-adhan-sub">{l.bakuNote}</span>}
          </div>

          {loading && <p className="jm-loading">{l.loading}</p>}

          <div className="jm-rows">
            {JAMAAT_KEYS.map((key) => renderRow({
              id: key,
              label: prayerName(key, lang),
              adhanLabel: l.adhan,
              adhanTime: adhan[key] || '',
              value: form.jamaat[key],
              onChange: (v) => setRule(key, v),
              configValue: MOSQUE.jamaat[key],
              bad: invalid[key],
              prefix: l.jamaat,
              placeholder: '05:30 / +15',
            }))}
          </div>
        </div>

        {/* Cümə namazı */}
        <div className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-title-icon">🕌</span>
            {l.jumuaTitle}
          </h2>
          <p className="jm-adhan-note">{l.jumuaHint}</p>

          {renderRow({
            id: 'jumua',
            label: l.jumuaTime,
            adhanLabel: `${prayerName('dhuhr', lang)} · ${l.adhan}`,
            adhanTime: adhan.dhuhr || '',
            value: form.jumua.time,
            onChange: setJumuaTime,
            configValue: MOSQUE.jumua.time,
            bad: invalid.jumua,
            prefix: l.jumuaShort,
            placeholder: '13:00 / +20',
          })}

          <div className="admin-input-group jm-khutbah">
            <span className="admin-input-label">{l.khutbahLang}</span>
            <p className="jm-hint">{l.khutbahHint}</p>
            <div className="jm-khutbah-grid">
              {LANGS.map((L) => (
                <label key={L} className="jm-khutbah-field">
                  <span className="jm-khutbah-code">{L.toUpperCase()}</span>
                  <input
                    type="text"
                    className="admin-input"
                    dir={L === 'ar' ? 'rtl' : 'ltr'}
                    lang={L}
                    value={form.jumua.khutbahLang[L]}
                    onChange={(e) => setKhutbah(L, e.target.value)}
                    maxLength={80}
                    autoComplete="off"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Əməliyyatlar — formadan dərhal sonra, heç nəyin üstünə düşmür */}
      <div className="jm-actions">
        {(error || hasErrors || (dirty && configured) || updatedAt) && (
          <div className="jm-status" aria-live="polite">
            {error && <span className="jm-msg jm-msg-error">{error}</span>}
            {!error && hasErrors && <span className="jm-msg jm-msg-error">{l.fixErrors}</span>}
            {!error && !hasErrors && dirty && configured && <span className="jm-msg jm-msg-warn">{l.unsaved}</span>}
            {!error && !hasErrors && !dirty && updatedAt && (
              <span className="jm-msg">{l.lastUpdated}: <span dir="ltr">{updatedAt.toLocaleString(DATE_LOCALES[lang] || 'az-AZ', { dateStyle: 'short', timeStyle: 'short' })}</span></span>
            )}
          </div>
        )}
        <button type="button" className="admin-cancel-btn jm-clear-btn" onClick={handleClear} disabled={disabled}>
          {l.clear}
        </button>
        <button type="button" className="admin-submit-btn jm-save-btn" onClick={handleSave} disabled={disabled || hasErrors}>
          <span>💾</span> {saving ? l.saving : saved ? '✅ ' + l.saved : l.save}
        </button>
      </div>

      {/* Faylda boş qalan statik məscid sahələri */}
      <div className="jm-box jm-box-info">
        <strong>ℹ️ {l.missingTitle}</strong>
        {missing.length === 0 ? (
          <p>{l.missingNone}</p>
        ) : (
          <>
            <p>
              {l.editedIn} <code dir="ltr">src/config/mosque.js</code> ({l.mobileCopy} <code dir="ltr">mobile/src/config/mosque.js</code>). {l.hiddenNote}
            </p>
            <ul className="jm-missing">
              {missing.map((key) => {
                const fk = FIELD_KEYS[key]
                const overridable = fk === 'jamaat' || fk === 'jumua'
                const setOnPage = (fk === 'jamaat' && savedHasJamaat) || (fk === 'jumua' && savedHasJumua)
                return (
                  <li key={key}>
                    <span className="jm-missing-label">{(fk && l.fields[fk]) || key}</span>
                    <code dir="ltr">{key}</code>
                    {overridable && (
                      <span className={`jm-missing-note${setOnPage ? ' jm-missing-note-ok' : ''}`}>
                        {setOnPage ? `✓ ${l.setHere}` : l.alsoHere}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
