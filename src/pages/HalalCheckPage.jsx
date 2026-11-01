import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { guessLang } from '../utils/textLang'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReportErrorButton from '../components/ReportErrorButton'
import {
  CATEGORIES, displayECode, extractECodes, lookupECode, offTagToCode, parseAnalysisTags,
  halalLabelTags, normalizeBarcode, gtinCheckOk, fetchProduct, ProductError,
} from '../utils/ecodes'
import { ChartFigure, BarChart } from '../components/viz'
import '../styles/HalalCheckPage.css'

/* ══════════════════════════════════════════════════════════════════
   HALAL QİDA YOXLAMASI — /halal-check
   1) E-kod yoxlayıcısı: public/data/ecodes.json (scripts/build-ecodes.mjs —
      Open Food Facts əlavələr taksonomiyası, ODbL). Qrup YALNIZ OFF faktlarından
      (vegan / vegetarian, mənbə mətni, Wikidata taksonu) — hökm deyil.
   2) Ştrixkod: Open Food Facts API v2 (kütləvi, natamam ola bilər).
      Kamera — yalnız BarcodeDetector API varsa (xarici kitabxana yoxdur).
   3) Fiqh izahı: dəlillər və AÇILIB OXUNMUŞ fətvalar (binbaz.org.sa,
      islamqa.info) — hər əlavəyə ayrıca hökm VERİLMİR.
   ══════════════════════════════════════════════════════════════════ */

// Brend / domen adları — dil kontekstindən kənarda (hər dildə eyni yazılır)
const OFF = 'Open Food Facts'
const WD = 'Wikidata'
const ODBL = 'ODbL 1.0'
const DBCL = 'DbCL 1.0'
const IQA = 'islamqa.info'
const BBZ = 'binbaz.org.sa'
const E1510 = 'E1510'
const E428 = 'E428'
const E471 = 'E471'
const HADITH_API = 'hadith-api (fawazahmed0)'

