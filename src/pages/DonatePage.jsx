import { useLang } from '../contexts/LangContext'
import { BRAND, brandName } from '../config/brand'
import { VerseCard, HadithCard } from '../components/VirtueCards'
import '../styles/DonatePage.css'
import Breadcrumb from '../components/Breadcrumb'

// ═══════════════════════════════════════════════════════
// Xeyriyyə və ianə — /donate (ümumi bələdçi)
//
// Muslims.cc konkret bir məscid və ya fond deyil — bu səhifədə ödəniş
// rekvizitləri, ianə qəbulu, məbləğ və ya layihə YOXDUR. Səhifə:
// • sədəqənin fəzilətini göstərir — ayə api.alquran.cloud-dan gətirilir
//   (yaddaşdan yazılmır), hədislər src/data/hadiths.js-dən OLDUĞU KİMİ
//   köçürülüb (id ilə; 1.2 MB-lıq faylı bir səhifəyə görə yükləməmək üçün);
// • etibarlı xeyriyyəyə necə vermək barədə qısa ümumi (dini hökm olmayan)
//   tövsiyələr verir;
// • zəkat kalkulyatoruna, sədəqə gündəliyinə və yaxınlıqdakı məscidlərə aparır.
// ═══════════════════════════════════════════════════════

// src/data/hadiths.js-dən bayt-bayt köçürülüb — mətni burada DƏYİŞMƏ
// (düzəliş lazımdırsa əvvəl hadiths.js-də et, sonra buraya köçür).
// Ərəbcə tərcümə yoxdur: ərəb dilində yalnız əsl mətn göstərilir.
const CHARITY_HADITHS = [
  { id: 546, source: 'Muslim 2588', ar: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ',
    az: 'Sədəqə malı azaltmaz.', en: 'Charity does not decrease wealth.', ru: 'Милостыня не уменьшает богатства.', tr: 'Sadaka malı eksiltmez.' },
  { id: 312, source: 'Buxari 1410', ar: 'مَنْ تَصَدَّقَ بِعِدْلِ تَمْرَةٍ مِنْ كَسْبٍ طَيِّبٍ',
    az: 'Kim halal qazancından bir xurma qədər sədəqə versə, Allah onu sağ əli ilə qəbul edər.', en: 'Whoever gives a date\'s worth of charity from pure earnings, Allah accepts it with His right hand.', ru: 'Кто подаст милостыню размером с финик из чистого заработка, Аллах примет её Своей правой рукой.', tr: 'Kim helal kazancından hurma büyüklüğünde sadaka verirse, Allah onu sağ eliyle kabul eder.' },
  { id: 552, source: 'Buxari 1442', ar: 'مَا مِنْ يَوْمٍ يُصْبِحُ الْعِبَادُ فِيهِ إِلَّا مَلَكَانِ يَنْزِلَانِ فَيَقُولُ أَحَدُهُمَا اللَّهُمَّ أَعْطِ مُنْفِقًا خَلَفًا',
    az: 'Hər gün iki mələk enər; biri "Allahım, infaq edənə əvəzini ver" deyər, digəri "Allahım, xəsisə tələf ver" deyər.', en: 'Every day two angels descend; one says: "O Allah, give the spender a replacement," and the other says: "O Allah, give the miser destruction."', ru: 'Каждый день спускаются два ангела; один говорит: «О Аллах, возмести расходующему», другой: «О Аллах, уничтожь имущество скупого».', tr: 'Her gün iki melek iner; biri "Allah\'ım infak edene karşılığını ver" der, diğeri "Allah\'ım cimriye telef ver" der.' },
  { id: 629, source: 'Muslim 1631', ar: 'إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ',
    az: 'İnsan öldükdə əməli kəsilər, üç şey istisnadır: davamlı sədəqə, faydalı elm, dua edən saleh övlad.', en: 'When a person dies, his deeds end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for him.', ru: 'Когда человек умирает, его дела прекращаются, кроме трёх: непрерывной милостыни, полезного знания или праведного ребёнка, молящегося за него.', tr: 'İnsan öldüğünde ameli kesilir, üç şey müstesna: sadaka-i cariye, faydalı ilim, dua eden salih evlat.' },
]

// İnfaq haqqında ayə (Bəqərə 2:261) — mətn API-dən gəlir
const CHARITY_VERSE = '2:261'

