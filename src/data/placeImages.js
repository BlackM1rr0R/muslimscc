// ═══════════════════════════════════════════════════════
// Yer fotoşəkilləri — ad və alt mətn (5 dil)
//
// Fayllar: public/images/places/<açar>-{800,1600}.webp
// Atribusiya (müəllif, lisenziya, ölçülər): src/data/imageCredits.js
// (scripts/fetch-place-images.mjs yaradır).
//
// Sələf mənhəci: canlı (insan, heyvan) təsviri olmayan kadrlar seçilib —
// memarlıq, dağ, səhra mənzərəsi; bəzilərində uzaqda, seçilməyən izdiham var.
// Arafat və Müzdəlifə üçün belə foto tapılmadı — orada yalnız xəritə var.
// ═══════════════════════════════════════════════════════
import { IMAGE_CREDITS } from './imageCredits'

export const PLACE_PHOTOS = {
  'masjid-al-haram': {
    name: { az: 'Məscidül-Haram', en: 'Masjid al-Haram', ru: 'Масджид аль-Харам', ar: 'المسجد الحرام', tr: 'Mescid-i Haram' },
    alt: {
      az: 'Gecə yuxarıdan görünüş: Məscidül-Haram, ortada Kəbə və işıqlı həyət',
      en: 'Night view from above: Masjid al-Haram with the Kaaba and the lit courtyard in the centre',
      ru: 'Ночной вид сверху: Масджид аль-Харам, в центре Кааба и освещённый двор',
      ar: 'منظر ليلي من الأعلى: المسجد الحرام وفي وسطه الكعبة والصحن المضاء',
      tr: 'Gece yukarıdan görünüm: Mescid-i Haram, ortada Kâbe ve ışıklı avlu',
    },
  },
  'masjid-an-nabawi': {
    name: { az: 'Məscidün-Nəbəvi', en: 'Al-Masjid an-Nabawi', ru: 'Масджид ан-Набави', ar: 'المسجد النبوي', tr: 'Mescid-i Nebevî' },
    alt: {
      az: 'Məscidün-Nəbəvinin ağ günbəzli damları və minarələri, arxada Mədinə dağları',
      en: 'The white domed roofs and minarets of al-Masjid an-Nabawi with the mountains of Medina behind',
      ru: 'Белые купольные крыши и минареты Масджид ан-Набави, за ними горы Медины',
      ar: 'أسطح المسجد النبوي البيضاء ذات القباب ومآذنه، وخلفها جبال المدينة',
      tr: 'Mescid-i Nebevî’nin beyaz kubbeli çatıları ve minareleri, arkada Medine dağları',
    },
  },
  quba: {
    name: { az: 'Quba məscidi', en: 'Quba Mosque', ru: 'Мечеть Куба', ar: 'مسجد قباء', tr: 'Kuba Mescidi' },
    alt: {
      az: 'Mavi səma altında ağ Quba məscidi, dörd minarəsi və günbəzləri',
      en: 'The white Quba Mosque with its four minarets and domes under a blue sky',
      ru: 'Белая мечеть Куба с четырьмя минаретами и куполами под голубым небом',
      ar: 'مسجد قباء الأبيض بمآذنه الأربع وقبابه تحت سماء زرقاء',
      tr: 'Mavi gökyüzü altında beyaz Kuba Mescidi, dört minaresi ve kubbeleri',
    },
  },
  'al-aqsa': {
    name: { az: 'Məscidül-Əqsa', en: 'Al-Aqsa Mosque', ru: 'Масджид аль-Акса', ar: 'المسجد الأقصى', tr: 'Mescid-i Aksâ' },
    alt: {
      az: 'Qüdsdə Məscidül-Əqsanın daş fasadı, tağlı girişi və boz günbəzi',
      en: 'The stone façade, arched portico and grey dome of al-Aqsa Mosque in Jerusalem',
      ru: 'Каменный фасад, арочный портик и серый купол мечети аль-Акса в Иерусалиме',
      ar: 'واجهة المسجد الأقصى الحجرية ورواقه المقوّس وقبته الرصاصية في القدس',
      tr: 'Kudüs’te Mescid-i Aksâ’nın taş cephesi, kemerli revakı ve gri kubbesi',
    },
  },
  'jabal-an-nur': {
    name: { az: 'Nur dağı (Həra)', en: 'Jabal an-Nur (Hira)', ru: 'Гора Нур (Хира)', ar: 'جبل النور (حراء)', tr: 'Nur Dağı (Hira)' },
    alt: {
      az: 'Məkkədə Nur dağının sıldırım qayalı zirvəsi',
      en: 'The steep rocky peak of Jabal an-Nur in Mecca',
      ru: 'Крутая скалистая вершина горы Нур в Мекке',
      ar: 'قمة جبل النور الصخرية الشاهقة في مكة',
      tr: 'Mekke’de Nur Dağı’nın sarp kayalık zirvesi',
    },
  },
  'jabal-thawr': {
    name: { az: 'Sevr dağı', en: 'Jabal Thawr', ru: 'Гора Саур', ar: 'جبل ثور', tr: 'Sevr Dağı' },
    alt: {
      az: 'Axşam işığında Məkkənin cənubundakı Sevr dağı',
      en: 'Jabal Thawr south of Mecca in the evening light',
      ru: 'Гора Саур к югу от Мекки в вечернем свете',
      ar: 'جبل ثور جنوب مكة في ضوء المساء',
      tr: 'Akşam ışığında Mekke’nin güneyindeki Sevr Dağı',
    },
  },
  uhud: {
    name: { az: 'Uhud dağı', en: 'Mount Uhud', ru: 'Гора Ухуд', ar: 'جبل أحد', tr: 'Uhud Dağı' },
    alt: {
      az: 'Mədinənin şimalında qırmızımtıl Uhud dağı, önündə yaşıl düzənlik',
      en: 'The reddish Mount Uhud north of Medina with a green plain in front',
      ru: 'Красноватая гора Ухуд к северу от Медины, перед ней зелёная равнина',
      ar: 'جبل أحد المائل إلى الحمرة شمال المدينة وأمامه سهل أخضر',
      tr: 'Medine’nin kuzeyinde kızılımsı Uhud Dağı, önünde yeşil ova',
    },
  },
  badr: {
    name: { az: 'Bədr', en: 'Badr', ru: 'Бадр', ar: 'بدر', tr: 'Bedir' },
    alt: {
      az: 'Bədr vadisinin ümumi görünüşü: səhra, uzaqda qum təpələri və dağlar',
      en: 'General view of the valley of Badr: desert with sand dunes and mountains in the distance',
      ru: 'Общий вид долины Бадр: пустыня, вдали песчаные холмы и горы',
      ar: 'منظر عام لوادي بدر: صحراء وفي البعيد كثبان رملية وجبال',
      tr: 'Bedir vadisinin genel görünümü: çöl, uzakta kum tepeleri ve dağlar',
    },
  },
  mina: {
    name: { az: 'Mina', en: 'Mina', ru: 'Мина', ar: 'منى', tr: 'Mina' },
    alt: {
      az: 'Yuxarıdan Mina vadisi: dağlar arasında minlərlə ağ çadır',
      en: 'The valley of Mina from above: thousands of white tents between the mountains',
      ru: 'Долина Мина сверху: тысячи белых шатров между горами',
      ar: 'وادي منى من الأعلى: آلاف الخيام البيضاء بين الجبال',
      tr: 'Yukarıdan Mina vadisi: dağlar arasında binlerce beyaz çadır',
    },
  },
  'al-baqi': {
    name: { az: 'Cənnətül-Bəqi', en: 'Jannat al-Baqi', ru: 'Джаннат аль-Баки', ar: 'جنة البقيع', tr: 'Cennetü’l-Bakî' },
    alt: {
      az: 'Mədinədəki Bəqi qəbiristanlığı: sünnəyə uyğun sadə, nişansız torpaq qəbirlər',
      en: 'The Baqi cemetery in Medina: simple, unadorned earth graves in line with the Sunnah',
      ru: 'Кладбище Баки в Медине: простые земляные могилы без надгробий, по Сунне',
      ar: 'مقبرة البقيع في المدينة: قبور ترابية بسيطة غير مشيّدة على السنة',
      tr: 'Medine’deki Bakî kabristanı: sünnete uygun sade, süslemesiz toprak kabirler',
    },
  },
  taif: {
    name: { az: 'Taif', en: 'Taif', ru: 'Таиф', ar: 'الطائف', tr: 'Taif' },
    alt: {
      az: 'Taif yaxınlığında Əl-Hada dağları və dolama yol',
      en: 'The al-Hada mountains and winding road near Taif',
      ru: 'Горы аль-Хада и серпантин около Таифа',
      ar: 'جبال الهدا والطريق المتعرّج قرب الطائف',
      tr: 'Taif yakınında el-Hada dağları ve virajlı yol',
    },
  },
}

// Şəkil altındakı kiçik atribusiya: "Foto: <müəllif> · <lisenziya>"
export const PHOTO_LABEL = { az: 'Foto', en: 'Photo', ru: 'Фото', ar: 'صورة', tr: 'Fotoğraf' }

// Açar → { ...ad/alt, ...atribusiya }; tanınmayan açar → null
export function placePhoto(key) {
  const p = PLACE_PHOTOS[key]
  const c = IMAGE_CREDITS[key]
  return p && c ? { key, ...p, ...c } : null
}