const LABELS = {
  az: {
    how: 'E-kodu yazın və ya tərkib siyahısını yapışdırın — hər əlavənin mənşə qrupu (bitki, heyvan, həşərat…) görünəcək. Bu, hökm deyil, məlumatdır.',
    statCodes: 'E-kod bazada', statNone: 'heyvan mənşəli deyil', statCheck: 'mənbəyi yoxlanmalıdır',
    ovTitle: 'Bazada nə var?', ovSub: 'mənşə qrupuna görə E-kodların sayı',
    clsTitle: 'Əlavələr nə üçündür?', clsSub: 'ən çox rast gələn 8 funksiya — bir əlavənin bir neçə funksiyası ola bilər',
    stepsTitle: 'Məhsulu necə yoxlamalı?', stepsLead: 'Dörd addım — qablaşdırmadan nəticəyə qədər.',
    steps: [
      ['Tərkibi oxuyun', 'Qablaşdırmadakı tərkib siyahısında E-kodları və ya əlavələrin adlarını tapın.'],
      ['Burada yoxlayın', 'Kodları və ya bütün tərkib siyahısını «E-kod yoxlayıcısı» sahəsinə yapışdırın, ya da ştrixkodu yazın.'],
      ['Mənşəyə baxın', '«Heyvan mənşəli» və ya «ola bilər» qrupundakı əlavənin mənbəyini məhsulu buraxan şirkətdən soruşun və ya halal sertifikatına baxın.'],
      ['Dəlili oxuyun', 'İstihalə, jelatin, spirt və şübhəli şeylər barədə qaydalar «Fiqhi izah» bölməsindədir.'],
    ],
    eyebrow: 'Halal qida', title: 'Halal qida yoxlaması',
    lead: 'E-kodları (qida əlavələrini) və məhsulun ştrixkodunu yoxlayın: əlavənin mənşəyi barədə açıq məlumat, tərkib və fiqhi izah — dəlilləri ilə.',
    jump: { codes: 'E-kodlar', barcode: 'Ştrixkod', fiqh: 'Fiqhi izah', sources: 'Mənbələr' },
    discTitle: 'Bu, halal sertifikatı deyil',
    // lang-ok[istehsalçılarda]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
    disc: `Bu səhifə heç bir məhsul və ya əlavə üçün halal/haram hökmü vermir. Qruplar yalnız ${OFF} məlumat bazasının mənşə barədə faktlarından qurulub; bu məlumat səhv və ya natamam ola bilər, eyni E-kod müxtəlif istehsalçılarda müxtəlif mənbədən alına bilər. Qərar vermək üçün halal sertifikatlaşdırma qurumlarına, istehsalçıya və alimlərə müraciət edin.`,
    codesTitle: 'E-kod yoxlayıcısı',
    codesLead: (n) => `${n} əlavə — ${OFF} taksonomiyasından. Kodu (E120, e-471, 330) və ya adı yazın; tərkib siyahısını da yapışdıra bilərsiniz.`,
    codesLabel: 'E-kod, ad və ya tərkib', codesPh: 'məs. E471, E120, jelatin', clear: 'Təmizlə',
    browse: 'Qrup üzrə bax', all: 'Hamısı', found: (n) => `Tapıldı: ${n}`, none: 'Heç nə tapılmadı.',
    notInData: (c) => `${c} bazada yoxdur.`, parent: (req, c) => `${req} ayrıca yoxdur — ümumi kod ${c} göstərilir.`,
    more: (n) => `Daha çox göstər (${n} qalıb)`,
    loading: 'Yüklənir…', loadError: 'Məlumat yüklənmədi. İnternet bağlantısını yoxlayıb yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    // lang-ok[vegetarian]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
    fields: 'Mənbə sahələri', vegan: `${OFF}: vegan`, vegetarian: `${OFF}: vegetarian`,
    inherited: (c) => `Bu kod üçün status yoxdur — ${OFF}-da valideyn kod ${c}-dən götürülüb`,
    palm: `${OFF}: palma yağından`, desc: `${OFF} təsviri (ingiliscə)`, cls: 'Funksiyası',
    insectWd: `${WD}: təsvir`, insectTaxon: `${WD}: təbii məhsul olduğu takson`,
    val: { yes: 'bəli', no: 'xeyr', maybe: 'ola bilər', null: 'göstərilməyib' },
    nameEn: 'Ad bu dildə bazada yoxdur — ingiliscə göstərilir', noName: (c) => `Bazada adı yoxdur; ümumi kod: ${c}`,
    openOff: `${OFF}-da aç`,
    bcTitle: 'Ştrixkodla yoxla',
    bcLead: `Məhsulun ştrixkodunu yazın (8–14 rəqəm). Tərkib, E-kodlar və halal nişanı ${OFF}-dan gətirilir.`,
    // lang-ok[Kamera,Kameranı]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
    bcLabel: 'Ştrixkod', bcPh: 'məs. 4600000000000', check: 'Yoxla', scan: 'Kamera ilə oxu', stop: 'Kameranı bağla',
    // lang-ok[Kamera]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
    scanHint: 'Ştrixkodu çərçivəyə tutun.', scanErr: 'Kamera açılmadı. İcazəni yoxlayın və ya kodu əl ilə yazın.',
    checkDigit: 'Yoxlama rəqəmi uyğun gəlmir — kod səhv yazılmış ola bilər.',
    err: {
      invalid: 'Ştrixkod 8–14 rəqəmdən ibarət olmalıdır.',
      notfound: `Bu ştrixkod ${OFF} bazasında tapılmadı. Bu, məhsul haqqında heç nə demir — sadəcə hələ əlavə olunmayıb.`,
      offline: 'İnternet bağlantısı yoxdur. Bağlantını yoxlayıb yenidən cəhd edin.',
      timeout: 'Server vaxtında cavab vermədi. Bir az sonra yenidən cəhd edin.',
      http: 'Server xətası. Bir az sonra yenidən cəhd edin.',
    },
    crowd: `Məlumat ${OFF} istifadəçiləri tərəfindən əlavə olunub — natamam, köhnə və ya səhv ola bilər. Qablaşdırmadakı tərkibi mütləq özünüz də oxuyun.`,
    product: 'Məhsul', brands: 'Brend', ingredients: 'Tərkib (qablaşdırmada yazıldığı dildə)', noIngr: 'Tərkib bazaya daxil edilməyib.',
    additives: 'Tapılan E-kodlar', noAdd: `${OFF} bu məhsulda E-kod qeyd etməyib (bu, olmadığı demək deyil).`,
    analysis: `${OFF} analizi`, labels: 'Halal nişanı',
    halalYes: 'Qablaşdırmada halal nişanı qeyd olunub:', halalNo: 'Bazada halal nişanı qeyd olunmayıb. Bu, məhsulun haram olduğu demək deyil.',
    an: {
      vegan: { yes: 'Vegan', no: 'Vegan deyil', maybe: 'Vegan ola bilər', unknown: 'Vegan statusu naməlum' },
      // lang-ok[Vegetarian]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
      vegetarian: { yes: 'Vegetarian', no: 'Vegetarian deyil', maybe: 'Vegetarian ola bilər', unknown: 'Vegetarian statusu naməlum' },
      palm: { free: 'Palma yağı yoxdur', contains: 'Palma yağı var', maybe: 'Palma yağı ola bilər', unknown: 'Palma yağı naməlum' },
    },
    fiqhTitle: 'Fiqhi izah', fiqhLead: 'Hər əlavəyə ayrıca hökm yox, qaydalar və dəlillər. Fətvalar mənbədə açılıb oxunub; tam mətn üçün keçidlərə baxın.',
    srcTitle: 'Mənbələr və lisenziya', translation: 'Tərcümə', ourTr: 'Tərcümə: Muslims.cc (ərəb əslindən)', ref: 'Mənbə',
    srcData: (d) => `E-kod bazası: ${OFF} əlavələr taksonomiyası, © ${OFF} töhfəçiləri, ${ODBL} lisenziyası (ayrı məzmun — ${DBCL}). Qurulma tarixi: ${d}. Həşərat sübutu üçün ${WD} (CC0) istifadə olunub.`,
    srcProduct: `Məhsul məlumatı: ${OFF} API — ${ODBL}.`,
    srcQuran: 'Quran mətni: quran.com (Osmani yazı); məna tərcüməsi: Vasim Məmmədəliyev və Ziya Bünyadov.',
    srcHadith: `Hədis mətni: ${HADITH_API} nəşri üzrə yoxlanılıb.`,
  },
  en: {
    how: 'Type an E-code or paste an ingredients list — you will see the origin group of each additive (plant, animal, insect…). This is information, not a ruling.',
    statCodes: 'E-codes in the database', statNone: 'of no animal origin', statCheck: 'need their source checked',
    ovTitle: 'What is in the database?', ovSub: 'number of E-codes by origin group',
    clsTitle: 'What are additives for?', clsSub: 'the 8 most common functions — one additive can have several',
    stepsTitle: 'How to check a product', stepsLead: 'Four steps — from the label to an answer.',
    steps: [
      ['Read the ingredients', 'Find the E-codes or additive names in the ingredients list on the pack.'],
      ['Check them here', 'Paste the codes or the whole ingredients list into the E-number checker, or type the barcode.'],
      ['Look at the origin', 'For an additive in the “animal origin” or “may be” group, ask the company that makes the product or look for a halal certificate.'],
      ['Read the evidence', 'The principles on istihala, gelatin, alcohol and doubtful matters are in the “Fiqh guide” section.'],
    ],
    eyebrow: 'Halal food', title: 'Halal food check',
    lead: 'Check E-numbers (food additives) and product barcodes: open data on where an additive comes from, the ingredients, and a fiqh guide with its evidence.',
    jump: { codes: 'E-numbers', barcode: 'Barcode', fiqh: 'Fiqh guide', sources: 'Sources' },
    discTitle: 'This is not a halal certification',
    disc: `This page gives no halal/haram ruling on any product or additive. The groups are built only from the origin facts in the ${OFF} database; that data may be wrong or incomplete, and the same E-number can come from different sources at different manufacturers. For a decision, ask halal certification bodies, the manufacturer and scholars.`,
    codesTitle: 'E-number checker',
    codesLead: (n) => `${n} additives from the ${OFF} taxonomy. Type a code (E120, e-471, 330) or a name — or paste an ingredients list.`,
    codesLabel: 'E-number, name or ingredients', codesPh: 'e.g. E471, E120, gelatine', clear: 'Clear',
    browse: 'Browse by group', all: 'All', found: (n) => `Found: ${n}`, none: 'Nothing found.',
    notInData: (c) => `${c} is not in the dataset.`, parent: (req, c) => `${req} has no entry of its own — showing the general code ${c}.`,
    more: (n) => `Show more (${n} left)`,
    loading: 'Loading…', loadError: 'The data could not be loaded. Check your connection and try again.', retry: 'Try again',
    fields: 'Source fields', vegan: `${OFF}: vegan`, vegetarian: `${OFF}: vegetarian`,
    inherited: (c) => `No status for this code itself — taken from its parent code ${c} in ${OFF}`,
    palm: `${OFF}: from palm oil`, desc: `${OFF} description (English)`, cls: 'Function',
    insectWd: `${WD}: description`, insectTaxon: `${WD}: natural product of taxon`,
    val: { yes: 'yes', no: 'no', maybe: 'maybe', null: 'not given' },
    nameEn: 'No name in this language in the dataset — shown in English', noName: (c) => `No name in the dataset; general code: ${c}`,
    openOff: `Open on ${OFF}`,
    bcTitle: 'Check by barcode',
    bcLead: `Enter the product barcode (8–14 digits). Ingredients, E-numbers and halal labels are fetched from ${OFF}.`,
    bcLabel: 'Barcode', bcPh: 'e.g. 4600000000000', check: 'Check', scan: 'Scan with camera', stop: 'Close camera',
    scanHint: 'Hold the barcode inside the frame.', scanErr: 'The camera could not be opened. Check the permission or type the code.',
    checkDigit: 'The check digit does not match — the code may be mistyped.',
    err: {
      invalid: 'A barcode has 8–14 digits.',
      notfound: `This barcode is not in the ${OFF} database. That says nothing about the product — it simply has not been added yet.`,
      offline: 'You are offline. Check your connection and try again.',
      timeout: 'The server did not answer in time. Please try again shortly.',
      http: 'Server error. Please try again shortly.',
    },
    crowd: `This data is contributed by ${OFF} users — it may be incomplete, outdated or wrong. Always read the ingredients on the package yourself.`,
    product: 'Product', brands: 'Brand', ingredients: 'Ingredients (as written on the package)', noIngr: 'No ingredients entered in the database.',
    additives: 'E-numbers found', noAdd: `${OFF} lists no E-numbers for this product (which does not mean there are none).`,
    analysis: `${OFF} analysis`, labels: 'Halal label',
    halalYes: 'A halal label is recorded for the package:', halalNo: 'No halal label is recorded in the database. That does not mean the product is haram.',
    an: {
      vegan: { yes: 'Vegan', no: 'Not vegan', maybe: 'Maybe vegan', unknown: 'Vegan status unknown' },
      vegetarian: { yes: 'Vegetarian', no: 'Not vegetarian', maybe: 'Maybe vegetarian', unknown: 'Vegetarian status unknown' },
      palm: { free: 'No palm oil', contains: 'Contains palm oil', maybe: 'May contain palm oil', unknown: 'Palm oil unknown' },
    },
    fiqhTitle: 'Fiqh guide', fiqhLead: 'Principles and evidence rather than a ruling per additive. Every fatwa cited was opened and read at its source; follow the links for the full text.',
    srcTitle: 'Sources and licence', translation: 'Translation', ourTr: 'Translation: Muslims.cc (from the Arabic)', ref: 'Source',
    srcData: (d) => `E-number dataset: ${OFF} additives taxonomy, © ${OFF} contributors, licensed under the ${ODBL} (individual contents: ${DBCL}). Built on ${d}. ${WD} (CC0) is used for insect evidence only.`,
    srcProduct: `Product data: ${OFF} API — ${ODBL}.`,
    srcQuran: 'Quran text: quran.com (Uthmani script); translation of the meaning: Saheeh International.',
    srcHadith: `Hadith texts checked against the ${HADITH_API} editions.`,
  },
  ru: {
    how: 'Введите Е-код или вставьте состав — увидите группу происхождения каждой добавки (растительная, животная, из насекомых…). Это сведения, а не решение.',
    statCodes: 'Е-кодов в базе', statNone: 'не животного происхождения', statCheck: 'требуют проверки источника',
    ovTitle: 'Что есть в базе?', ovSub: 'число Е-кодов по группам происхождения',
    clsTitle: 'Зачем нужны добавки?', clsSub: '8 самых частых функций — у одной добавки их может быть несколько',
    stepsTitle: 'Как проверить продукт', stepsLead: 'Четыре шага — от этикетки до ответа.',
    steps: [
      ['Прочитайте состав', 'Найдите на упаковке в составе Е-коды или названия добавок.'],
      ['Проверьте здесь', 'Вставьте коды или весь состав в поле «Проверка Е-кодов» либо введите штрихкод.'],
      ['Посмотрите происхождение', 'Если добавка в группе «животного происхождения» или «может быть», спросите компанию-изготовителя или ищите сертификат халяль.'],
      ['Прочитайте доводы', 'Правила об истихале, желатине, спирте и сомнительном — в разделе «Фикх».'],
    ],
    eyebrow: 'Халяльная еда', title: 'Проверка продуктов на халяль',
    lead: 'Проверьте Е-коды (пищевые добавки) и штрихкод продукта: открытые данные о происхождении добавки, состав и фикх-пояснение с доводами.',
    jump: { codes: 'Е-коды', barcode: 'Штрихкод', fiqh: 'Фикх', sources: 'Источники' },
    discTitle: 'Это не халяль-сертификат',
    disc: `Эта страница не выносит решения «халяль/харам» ни по одному продукту или добавке. Группы построены только на фактах о происхождении из базы ${OFF}; эти данные могут быть ошибочными или неполными, а один и тот же Е-код у разных производителей может иметь разное происхождение. За решением обращайтесь в органы халяль-сертификации, к производителю и к учёным.`,
    codesTitle: 'Проверка Е-кодов',
    codesLead: (n) => `Добавок в базе: ${n} — из таксономии ${OFF}. Введите код (Е120, е-471, 330) или название — или вставьте состав целиком.`,
    codesLabel: 'Е-код, название или состав', codesPh: 'напр. Е471, Е120, желатин', clear: 'Очистить',
    browse: 'Просмотр по группам', all: 'Все', found: (n) => `Найдено: ${n}`, none: 'Ничего не найдено.',
    notInData: (c) => `${c} нет в базе.`, parent: (req, c) => `Отдельной записи для ${req} нет — показан общий код ${c}.`,
    more: (n) => `Показать ещё (осталось ${n})`,
    loading: 'Загрузка…', loadError: 'Не удалось загрузить данные. Проверьте подключение и повторите попытку.', retry: 'Повторить',
    fields: 'Поля источника', vegan: `${OFF}: веганский`, vegetarian: `${OFF}: вегетарианский`,
    inherited: (c) => `У самого кода статуса нет — взят из родительского кода ${c} в ${OFF}`,
    palm: `${OFF}: из пальмового масла`, desc: `Описание ${OFF} (на английском)`, cls: 'Назначение',
    insectWd: `${WD}: описание`, insectTaxon: `${WD}: природный продукт таксона`,
    val: { yes: 'да', no: 'нет', maybe: 'возможно', null: 'не указано' },
    nameEn: 'Названия на этом языке в базе нет — показано английское', noName: (c) => `В базе нет названия; общий код: ${c}`,
    openOff: `Открыть в ${OFF}`,
    bcTitle: 'Проверка по штрихкоду',
    bcLead: `Введите штрихкод продукта (8–14 цифр). Состав, Е-коды и халяль-маркировка загружаются из ${OFF}.`,
    bcLabel: 'Штрихкод', bcPh: 'напр. 4600000000000', check: 'Проверить', scan: 'Сканировать камерой', stop: 'Закрыть камеру',
    scanHint: 'Наведите рамку на штрихкод.', scanErr: 'Не удалось открыть камеру. Проверьте разрешение или введите код вручную.',
    checkDigit: 'Контрольная цифра не совпадает — возможно, код введён с ошибкой.',
    err: {
      invalid: 'Штрихкод состоит из 8–14 цифр.',
      notfound: `Этого штрихкода нет в базе ${OFF}. О самом продукте это ничего не говорит — его просто ещё не добавили.`,
      offline: 'Нет подключения к интернету. Проверьте связь и повторите попытку.',
      timeout: 'Сервер не ответил вовремя. Повторите попытку чуть позже.',
      http: 'Ошибка сервера. Повторите попытку чуть позже.',
    },
    crowd: `Эти данные добавлены пользователями ${OFF} — они могут быть неполными, устаревшими или ошибочными. Обязательно прочитайте состав на упаковке сами.`,
    product: 'Продукт', brands: 'Бренд', ingredients: 'Состав (на языке упаковки)', noIngr: 'Состав в базу не внесён.',
    additives: 'Найденные Е-коды', noAdd: `${OFF} не указывает Е-кодов для этого продукта (это не значит, что их нет).`,
    analysis: `Анализ ${OFF}`, labels: 'Халяль-маркировка',
    halalYes: 'Для упаковки указана халяль-маркировка:', halalNo: 'Халяль-маркировка в базе не указана. Это не значит, что продукт харам.',
    an: {
      vegan: { yes: 'Веганский', no: 'Не веганский', maybe: 'Возможно веганский', unknown: 'Веганский статус неизвестен' },
      vegetarian: { yes: 'Вегетарианский', no: 'Не вегетарианский', maybe: 'Возможно вегетарианский', unknown: 'Вегетарианский статус неизвестен' },
      palm: { free: 'Без пальмового масла', contains: 'Содержит пальмовое масло', maybe: 'Может содержать пальмовое масло', unknown: 'Пальмовое масло: неизвестно' },
    },
    fiqhTitle: 'Фикх-пояснение', fiqhLead: 'Принципы и доводы, а не решение по каждой добавке. Каждая приведённая фетва открыта и прочитана в источнике; полный текст — по ссылкам.',
    srcTitle: 'Источники и лицензия', translation: 'Перевод', ourTr: 'Перевод: Muslims.cc (с арабского)', ref: 'Источник',
    srcData: (d) => `База Е-кодов: таксономия добавок ${OFF}, © участники ${OFF}, лицензия ${ODBL} (отдельное содержимое — ${DBCL}). Дата сборки: ${d}. ${WD} (CC0) используется только для признака «насекомые».`,
    srcProduct: `Данные о продуктах: ${OFF} — ${ODBL}.`,
    srcQuran: 'Текст Корана: quran.com (османский шрифт); перевод смыслов: Э. Кулиев.',
    srcHadith: `Тексты хадисов сверены по изданиям ${HADITH_API}.`,
  },
  ar: {
    how: 'اكتب رمز E أو الصق قائمة المكونات لترى مجموعة أصل كل مضاف (نباتي، حيواني، حشري…). هذه معلومات وليست حكمًا.',
    statCodes: 'رمز E في القاعدة', statNone: 'ليست من أصل حيواني', statCheck: 'يلزم التحقق من مصدرها',
    ovTitle: 'ماذا في قاعدة البيانات؟', ovSub: 'عدد رموز E حسب مجموعة الأصل',
    clsTitle: 'ما وظيفة المضافات؟', clsSub: 'أكثر ٨ وظائف شيوعًا، وقد يكون للمضاف الواحد أكثر من وظيفة',
    stepsTitle: 'كيف تفحص منتجًا؟', stepsLead: 'أربع خطوات من الملصق إلى النتيجة.',
    steps: [
      ['اقرأ المكونات', 'ابحث في قائمة المكونات على العبوة عن رموز E أو أسماء المضافات.'],
      ['افحصها هنا', 'الصق الرموز أو قائمة المكونات كاملة في حقل «فاحص رموز E»، أو اكتب الرمز الشريطي.'],
      ['انظر إلى الأصل', 'إن كان المضاف في مجموعة «من أصل حيواني» أو «قد يكون»، فاسأل الشركة المنتجة أو ابحث عن شهادة الحلال.'],
      ['اقرأ الدليل', 'قواعد الاستحالة والجيلاتين والكحول والمشتبهات في قسم «الأحكام الفقهية».'],
    ],
    eyebrow: 'الطعام الحلال', title: 'فحص الأطعمة الحلال',
    lead: 'افحص رموز E (المضافات الغذائية) والرمز الشريطي للمنتج: بيانات مفتوحة عن أصل المضاف، والمكوّنات، وبيان فقهي بأدلته.',
    jump: { codes: 'رموز E', barcode: 'الرمز الشريطي', fiqh: 'البيان الفقهي', sources: 'المصادر' },
    discTitle: 'هذه ليست شهادة حلال',
    disc: `لا تُصدر هذه الصفحة حكمًا بالحل أو الحرمة على أي منتج أو مضاف. بُنيت المجموعات فقط من معلومات الأصل في قاعدة بيانات ${OFF}، وقد تكون خاطئة أو ناقصة، وقد يُستخرج رمز E الواحد من مصادر مختلفة عند مصنّعين مختلفين. وللحكم ارجع إلى جهات اعتماد الحلال والشركة المصنّعة وأهل العلم.`,
    codesTitle: 'فاحص رموز E',
    codesLead: (n) => `عدد المضافات: ${n} — من تصنيف ${OFF}. اكتب الرمز (E120 أو 471) أو الاسم، أو الصق قائمة المكوّنات.`,
    codesLabel: 'رمز E أو الاسم أو المكوّنات', codesPh: 'مثل: E471، E120، جيلاتين', clear: 'مسح',
    browse: 'تصفّح حسب المجموعة', all: 'الكل', found: (n) => `النتائج: ${n}`, none: 'لم يُعثر على شيء.',
    notInData: (c) => `الرمز ${c} غير موجود في القاعدة.`, parent: (req, c) => `لا يوجد إدخال مستقل لـ ${req} — يُعرض الرمز العام ${c}.`,
    more: (n) => `عرض المزيد (المتبقي ${n})`,
    loading: 'جارٍ التحميل…', loadError: 'تعذّر تحميل البيانات. تحقّق من الاتصال وأعد المحاولة.', retry: 'أعد المحاولة',
    fields: 'حقول المصدر', vegan: `${OFF}: نباتي صرف`, vegetarian: `${OFF}: نباتي`,
    inherited: (c) => `لا توجد حالة لهذا الرمز نفسه — أُخذت من الرمز الأصل ${c} في ${OFF}`,
    palm: `${OFF}: من زيت النخيل`, desc: `وصف ${OFF} (بالإنجليزية)`, cls: 'الوظيفة',
    insectWd: `${WD}: الوصف`, insectTaxon: `${WD}: منتج طبيعي للتصنيف الحيوي`,
    val: { yes: 'نعم', no: 'لا', maybe: 'محتمل', null: 'غير مذكور' },
    nameEn: 'لا يوجد اسم بهذه اللغة في القاعدة — يُعرض بالإنجليزية', noName: (c) => `لا اسم له في القاعدة؛ الرمز العام: ${c}`,
    openOff: `فتح في ${OFF}`,
    bcTitle: 'الفحص بالرمز الشريطي',
    bcLead: `أدخل الرمز الشريطي للمنتج (من 8 إلى 14 رقمًا). تُجلب المكوّنات ورموز E وعلامة الحلال من ${OFF}.`,
    bcLabel: 'الرمز الشريطي', bcPh: 'مثل: 6281000000000', check: 'افحص', scan: 'المسح بالكاميرا', stop: 'إغلاق الكاميرا',
    scanHint: 'ضع الرمز الشريطي داخل الإطار.', scanErr: 'تعذّر فتح الكاميرا. تحقّق من الإذن أو اكتب الرمز يدويًا.',
    checkDigit: 'رقم التحقق غير مطابق — ربما كُتب الرمز خطأً.',
    err: {
      invalid: 'الرمز الشريطي من 8 إلى 14 رقمًا.',
      notfound: `هذا الرمز غير موجود في قاعدة ${OFF}. وهذا لا يدل على شيء في المنتج نفسه — لم يُضف بعدُ فحسب.`,
      offline: 'لا يوجد اتصال بالإنترنت. تحقّق من الاتصال وأعد المحاولة.',
      timeout: 'لم يستجب الخادم في الوقت المحدد. أعد المحاولة بعد قليل.',
      http: 'خطأ في الخادم. أعد المحاولة بعد قليل.',
    },
    crowd: `هذه البيانات يضيفها مستخدمو ${OFF}، فقد تكون ناقصة أو قديمة أو خاطئة. اقرأ المكوّنات على العبوة بنفسك دائمًا.`,
    product: 'المنتج', brands: 'العلامة التجارية', ingredients: 'المكوّنات (بلغة العبوة)', noIngr: 'لم تُدخل المكوّنات في القاعدة.',
    additives: 'رموز E المكتشفة', noAdd: `لم يذكر ${OFF} رموز E لهذا المنتج (وهذا لا يعني عدم وجودها).`,
    analysis: `تحليل ${OFF}`, labels: 'علامة الحلال',
    halalYes: 'سُجّلت علامة حلال على العبوة:', halalNo: 'لم تُسجَّل علامة حلال في القاعدة. وهذا لا يعني أن المنتج حرام.',
    an: {
      vegan: { yes: 'نباتي صرف', no: 'ليس نباتيًا صرفًا', maybe: 'قد يكون نباتيًا صرفًا', unknown: 'حالته النباتية الصرفة غير معروفة' },
      vegetarian: { yes: 'نباتي', no: 'ليس نباتيًا', maybe: 'قد يكون نباتيًا', unknown: 'حالته النباتية غير معروفة' },
      palm: { free: 'خالٍ من زيت النخيل', contains: 'يحتوي على زيت النخيل', maybe: 'قد يحتوي على زيت النخيل', unknown: 'زيت النخيل غير معروف' },
    },
    fiqhTitle: 'البيان الفقهي', fiqhLead: 'قواعد وأدلة لا حكم على كل مضاف. كل فتوى مذكورة فُتحت وقُرئت في مصدرها؛ وللنص الكامل انظر الروابط.',
    srcTitle: 'المصادر والترخيص', translation: 'الترجمة', ourTr: '', ref: 'المصدر',
    srcData: (d) => `قاعدة رموز E: تصنيف المضافات في ${OFF}، حقوق المساهمين في ${OFF}، بترخيص ${ODBL} (والمحتويات المفردة: ${DBCL}). تاريخ البناء: ${d}. ويُستعمل ${WD} (CC0) لدليل الحشرات فقط.`,
    srcProduct: `بيانات المنتجات: ${OFF} — ${ODBL}.`,
    srcQuran: 'نص القرآن: quran.com (الرسم العثماني).',
    srcHadith: `نصوص الأحاديث مقابلة على نشرة ${HADITH_API}.`,
  },
  tr: {
    how: 'Bir E-kodu yazın veya içindekiler listesini yapıştırın — her katkı maddesinin kaynak grubu (bitkisel, hayvansal, böcek…) görünür. Bu bir hüküm değil, bilgidir.',
    statCodes: 'E-kodu veri tabanında', statNone: 'hayvansal kaynaklı değil', statCheck: 'kaynağı sorulmalı',
    ovTitle: 'Veri tabanında ne var?', ovSub: 'kaynak grubuna göre E-kodu sayısı',
    clsTitle: 'Katkı maddeleri ne işe yarar?', clsSub: 'en sık görülen 8 işlev — bir katkının birden fazla işlevi olabilir',
    stepsTitle: 'Bir ürün nasıl kontrol edilir?', stepsLead: 'Dört adım — etiketten sonuca kadar.',
    steps: [
      ['İçindekileri okuyun', 'Ambalajdaki içindekiler listesinde E-kodlarını veya katkı adlarını bulun.'],
      ['Burada kontrol edin', 'Kodları veya içindekiler listesinin tamamını “E-kodu sorgulama” alanına yapıştırın ya da barkodu yazın.'],
      ['Kaynağa bakın', '“Hayvansal kaynaklı” veya “olabilir” grubundaki bir katkının kaynağını üretici firmaya sorun ya da helal sertifikasına bakın.'],
      ['Delili okuyun', 'İstihale, jelatin, alkol ve şüpheli şeylerle ilgili kurallar “Fıkhi açıklama” bölümündedir.'],
    ],
    eyebrow: 'Helal gıda', title: 'Helal gıda kontrolü',
    lead: 'E-kodlarını (gıda katkı maddelerini) ve ürün barkodunu kontrol edin: katkının kaynağına dair açık veri, içindekiler ve delilleriyle fıkhî açıklama.',
    jump: { codes: 'E-kodları', barcode: 'Barkod', fiqh: 'Fıkhî açıklama', sources: 'Kaynaklar' },
    discTitle: 'Bu bir helal sertifikası değildir',
    disc: `Bu sayfa hiçbir ürün veya katkı maddesi için helal/haram hükmü vermez. Gruplar yalnızca ${OFF} veri tabanındaki kaynak bilgilerinden oluşturulmuştur; bu veriler hatalı veya eksik olabilir ve aynı E-kodu farklı üreticilerde farklı kaynaktan elde edilebilir. Karar için helal sertifika kuruluşlarına, üreticiye ve âlimlere başvurun.`,
    codesTitle: 'E-kodu sorgulama',
    codesLead: (n) => `${OFF} sınıflandırmasından ${n} katkı maddesi. Kodu (E120, e-471, 330) veya adı yazın; içindekiler listesini de yapıştırabilirsiniz.`,
    codesLabel: 'E-kodu, ad veya içindekiler', codesPh: 'örn. E471, E120, jelatin', clear: 'Temizle',
    browse: 'Gruba göre göz at', all: 'Tümü', found: (n) => `Bulunan: ${n}`, none: 'Bir şey bulunamadı.',
    notInData: (c) => `${c} veri tabanında yok.`, parent: (req, c) => `${req} için ayrı kayıt yok — genel kod ${c} gösteriliyor.`,
    more: (n) => `Daha fazla göster (${n} kaldı)`,
    loading: 'Yükleniyor…', loadError: 'Veriler yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar dene',
    fields: 'Kaynak alanları', vegan: `${OFF}: vegan`, vegetarian: `${OFF}: vejetaryen`,
    inherited: (c) => `Bu kodun kendi durumu yok — ${OFF} içindeki üst kod ${c} üzerinden alındı`,
    palm: `${OFF}: palm yağından`, desc: `${OFF} açıklaması (İngilizce)`, cls: 'İşlevi',
    insectWd: `${WD}: açıklama`, insectTaxon: `${WD}: doğal ürünü olduğu takson`,
    val: { yes: 'evet', no: 'hayır', maybe: 'olabilir', null: 'belirtilmemiş' },
    nameEn: 'Bu dilde ad veri tabanında yok — İngilizcesi gösteriliyor', noName: (c) => `Veri tabanında adı yok; genel kod: ${c}`,
    openOff: `${OFF} üzerinde aç`,
    bcTitle: 'Barkodla kontrol',
    bcLead: `Ürün barkodunu girin (8–14 rakam). İçindekiler, E-kodları ve helal etiketi ${OFF} üzerinden getirilir.`,
    bcLabel: 'Barkod', bcPh: 'örn. 8690000000000', check: 'Kontrol et', scan: 'Kamerayla tara', stop: 'Kamerayı kapat',
    scanHint: 'Barkodu çerçevenin içine tutun.', scanErr: 'Kamera açılamadı. İzni kontrol edin veya kodu elle yazın.',
    checkDigit: 'Kontrol hanesi uyuşmuyor — kod yanlış yazılmış olabilir.',
    err: {
      invalid: 'Barkod 8–14 rakamdan oluşur.',
      notfound: `Bu barkod ${OFF} veri tabanında bulunamadı. Bu, ürün hakkında bir şey söylemez — yalnızca henüz eklenmemiştir.`,
      offline: 'İnternet bağlantısı yok. Bağlantınızı kontrol edip tekrar deneyin.',
      timeout: 'Sunucu zamanında yanıt vermedi. Biraz sonra tekrar deneyin.',
      http: 'Sunucu hatası. Biraz sonra tekrar deneyin.',
    },
    crowd: `Bu veriler ${OFF} kullanıcıları tarafından eklenmiştir — eksik, eski veya hatalı olabilir. Ambalajdaki içindekiler listesini mutlaka kendiniz de okuyun.`,
    product: 'Ürün', brands: 'Marka', ingredients: 'İçindekiler (ambalajdaki dilde)', noIngr: 'İçindekiler veri tabanına girilmemiş.',
    additives: 'Bulunan E-kodları', noAdd: `${OFF} bu üründe E-kodu belirtmemiş (bu, olmadığı anlamına gelmez).`,
    analysis: `${OFF} analizi`, labels: 'Helal etiketi',
    halalYes: 'Ambalajda helal etiketi kayıtlı:', halalNo: 'Veri tabanında helal etiketi kayıtlı değil. Bu, ürünün haram olduğu anlamına gelmez.',
    an: {
      vegan: { yes: 'Vegan', no: 'Vegan değil', maybe: 'Vegan olabilir', unknown: 'Vegan durumu bilinmiyor' },
      vegetarian: { yes: 'Vejetaryen', no: 'Vejetaryen değil', maybe: 'Vejetaryen olabilir', unknown: 'Vejetaryen durumu bilinmiyor' },
      palm: { free: 'Palm yağı yok', contains: 'Palm yağı içerir', maybe: 'Palm yağı içerebilir', unknown: 'Palm yağı bilinmiyor' },
    },
    fiqhTitle: 'Fıkhî açıklama', fiqhLead: 'Her katkı için ayrı hüküm değil, ilkeler ve deliller. Aktarılan her fetva kaynağında açılıp okunmuştur; tam metin için bağlantılara bakın.',
    srcTitle: 'Kaynaklar ve lisans', translation: 'Meal', ourTr: '', ref: 'Kaynak',
    srcData: (d) => `E-kodu veri tabanı: ${OFF} katkı maddeleri sınıflandırması, © ${OFF} katkıcıları, ${ODBL} lisansı (tekil içerik: ${DBCL}). Derleme tarihi: ${d}. ${WD} (CC0) yalnızca böcek kaynağı kanıtı için kullanıldı.`,
    srcProduct: `Ürün verisi: ${OFF} API — ${ODBL}.`,
    srcQuran: 'Kur’an metni: quran.com (Osmanlı hattı); meal: Diyanet İşleri Başkanlığı.',
    srcHadith: `Hadis metinleri ${HADITH_API} neşrine göre kontrol edildi.`,
  },
}