const LABELS = {
  az: {
    title: 'Xeyriyyə və ianə',
    subtitle: 'Sədəqənin fəziləti və etibarlı xeyriyyəyə necə vermək',
    virtues: 'Sədəqənin fəziləti',
    tipsTitle: 'Necə vermək olar',
    tips: [
      'Etibarlı, rəsmi qeydiyyatda olan xeyriyyə təşkilatı və ya tanıdığınız məscid seçin.',
      'İanənin nəyə xərcləndiyini soruşun; mümkünsə qəbz və ya hesabat istəyin.',
      'Ödənişi yalnız rəsmi kanallarla edin — tanımadığınız şəxsi kartlara və sosial şəbəkədəki yoxlanılmamış çağırışlara ehtiyatlı olun.',
      'Zəkatı ayrıca hesablayın və onu almağa haqqı olanlara çatdırın.',
      'Ətrafınızdakı ehtiyacı olanları — qohumları və qonşuları unutmayın.',
    ],
    noPayments: '{brand} ianə və ya ödəniş qəbul etmir — bu səhifə yalnız məlumat üçündür.',
    seeAlso: 'Faydalı keçidlər',
    zakat: 'Zəkat kalkulyatoru', zakatDesc: 'Zəkatınızı hesablayın',
    journal: 'Sədəqə gündəliyi', journalDesc: 'Öz xeyir əməllərinizi qeyd edin',
    mosques: 'Yaxınlıqdakı məscidlər', mosquesDesc: 'Xəritədə yaxın məscidləri tapın',
  },
  en: {
    title: 'Charity & Giving',
    subtitle: 'The virtue of charity and how to give to a trustworthy cause',
    virtues: 'The virtue of charity',
    tipsTitle: 'How to give',
    tips: [
      'Choose a trustworthy, officially registered charity or a mosque you know.',
      'Ask how the donation will be spent; if possible, request a receipt or a report.',
      'Pay only through official channels — be careful with unknown personal cards and unverified appeals on social media.',
      'Calculate your zakat separately and make sure it reaches those entitled to it.',
      'Do not forget the people in need around you — relatives and neighbours.',
    ],
    noPayments: '{brand} does not accept donations or payments — this page is for information only.',
    seeAlso: 'Useful links',
    zakat: 'Zakat calculator', zakatDesc: 'Calculate your zakat',
    journal: 'Sadaqah journal', journalDesc: 'Keep a record of your good deeds',
    mosques: 'Mosques near me', mosquesDesc: 'Find nearby mosques on the map',
  },
  ru: {
    title: 'Благотворительность',
    subtitle: 'Достоинство садаки и как жертвовать надёжным организациям',
    virtues: 'Достоинство садаки',
    tipsTitle: 'Как жертвовать',
    tips: [
      'Выбирайте надёжную, официально зарегистрированную благотворительную организацию или знакомую вам мечеть.',
      'Спрашивайте, на что пойдёт пожертвование; по возможности просите квитанцию или отчёт.',
      'Платите только через официальные каналы — будьте осторожны с незнакомыми личными картами и непроверенными призывами в соцсетях.',
      'Рассчитывайте закят отдельно и следите, чтобы он дошёл до тех, кто имеет на него право.',
      'Не забывайте о нуждающихся рядом — родственниках и соседях.',
    ],
    noPayments: '{brand} не принимает пожертвования и платежи — эта страница носит только информационный характер.',
    seeAlso: 'Полезные ссылки',
    zakat: 'Калькулятор закята', zakatDesc: 'Рассчитайте свой закят',
    journal: 'Дневник садаки', journalDesc: 'Записывайте свои добрые дела',
    mosques: 'Мечети рядом', mosquesDesc: 'Найдите ближайшие мечети на карте',
  },
  ar: {
    title: 'الصدقة والتبرع',
    subtitle: 'فضل الصدقة وكيف تتبرع لجهة موثوقة',
    virtues: 'فضل الصدقة',
    tipsTitle: 'كيف تتبرع',
    tips: [
      'اختر جمعية خيرية موثوقة ومسجّلة رسميًا أو مسجدًا تعرفه.',
      'اسأل كيف سيُنفق تبرعك، واطلب إيصالًا أو تقريرًا إن أمكن.',
      'ادفع عبر القنوات الرسمية فقط، واحذر من البطاقات الشخصية المجهولة والنداءات غير الموثّقة على مواقع التواصل.',
      'احسب زكاتك على حدة وتأكّد من وصولها إلى مستحقيها.',
      'لا تنسَ المحتاجين من حولك — الأقارب والجيران.',
    ],
    noPayments: 'لا يقبل {brand} التبرعات أو المدفوعات — هذه الصفحة للمعلومات فقط.',
    seeAlso: 'روابط مفيدة',
    zakat: 'حاسبة الزكاة', zakatDesc: 'احسب زكاتك',
    journal: 'سجل الصدقات', journalDesc: 'سجّل أعمالك الخيرية',
    mosques: 'المساجد القريبة', mosquesDesc: 'اعثر على المساجد القريبة على الخريطة',
  },
  tr: {
    title: 'Hayır ve Bağış',
    subtitle: 'Sadakanın fazileti ve güvenilir bir hayır kurumuna nasıl bağış yapılır',
    virtues: 'Sadakanın fazileti',
    tipsTitle: 'Nasıl bağış yapılır',
    tips: [
      'Güvenilir, resmî olarak kayıtlı bir hayır kurumu ya da tanıdığınız bir cami seçin.',
      'Bağışın nereye harcanacağını sorun; mümkünse makbuz veya rapor isteyin.',
      'Ödemeyi yalnızca resmî kanallardan yapın — tanımadığınız kişisel kartlara ve sosyal medyadaki doğrulanmamış çağrılara karşı dikkatli olun.',
      'Zekâtınızı ayrıca hesaplayın ve hak sahiplerine ulaştığından emin olun.',
      'Çevrenizdeki ihtiyaç sahiplerini — akrabalarınızı ve komşularınızı unutmayın.',
    ],
    noPayments: '{brand} bağış veya ödeme kabul etmez — bu sayfa yalnızca bilgilendirme amaçlıdır.',
    seeAlso: 'Faydalı bağlantılar',
    zakat: 'Zekât hesaplayıcı', zakatDesc: 'Zekâtınızı hesaplayın',
    journal: 'Sadaka günlüğü', journalDesc: 'Hayır işlerinizi kaydedin',
    mosques: 'Yakındaki camiler', mosquesDesc: 'Haritada yakındaki camileri bulun',
  },
}

