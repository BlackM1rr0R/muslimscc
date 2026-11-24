// ═══════════════════════════════════════════════════════
// /widget → "WordPress plagini" bölməsi: endirmə düyməsi + 3 addımlı quraşdırma
//
// • Zip build zamanı yığılır (scripts/build-wp-plugin.mjs → dist/downloads/), repoda binar yoxdur.
// • Plaginin özü: wordpress/muslimscc-prayer-times/ (blok, klassik vidcet, [muslimscc_prayer] qısa kodu).
// • İstinad linki plagində susmaya görə SÖNÜKDÜR (WordPress.org qaydası 10) — burada da belə deyilir.
// • shortcodeBox — WidgetPage-in CopyBox-u (seçilmiş şəhər/dil/görünüşə uyğun qısa kod).
// ═══════════════════════════════════════════════════════

import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { WP_PLUGIN_ZIP, WP_PLUGIN_VERSION } from '../../utils/wpPlugin'

const T = {
  // lang-ok[WordPress]: məhsulun adı
  title: { az: 'WordPress plagini', en: 'WordPress plugin', ru: 'Плагин для WordPress', ar: 'إضافة ووردبريس', tr: 'WordPress eklentisi' },
  lead: {
    // lang-ok[vidcet]: WordPress termini (widget)
    az: 'Saytınız WordPress-dədirsə, kod yazmadan əlavə edin: blok, klassik vidcet və ya qısa kod. Yığcam və ya tam (məscid ekranı) görünüş, 5 dil, işıqlı və qaranlıq mövzu.',
    en: 'If your site runs on WordPress, add the widget without touching code: as a block, a classic widget or a shortcode. Compact or full (mosque display) layout, 5 languages, light and dark themes.',
    // lang-ok[WordPress]: məhsulun adı
    ru: 'Если ваш сайт работает на WordPress, добавьте виджет без кода: блоком, классическим виджетом или шорткодом. Компактный или полный (экран мечети) вид, 5 языков, светлая и тёмная тема.',
    ar: 'إن كان موقعك يعمل بووردبريس فأضف الأداة دون كتابة شيفرة: كتلةً أو أداةً كلاسيكية أو رمزًا قصيرًا. عرض مختصر أو كامل (شاشة المسجد)، 5 لغات، ومظهر فاتح وداكن.',
    tr: 'Siteniz WordPress ile çalışıyorsa aracı kod yazmadan ekleyin: blok, klasik bileşen ya da kısa kod olarak. Sade veya tam (cami ekranı) görünüm, 5 dil, açık ve koyu tema.',
  },
  // lang-ok[zip]: fayl formatı
  download: { az: 'Plagini endir (.zip)', en: 'Download the plugin (.zip)', ru: 'Скачать плагин (.zip)', ar: 'تنزيل الإضافة (.zip)', tr: 'Eklentiyi indir (.zip)' },
  meta: {
    // lang-ok[WordPress,GPL]: məhsul və lisenziya adı
    az: `Versiya ${WP_PLUGIN_VERSION} · WordPress 6.3+ · pulsuz, GPL lisenziyası`,
    en: `Version ${WP_PLUGIN_VERSION} · WordPress 6.3+ · free, GPL licence`,
    // lang-ok[WordPress,GPL]: название продукта и лицензии
    ru: `Версия ${WP_PLUGIN_VERSION} · WordPress 6.3+ · бесплатно, лицензия GPL`,
    // lang-ok[WordPress,GPL]: اسم المنتج والترخيص
    ar: `الإصدار ${WP_PLUGIN_VERSION} · WordPress 6.3+ · مجانية، بترخيص GPL`,
    // lang-ok[WordPress,GPL]: ürün ve lisans adı
    tr: `Sürüm ${WP_PLUGIN_VERSION} · WordPress 6.3+ · ücretsiz, GPL lisansı`,
  },
  stepsLabel: { az: 'Üç addımda quraşdırma', en: 'Install in three steps', ru: 'Установка в три шага', ar: 'التثبيت في ثلاث خطوات', tr: 'Üç adımda kurulum' },
  steps: [
    {
      t: { az: 'Endirin', en: 'Download', ru: 'Скачайте', ar: 'نزّل', tr: 'İndirin' },
      d: {
        az: 'Yuxarıdakı düymə ilə ZIP faylını kompüterinizə endirin. Açmayın.',
        en: 'Save the ZIP file with the button above. Don’t unzip it.',
        // lang-ok[ZIP]: формат файла
        ru: 'Сохраните ZIP-файл кнопкой выше. Распаковывать не нужно.',
        // lang-ok[ZIP]: صيغة الملف
        ar: 'احفظ ملف ZIP بالزر أعلاه، ولا تفكّ ضغطه.',
        tr: 'Yukarıdaki düğmeyle ZIP dosyasını kaydedin. Açmayın.',
      },
    },
    {
      t: { az: 'Quraşdırın', en: 'Install', ru: 'Установите', ar: 'ثبّت', tr: 'Kurun' },
      d: {
        az: 'WordPress idarə panelində: Plaginlər → Yeni əlavə et → Plagin yüklə → faylı seçin → İndi quraşdır → Aktivləşdir.',
        en: 'In your WordPress admin: Plugins → Add New Plugin → Upload Plugin → choose the file → Install Now → Activate.',
        // lang-ok[WordPress]: название продукта
        ru: 'В админке WordPress: Плагины → Добавить новый → Загрузить плагин → выберите файл → Установить → Активировать.',
        // lang-ok[WordPress]: اسم المنتج
        ar: 'في لوحة تحكم WordPress: الإضافات ← أضف جديد ← رفع إضافة ← اختر الملف ← التثبيت الآن ← تفعيل.',
        tr: 'WordPress yönetim panelinde: Eklentiler → Yeni ekle → Eklenti yükle → dosyayı seçin → Şimdi kur → Etkinleştir.',
      },
    },
    {
      t: { az: 'Əlavə edin', en: 'Add it', ru: 'Добавьте', ar: 'أضِف', tr: 'Ekleyin' },
      d: {
        // lang-ok[Times]: WordPress-də blokun adı tərcümə olunmur
        az: '“Prayer Times (muslims.cc)” blokunu və ya vidceti seçin, yaxud bu qısa kodu səhifəyə yapışdırın:',
        en: 'Pick the “Prayer Times (muslims.cc)” block or widget, or paste this shortcode into a page:',
        // lang-ok: название блока в WordPress не переводится
        ru: 'Выберите блок или виджет «Prayer Times (muslims.cc)» либо вставьте на страницу этот шорткод:',
        // lang-ok: اسم الكتلة في ووردبريس لا يُترجم
        ar: 'اختر كتلة أو أداة «Prayer Times (muslims.cc)»، أو الصق هذا الرمز القصير في الصفحة:',
        // lang-ok: WordPress'te blok adı çevrilmez
        tr: '“Prayer Times (muslims.cc)” bloğunu ya da bileşenini seçin veya bu kısa kodu sayfaya yapıştırın:',
      },
    },
  ],
  credit: {
    // lang-ok[times]: plagindəki linkin mətni ingiliscədir
    az: 'Plagin saytınıza özbaşına heç bir link əlavə etmir. Bizi dəstəkləmək istəsəniz, ayarlarda “Prayer times by muslims.cc” linkini aça bilərsiniz.',
    en: 'The plugin never adds a link to your site on its own. If you’d like to support us, you can turn on the “Prayer times by muslims.cc” link in its settings.',
    // lang-ok: текст ссылки в плагине на английском
    ru: 'Плагин сам не добавляет на ваш сайт никаких ссылок. Если хотите нас поддержать, включите в его настройках ссылку «Prayer times by muslims.cc».',
    // lang-ok: نص الرابط في الإضافة بالإنجليزية
    ar: 'لا تضيف الإضافة أي رابط إلى موقعك من تلقاء نفسها. وإن أردت دعمنا فيمكنك تفعيل رابط «Prayer times by muslims.cc» من إعداداتها.',
    // lang-ok: eklentideki bağlantı metni İngilizcedir
    tr: 'Eklenti sitenize kendiliğinden hiçbir bağlantı eklemez. Bizi desteklemek isterseniz ayarlarından “Prayer times by muslims.cc” bağlantısını açabilirsiniz.',
  },
}

export default function WpPluginSection({ lang, shortcodeBox }) {
  const P = (o) => pickUi(o, lang, 'en')
  return (
    <section className="wg-section ui-card wg-wp" aria-labelledby="wg-wp-title" data-testid="wg-wp" data-reveal>
      <h2 id="wg-wp-title" className="ui-title ui-title--sm">
        {P(T.title)}
      </h2>
      <p className="wg-hint">{P(T.lead)}</p>
      <p>
        <a className="ui-btn ui-btn--primary" href={WP_PLUGIN_ZIP} download data-testid="wg-wp-download">
          <Icon name="download" className="ui-btn__icon" /> {P(T.download)}
        </a>
      </p>
      <p className="wg-hint" dir="auto">{P(T.meta)}</p>

      <ol className="ui-steps" aria-label={P(T.stepsLabel)}>
        {T.steps.map((st, i) => (
          <li key={i} className="ui-step">
            <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
            <div className="ui-step__body">
              <p className="ui-step__title">{P(st.t)}</p>
              <p className="ui-step__text">{P(st.d)}</p>
              {i === 2 && shortcodeBox}
            </div>
          </li>
        ))}
      </ol>

      <p className="wg-note" role="note">{P(T.credit)}</p>
    </section>
  )
}