/** Qruplar — yalnız mənşə barədə; hökm deyil. */
const CAT = {
  az: {
    insect: ['Həşərat mənşəli', `Mənbə məlumatı onu həşəratla əlaqələndirir (${OFF} mətni və ya ${WD} taksonu).`],
    // lang-ok[vegetarian]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
    animal: ['Heyvan mənşəli', `${OFF}: vegan və ya vegetarian deyil.`],
    alcohol: ['Spirtlə bağlı', `${OFF} adı etanoldur və ya təsviri mənşəyini şərabçılıq kimi göstərir.`],
    // lang-ok[vegetarian]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
    maybe: ['Heyvan mənşəli ola bilər — mənbəni yoxlayın', `${OFF}: vegan / vegetarian statusu «ola bilər». Bitki və ya heyvan mənşəli ola bilər.`],
    // lang-ok[mineral,vegetarian]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
    none: ['Heyvan mənşəli deyil (bitki, mineral, sintetik)', `${OFF}: həm vegan, həm vegetarian.`],
    unknown: ['Naməlum', `${OFF}-da mənşə statusu göstərilməyib.`],
  },
  en: {
    insect: ['Insect-derived', `Source data links it to an insect (${OFF} text or a ${WD} taxon).`],
    animal: ['Animal origin', `${OFF}: not vegan or not vegetarian.`],
    alcohol: ['Alcohol-related', `The ${OFF} name is ethanol, or its description gives winemaking as the origin.`],
    maybe: ['May be of animal origin — check the source', `${OFF}: vegan / vegetarian status is "maybe". It may come from plants or animals.`],
    none: ['No animal origin (plant, mineral, synthetic)', `${OFF}: both vegan and vegetarian.`],
    unknown: ['Unknown', `${OFF} gives no origin status.`],
  },
  ru: {
    insect: ['Из насекомых', `Данные источника связывают её с насекомыми (текст ${OFF} или таксон ${WD}).`],
    animal: ['Животного происхождения', `${OFF}: не веганская или не вегетарианская.`],
    alcohol: ['Связана со спиртом', `Название в ${OFF} — этанол, или в описании происхождение указано как виноделие.`],
    maybe: ['Может быть животного происхождения — уточните источник', `${OFF}: статус «возможно». Может быть растительного или животного происхождения.`],
    none: ['Не животного происхождения (растительная, минеральная, синтетическая)', `${OFF}: и веганская, и вегетарианская.`],
    unknown: ['Неизвестно', `${OFF} не указывает происхождение.`],
  },
  ar: {
    insect: ['من أصل حشري', `تربطه بيانات المصدر بالحشرات (نص ${OFF} أو تصنيف ${WD}).`],
    animal: ['من أصل حيواني', `${OFF}: ليس نباتيًا صرفًا أو ليس نباتيًا.`],
    alcohol: ['متعلّق بالكحول', `اسمه في ${OFF} الإيثانول، أو يذكر وصفه أن أصله من صناعة النبيذ.`],
    maybe: ['قد يكون من أصل حيواني — تحقّق من المصدر', `${OFF}: الحالة «محتمل»؛ قد يكون نباتي الأصل أو حيوانيّه.`],
    none: ['ليس من أصل حيواني (نباتي، معدني، صناعي)', `${OFF}: نباتي صرف ونباتي معًا.`],
    unknown: ['غير معروف', `لا يذكر ${OFF} حالة الأصل.`],
  },
  tr: {
    insect: ['Böcek kaynaklı', `Kaynak verisi onu böcekle ilişkilendiriyor (${OFF} metni veya ${WD} taksonu).`],
    animal: ['Hayvansal kaynaklı', `${OFF}: vegan veya vejetaryen değil.`],
    alcohol: ['Alkolle ilgili', `${OFF} adı etanol ya da açıklaması kaynağını şarapçılık olarak gösteriyor.`],
    maybe: ['Hayvansal kaynaklı olabilir — kaynağı sorun', `${OFF}: vegan / vejetaryen durumu “olabilir”. Bitkisel veya hayvansal olabilir.`],
    none: ['Hayvansal kaynaklı değil (bitkisel, mineral, sentetik)', `${OFF}: hem vegan hem vejetaryen.`],
    unknown: ['Bilinmiyor', `${OFF} kaynak durumunu belirtmiyor.`],
  },
}