export default function DonatePage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.en
  const go = (key) => { setPage?.(key); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const links = [
    { key: 'zakat',   icon: '🧮', tone: 'gold', title: t.zakat,   desc: t.zakatDesc },
    { key: 'charity', icon: '🤲', tone: 'teal', title: t.journal, desc: t.journalDesc },
    { key: 'mosques', icon: '📍', tone: 'rose', title: t.mosques, desc: t.mosquesDesc },
  ]

  return (
    <div className="donate-page">
      <div className="page-hero theme-donate hero-compact">
        {/* Bütün hero-larda eyni iz: Ana səhifə › … (components/Breadcrumb) */}
        <Breadcrumb setPage={setPage} current={t.title} />
        {/* Ərəbcə dekorativ başlıq ar dilində təkrar olmasın */}
        {lang !== 'ar' && <div className="page-hero-arabic">{BRAND.arabicMotto}</div>}
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="dn-wrap">

        {/* Fəzilətlər — ayə (API) + hədislər (hadiths.js) */}
        <section className="dn-virtues" aria-labelledby="dn-virtues-title">
          <h2 id="dn-virtues-title" className="dn-links-title">{t.virtues}</h2>
          <div className="dn-vlist" data-reveal="stagger">
            <VerseCard verseRef={CHARITY_VERSE} lang={lang} />
            {CHARITY_HADITHS.map(h => <HadithCard key={h.id} h={h} lang={lang} />)}
          </div>
        </section>

        {/* Ümumi tövsiyələr */}
        <section className="dn-card" data-reveal aria-labelledby="dn-tips-title">
          <h2 id="dn-tips-title" className="dn-card-title">{t.tipsTitle}</h2>
          <ol className="dn-tips">
            {t.tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ol>
          <p className="dn-footnote">{t.noPayments.replace('{brand}', brandName(lang))}</p>
        </section>

        {/* Əlaqəli bölmələr — telefonda qruplaşdırılmış siyahı (CSS) */}
        <nav className="dn-links" data-reveal data-reveal-delay="60" aria-labelledby="dn-links-title">
          <h2 id="dn-links-title" className="dn-links-title">{t.seeAlso}</h2>
          <div className="dn-links-grid">
            {links.map(k => (
              <button key={k.key} type="button" className="dn-link" onClick={() => go(k.key)}>
                <span className={`dn-link-icon icon-tile--${k.tone}`} aria-hidden="true">{k.icon}</span>
                <span className="dn-link-body">
                  <span className="dn-link-title">{k.title}</span>
                  <span className="dn-link-desc">{k.desc}</span>
                </span>
                <span className="dn-link-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </nav>

      </div>
    </div>
  )
}