/** Funksiya sinifləri (OFF additives_classes id → ad). Yoxdursa OFF adı, o da yoxdursa ingiliscə. */
const CLASS_LABELS = {
  // lang-ok[konservant]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
  az: { acid: 'turşu', 'acidity-regulator': 'turşuluq tənzimləyicisi', 'anti-caking-agent': 'topalanmanı önləyən', 'anti-foaming-agent': 'köpüyü söndürən', antioxidant: 'antioksidant', carrier: 'daşıyıcı', coagulant: 'laxtalandırıcı', colour: 'boyaq', 'colour-retention-agent': 'rəngi saxlayan', emulsifier: 'emulqator', 'firming-agent': 'bərkidici', 'flavour-enhancer': 'dad gücləndirici', 'flour-treatment-agent': 'un yaxşılaşdırıcı', 'glazing-agent': 'parıldadıcı örtük', humectant: 'nəmliyi saxlayan', preservative: 'konservant', 'propellent-gas': 'qovucu qaz', 'raising-agent': 'qabardıcı', sequestrant: 'metal bağlayıcı', stabiliser: 'stabilizator', sweetener: 'şirinləşdirici', thickener: 'qatılaşdırıcı' },
  en: { acid: 'acid', 'acidity-regulator': 'acidity regulator', 'anti-caking-agent': 'anti-caking agent', 'anti-foaming-agent': 'anti-foaming agent', antioxidant: 'antioxidant', carrier: 'carrier', coagulant: 'coagulant', colour: 'colour', 'colour-retention-agent': 'colour retention agent', emulsifier: 'emulsifier', 'firming-agent': 'firming agent', 'flavour-enhancer': 'flavour enhancer', 'flour-treatment-agent': 'flour treatment agent', 'glazing-agent': 'glazing agent', humectant: 'humectant', preservative: 'preservative', 'propellent-gas': 'propellant gas', 'raising-agent': 'raising agent', sequestrant: 'sequestrant', stabiliser: 'stabiliser', sweetener: 'sweetener', thickener: 'thickener' },
  ru: { acid: 'кислота', 'acidity-regulator': 'регулятор кислотности', 'anti-caking-agent': 'антислёживатель', 'anti-foaming-agent': 'пеногаситель', antioxidant: 'антиоксидант', carrier: 'носитель', coagulant: 'коагулянт', colour: 'краситель', 'colour-retention-agent': 'фиксатор окраски', emulsifier: 'эмульгатор', 'firming-agent': 'уплотнитель', 'flavour-enhancer': 'усилитель вкуса', 'flour-treatment-agent': 'улучшитель муки', 'glazing-agent': 'глазирователь', humectant: 'влагоудерживающий агент', preservative: 'консервант', 'propellent-gas': 'газ-пропеллент', 'raising-agent': 'разрыхлитель', sequestrant: 'комплексообразователь', stabiliser: 'стабилизатор', sweetener: 'подсластитель', thickener: 'загуститель' },
  ar: { acid: 'حمض', 'acidity-regulator': 'منظّم حموضة', 'anti-caking-agent': 'مانع تكتّل', 'anti-foaming-agent': 'مانع رغوة', antioxidant: 'مضاد أكسدة', carrier: 'مادة حاملة', coagulant: 'مخثّر', colour: 'ملوّن', 'colour-retention-agent': 'مثبّت لون', emulsifier: 'مستحلب', 'firming-agent': 'عامل تصليب', 'flavour-enhancer': 'محسّن نكهة', 'flour-treatment-agent': 'محسّن دقيق', 'glazing-agent': 'عامل تلميع', humectant: 'مرطّب', preservative: 'مادة حافظة', 'propellent-gas': 'غاز دافع', 'raising-agent': 'عامل رفع', sequestrant: 'عامل عزل', stabiliser: 'مثبّت', sweetener: 'محلٍّ', thickener: 'مكثّف' },
  tr: { acid: 'asit', 'acidity-regulator': 'asitlik düzenleyici', 'anti-caking-agent': 'topaklanmayı önleyici', 'anti-foaming-agent': 'köpük önleyici', antioxidant: 'antioksidan', carrier: 'taşıyıcı', coagulant: 'pıhtılaştırıcı', colour: 'renklendirici', 'colour-retention-agent': 'renk koruyucu', emulsifier: 'emülgatör', 'firming-agent': 'sertleştirici', 'flavour-enhancer': 'lezzet artırıcı', 'flour-treatment-agent': 'un işlem maddesi', 'glazing-agent': 'parlatıcı', humectant: 'nem tutucu', preservative: 'koruyucu', 'propellent-gas': 'itici gaz', 'raising-agent': 'kabartıcı', sequestrant: 'sekestran', stabiliser: 'stabilizör', sweetener: 'tatlandırıcı', thickener: 'kıvam artırıcı' },
}

// ── Dəlillər: mətnlər mənbədən yoxlanılıb (quran.com, alquran.cloud, hadith-api) ──
const AYAH = {
  '2:29': {
    ar: 'هُوَ ٱلَّذِى خَلَقَ لَكُم مَّا فِى ٱلْأَرْضِ جَمِيعًا ثُمَّ ٱسْتَوَىٰٓ إِلَى ٱلسَّمَآءِ فَسَوَّىٰهُنَّ سَبْعَ سَمَـٰوَٰتٍ ۚ وَهُوَ بِكُلِّ شَىْءٍ عَلِيمٌ',
    az: 'Yer üzündə nə varsa, hamısını sizin üçün yaradan, sonra səmaya üz tutaraq onu yeddi qat göy halında düzəldib nizama salan Odur (Allahdır)! O, hər şeyi biləndir!',
    en: 'It is He who created for you all of that which is on the earth. Then He directed Himself to the heaven, [His being above all creation], and made them seven heavens, and He is Knowing of all things.',
    ru: 'Он - Тот, Кто сотворил для вас все, что на земле, а затем обратился к небу и сделал его семью небесами. Ему известно о всякой вещи.',
    tr: 'Yerde olanların hepsini; sizin için yaratan O\'dur. Sonra, göğe doğru yönelerek yedi gök olarak onları düzenlemiştir. O her şeyi bilir.', // lang-ok: Diyanet meali olduğu kimi (apostrof mənbədədir)
  },
  '2:173': {
    ar: 'إِنَّمَا حَرَّمَ عَلَيْكُمُ ٱلْمَيْتَةَ وَٱلدَّمَ وَلَحْمَ ٱلْخِنزِيرِ وَمَآ أُهِلَّ بِهِۦ لِغَيْرِ ٱللَّهِ ۖ فَمَنِ ٱضْطُرَّ غَيْرَ بَاغٍ وَلَا عَادٍ فَلَآ إِثْمَ عَلَيْهِ ۚ إِنَّ ٱللَّهَ غَفُورٌ رَّحِيمٌ',
    az: 'O (Allah) sizə ölmüş heyvanı, (axar) qanı, donuz ətini və Allahdan başqasının adı ilə (bütlərin və s. adı ilə) kəsilənləri (yeməyi) qəti haram etmişdir. Lakin naəlac qaldıqda (başqasının malını) zorla mənimsəmədən və həddi aşmadan (zəruri ehtiyacı ödəyənə qədər) bunlardan yeməyə məcbur olan kimsənin heç bir günahı yoxdur. Allah bağışlayandır, mərhəmətlidir!',
    en: 'He has only forbidden to you dead animals, blood, the flesh of swine, and that which has been dedicated to other than Allah. But whoever is forced [by necessity], neither desiring [it] nor transgressing [its limit], there is no sin upon him. Indeed, Allah is Forgiving and Merciful.',
    ru: 'Он запретил вам мертвечину, кровь, мясо свиньи и то, что принесено в жертву не ради Аллаха. Если же кто-либо вынужден пойти на это, не домогаясь запретного, не проявляя ослушания и не преступая пределы необходимого, то нет на нем греха. Воистину, Аллах - Прощающий, Милосердный.',
    tr: 'Şüphesiz size ölü hayvan etini, kanı, domuz etini, Allah\'tan başkası için kesilen hayvanı haram kılmıştır; fakat, darda kalana, başkasının payına el uzatmamak ve zaruret miktarını aşmamak üzere günah sayılmaz. Çünkü Allah bağışlayandır, merhamet edendir.', // lang-ok: Diyanet meali olduğu kimi (apostrof mənbədədir)
  },
}

// Səhih əl-Buxari 52 = Səhih Muslim 1599 (Fuad Abdulbaqi nömrəsi) — Nüman ibn Bəşir
const HADITH = {
  ar: 'الْحَلاَلُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ، وَبَيْنَهُمَا مُشَبَّهَاتٌ لاَ يَعْلَمُهَا كَثِيرٌ مِنَ النَّاسِ، فَمَنِ اتَّقَى الْمُشَبَّهَاتِ اسْتَبْرَأَ لِدِيِنِهِ وَعِرْضِهِ، وَمَنْ وَقَعَ فِي الشُّبُهَاتِ كَرَاعٍ يَرْعَى حَوْلَ الْحِمَى، يُوشِكُ أَنْ يُوَاقِعَهُ…',
  az: 'Halal aydındır, haram da aydındır. Onların arasında isə insanların çoxunun bilmədiyi şübhəli şeylər var. Kim şübhəli şeylərdən çəkinərsə, dinini və şərəfini qorumuş olar. Kim şübhəli şeylərə düşərsə, qoruğun ətrafında heyvan otaran çobana bənzəyər — az qalır ki, ora girsin…',
  en: 'Both legal and illegal things are evident but in between them there are doubtful (suspicious) things and most of the people have no knowledge about them. So whoever saves himself from these suspicious things saves his religion and his honor. And whoever indulges in these suspicious things is like a shepherd who grazes (his animals) near the Hima (private pasture) of someone else and at any moment he is liable to get in it…',
  ru: 'Дозволенное очевидно, и запретное очевидно, а между тем и другим находится сомнительное, о котором многие люди не знают. Остерегающийся сомнительного очищает свою религию и свою честь, а тот, кто занимается сомнительным, подобен пастуху, который пасёт (своё стадо) около заповедного места и вот-вот окажется там…',
  tr: 'Helal de bellidir, haram da. Bu ikisi arasında insanlardan çoğunun bilmediği şüpheli şeyler vardır. Kim şüphelilerden korunursa dini ve ırzını (şahsiyetini) korumuş olur. Kim de şüpheli şeylere düşerse harama düşer. Bu kişi bir koruluğun etrafında koyun güden ve koyunların her an koruluğa girme ihtimali bulunan bir çoban gibidir…',
}

// Açılıb oxunmuş fətvalar (başlıq mənbədəki kimi — dildən asılı deyil)
const SRC = {
  bb3804: { url: 'https://binbaz.org.sa/fatwas/3804', label: `${BBZ} · 3804 — حكم الأجبان المعلّبة المستوردة` },
  bb19486: { url: 'https://binbaz.org.sa/fatwas/19486', label: `${BBZ} · 19486 — حكم شحم الخنزير` },
  bbRawd: { url: 'https://binbaz.org.sa/audios/1868', label: `${BBZ} · شرح الروض المربع — كتاب الطهارة (09)` },
  iq385517: { url: 'https://islamqa.info/ar/answers/385517', label: `${IQA} · 385517 — ما مفهوم الاستحالة المطهرة؟` },
  iq97541: { url: 'https://islamqa.info/en/answers/97541', label: `${IQA} · 97541 — Ruling on using materials to which “animal glycerine” has been added` },
  iq114129: { url: 'https://islamqa.info/en/answers/114129', label: `${IQA} · 114129 — Ruling on using foods which contain pork-derived substances` },
  iq219137: { url: 'https://islamqa.info/en/answers/219137', label: `${IQA} · 219137 — Is Gelatin Halal?` },
  iq59899: { url: 'https://islamqa.info/en/answers/59899', label: `${IQA} · 59899 — Is Alcohol in Food and Cosmetics Haram?` },
}

// Ərəb sitatlar — mənbə səhifəsindən olduğu kimi
const AR_Q = {
  asl: 'والأصل السلامة والعافية، إلا بعد ثبوت شيءٍ بيقينٍ',
  shahm: 'أن الذي عليه الأئمة الأربعة وعامة أهل العلم هو: تحريم شحمه تبعًا للحمه',
  istihala: 'الاستحالة مطهرة مبيحة، عند جمهور الحنفية، والمالكية، وجماعة من أهل العلم كابن تيمية وابن القيم',
  rawd: '(ولا) يطهر متنجس بـ(استحالة)',
  bazWater: 'الأصل لا بدَّ من الماء، هذا هو الأصل',
}

// Sitat → mənbə (identifikator kimi — dil yoxlayıcısı bunları mətn saymır)
const Q = {
  asl: { ar: AR_Q.asl, src: SRC.bb3804 },
  shahm: { ar: AR_Q.shahm, src: SRC.bb19486 },
  istihala: { ar: AR_Q.istihala, src: SRC.iq385517 },
  rawd: { ar: AR_Q.rawd, src: SRC.bbRawd },
  bazWater: { ar: AR_Q.bazWater, src: SRC.bbRawd },
}
const FIQH_KEYS = ['asl', 'pork', 'istihala', 'gelatin', 'alcohol', 'doubt']

/**
 * Fiqh bölmələri. Hər bölmə: başlıq, paraqraflar; blok növləri:
 *  { p } — mətn (və ya say funksiyası), { ayah } — ayə, { hadith } — hədis,
 *  { q, mean } — fətvadan ərəbcə sitat (Q) + mənası. Bölmə açarları — FIQH_KEYS (eyni sıra).
 */
const FIQH = {
  az: [
    { title: 'Əsl hökm — halallıq', blocks: [
      { p: 'Yeyilən şeylərdə əsl hökm halallıqdır — haram olduğu dəlil ilə sabit olmayınca. Allah buyurur:' },
      { ayah: AYAH['2:29'] },
      { p: 'Şeyx İbn Baz tərkibində donuz piyi olduğu deyilən idxal pendirləri barədə sualda belə cavab verib:' },
      { q: Q.asl, mean: 'Əsl olan salamatlıq və sağlamlıqdır; yalnız bir şey yəqinliklə sübut olunarsa, başqa.' },
      { p: (c) => `Yəni tərkibdə yalnız "E" nömrəsinin olması məhsulu haram etmir. Bu bazada ${c.total} koddan ${c.none}-i ${OFF} məlumatına görə heyvan mənşəli deyil.` },
    ] },
    { title: 'Donuz və ondan alınanlar haramdır', blocks: [
      { ayah: AYAH['2:173'] },
      { p: 'Şeyx İbn Baz donuz piyi barədə fətvasında qeyd edir ki, dörd imam və alimlərin əksəriyyəti onun piyini də ətinə tabe olaraq haram sayır:' },
      { q: Q.shahm, mean: 'Dörd imamın və alimlərin ümumiyyətlə tutduğu yol budur: onun piyi ətinə tabe olaraq haramdır.' },
      { p: 'Donuzdan alınıb sonra kimyəvi emaldan keçən maddələrin hökmü isə "istihalə" məsələsinə bağlıdır.' },
    ] },
    { title: 'İstihalə — maddənin tam çevrilməsi', blocks: [
      { p: 'İstihalə — maddənin adı və xassələri tamam başqa olan yeni maddəyə çevrilməsidir. Alimlərin bu barədə iki görüşü var.' },
      { p: `1) Tam istihalə maddəni pak və mübah edir. ${IQA} (№385517) bunu Hənəfilərin əksəriyyətinin, Malikilərin, həmçinin İbn Teymiyyə və İbn əl-Qəyyimin görüşü kimi göstərir (əl-Mövsuə əl-Fiqhiyyə 10/278; Məcmu əl-Fətava 21/611):` },
      { q: Q.istihala, mean: 'İstihalə pak edən və mübah edəndir — Hənəfilərin əksəriyyətinə, Malikilərə və İbn Teymiyyə, İbn əl-Qəyyim kimi bir qrup alimə görə.' },
      { p: `İbn əl-Qəyyim: «Şeyin mənşəyi deyil, indi nə olduğu əsasdır» (İ‘lamul-Muvaqqiin 2/14–15; ${IQA} №97541).` },
      { p: '2) İstihalə nəcisi pak etmir (öz-özünə sirkəyə çevrilən şərab istisnadır). Hənbəli mətni "ər-Rövd əl-Murbi"də belə deyilir; Şeyx İbn Baz bu mətnin şərhində suala cavab olaraq: «Əsl odur ki, su mütləqdir».' },
      { q: Q.rawd, mean: 'Nəcislənmiş şey istihalə ilə pak olmur.' },
      { q: Q.bazWater, mean: 'Əsl budur ki, su mütləq lazımdır — əsl budur.' },
      { p: `${IQA} (№114129) Daimi Fətva Komitəsinin də bu görüşdə olduğunu nəql edir: qadağa aradan qalxmır, hökm dəyişmir.` },
      // lang-ok[konkret]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
      { p: 'Mübahisə çox vaxt konkret sənaye prosesinin tam istihalə olub-olmamasındadır. Bu səhifə bunu hər əlavə üçün ayrıca həll etmir.' },
    ] },
    { title: 'Jelatin məsələsi', blocks: [
      { p: `Bu bazada jelatin (${E428}) ${OFF} məlumatına görə heyvan mənşəlidir, lakin hansı heyvandan alındığı göstərilmir. ${IQA} (№219137) cavabına görə:` },
      { p: '• Şəri qaydada kəsilmiş halal heyvanlardan alınan jelatin icazəlidir.' },
      { p: '• Donuz dərisindən alınan jelatində çevrilmə tam deyil, qismən olur; ona görə belə jelatin olan qida, içki və dərmanlar icazəli deyil (cavab Daimi Komitənin fətvalarına (22/260) və fiqh məclislərinin qərarlarına istinad edir).' },
      { p: '• Bəzi tədqiqatçılar və İslam Tibb Elmləri Təşkilatı isə onu pak sayıb — yəni məsələdə ixtilaf var.' },
      // lang-ok[istehsalçıdan]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
      { p: 'Mənbəyi bilinməyən jelatin üçün istehsalçıdan soruşun və ya etibarlı halal sertifikatına baxın.' },
    ] },
    { title: 'Həlledici kimi az miqdarda spirt', blocks: [
      { p: `Bəzi aromatizator və boyaqlar az miqdarda spirtdə həll edilir. ${IQA} (№59899) Şeyx İbn Useymindən («Fətava Nurun ‘alə-d-Dərb») nəql edir: spirt qarışdığı şeydə həll olub izi görünmürsə, o şey haram olmur. Onun qaydası: «Hər şey təsirin olub-olmamasından asılıdır».` },
      { p: `Bu bazada ${E1510} (etanol) ${OFF} adına görə "spirtlə bağlı" qrupdadır. Məhsulda onun miqdarı və təsiri barədə ${OFF} məlumat vermir.` },
    ] },
    { title: 'Şübhəli şeylər və vərə‘', blocks: [
      { hadith: true },
      { p: `Bu hədisdə iki şey birləşir: əsl hökm halallıqdır, şübhəlidən çəkinmək isə dini qorumaq və təqvadır (vərə‘). ${IQA} (№114129) tövsiyə edir: bir şeydən əmin deyilsə, onu tərk etsin; keçmişdə bilmədən yeyilən üçün isə heç nə lazım deyil — gələcəkdə diqqətli olmaq kifayətdir.` },
      // lang-ok[istehsalçıdan]: az dilinin öz sözləri (istehsalçı, vegetarian, kamera, mineral, konservant, konkret)
      { p: `"Heyvan mənşəli ola bilər" qrupu (məs. ${E471}) məhz bu sahəyə düşür: istehsalçıdan mənbəni soruşmaq və ya etibarlı halal sertifikatına baxmaq olar.` },
    ] },
  ],
  en: [
    { title: 'The default ruling is permissibility', blocks: [
      { p: 'The default ruling on food is that it is permissible unless evidence establishes that it is forbidden. Allah says:' },
      { ayah: AYAH['2:29'] },
      { p: 'Shaykh Ibn Baz, asked about imported cheeses said to contain pork fat, answered:' },
      { q: Q.asl, mean: 'The default is soundness and wellbeing, unless something is established with certainty.' },
      { p: (c) => `So an "E" number on its own does not make a product haram. Of the ${c.total} codes in this dataset, ${c.none} have no animal origin according to ${OFF}.` },
    ] },
    { title: 'Pork and its derivatives are forbidden', blocks: [
      { ayah: AYAH['2:173'] },
      { p: 'In his fatwa on pork fat, Shaykh Ibn Baz states that the four imams and scholars in general hold its fat forbidden, following its meat:' },
      { q: Q.shahm, mean: 'What the four imams and scholars in general hold is that its fat is forbidden, following its meat.' },
      { p: 'The ruling on substances taken from pigs and then chemically processed depends on the question of istihalah.' },
    ] },
    { title: 'Istihalah — complete transformation', blocks: [
      { p: 'Istihalah is the change of a substance into a new substance with a different name and different properties. The scholars hold two views on it.' },
      { p: `1) Complete transformation makes a substance pure and permissible. ${IQA} (no. 385517) gives this as the view of most Hanafis, the Malikis, and scholars such as Ibn Taymiyyah and Ibn al-Qayyim (al-Mawsu‘ah al-Fiqhiyyah 10/278; Majmu‘ al-Fatawa 21/611):` },
      { q: Q.istihala, mean: 'Istihalah purifies and makes permissible — according to most Hanafis, the Malikis and a group of scholars such as Ibn Taymiyyah and Ibn al-Qayyim.' },
      { p: `Ibn al-Qayyim: "It is not the origin of a thing that matters, but what it is now" (I‘lam al-Muwaqqi‘in 2/14–15; ${IQA} no. 97541).` },
      { p: '2) Transformation does not purify an impure thing (except wine that turns into vinegar by itself). This is stated in the Hanbali text al-Rawd al-Murbi‘; in his commentary on it, Shaykh Ibn Baz answered a question by saying that water is the principle.' },
      { q: Q.rawd, mean: 'An impure thing is not purified by transformation.' },
      { q: Q.bazWater, mean: 'The principle is that water is required — this is the principle.' },
      { p: `${IQA} (no. 114129) reports that the Standing Committee holds this view too: the prohibition is not lifted and the ruling does not change.` },
      { p: 'The dispute is often about whether a given industrial process is a complete transformation. This page does not settle that for each additive.' },
    ] },
    { title: 'The gelatin question', blocks: [
      { p: `In this dataset gelatine (${E428}) is of animal origin according to ${OFF}, but the animal is not stated. According to ${IQA} (no. 219137):` },
      { p: '• Gelatin from permissible animals slaughtered in the prescribed manner is permissible.' },
      { p: '• In gelatin from pig skin the transformation is partial, not complete, so foods, drinks and medicines containing it are not permissible (the answer cites the Standing Committee, 22/260, and fiqh council resolutions).' },
      { p: '• Some researchers and the Islamic Organization for Medical Sciences considered it pure — so the matter is disputed.' },
      { p: 'For gelatin of unknown source, ask the manufacturer or look for a reliable halal certification.' },
    ] },
    { title: 'Small amounts of alcohol used as a solvent', blocks: [
      { p: `Some flavourings and colours are dissolved in a little alcohol. ${IQA} (no. 59899) quotes Shaykh Ibn ‘Uthaymin (Fatawa Nur ‘ala al-Darb): if the alcohol is absorbed into what it is mixed with and no trace of it can be seen, that thing does not become haram. His rule: "Everything depends on whether it has an impact or not."` },
      { p: `In this dataset ${E1510} (ethanol) is in the "alcohol-related" group because of its ${OFF} name. ${OFF} gives no data on its amount or effect in a product.` },
    ] },
    { title: 'Doubtful matters and wara‘', blocks: [
      { hadith: true },
      { p: `This hadith brings two things together: the default is permissibility, and keeping away from what is doubtful protects one’s religion — this is wara‘ (scrupulous piety). ${IQA} (no. 114129) advises: if he is uncertain about something, he should leave it; nothing is required for what was eaten unknowingly in the past — only care in the future.` },
      { p: `The "may be of animal origin" group (e.g. ${E471}) falls exactly here: you can ask the manufacturer about the source or look for a reliable halal certification.` },
    ] },
  ],
  ru: [
    { title: 'Исходное правило — дозволенность', blocks: [
      { p: 'Исходное правило в отношении пищи — дозволенность, пока доводом не установлен запрет. Аллах говорит:' },
      { ayah: AYAH['2:29'] },
      { p: 'Шейх Ибн Баз, отвечая на вопрос об импортных сырах, в которых якобы есть свиной жир, сказал:' },
      { q: Q.asl, mean: 'Исходное — благополучие и безвредность, пока что-либо не будет установлено с уверенностью.' },
      { p: (c) => `То есть одно лишь наличие «Е»-номера не делает продукт харамом. Из ${c.total} кодов этой базы ${c.none} по данным ${OFF} не животного происхождения.` },
    ] },
    { title: 'Свинина и всё полученное из неё запретно', blocks: [
      { ayah: AYAH['2:173'] },
      { p: 'В фетве о свином жире шейх Ибн Баз указывает, что четыре имама и учёные в целом считают его жир запретным вслед за мясом:' },
      { q: Q.shahm, mean: 'Четыре имама и учёные в целом придерживаются того, что его жир запретен вслед за мясом.' },
      { p: 'Решение о веществах, полученных из свиньи и затем прошедших химическую обработку, зависит от вопроса истихаля.' },
    ] },
    { title: 'Истихаля — полное превращение вещества', blocks: [
      { p: 'Истихаля — превращение вещества в новое вещество с другим названием и другими свойствами. У учёных об этом два мнения.' },
      { p: `1) Полное превращение делает вещество чистым и дозволенным. Сайт ${IQA} (№ 385517) приводит это как мнение большинства ханафитов, маликитов, а также Ибн Таймии и Ибн аль-Каййима («аль-Маусу‘а аль-фикхийя» 10/278; «Маджму‘ аль-фатава» 21/611):` },
      { q: Q.istihala, mean: 'Истихаля очищает и делает дозволенным — по мнению большинства ханафитов, маликитов и ряда учёных, таких как Ибн Таймия и Ибн аль-Каййим.' },
      { p: `Ибн аль-Каййим: «Значение имеет не происхождение вещи, а то, чем она является сейчас» («И‘лям аль-мувакки‘ин» 2/14–15; ${IQA} № 97541).` },
      { p: '2) Превращение не очищает нечистое (кроме вина, которое само стало уксусом). Так сказано в ханбалитском тексте «ар-Рауд аль-мурби‘»; в его разъяснении шейх Ибн Баз, отвечая на вопрос, сказал, что основа — вода.' },
      { q: Q.rawd, mean: 'Осквернённое не очищается превращением.' },
      { q: Q.bazWater, mean: 'Основа в том, что вода обязательна, — это основа.' },
      { p: `${IQA} (№ 114129) передаёт, что такого же мнения Постоянный комитет: запрет не снимается и решение не меняется.` },
      { p: 'Спор часто касается того, является ли конкретный промышленный процесс полным превращением. Эта страница не решает его для каждой добавки.' },
    ] },
    { title: 'Вопрос желатина', blocks: [
      { p: `В этой базе желатин (${E428}) по данным ${OFF} животного происхождения, но животное не указано. Согласно ответу ${IQA} (№ 219137):` },
      { p: '• Желатин из дозволенных животных, забитых по шариату, дозволен.' },
      { p: '• В желатине из свиной кожи превращение частичное, а не полное, поэтому еда, напитки и лекарства с ним недозволены (ответ ссылается на фетвы Постоянного комитета, 22/260, и решения фикх-академий).' },
      { p: '• Некоторые исследователи и Исламская организация медицинских наук сочли его чистым — то есть в вопросе есть разногласие.' },
      { p: 'Если источник желатина неизвестен, спросите производителя или ищите надёжную халяль-сертификацию.' },
    ] },
    { title: 'Малое количество спирта как растворитель', blocks: [
      { p: `Некоторые ароматизаторы и красители растворяют в небольшом количестве спирта. ${IQA} (№ 59899) приводит слова шейха Ибн ‘Усаймина («Фатава нур ‘аля ад-дарб»): если спирт растворился в том, с чем смешан, и его след не виден, эта вещь не становится харамом. Его правило: «Всё зависит от того, есть ли воздействие или нет».` },
      { p: `В этой базе ${E1510} (этанол) — в группе «связана со спиртом» по названию в ${OFF}. О его количестве и воздействии в продукте ${OFF} данных не даёт.` },
    ] },
    { title: 'Сомнительное и благочестивая осторожность (вара‘)', blocks: [
      { hadith: true },
      { p: `В этом хадисе соединены две вещи: исходное правило — дозволенность, а остерегаться сомнительного — значит беречь свою религию; это вара‘. ${IQA} (№ 114129) советует: если человек не уверен в чём-то, пусть оставит это; за съеденное по незнанию в прошлом ничего не требуется — достаточно осторожности впредь.` },
      { p: `Группа «может быть животного происхождения» (напр. ${E471}) относится именно сюда: можно спросить производителя об источнике или искать надёжную халяль-сертификацию.` },
    ] },
  ],
  ar: [
    { title: 'الأصل في الأطعمة الحِلّ', blocks: [
      { p: 'الأصل في الأطعمة الإباحة حتى يقوم الدليل على التحريم. قال الله تعالى:' },
      { ayah: AYAH['2:29'] },
      { p: 'وسُئل الشيخ ابن باز عن الأجبان المستوردة التي قيل إن فيها شحم خنزير، فقال:' },
      { q: Q.asl },
      { p: (c) => `فمجرد وجود رمز E لا يجعل المنتج حرامًا. ومن ${c.total} رمزًا في هذه القاعدة، ${c.none} ليست من أصل حيواني بحسب ${OFF}.` },
    ] },
    { title: 'الخنزير وما يُستخرج منه حرام', blocks: [
      { ayah: AYAH['2:173'] },
      { p: 'وفي فتوى الشيخ ابن باز في شحم الخنزير:' },
      { q: Q.shahm },
      { p: 'وأما ما يُستخرج من الخنزير ثم يُعالَج كيميائيًا فحكمه مبني على مسألة الاستحالة.' },
    ] },
    { title: 'الاستحالة', blocks: [
      { p: 'الاستحالة: تحوّل العين إلى عين أخرى تخالفها في الاسم والصفات. وللعلماء فيها قولان.' },
      { p: 'القول الأول: الاستحالة التامة تطهّر وتبيح. ذكره موقع الإسلام سؤال وجواب (385517) قولًا لجمهور الحنفية والمالكية وابن تيمية وابن القيم (الموسوعة الفقهية 10/278، مجموع الفتاوى 21/611):' },
      { q: Q.istihala },
      { p: 'وقال ابن القيم ما معناه: العبرة بما صار إليه الشيء لا بأصله (إعلام الموقعين 2/14–15؛ الإسلام سؤال وجواب 97541).' },
      { p: 'القول الثاني: لا يطهر النجس بالاستحالة (إلا الخمرة إذا تخللت بنفسها). وهو نص «الروض المربع» في مذهب الحنابلة، وقال الشيخ ابن باز في شرحه جوابًا عن سؤال:' },
      { q: Q.rawd },
      { q: Q.bazWater },
      { p: 'ونقل موقع الإسلام سؤال وجواب (114129) أن هذا قول اللجنة الدائمة أيضًا: لا يرتفع التحريم ولا يتغيّر الحكم.' },
      { p: 'وكثيرًا ما يكون الخلاف في كون عملية صناعية بعينها استحالة تامة أم لا، ولا تفصل هذه الصفحة في ذلك لكل مضاف.' },
    ] },
    { title: 'مسألة الجيلاتين', blocks: [
      { p: `الجيلاتين (${E428}) في هذه القاعدة من أصل حيواني بحسب ${OFF}، ولا يُذكر الحيوان. وفي جواب الإسلام سؤال وجواب (219137):` },
      { p: '• الجيلاتين المستخرج من الحيوانات المباحة المذكاة ذكاة شرعية مباح.' },
      { p: '• الجيلاتين المستخرج من جلد الخنزير استحالته جزئية لا تامة، فلا يجوز تناول الأطعمة والأشربة والأدوية التي تحتويه (واستند الجواب إلى فتاوى اللجنة الدائمة 22/260 وقرارات المجامع الفقهية).' },
      { p: '• وعدّه بعض الباحثين والمنظمة الإسلامية للعلوم الطبية طاهرًا، فالمسألة خلافية.' },
      { p: 'فإن جُهل مصدر الجيلاتين فاسأل الشركة المصنّعة أو ابحث عن شهادة حلال موثوقة.' },
    ] },
    { title: 'الكحول اليسير المستعمل مذيبًا', blocks: [
      { p: 'تُذاب بعض المنكّهات والملوّنات في قليل من الكحول. ونقل موقع الإسلام سؤال وجواب (59899) عن الشيخ ابن عثيمين (فتاوى نور على الدرب) أن الكحول إذا استُهلك فيما خُلط به ولم يظهر له أثر لم يحرم ذلك الشيء، وأن المدار على وجود الأثر وعدمه.' },
      { p: `والرمز ${E1510} (الإيثانول) في هذه القاعدة ضمن مجموعة «متعلّق بالكحول» بحسب اسمه في ${OFF}، ولا يذكر ${OFF} مقداره ولا أثره في المنتج.` },
    ] },
    { title: 'المشتبهات والورع', blocks: [
      { hadith: true },
      { p: 'يجمع هذا الحديث أمرين: أن الأصل الحِلّ، وأن اتقاء المشتبهات استبراء للدين وهو الورع. وفي جواب الإسلام سؤال وجواب (114129): من شكّ في شيء فليتركه، ولا شيء عليه فيما أكله جاهلًا فيما مضى، وليحتط فيما يستقبل.' },
      { p: `ومجموعة «قد يكون من أصل حيواني» (مثل ${E471}) من هذا الباب: يمكن سؤال الشركة المصنّعة عن المصدر أو البحث عن شهادة حلال موثوقة.` },
    ] },
  ],
  tr: [
    { title: 'Asıl hüküm helalliktir', blocks: [
      { p: 'Yiyeceklerde asıl hüküm, haram olduğu delille sabit olmadıkça helalliktir. Allah buyurur:' },
      { ayah: AYAH['2:29'] },
      { p: 'Şeyh İbn Baz, içinde domuz yağı bulunduğu söylenen ithal peynirler hakkındaki soruya şöyle cevap vermiştir:' },
      { q: Q.asl, mean: 'Asıl olan selamet ve afiyettir; ancak bir şey kesin olarak sabit olursa başka.' },
      { p: (c) => `Yani içindekilerde sadece bir “E” numarasının bulunması ürünü haram yapmaz. Bu veri tabanındaki ${c.total} koddan ${c.none} tanesi ${OFF} verisine göre hayvansal kaynaklı değildir.` },
    ] },
    { title: 'Domuz ve ondan elde edilenler haramdır', blocks: [
      { ayah: AYAH['2:173'] },
      { p: 'Şeyh İbn Baz domuz yağı hakkındaki fetvasında dört imamın ve âlimlerin geneli tarafından yağının da etine tabi olarak haram sayıldığını belirtir:' },
      { q: Q.shahm, mean: 'Dört imamın ve âlimlerin genelinin görüşü, yağının etine tabi olarak haram olmasıdır.' },
      { p: 'Domuzdan elde edilip sonra kimyasal işlemden geçen maddelerin hükmü ise istihale meselesine bağlıdır.' },
    ] },
    { title: 'İstihale — maddenin tamamen dönüşmesi', blocks: [
      { p: 'İstihale, bir maddenin adı ve özellikleri farklı olan yeni bir maddeye dönüşmesidir. Âlimlerin bu konuda iki görüşü vardır.' },
      { p: `1) Tam istihale maddeyi temiz ve mubah kılar. ${IQA} (no. 385517) bunu Hanefîlerin çoğunluğunun, Mâlikîlerin ve İbn Teymiyye ile İbnü’l-Kayyim gibi âlimlerin görüşü olarak aktarır (el-Mevsûatü’l-Fıkhiyye 10/278; Mecmûu’l-Fetâvâ 21/611):` },
      { q: Q.istihala, mean: 'İstihale temizleyici ve mubah kılıcıdır — Hanefîlerin çoğunluğuna, Mâlikîlere ve İbn Teymiyye, İbnü’l-Kayyim gibi bir grup âlime göre.' },
      { p: `İbnü’l-Kayyim: “Önemli olan şeyin aslı değil, şu anki hâlidir” (İ‘lâmü’l-Muvakkıîn 2/14–15; ${IQA} no. 97541).` },
      { p: '2) İstihale necis olanı temizlemez (kendiliğinden sirkeye dönüşen şarap hariç). Hanbelî metni “er-Ravdu’l-Mürbi‘” böyle der; Şeyh İbn Baz bu metnin şerhinde bir soruya cevaben aslın su olduğunu söylemiştir.' },
      { q: Q.rawd, mean: 'Necis olan şey istihale ile temizlenmez.' },
      { q: Q.bazWater, mean: 'Asıl olan, suyun şart olmasıdır — asıl budur.' },
      { p: `${IQA} (no. 114129), Daimî Fetva Komitesinin de bu görüşte olduğunu aktarır: yasak kalkmaz, hüküm değişmez.` },
      { p: 'Tartışma çoğu zaman belirli bir sanayi işleminin tam istihale olup olmadığı üzerinedir. Bu sayfa bunu her katkı maddesi için ayrıca çözmez.' },
    ] },
    { title: 'Jelatin meselesi', blocks: [
      { p: `Bu veri tabanında jelatin (${E428}) ${OFF} verisine göre hayvansal kaynaklıdır, ancak hangi hayvandan elde edildiği belirtilmez. ${IQA} (no. 219137) cevabına göre:` },
      { p: '• Şer‘î usulle kesilmiş helal hayvanlardan elde edilen jelatin caizdir.' },
      { p: '• Domuz derisinden elde edilen jelatinde dönüşüm tam değil kısmidir; bu yüzden onu içeren yiyecek, içecek ve ilaçlar caiz değildir (cevap Daimî Komite fetvalarına, 22/260, ve fıkıh meclisi kararlarına dayanır).' },
      { p: '• Bazı araştırmacılar ve İslami Tıp Bilimleri Teşkilatı ise onu temiz saymıştır — yani meselede ihtilaf vardır.' },
      { p: 'Kaynağı bilinmeyen jelatin için üreticiye sorun veya güvenilir bir helal sertifikasına bakın.' },
    ] },
    { title: 'Çözücü olarak az miktarda alkol', blocks: [
      { p: `Bazı aroma ve renklendiriciler az miktarda alkolde çözülür. ${IQA} (no. 59899), Şeyh İbn Useymîn’den (“Fetâvâ Nûrun ‘ale’d-Derb”) şunu aktarır: alkol karıştığı şeyde kaybolur ve izi görünmezse, o şey haram olmaz. Onun kaidesi: “Her şey etkisinin olup olmamasına bağlıdır.”` },
      { p: `Bu veri tabanında ${E1510} (etanol), ${OFF} adına göre “alkolle ilgili” gruptadır. ${OFF} üründeki miktarı ve etkisi hakkında veri vermez.` },
    ] },
    { title: 'Şüpheli şeyler ve vera‘', blocks: [
      { hadith: true },
      { p: `Bu hadis iki şeyi birleştirir: asıl hüküm helalliktir; şüpheliden sakınmak ise dini korumaktır, buna vera‘ denir. ${IQA} (no. 114129) şunu tavsiye eder: bir şeyden emin değilse onu bıraksın; geçmişte bilmeden yenen için bir şey gerekmez — ileride dikkatli olmak yeterlidir.` },
      { p: `“Hayvansal kaynaklı olabilir” grubu (örn. ${E471}) tam olarak buraya girer: üreticiye kaynağı sorabilir veya güvenilir bir helal sertifikasına bakabilirsiniz.` },
    ] },
  ],
}

const QREF = { az: 'Bəqərə', en: 'al-Baqarah', ru: 'аль-Бакара', ar: 'البقرة', tr: 'Bakara' }
const HREF = {
  az: 'Səhih əl-Buxari 52; Səhih Muslim 1599 — Nüman ibn Bəşirdən',
  en: 'Sahih al-Bukhari 52; Sahih Muslim 1599 — from al-Nu‘man ibn Bashir',
  ru: 'Сахих аль-Бухари 52; Сахих Муслим 1599 — от ан-Ну‘мана ибн Башира',
  ar: 'صحيح البخاري 52، صحيح مسلم 1599 — عن النعمان بن بشير',
  tr: 'Sahîh-i Buhârî 52; Sahîh-i Müslim 1599 — Nu‘mân b. Beşîr’den',
}

// ── Məlumat yükləmə (bir dəfə) ──
let ecodesPromise = null
function loadEcodes() {
  if (!ecodesPromise) {
    ecodesPromise = fetch('/data/ecodes.json').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    ecodesPromise.catch(() => { ecodesPromise = null })
  }
  return ecodesPromise
}

const WANTED_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']
const norm = (s, lang) => String(s || '').toLocaleLowerCase(lang).normalize('NFKD').replace(/[̀-ًͯ-ْ]/g, '')

function nameOf(entry, items, lang) {
  if (entry.n[lang]) return { name: entry.n[lang], fallback: false }
  if (entry.n.en) return { name: entry.n.en, fallback: lang !== 'en' }
  const parent = entry.p && items[entry.p]
  if (parent) { const pn = parent.n[lang] || parent.n.en; return { name: pn || '', fallback: !parent.n[lang], parent: entry.p } }
  return { name: '', fallback: false }
}

function classLabel(id, data, lang) {
  return CLASS_LABELS[lang]?.[id] || data.classes?.[id]?.[lang] || data.classes?.[id]?.en || id.replace(/-/g, ' ')
}

/** Kateqoriya nişanı (yalnız mənşə). */
function CatBadge({ cat, lang }) {
  const [label] = (CAT[lang] || CAT.en)[cat]
  return <span className={`hc-cat hc-cat--${cat}`}><span className="hc-cat__dot" aria-hidden="true" />{label}</span>
}

/** Bir E-kod kartı: ad, qrup, funksiya; açılanda — mənbə sahələri. */
function ECodeCard({ code, entry, data, lang, L, note }) {
  const { name, fallback, parent } = nameOf(entry, data.items, lang)
  const cat = (CAT[lang] || CAT.en)[entry.cat]
  const v = (x) => L.val[x ?? 'null'] ?? x
  return (
    <article className="ui-card hc-code">
      <div className="hc-code__head">
        <span className="hc-code__id ui-num" dir="ltr">{displayECode(code)}</span>
        <div className="hc-code__main">
          <h3 className="hc-code__name" dir="auto">{name || displayECode(code)}</h3>
          {(fallback || parent) && (
            <p className="hc-code__hint">{parent ? L.noName(displayECode(parent)) : L.nameEn}</p>
          )}
          {lang !== 'en' && entry.n.en && entry.n[lang] && <p className="hc-code__en" lang="en" dir="ltr">{entry.n.en}</p>}
        </div>
        <ReportErrorButton compact refText={`E-kod ${displayECode(code)}`} kind="source" />
      </div>
      {note && <p className="hc-code__note"><Icon name="info" size={15} /> {note}</p>}
      <div className="hc-code__tags">
        <CatBadge cat={entry.cat} lang={lang} />
        {(entry.cls || []).map((c) => <span key={c} className="ui-badge">{classLabel(c, data, lang)}</span>)}
      </div>
      <p className="hc-code__why">{cat[1]}</p>
      <details className="hc-fields">
        <summary className="hc-fields__sum"><Icon name="list" size={16} /> {L.fields}<Icon name="chevronDown" size={16} className="hc-fields__chev" /></summary>
        <dl className="hc-fields__list">
          <div><dt>{L.vegan}</dt><dd>{v(entry.vegan)}</dd></div>
          <div><dt>{L.vegetarian}</dt><dd>{v(entry.vegetarian)}</dd></div>
          {entry.from && <div className="hc-fields__wide"><dt>{L.inherited(displayECode(entry.from))}</dt></div>}
          {entry.palm && <div><dt>{L.palm}</dt><dd>{v(entry.palm)}</dd></div>}
          {entry.insect && (
            <div className="hc-fields__wide">
              <dt>{entry.insect.via === 'description' ? L.insectWd : L.insectTaxon}</dt>
              <dd lang="en" dir="ltr">
                <a href={`https://www.wikidata.org/wiki/${entry.insect.via === 'description' ? entry.insect.wd : entry.insect.taxon}`} target="_blank" rel="noopener noreferrer">{entry.insect.text}</a>
              </dd>
            </div>
          )}
          {entry.desc && <div className="hc-fields__wide"><dt>{L.desc}</dt><dd lang="en" dir="ltr">{entry.desc}</dd></div>}
        </dl>
        <p className="hc-fields__links">
          <a className="ui-link" href={`https://world.openfoodfacts.org/facets/additives/${code}`} target="_blank" rel="noopener noreferrer">
            {L.openOff} <Icon name="external" size={14} />
          </a>
          {entry.wd && (
            <a className="ui-link" href={`https://www.wikidata.org/wiki/${entry.wd}`} target="_blank" rel="noopener noreferrer">
              {WD} {entry.wd} <Icon name="external" size={14} />
            </a>
          )}
        </p>
      </details>
    </article>
  )
}

/** Kamera ilə ştrixkod oxuma — yalnız BarcodeDetector olan brauzerlərdə göstərilir. */
function Scanner({ onCode, onClose, L }) {
  const videoRef = useRef(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    let stream = null
    let timer = null
    let live = true
    ;(async () => {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats()
        const formats = WANTED_FORMATS.filter((f) => supported.includes(f))
        const detector = new window.BarcodeDetector({ formats })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (!live) { stream.getTracks().forEach((t) => t.stop()); return }
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        const tick = async () => {
          if (!live) return
          try {
            const found = await detector.detect(video)
            const code = found.map((b) => normalizeBarcode(b.rawValue)).find(Boolean)
            if (code) { onCode(code); return }
          } catch { /* növbəti kadr */ }
          timer = setTimeout(tick, 250)
        }
        tick()
      } catch {
        if (live) setErr(true)
      }
    })()
    return () => {
      live = false
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onCode])
  return (
    <div className="hc-scan">
      {err ? <p className="hc-scan__err" role="alert">{L.scanErr}</p> : (
        <>
          <div className="hc-scan__frame">
            <video ref={videoRef} className="hc-scan__video" muted playsInline aria-label={L.scanHint} />
            <span className="hc-scan__box" aria-hidden="true" />
          </div>
          <p className="hc-scan__hint">{L.scanHint}</p>
        </>
      )}
      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onClose}>
        <Icon name="close" className="ui-btn__icon" /> {L.stop}
      </button>
    </div>
  )
}

function useCanScan() {
  const [can, setCan] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) return
    let live = true
    window.BarcodeDetector.getSupportedFormats?.()
      .then((f) => { if (live) setCan(WANTED_FORMATS.some((x) => f.includes(x))) })
      .catch(() => {})
    return () => { live = false }
  }, [])
  return can
}

function ECodeSection({ data, status, retry, lang, L }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(null)
  const [limit, setLimit] = useState(24)
  useEffect(() => { setLimit(24) }, [q, cat])

  const results = useMemo(() => {
    if (!data) return { list: [], missing: [] }
    const items = data.items
    const s = q.trim()
    let list = []
    const missing = []
    if (s) {
      const codes = extractECodes(s)
      if (codes.length) {
        for (const c of codes) {
          const hit = lookupECode(items, c)
          if (!hit) missing.push(c)
          else if (!list.some((x) => x.code === hit.code && !x.note)) list.push({ code: hit.code, entry: hit.entry, note: hit.exact ? null : L.parent(displayECode(c), displayECode(hit.code)) })
        }
      } else if (s.length >= 2) {
        const ns = norm(s, lang)
        list = Object.entries(items)
          .filter(([, e]) => Object.values(e.n).some((n) => norm(n, lang).includes(ns)))
          .map(([code, entry]) => ({ code, entry }))
      }
    } else {
      // v3.2: axtarış boşdursa da kodlar kart şəbəkəsində göstərilir (filtr seçilibsə — yalnız o qrup)
      list = Object.entries(items).filter(([, e]) => !cat || e.cat === cat).map(([code, entry]) => ({ code, entry }))
    }
    if (cat && s) list = list.filter((x) => x.entry.cat === cat)
    return { list, missing }
  }, [data, q, cat, lang, L])

  const counts = data?.meta?.counts || {}
  return (
    <section id="hc-codes" className="ui-section ui-section--tight hc-block" aria-labelledby="hc-codes-h">
      <div className="ui-container hc-layout">
        <div className="ui-section-head" data-reveal>
          <h2 id="hc-codes-h" className="ui-title">{L.codesTitle}</h2>
          {data && <p className="ui-lead">{L.codesLead(data.meta.count)}</p>}
        </div>

        {status === 'loading' && !data && (
          <div className="hc-loading" role="status">
            {[0, 1].map((i) => <span key={i} className="ui-skeleton ui-skeleton--card" />)}
            <span className="ui-sr-only">{L.loading}</span>
          </div>
        )}
        {status === 'error' && !data && (
          <div className="ui-card ui-card--sunken hc-empty" role="alert">
            <p>{L.loadError}</p>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={retry}>
              <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
            </button>
          </div>
        )}

        {data && (
          <>
            <div className="hc-toolbar">
            <div className="hc-search">
              <Icon name="search" size={19} className="hc-search__icon" />
              <textarea className="ui-input hc-search__input" rows={1} aria-label={L.codesLabel} placeholder={L.codesPh}
                value={q} onChange={(e) => setQ(e.target.value)} spellCheck={false} />
              {q && (
                <button type="button" className="ui-icon-btn hc-search__clear" onClick={() => setQ('')} aria-label={L.clear} title={L.clear}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <div className="hc-chips" role="group" aria-label={L.browse}>
              <button type="button" className="ui-chip" aria-pressed={cat === null} onClick={() => setCat(null)}>{L.all}</button>
              {CATEGORIES.map((c) => (
                <button key={c} type="button" className="ui-chip hc-chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>
                  <span className={`hc-cat__dot hc-cat--${c}`} aria-hidden="true" />{(CAT[lang] || CAT.en)[c][0]} <span className="ui-num hc-chip__n">{counts[c] || 0}</span>
                </button>
              ))}
            </div>
            </div>

            {(q.trim() || cat || results.list.length > 0) && (
              <p className="hc-results" role="status">
                {results.list.length ? L.found(results.list.length) : (!results.missing.length ? L.none : '')}
              </p>
            )}
            {results.missing.map((c) => <p key={c} className="hc-missing"><Icon name="alert" size={15} /> {L.notInData(displayECode(c))}</p>)}
            <div className="hc-codes">
              {results.list.slice(0, limit).map((x) => (
                <ECodeCard key={x.code + (x.note || '')} code={x.code} entry={x.entry} data={data} lang={lang} L={L} note={x.note} />
              ))}
            </div>
            {results.list.length > limit && (
              <button type="button" className="ui-btn ui-btn--secondary hc-more" onClick={() => setLimit((n) => n + 48)}>
                {L.more(results.list.length - limit)}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function BarcodeSection({ data, lang, L }) {
  const [input, setInput] = useState('')
  const [state, setState] = useState({ status: 'idle' })
  const [scanning, setScanning] = useState(false)
  const canScan = useCanScan()
  const ctrlRef = useRef(null)
  useEffect(() => () => ctrlRef.current?.abort(), [])

  const lookup = useCallback(async (raw) => {
    const code = normalizeBarcode(raw)
    if (!code) { setState({ status: 'error', kind: 'invalid' }); return }
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    setState({ status: 'loading', code })
    try {
      const r = await fetchProduct(code, { signal: ctrl.signal })
      if (!ctrl.signal.aborted) setState({ status: 'ok', code, product: r.product })
    } catch (e) {
      if (ctrl.signal.aborted) return
      setState({ status: 'error', code, kind: e instanceof ProductError ? e.kind : 'http' })
    }
  }, [])

  const onScanned = useCallback((code) => { setScanning(false); setInput(code); lookup(code) }, [lookup])
  const submit = (e) => { e.preventDefault(); lookup(input) }
  const typed = normalizeBarcode(input)

  return (
    <section id="hc-barcode" className="ui-section ui-section--tight ui-section--alt hc-block" aria-labelledby="hc-barcode-h">
      <div className="ui-container hc-layout">
        <div className="ui-section-head" data-reveal>
          <h2 id="hc-barcode-h" className="ui-title">{L.bcTitle}</h2>
          <p className="ui-lead">{L.bcLead}</p>
        </div>
        <form className="hc-bc" onSubmit={submit}>
          <label className="ui-field hc-bc__field">
            <span className="ui-field__label">{L.bcLabel}</span>
            <input className="ui-input ui-num" inputMode="numeric" autoComplete="off" enterKeyHint="search" dir="ltr"
              placeholder={L.bcPh} value={input} onChange={(e) => setInput(e.target.value)} maxLength={20} />
            {typed && !gtinCheckOk(typed) && <span className="ui-field__hint hc-bc__warn">{L.checkDigit}</span>}
          </label>
          <div className="hc-bc__actions">
            <button type="submit" className="ui-btn ui-btn--primary" disabled={state.status === 'loading'}>
              {state.status === 'loading' ? <span className="ui-spin hc-spin" aria-hidden="true" /> : <Icon name="search" className="ui-btn__icon" />} {L.check}
            </button>
            {canScan && !scanning && (
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setScanning(true)}>
                <Icon name="target" className="ui-btn__icon" /> {L.scan}
              </button>
            )}
          </div>
        </form>
        {scanning && <Scanner onCode={onScanned} onClose={() => setScanning(false)} L={L} />}

        <div aria-live="polite">
          {state.status === 'loading' && <span className="ui-skeleton ui-skeleton--card hc-bc__skeleton" role="status"><span className="ui-sr-only">{L.loading}</span></span>}
          {state.status === 'error' && (
            <div className="ui-card ui-card--sunken hc-empty" role="alert">
              <p>{L.err[state.kind] || L.err.http}</p>
              {['offline', 'timeout', 'http'].includes(state.kind) && (
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => lookup(state.code)}>
                  <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
                </button>
              )}
            </div>
          )}
          {state.status === 'ok' && <ProductCard code={state.code} p={state.product} data={data} lang={lang} L={L} />}
        </div>
      </div>
    </section>
  )
}

function ProductCard({ code, p, data, lang, L }) {
  const an = parseAnalysisTags(p.ingredients_analysis_tags)
  const halal = halalLabelTags(p.labels_tags)
  const codes = [...new Set((p.additives_tags || []).map(offTagToCode).filter(Boolean))]
  return (
    <article className="ui-card hc-product">
      <header className="hc-product__head">
        <div>
          <span className="ui-eyebrow">{L.product}</span>
          <h3 className="hc-product__name" dir="auto">{p.product_name || code}</h3>
          {p.brands && <p className="hc-product__brand" dir="auto">{L.brands}: {p.brands}</p>}
          <p className="hc-product__code ui-num" dir="ltr">{code}</p>
        </div>
        <a className="ui-link" href={`https://world.openfoodfacts.org/product/${code}`} target="_blank" rel="noopener noreferrer">
          {L.openOff} <Icon name="external" size={14} />
        </a>
      </header>

      <p className="hc-crowd"><Icon name="alert" size={15} /> {L.crowd}</p>

      <div className="hc-product__grid">
        <section aria-label={L.labels}>
          <h4 className="hc-product__h">{L.labels}</h4>
          {halal.length ? (
            <p>{L.halalYes} {halal.map((t) => <span key={t} className="ui-badge ui-badge--brand hc-tag" dir="auto">{t.replace(/^[a-z]{2}:/, '')}</span>)}</p>
          ) : <p className="hc-muted">{L.halalNo}</p>}
        </section>
        <section aria-label={L.analysis}>
          <h4 className="hc-product__h">{L.analysis}</h4>
          <p className="hc-product__an">
            <span className="ui-badge">{L.an.vegan[an.vegan]}</span>
            <span className="ui-badge">{L.an.vegetarian[an.vegetarian]}</span>
            <span className="ui-badge">{L.an.palm[an.palmOil]}</span>
          </p>
        </section>
      </div>

      <section>
        <h4 className="hc-product__h">{L.ingredients}</h4>
        {p.ingredients_text ? <p className="hc-product__ingr" dir="auto">{p.ingredients_text}</p> : <p className="hc-muted">{L.noIngr}</p>}
      </section>

      <section>
        <h4 className="hc-product__h">{L.additives} {codes.length > 0 && <span className="ui-num hc-muted">({codes.length})</span>}</h4>
        {!codes.length && <p className="hc-muted">{L.noAdd}</p>}
        {!data && codes.length > 0 && <p className="hc-muted">{codes.map(displayECode).join(', ')}</p>}
        {data && (
          <div className="hc-codes">
            {codes.map((c) => {
              const hit = lookupECode(data.items, c)
              if (!hit) return <p key={c} className="hc-missing"><Icon name="alert" size={15} /> {L.notInData(displayECode(c))}</p>
              return <ECodeCard key={c} code={hit.code} entry={hit.entry} data={data} lang={lang} L={L}
                note={hit.exact ? null : L.parent(displayECode(c), displayECode(hit.code))} />
            })}
          </div>
        )}
      </section>
    </article>
  )
}

function Ayah({ a, lang }) {
  const k = Object.keys(AYAH).find((x) => AYAH[x] === a)
  const [s, v] = k.split(':')
  return (
    <figure className="ui-quote hc-quote">
      <blockquote>
        <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{a.ar}</p>
        {lang !== 'ar' && <p className="ui-quote__text">{a[lang] || a.en}</p>}
      </blockquote>
      <figcaption className="ui-quote__src">— {QREF[lang] || QREF.en} {s}:{v}</figcaption>
    </figure>
  )
}

function FiqhSection({ data, lang, L }) {
  const sections = FIQH[lang] || FIQH.en
  const c = { total: data?.meta?.count ?? '…', none: data?.meta?.counts?.none ?? '…' }
  return (
    <section id="hc-fiqh" className="ui-section ui-section--tight hc-block" aria-labelledby="hc-fiqh-h">
      <div className="ui-container hc-layout">
        <div className="ui-section-head" data-reveal>
          <h2 id="hc-fiqh-h" className="ui-title">{L.fiqhTitle}</h2>
          <p className="ui-lead">{L.fiqhLead}</p>
        </div>
        {/* v3.1: bölmələr geniş ekranda iki sütunlu "masonry" (CSS columns) — oxu sırası
            sütun üzrə yuxarıdan aşağı; telefonda tək sütun */}
        <div className="hc-fiqh-grid">
        {sections.map((sec, si) => {
          const key = FIQH_KEYS[si]
          return (
            <article key={key} id={`hc-${key}`} className="ui-card hc-fiqh">
              <h3 className="hc-fiqh__title">{sec.title}</h3>
              {sec.blocks.map((b, i) => {
                if (b.ayah) return <Ayah key={i} a={b.ayah} lang={lang} />
                if (b.hadith) {
                  return (
                    <figure key={i} className="ui-quote hc-quote">
                      <blockquote>
                        <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{HADITH.ar}</p>
                        {lang !== 'ar' && <p className="ui-quote__text">{HADITH[lang] || HADITH.en}</p>}
                      </blockquote>
                      <figcaption className="ui-quote__src">— {HREF[lang] || HREF.en}{lang === 'az' && <> · {L.ourTr}</>}</figcaption>
                    </figure>
                  )
                }
                if (b.q) {
                  return (
                    <figure key={i} className="ui-quote hc-quote hc-quote--fatwa">
                      <blockquote>
                        <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">«{b.q.ar}»</p>
                        {b.mean && lang !== 'ar' && <p className="ui-quote__text">{b.mean}</p>}
                      </blockquote>
                      <figcaption className="ui-quote__src">
                        — <a href={b.q.src.url} target="_blank" rel="noopener noreferrer" dir="auto" lang={guessLang(b.q.src.label)}>{b.q.src.label}</a>
                      </figcaption>
                    </figure>
                  )
                }
                return <p key={i} className="hc-fiqh__p">{typeof b.p === 'function' ? b.p(c) : b.p}</p>
              })}
              {FIQH_EXTRA_REFS[key] && (
                <p className="hc-fiqh__refs">
                  {L.ref}: {FIQH_EXTRA_REFS[key].map((r, i) => (
                    <span key={r}>{i > 0 && ' · '}<a href={SRC[r].url} target="_blank" rel="noopener noreferrer" dir="auto" lang={guessLang(SRC[r].label)}>{SRC[r].label}</a></span>
                  ))}
                </p>
              )}
            </article>
          )
        })}
        </div>
      </div>
    </section>
  )
}

// Sitatı olmayan, amma mətnində istinad edilən fətvalar — bölmənin sonunda keçid
const FIQH_EXTRA_REFS = {
  istihala: ['iq97541', 'iq114129'],
  gelatin: ['iq219137'],
  alcohol: ['iq59899'],
  doubt: ['iq114129'],
}

// ── Dizayn v3: bazanın xülasəsi (qrafiklər) + "məhsulu necə yoxlamalı" addımları ──
// Rəqəmlər yalnız ecodes.json-dan (OFF taksonomiyası) hesablanır — uydurma yox.
// Qrup rəngi viz palitrasındandır (status rəngi yox — bu, hökm deyil):
// heyvan mənşəli deyil → 1, ola bilər → 2, spirt → 3, heyvan/həşərat → 4, naməlum → boz.
const CAT_TONE = { none: 1, maybe: 2, alcohol: 3, animal: 4, insect: 4, unknown: 'muted' }

function OverviewSection({ data, lang, L }) {
  const cats = useMemo(() => {
    const counts = data?.meta?.counts || {}
    return CATEGORIES.map((c) => ({ key: c, label: (CAT[lang] || CAT.en)[c][0], value: counts[c] || 0, tone: CAT_TONE[c] }))
      .sort((a, b) => b.value - a.value)
  }, [data, lang])
  const classes = useMemo(() => {
    if (!data) return []
    const n = {}
    for (const e of Object.values(data.items)) for (const c of e.cls || []) n[c] = (n[c] || 0) + 1
    return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([c, v]) => ({ key: c, label: classLabel(c, data, lang), value: v }))
  }, [data, lang])

  return (
    <section id="hc-overview" className="ui-section ui-section--tight ui-section--alt hc-block hc-overview" aria-labelledby="hc-steps-h">
      <div className="ui-container">
        <div className="ui-section-head" data-reveal>
          <h2 id="hc-steps-h" className="ui-title">{L.stepsTitle}</h2>
          <p className="ui-lead">{L.stepsLead}</p>
        </div>
        <ol className="ui-steps ui-steps--row hc-steps">
          {L.steps.map(([title, text], i) => (
            <li key={i} className="ui-step">
              <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
              <div className="ui-step__body">
                <h3 className="ui-step__title">{title}</h3>
                <p className="ui-step__text">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        {data && (
          <div className="hc-charts">
            <ChartFigure title={L.ovTitle} sub={L.ovSub} note={`${OFF} · ${ODBL} · ${data.meta.built}`}>
              <BarChart data={cats} labelWidth="42%" label={`${L.ovTitle}: ${L.ovSub}`} />
            </ChartFigure>
            <ChartFigure title={L.clsTitle} sub={L.clsSub} note={`${OFF} · ${ODBL}`}>
              <BarChart data={classes} labelWidth="42%" label={`${L.clsTitle}: ${L.clsSub}`} />
            </ChartFigure>
          </div>
        )}
      </div>
    </section>
  )
}

export default function HalalCheckPage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    setStatus((s) => (s === 'ok' ? s : 'loading'))
    loadEcodes()
      .then((d) => { if (live) { setData(d); setStatus('ok') } })
      .catch(() => { if (live) setStatus('error') })
    return () => { live = false }
  }, [attempt])

  const counts = data?.meta?.counts || {}
  const toCheck = (counts.maybe || 0) + (counts.animal || 0) + (counts.insect || 0) + (counts.alcohol || 0)

  return (
    <div className="hc-page">
      <header className="ui-page-hero hc-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          <p className="ui-lead">{L.lead}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {L.how}</p>
          {data && (
            <ul className="ui-page-hero__stats">
              <li><b className="ui-num">{data.meta.count}</b><span>{L.statCodes}</span></li>
              <li><b className="ui-num">{counts.none || 0}</b><span>{L.statNone}</span></li>
              <li><b className="ui-num">{toCheck}</b><span>{L.statCheck}</span></li>
            </ul>
          )}
          <nav className="hc-jump" aria-label={L.title}>
            {['codes', 'barcode', 'fiqh', 'sources'].map((k) => (
              <a key={k} className="ui-chip" href={`#hc-${k}`}>{L.jump[k]}</a>
            ))}
          </nav>
        </div>
      </header>

      <div className="ui-container hc-layout">
        <aside className="ui-callout ui-callout--warn hc-disc" role="note" aria-labelledby="hc-disc-h">
          <Icon name="shield" />
          <div>
            <h2 id="hc-disc-h" className="ui-callout__title hc-disc__title">{L.discTitle}</h2>
            <p className="hc-disc__text">{L.disc}</p>
          </div>
        </aside>
      </div>

      <ECodeSection data={data} status={status} retry={() => setAttempt((a) => a + 1)} lang={lang} L={L} />
      <BarcodeSection data={data} lang={lang} L={L} />
      <OverviewSection data={data} lang={lang} L={L} />
      <FiqhSection data={data} lang={lang} L={L} />

      <section id="hc-sources" className="ui-section ui-section--tight ui-section--alt hc-block" aria-labelledby="hc-sources-h">
        <div className="ui-container hc-layout">
          <h2 id="hc-sources-h" className="ui-title ui-title--sm">{L.srcTitle}</h2>
          <ul className="hc-sources">
            <li>
              {L.srcData(data?.meta?.built || '…')}{' '}
              <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">world.openfoodfacts.org</a>
              {' · '}
              <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">{ODBL}</a>
            </li>
            <li>{L.srcProduct}</li>
            <li>{L.srcQuran}</li>
            <li>{L.srcHadith}</li>
            {Object.values(SRC).map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" dir="auto" lang={guessLang(s.label)}>{s.label}</a></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
