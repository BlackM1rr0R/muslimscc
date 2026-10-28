import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import VideoSection from '../components/VideoSection';
import BookSection from '../components/BookSection';
import {
  AnnouncementBanner,
  HeroBannerDisplay,
  DailyContentDisplay,
} from '../components/AdminContentSections';
import { FadeUp, FadeIn, ScaleIn, SlideIn, Float, Pulse, Rotate, PressableCard, useParallaxHero, AnimatedNumber, BreathingDot } from '../components/Animated';
import { brandName, filled, tr } from '../config/brand';
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes';
import { QUOTES } from '../data/quotes';
import { DUAS_DATA } from '../data/duas';
import { localizeSource } from '../utils/sourceNames';

const { width: SW, height: SH } = Dimensions.get('window');
// Parallaks effekti üçün təxmini hero hündürlüyü
const HERO_HEIGHT = 420;

// ═══ GÜNÜN HƏDİSİ / DUASI — mətn yaddaşdan yazılmır ═══
// Hər ikisi repo məlumatından (data/quotes.js, data/duas.js) OLDUĞU KİMİ,
// mənbəsi ilə götürülür. Seçim veb-dəki DailyReminderBar ilə eynidir (eyni
// data faylları, eyni gün nömrəsi) — sayt və tətbiq eyni gün eyni hədisi və
// duanı göstərir.
const TEXT_LANGS = ['az', 'en', 'ru', 'tr'];
const maxLen = (texts) => Math.max(0, ...TEXT_LANGS.map(l => (texts?.[l] || '').length));
// Qısa mətnlərə üstünlük ver (kart uzanmasın); heç biri uyğun deyilsə bütün siyahı
const preferShort = (list, getTexts, limit) => {
  const short = list.filter(x => maxLen(getTexts(x)) <= limit);
  return short.length ? short : list;
};
const HADITH_POOL = preferShort(QUOTES.filter(q => q.cat === 'hadith' && q.ar && q.source), q => q.text, 100);
const DUA_POOL = preferShort(DUAS_DATA.filter(d => d.ar && d.source), d => d, 140);
// Yerli təqvim günü üzrə epoxadan keçən günlərin sayı (veb ilə eyni)
const dayNumber = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
const pick = (pool, day, offset = 0) =>
  pool.length ? pool[(((day + offset) % pool.length) + pool.length) % pool.length] : null;

// ═══ NAMAZ KARTI — 4 sürətli düymə (yalnız Icon.js-də olan ikon açarları) ═══
const HERO_QUICK = [
  { key:'prayer', nav:'Prayer', iconKey:'time' },
  { key:'jamaat', nav:'Jamaat', iconKey:'prayer' },
  { key:'announcements', nav:'Announcements', iconKey:'about' },
  { key:'donate', nav:'Donate', iconKey:'heart' },
];

const pad2 = (n) => String(n).padStart(2, '0');

// Kartda 5 fərz namazı göstərilir (günəş — Namaz ekranında)
const FARD_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Namaz kartı üçün əlavə mətnlər (i18n.js-dəki prayerCard-a əlavə)
const MQ_EXTRA = {
  az: { friday: 'Cümə namazı · zöhr azanı' },
  en: { friday: 'Friday prayer · Dhuhr adhan' },
  ru: { friday: 'Пятничный намаз · азан зухра' },
  ar: { friday: 'صلاة الجمعة · أذان الظهر' },
  tr: { friday: 'Cuma namazı · öğle ezanı' },
};

/** 'DD-MM-YYYY' → 'DD.MM' (qısa, dildən asılı olmayan tarix). */
const shortDate = (dateKey) => {
  const [d, m] = String(dateKey || '').split('-');
  return d && m ? `${d}.${m}` : '';
};

// ── Canlı geri sayım — yalnız bu kiçik komponent hər saniyə yenilənir ──
function Countdown({ at, mc, style }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [at]);

  const total = Math.max(0, Math.floor((at - now) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const spoken = (h ? mc.hm : mc.m).replace('{h}', String(h)).replace('{m}', String(m));

  return (
    <Text style={style} accessibilityRole="timer" accessibilityLabel={spoken}>
      {pad2(h)}:{pad2(m)}:{pad2(s)}
    </Text>
  );
}

// ── Növbəti namaz paneli (hero daxilində) ──
// Azan vaxtı aladhan.com-dan istifadəçinin seçdiyi şəhər üçün HESABLANIR və
// belə də yazılır (hooks/usePrayerTimes). Altında 5 namazın azan vaxtları
// cədvəli; geri sayım növbəti azana qədərdir.
function NextPrayerPanel({ lang, mc, times, cityLabel, onOpen, onRetry, isAr }) {
  const { loading, error, next, isFriday, prayers = [], nextFriday } = times;
  const extra = MQ_EXTRA[lang] || MQ_EXTRA.en;
  const name = (key) => tr(PRAYER_NAMES[key], lang) || key;
  const rtl = isAr ? st.rtlText : null;
  const flip = isAr ? st.flipX : null;

  if (next) {
    const isJumua = isFriday && !next.tomorrow && next.key === 'dhuhr';
    const fard = prayers.filter(p => FARD_KEYS.includes(p.key));
    // Cümə gələcək gündədirsə kiçik bir sətir: "Cümə namazı · zöhr azanı · 30.10 · 12:58"
    const showFriday = !!nextFriday && !nextFriday.isToday && filled(nextFriday.dhuhr);
    const spoken = [
      `${mc.nextPrayer}: ${name(next.key)}`,
      `${mc.adhan} ${next.adhan}`,
      filled(cityLabel) ? cityLabel : null,
    ].filter(Boolean).join(', ');

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onOpen}
        style={st.mqPanel}
        accessibilityRole="button"
        accessibilityLabel={spoken}
        accessibilityHint={mc.allTimes}
      >
        <View style={st.mqTopRow}>
          <BreathingDot color="#fff" size={8} />
          <Text style={st.mqLabel} numberOfLines={1}>{mc.nextPrayer}</Text>
          {next.tomorrow ? (
            <View style={st.mqTag}><Text style={st.mqTagText}>{mc.tomorrow}</Text></View>
          ) : null}
          {isJumua ? (
            <View style={[st.mqTag, st.mqTagGold]}><Text style={st.mqTagText}>{mc.jumua}</Text></View>
          ) : null}
          <View style={st.mqSpacer} />
          <Text style={st.mqAll} numberOfLines={1}>{mc.allTimes}</Text>
          <AppIcon name="chevronRight" size={14} color="rgba(255,255,255,0.85)" style={flip} />
        </View>

        <View style={st.mqMainRow}>
          <View style={st.mqNameCol}>
            <Text style={[st.mqName, rtl]} numberOfLines={1}>{name(next.key)}</Text>
            <View style={st.mqTimesRow}>
              <Text style={st.mqTime}>
                {mc.adhan} <Text style={st.mqTimeVal}>{next.adhan}</Text>
              </Text>
            </View>
          </View>
          <View style={st.mqCountCol}>
            <Countdown at={next.at} mc={mc} style={st.mqCount} />
            <Text style={st.mqCountLabel} numberOfLines={1}>{mc.untilAdhan}</Text>
          </View>
        </View>

        {/* 5 namaz: hesablanmış azan vaxtları */}
        {fard.length ? (
          <View style={st.mqGrid}>
            {fard.map(p => {
              const on = !next.tomorrow && next.key === p.key;
              const jumuaCol = isFriday && p.key === 'dhuhr';
              return (
                <View key={p.key} style={[st.mqGridCol, on && st.mqGridColOn]}>
                  <Text style={[st.mqGridName, jumuaCol && st.mqGridNameGold]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {jumuaCol ? mc.jumua : name(p.key)}
                  </Text>
                  <Text style={st.mqGridAdhan} numberOfLines={1}>{p.adhan}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {showFriday ? (
          <View style={st.mqFriday}>
            <View style={[st.mqTag, st.mqTagGold]}><Text style={st.mqTagText}>{mc.jumua}</Text></View>
            <Text style={[st.mqFridayText, rtl]} numberOfLines={1}>
              {extra.friday} · {shortDate(nextFriday.date)} · <Text style={st.mqTimeVal}>{nextFriday.dhuhr}</Text>
            </Text>
          </View>
        ) : null}

        <Text style={[st.mqNote, rtl]}>
          {filled(cityLabel) ? mc.calcCity.replace('{city}', cityLabel) : mc.calc}
        </Text>
      </TouchableOpacity>
    );
  }

  // Xəta — keşdə də məlumat yoxdur
  if (!loading && error) {
    return (
      <View style={[st.mqPanel, st.mqPanelCenter]} accessibilityRole="alert">
        <Text style={st.mqStatus}>{mc.error}</Text>
        <TouchableOpacity onPress={onRetry} activeOpacity={0.8} style={st.mqRetry} accessibilityRole="button">
          <AppIcon name="reset" size={14} color="#fff" />
          <Text style={st.mqRetryText}>{mc.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Yüklənir — hündürlük sabit qalır ki, səhifə tullanmasın
  return (
    <View style={[st.mqPanel, st.mqPanelCenter]}>
      <ActivityIndicator color="#fff" />
      <Text style={st.mqStatus}>{mc.loading}</Text>
    </View>
  );
}

// ═══ DATA ═══
const FEATURES = [
  { iconKey:'quran', key:'feature1', nav:'Quran', gradient:['#10b981','#059669'] },
  { iconKey:'hadith', key:'feature2', nav:'Hadith', gradient:['#f59e0b','#d97706'] },
  { iconKey:'prayer', key:'feature3', nav:'Prayer', gradient:['#3b82f6','#2563eb'] },
  { iconKey:'duas', key:'feature4', nav:'Duas', gradient:['#8b5cf6','#7c3aed'] },
  { iconKey:'names', key:'feature5', nav:'Names', gradient:['#ec4899','#db2777'] },
  { iconKey:'zakat', key:'feature6', nav:'Zakat', gradient:['#f97316','#ea580c'] },
];

const QUICK_LINKS = [
  { iconKey:'dhikr', label:'dhikr', nav:'Dhikr', color:'#10b981' },
  { iconKey:'qibla', label:'qibla', nav:'Qibla', color:'#3b82f6' },
  { iconKey:'calendar', label:'calendar', nav:'Calendar', color:'#8b5cf6' },
  { iconKey:'prayerguide', label:'prayerguide', nav:'PrayerGuide', color:'#f59e0b' },
  { iconKey:'hajjguide', label:'hajjguide', nav:'HajjGuide', color:'#ef4444' },
  { iconKey:'hifz', label:'hifz', nav:'Hifz', color:'#06b6d4' },
  { iconKey:'quiz', label:'quiz', nav:'Quiz', color:'#ec4899' },
  { iconKey:'dailytracker', label:'dailytracker', nav:'DailyTracker', color:'#14b8a6' },
  { iconKey:'charity', label:'charity', nav:'Charity', color:'#f97316' },
  { iconKey:'duajournal', label:'duajournal', nav:'DuaJournal', color:'#a855f7' },
  { iconKey:'quotes', label:'quotes', nav:'Quotes', color:'#6366f1' },
  { iconKey:'analytics', label:'analytics', nav:'Analytics', color:'#84cc16' },
];

const NAV_L = {
  az:{dhikr:'Zikr',qibla:'Qiblə',calendar:'Təqvim',prayerguide:'Namaz',hajjguide:'Həcc',hifz:'Hifz',quiz:'Viktorina',dailytracker:'İzləyici',analytics:'Statistika',charity:'Sədəqə',duajournal:'Jurnal',quotes:'Sitatlar'},
  en:{dhikr:'Dhikr',qibla:'Qibla',calendar:'Calendar',prayerguide:'Prayer',hajjguide:'Hajj',hifz:'Hifz',quiz:'Quiz',dailytracker:'Tracker',analytics:'Analytics',charity:'Charity',duajournal:'Journal',quotes:'Quotes'},
  ru:{dhikr:'Зикр',qibla:'Кибла',calendar:'Календарь',prayerguide:'Намаз',hajjguide:'Хадж',hifz:'Хифз',quiz:'Тест',dailytracker:'Трекер',analytics:'Статистика',charity:'Садака',duajournal:'Дуа',quotes:'Цитаты'},
  ar:{dhikr:'الذكر',qibla:'القبلة',calendar:'التقويم',prayerguide:'الصلاة',hajjguide:'الحج',hifz:'الحفظ',quiz:'اختبار',dailytracker:'المتابعة',analytics:'إحصائيات',charity:'الصدقة',duajournal:'الدعاء',quotes:'اقتباسات'},
  tr:{dhikr:'Zikir',qibla:'Kıble',calendar:'Takvim',prayerguide:'Namaz',hajjguide:'Hac',hifz:'Hıfz',quiz:'Sınav',dailytracker:'Takip',analytics:'İstatistik',charity:'Sadaka',duajournal:'Günlük',quotes:'Alıntılar'},
};

const TAWHEED = [
  { ar:'تَوْحِيدُ الرُّبُوبِيَّة', color:'#10b981', gradient:['#10b981','#059669'],
    title:{az:'Rübubiyyət Tövhidi',en:'Tawhid al-Rububiyyah',ru:'Таухид ар-Рубубийя',ar:'توحيد الربوبية',tr:'Rububiyyet Tevhidi'},
    desc:{az:'Allahın Rəbb olduğuna inanmaqdır — O hər şeyin yaradıcısı, ruzi verəni, idarəçisidir.',en:'Belief in Allah\'s Lordship — that He alone creates, provides sustenance, and governs all things.',ru:'Вера в господство Аллаха — Он один творит и управляет всем.',ar:'الإيمان بأن الله وحده هو الخالق الرازق المدبر',tr:'Allah\'ın Rablığına iman — yalnız O yaratan ve rızık verendir.'},
    ayah:'أَلاَ لَهُ الْخَلْقُ وَالأَمْرُ', ayahRef:{az:'Əraf 54',en:'Al-A\'raf 54',ru:'Аль-Аграф 54',ar:'الأعراف ٥٤',tr:'Araf 54'} },
  { ar:'تَوْحِيدُ الأُلُوهِيَّة', color:'#f59e0b', gradient:['#f59e0b','#d97706'],
    title:{az:'Uluhiyyət Tövhidi',en:'Tawhid al-Uluhiyyah',ru:'Таухид аль-Улюхийя',ar:'توحيد الألوهية',tr:'Uluhiyyet Tevhidi'},
    desc:{az:'Bütün ibadətin — namaz, dua, qurban — yalnız Allaha edilməsidir. Peyğəmbərlərin dəvətinin əsası.',en:'Dedicating all worship solely to Allah. This is the core of every prophet\'s call.',ru:'Посвящение поклонения исключительно Аллаху.',ar:'إفراد الله بالعبادة',tr:'Tüm ibadetleri yalnızca Allah\'a adamak.'},
    ayah:'وَمَا خَلَقْتُ الجِنَّ وَالإِنسَ إِلاَّ لِيَعْبُدُونِ', ayahRef:{az:'Zariyat 56',en:'Adh-Dhariyat 56',ru:'Аз-Зарийат 56',ar:'الذاريات ٥٦',tr:'Zariyat 56'} },
  { ar:'تَوْحِيدُ الأَسْمَاءِ وَالصِّفَاتِ', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'],
    title:{az:'Əsma və Sifat Tövhidi',en:'Tawhid al-Asma was-Sifat',ru:'Таухид аль-Асма',ar:'توحيد الأسماء والصفات',tr:'Esma ve Sıfat'},
    desc:{az:'Allahın Özü üçün Quran və sünnədə sabit etdiyi bütün gözəl ad və sifətlərə iman.',en:'Affirming Allah\'s beautiful Names and Attributes without likening them to creation.',ru:'Утверждение Имён и Атрибутов Аллаха.',ar:'إثبات الأسماء والصفات',tr:'Allah\'ın isim ve sıfatlarını ispat etmek.'},
    ayah:'وَلِلَّهِ الأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا', ayahRef:{az:'Əraf 180',en:'Al-A\'raf 180',ru:'Аль-Аграф 180',ar:'الأعراف ١٨٠',tr:'Araf 180'} },
];

const FIVE_PILLARS = [
  { n:1, icon:'☝️', color:'#10b981', gradient:['#10b981','#059669'], t:{az:'Şəhadət',en:'Shahada',ru:'Шахада',ar:'الشهادة',tr:'Şehadet'}, d:{az:'Allahdan başqa ilah olmadığına və Muhəmmədin Onun elçisi olduğuna şəhadət vermək.',en:'Testifying that there is no god but Allah and Muhammad is His Messenger.',ru:'Свидетельство: нет бога кроме Аллаха, Мухаммад — Его посланник.',ar:'الشهادة أن لا إله إلا الله وأن محمداً رسول الله',tr:'Allah\'tan başka ilah olmadığına ve Muhammed\'in Onun elçisi olduğuna şehadet.'} },
  { n:2, icon:'🕌', color:'#3b82f6', gradient:['#3b82f6','#2563eb'], t:{az:'Namaz',en:'Salah',ru:'Намаз',ar:'الصلاة',tr:'Namaz'}, d:{az:'Hər müsəlmana gündə 5 vaxt namaz qılmaq fərzdir: Sübh, Zöhr, Əsr, Məğrib, İşa.',en:'Performing the 5 daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha.',ru:'5 ежедневных молитв: Фаджр, Зухр, Аср, Магриб, Иша.',ar:'أداء الصلوات الخمس',tr:'Günde 5 vakit namaz kılmak farzdır.'} },
  { n:3, icon:'💰', color:'#f59e0b', gradient:['#f59e0b','#d97706'], t:{az:'Zəkat',en:'Zakat',ru:'Закят',ar:'الزكاة',tr:'Zekât'}, d:{az:'Malı nisab həddinə çatan hər müsəlman malının 2.5%-ni ehtiyacı olanlara verməlidir.',en:'Giving 2.5% of wealth to those in need once nisab threshold is reached.',ru:'Отдать 2.5% имущества нуждающимся при достижении нисаба.',ar:'إخراج ٢.٥٪ من المال للفقراء',tr:'Nisap miktarına ulaşanların malının %2.5\'ini vermesi.'} },
  { n:4, icon:'🌙', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'], t:{az:'Oruc',en:'Sawm',ru:'Пост',ar:'الصيام',tr:'Oruç'}, d:{az:'Ramazan ayında sübhdən məğribə qədər yemək, içmək və iftar edən şeylərdən çəkinmək.',en:'Fasting from dawn to sunset during the month of Ramadan.',ru:'Пост от рассвета до заката в месяц Рамадан.',ar:'الصيام من الفجر إلى المغرب في رمضان',tr:'Ramazan\'da imsak\'tan iftar\'a oruç tutmak.'} },
  { n:5, icon:'🕋', color:'#ef4444', gradient:['#ef4444','#dc2626'], t:{az:'Həcc',en:'Hajj',ru:'Хадж',ar:'الحج',tr:'Hac'}, d:{az:'İmkanı olan hər müsəlman ömründə ən azı bir dəfə Məkkəyə Həcc ziyarətini yerinə yetirməlidir.',en:'Performing Hajj pilgrimage to Mecca at least once in a lifetime if able.',ru:'Совершить Хадж в Мекку хотя бы раз в жизни.',ar:'أداء الحج مرة واحدة في العمر للمستطيع',tr:'Ömründe en az bir kere Mekke\'ye hac yapmak.'} },
];

// 99 ad — name = Az transliterasiya (yalnız az-da göstərilir — veb ana səhifə ilə eyni),
// meaning = aktiv dilə uyğun seçilir (ərəbcədə göstərilmir — ərəb adı onsuz da var).
const ALLAH_NAMES = [
  { ar:'ٱلرَّحْمَٰن', name:'Rəhman', color:'#10b981', meaning:{ az:'Mərhəmətli',         en:'The Most Gracious',          ru:'Всемилостивый',         ar:'الرحمن', tr:'Rahmân' } },
  { ar:'ٱلرَّحِيم',  name:'Rəhim',  color:'#f59e0b', meaning:{ az:'Rəhmli',              en:'The Most Merciful',          ru:'Милосердный',           ar:'الرحيم', tr:'Rahîm' } },
  { ar:'ٱلْمَلِك',   name:'Malik',  color:'#8b5cf6', meaning:{ az:'Hökmdar',             en:'The King',                   ru:'Царь',                  ar:'الملك',  tr:'Melik' } },
  { ar:'ٱلْقُدُّوس', name:'Quddus', color:'#3b82f6', meaning:{ az:'Pak olan',            en:'The Most Pure',              ru:'Святой',                ar:'القدوس', tr:'Kuddûs' } },
  { ar:'ٱلسَّلَٰم',  name:'Salam',  color:'#ec4899', meaning:{ az:'Sülh verən',          en:'Source of Peace',            ru:'Источник мира',         ar:'السلام', tr:'Selâm' } },
  { ar:'ٱلْعَزِيز',  name:'Əziz',   color:'#f97316', meaning:{ az:'Qüdrətli',            en:'The Almighty',               ru:'Могущественный',        ar:'العزيز', tr:'Azîz' } },
  { ar:'ٱلْغَفُور',  name:'Ğafur',  color:'#14b8a6', meaning:{ az:'Bağışlayan',          en:'The Forgiving',              ru:'Прощающий',             ar:'الغفور', tr:'Gafûr' } },
  { ar:'ٱلْوَدُود',  name:'Vədud',  color:'#a855f7', meaning:{ az:'Sevən',               en:'The Loving',                 ru:'Любящий',               ar:'الودود', tr:'Vedûd' } },
  { ar:'ٱلْحَكِيم',  name:'Həkim',  color:'#6366f1', meaning:{ az:'Hikmət sahibi',       en:'The Wise',                   ru:'Мудрый',                ar:'الحكيم', tr:'Hakîm' } },
  { ar:'ٱلنُّور',    name:'Nur',    color:'#fbbf24', meaning:{ az:'Nur (İşıq)',          en:'The Light',                  ru:'Свет',                  ar:'النور',  tr:'Nûr' } },
  { ar:'ٱلتَّوَّاب', name:'Tövvab', color:'#84cc16', meaning:{ az:'Tövbələri qəbul edən', en:'The Acceptor of Repentance', ru:'Принимающий покаяние', ar:'التواب', tr:'Tevvâb' } },
  { ar:'ٱلْمُؤْمِن', name:'Mömin',  color:'#ef4444', meaning:{ az:'Güvən verən',         en:'The Granter of Security',    ru:'Дарующий веру',         ar:'المؤمن', tr:"Mü'min" } },
];

// ═══════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.home || T.az.home;
  const mc = t.prayerCard || T.az.home.prayerCard;
  const navT = T[lang]?.nav || T.az.nav;
  const navLabels = NAV_L[lang] || NAV_L.az;
  const isAr = lang === 'ar';

  // Seçilmiş şəhərin bugünkü azan vaxtları (Camaat ekranı ilə eyni keş — bir sorğu)
  const times = usePrayerTimes();
  const locality = tr(times.city?.name, lang);

  // Parallax scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const { heroScale, heroTranslate, heroOpacity } = useParallaxHero(scrollY, HERO_HEIGHT);

  // Günün hədisi və duası (veb ilə eyni seçim)
  const day = dayNumber();
  const hadith = pick(HADITH_POOL, day, 1);
  const dua = pick(DUA_POOL, day, 2);
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shL = dark ? Shadows.dark.lg : Shadows.lg;

  const navigate = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>

      {/* Ekranda məzmunun üstünə düşən üzən başlıq/düymə yoxdur
          (sahibin qaydası: heç nə məzmunu örtməsin). */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >

        {/* ═══ PARALLAX HERO ═══ */}
        <Animated.View style={{ transform: [{ scale: heroScale }, { translateY: heroTranslate }] }}>
          <LinearGradient
            colors={dark ? [c.ctaGradStart, c.ctaGradMid, c.ctaGradEnd] : [c.primaryDark, c.primary, c.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.hero}
          >
            {/* Rotating decorative ring */}
            <Rotate duration={40000} style={st.rotatingRing}>
              <View style={st.rotatingRingInner} />
            </Rotate>

            {/* ═══ BAŞLIQ — ad, seçilmiş şəhər, növbəti namaz, 4 sürətli düymə ═══ */}
            <Animated.View style={[st.heroInner, { opacity: heroOpacity }]}>
              <FadeIn delay={100}>
                <View style={st.heroBadge}>
                  <Text style={st.heroBadgeText}>{t.badge}</Text>
                </View>
              </FadeIn>

              <FadeUp delay={180}>
                <Text style={st.heroTitle} accessibilityRole="header">{brandName(lang)}</Text>
              </FadeUp>

              {filled(locality) ? (
                <FadeUp delay={260}>
                  <View style={st.heroLocRow}>
                    <AppIcon name="location" size={15} color="rgba(255,255,255,0.85)" />
                    <Text style={st.heroLoc}>{locality}</Text>
                  </View>
                </FadeUp>
              ) : null}

              <FadeUp delay={340} style={st.heroBlock}>
                <NextPrayerPanel
                  lang={lang}
                  mc={mc}
                  times={times}
                  cityLabel={locality}
                  isAr={isAr}
                  onOpen={() => navigate('Prayer')}
                  onRetry={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    times.reload();
                  }}
                />
              </FadeUp>

              <FadeUp delay={420} style={st.heroBlock}>
                <View style={st.mqQuickRow}>
                  {HERO_QUICK.map(q => (
                    <TouchableOpacity
                      key={q.key}
                      style={st.mqQuick}
                      activeOpacity={0.8}
                      onPress={() => navigate(q.nav)}
                      accessibilityRole="button"
                      accessibilityLabel={navT[q.key] || mc.quick[q.key]}
                    >
                      <View style={st.mqQuickIcon}>
                        <AppIcon name={q.iconKey} size={20} color="#fff" />
                      </View>
                      <Text style={st.mqQuickLabel} numberOfLines={2}>{mc.quick[q.key]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FadeUp>
            </Animated.View>

            {/* Decorative blurred circles */}
            <View style={st.heroCircle1} />
            <View style={st.heroCircle2} />
            <View style={st.heroCircle3} />
          </LinearGradient>
        </Animated.View>

        <View style={st.contentWrap}>

          {/* ═══ GÜNÜN HƏDİSİ (data/quotes.js — olduğu kimi, mənbəsi ilə) ═══ */}
          {hadith ? (
            <ScaleIn delay={200}>
              <View style={[st.floatingCard, { backgroundColor: c.card, borderColor: c.cardBorder }, shL]}>
                <LinearGradient
                  colors={['transparent', c.goldBg]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={st.dailyHeader}>
                  <View style={[st.dailyIcon, { backgroundColor: c.goldBg }]}>
                    <AppIcon name="hadith" size={18} color={c.gold} />
                  </View>
                  <Text style={[st.dailyLabel, { color: c.gold }]}>
                    {lang === 'az' ? 'GÜNÜN HƏDİSİ' : lang === 'ru' ? 'ХАДИС ДНЯ' : lang === 'ar' ? 'حديث اليوم' : lang === 'tr' ? 'GÜNÜN HADİSİ' : 'HADITH OF THE DAY'}
                  </Text>
                </View>
                <Text style={[st.dailyArabic, { color: c.text }]}>{hadith.ar}</Text>
                {/* Ərəb dilində mətn artıq yuxarıdadır — iki dəfə göstərilməsin */}
                {!isAr ? (
                  <Text style={[st.dailyText, { color: c.textSecondary }]}>{hadith.text?.[lang] || ''}</Text>
                ) : null}
                <View style={[st.sourceChip, { backgroundColor: c.goldBg }]}>
                  <Text style={[st.sourceChipText, { color: c.gold }]}>— {localizeSource(hadith.source, lang)}</Text>
                </View>
              </View>
            </ScaleIn>
          ) : null}

          {/* Elanlar — admin paneldən; aktiv elan yoxdursa heç nə göstərmir.
              Elan aşağıda itməsin deyə yuxarıya, günün hədisindən sonra qoyulub.
              Bannerin öz 16px kənar boşluğu + 4px = kartlarla eyni 20px xətt. */}
          <View style={st.annWrap}>
            <AnnouncementBanner />
          </View>

          {/* ═══ AYƏ ═══ */}
          <FadeUp delay={300}>
            <View style={[st.ayahCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <Float distance={8}>
                <View style={[st.ayahIconWrap, { backgroundColor: c.goldBg }]}>
                  <AppIcon name="crescent" size={32} color={c.gold} />
                </View>
              </Float>
              <Text style={[st.ayahText, { color: c.text }]}>"{t.ayah}"</Text>
              <View style={[st.ayahRefBadge, { backgroundColor: c.primaryBg }]}>
                <Text style={[st.ayahRef, { color: c.primary }]}>{t.ayahRef}</Text>
              </View>
            </View>
          </FadeUp>

          {/* ═══ GÜNÜN DUASI (data/duas.js — olduğu kimi, mənbəsi ilə) ═══ */}
          {dua ? (
            <FadeUp delay={400}>
              <LinearGradient
                colors={dark ? ['#1a3d2a', '#0d2818'] : ['#e8f4ee', '#f0faf4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[st.duaCard, { borderColor: c.primaryBorder }, sh]}
              >
                <View style={st.dailyHeader}>
                  <View style={[st.dailyIcon, { backgroundColor: c.primaryBg }]}>
                    <AppIcon name="duas" size={18} color={c.primary} />
                  </View>
                  <Text style={[st.dailyLabel, { color: c.primary }]}>
                    {lang === 'az' ? 'GÜNÜN DUASI' : lang === 'ru' ? 'ДУА ДНЯ' : lang === 'ar' ? 'دعاء اليوم' : lang === 'tr' ? 'GÜNÜN DUASI' : 'DUA OF THE DAY'}
                  </Text>
                </View>
                <Text style={[st.dailyArabic, { color: c.text }]}>{dua.ar}</Text>
                {!isAr ? (
                  <Text style={[st.dailyText, { color: c.textSecondary }]}>{dua[lang] || ''}</Text>
                ) : null}
                <View style={[st.sourceChip, { backgroundColor: c.primaryBg }]}>
                  <Text style={[st.sourceChipText, { color: c.primary }]}>— {localizeSource(dua.source, lang)}</Text>
                </View>
              </LinearGradient>
            </FadeUp>
          ) : null}


          {/* ═══ QUICK LINKS — colorful bubbles ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>
                {lang === 'az' ? 'Sürətli Keçid' : lang === 'ru' ? 'Быстрые Ссылки' : lang === 'ar' ? 'روابط سريعة' : lang === 'tr' ? 'Hızlı Erişim' : 'Quick Access'}
              </Text>
            </FadeUp>
            <FadeUp delay={100}>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Ən çox istifadə olunan xüsusiyyətlərə cəld keçid' : lang === 'ru' ? 'Быстрый доступ к популярным функциям' : lang === 'ar' ? 'الوصول السريع للميزات الأكثر استخداماً' : lang === 'tr' ? 'En çok kullanılan özelliklere hızlı erişim' : 'Quick access to most used features'}
              </Text>
            </FadeUp>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.quickScroll}>
              {QUICK_LINKS.map((q, i) => (
                <FadeUp key={i} delay={100 + i * 40}>
                  <PressableCard
                    style={[st.quickLink, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
                    onPress={() => navigate(q.nav)}
                  >
                    <View style={[st.quickIconW, { backgroundColor: q.color + '18' }]}>
                      <AppIcon name={q.iconKey} size={24} color={q.color} />
                    </View>
                    <Text style={[st.quickLabel, { color: c.text }]} numberOfLines={1}>{navLabels[q.label]}</Text>
                  </PressableCard>
                </FadeUp>
              ))}
            </ScrollView>
          </View>

          {/* ═══ İSLAMIN 5 SÜTUNU — with gradient cards ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>
                {lang === 'az' ? 'İslamın 5 Sütunu' : lang === 'ru' ? '5 Столпов Ислама' : lang === 'ar' ? 'أركان الإسلام الخمسة' : lang === 'tr' ? 'İslamın 5 Şartı' : '5 Pillars of Islam'}
              </Text>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Hər müsəlmanın bilməli olduğu əsas ibadətlər' : lang === 'ru' ? 'Основные обязанности каждого мусульманина' : lang === 'ar' ? 'الأركان الأساسية لكل مسلم' : lang === 'tr' ? 'Her Müslümanın bilmesi gereken temel ibadetler' : 'Core worships every Muslim must know'}
              </Text>
            </FadeUp>
            {FIVE_PILLARS.map((p, i) => (
              <FadeUp key={i} delay={i * 100}>
                <PressableCard
                  style={[st.pillarCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
                  haptic="light"
                >
                  <LinearGradient
                    colors={[p.color + '18', p.color + '03']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={st.pillarRow}>
                    <LinearGradient colors={p.gradient} style={st.pillarNumBadge}>
                      <Text style={st.pillarNum}>{p.n}</Text>
                    </LinearGradient>
                    <Text style={st.pillarIcon}>{p.icon}</Text>
                    <Text style={[st.pillarTitle, { color: c.text }]}>{p.t[lang] || p.t.en}</Text>
                  </View>
                  <Text style={[st.pillarDesc, { color: c.textSecondary }]}>{p.d[lang] || p.d.en}</Text>
                </PressableCard>
              </FadeUp>
            ))}
          </View>

          {/* ═══ TÖVHİD ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>
                {lang === 'az' ? 'Tövhid — Allahın Birliyi' : lang === 'ru' ? 'Таухид — Единство Аллаха' : lang === 'ar' ? 'التوحيد — وحدانية الله' : lang === 'tr' ? 'Tevhid — Allah\'ın Birliği' : 'Tawheed — Oneness of Allah'}
              </Text>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Tövhid üç əsas qismə bölünür' : lang === 'ru' ? 'Таухид делится на три вида' : lang === 'ar' ? 'التوحيد ثلاثة أقسام' : lang === 'tr' ? 'Tevhid üç kısma ayrılır' : 'Tawheed has three essential categories'}
              </Text>
            </FadeUp>
            {TAWHEED.map((tw, i) => (
              <FadeUp key={i} delay={i * 120}>
                <View style={[st.tawheedCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                  <LinearGradient
                    colors={[tw.color + '15', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={[st.twIndicator, { backgroundColor: tw.color }]} />
                  <Text style={[st.twAr, { color: tw.color }]}>{tw.ar}</Text>
                  <Text style={[st.twTitle, { color: c.text }]}>{tw.title[lang] || tw.title.en}</Text>
                  <Text style={[st.twDesc, { color: c.textSecondary }]}>{tw.desc[lang] || tw.desc.en}</Text>
                  <View style={[st.twAyahBox, { backgroundColor: tw.color + '10', borderColor: tw.color + '25' }]}>
                    <Text style={[st.twAyah, { color: tw.color }]}>{tw.ayah}</Text>
                    <Text style={[st.twAyahRef, { color: tw.color + 'bb' }]}>— {tw.ayahRef[lang] || tw.ayahRef.en}</Text>
                  </View>
                </View>
              </FadeUp>
            ))}
          </View>

          {/* ═══ ALLAHIN ADLARI — horizontal scroll gradient chips ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>
                {lang === 'az' ? 'Allahın Gözəl Adları' : lang === 'ru' ? 'Прекрасные Имена Аллаха' : lang === 'ar' ? 'أسماء الله الحسنى' : lang === 'tr' ? 'Allah\'ın Güzel İsimleri' : 'Beautiful Names of Allah'}
              </Text>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Əsmaül-Hüsna — ən gözəl 99 ad' : lang === 'ru' ? '99 прекрасных имён Аллаха' : lang === 'ar' ? '٩٩ اسماً حسنى' : lang === 'tr' ? '99 en güzel isim' : '99 most beautiful names'}
              </Text>
            </FadeUp>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
              {ALLAH_NAMES.map((n, i) => (
                <FadeUp key={i} delay={i * 50}>
                  <PressableCard onPress={() => navigate('Names')} style={{}}>
                    <LinearGradient
                      colors={[n.color + '22', n.color + '08']}
                      style={[st.nameChip, { borderColor: n.color + '40' }]}
                    >
                      <Text style={[st.nameAr, { color: n.color }]}>{n.ar}</Text>
                      {lang === 'az' ? <Text style={[st.nameTr, { color: c.text }]}>{n.name}</Text> : null}
                      {lang !== 'ar' ? <Text style={[st.nameEn, { color: c.textMuted }]}>{n.meaning?.[lang]}</Text> : null}
                    </LinearGradient>
                  </PressableCard>
                </FadeUp>
              ))}
            </ScrollView>
          </View>

          {/* ═══ XÜSUSİYYƏTLƏR — gradient feature cards ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>{t.featTitle}</Text>
              <Text style={[st.secSub, { color: c.textSecondary }]}>{t.featSub}</Text>
            </FadeUp>
            {FEATURES.map((f, i) => (
              <FadeUp key={i} delay={i * 80}>
                <PressableCard
                  style={[st.featureCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
                  onPress={() => navigate(f.nav)}
                >
                  <LinearGradient colors={f.gradient} style={st.featureIconW}>
                    <AppIcon name={f.iconKey} size={26} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.featureTitle, { color: c.text }]}>{t[`${f.key}Title`]}</Text>
                    <Text style={[st.featureDesc, { color: c.textSecondary }]}>{t[`${f.key}Desc`]}</Text>
                  </View>
                  <View style={[st.featureArrow, { backgroundColor: c.primaryBg }]}>
                    <AppIcon name="chevronRight" size={18} color={c.primary} style={isAr ? st.flipX : null} />
                  </View>
                </PressableCard>
              </FadeUp>
            ))}
          </View>

          {/* ═══ ADMIN-DRIVEN CONTENT (web ilə eyni Firebase) ═══ */}
          {/* Admin hero banner — Ramazan, Eyd kimi xüsusi günlər üçün */}
          <HeroBannerDisplay />

          {/* Bugünkü ayə / zikr / söz (admin paneldən təyin olunur) */}
          <DailyContentDisplay />

          {/* ═══ VIDEO SECTION ═══ */}
          <VideoSection />

          {/* ═══ BOOK SECTION ═══ */}
          <BookSection />

          {/* ═══ CTA ═══ */}
          <FadeUp delay={200}>
            <LinearGradient
              colors={dark ? [c.ctaGradStart, c.ctaGradMid, c.ctaGradEnd] : [c.primaryDark, c.primary, c.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[st.ctaCard, Shadows.floating]}
            >
              <Float distance={4}>
                <AppIcon name="crescent" size={40} color="#fff" style={{ opacity: 0.4, marginBottom: 12 }} />
              </Float>
              <Text style={st.ctaTitle}>{t.ctaTitle}</Text>
              <Text style={st.ctaDesc}>{t.ctaDesc}</Text>
              <PressableCard
                style={[st.ctaBtn, Shadows.button]}
                onPress={() => navigate('Quran')}
                haptic="medium"
              >
                <AppIcon name="quran" size={20} color={c.primary} style={{ marginRight: 8 }} />
                <Text style={[st.ctaBtnText, { color: c.primary }]}>{t.ctaBtn}</Text>
              </PressableCard>
              <View style={st.ctaCircle1} />
              <View style={st.ctaCircle2} />
            </LinearGradient>
          </FadeUp>

          <View style={{ height: 60 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  // Hero
  hero: {
    paddingTop: 28,
    paddingBottom: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  heroInner: { width: '100%', maxWidth: 520, alignItems: 'center' },
  heroBlock: { alignSelf: 'stretch' },
  rotatingRing: {
    position: 'absolute',
    width: 400,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.1,
  },
  rotatingRingInner: {
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  heroBadgeText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5, textAlign: 'center' },
  heroTitle: { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6, letterSpacing: -0.8, lineHeight: 36 },
  heroLocRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 18 },
  heroLoc: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.88)' },

  // Növbəti namaz paneli (şüşə effektli)
  mqPanel: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  mqPanelCenter: { minHeight: 128, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mqTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mqLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.92)', letterSpacing: 0.4, flexShrink: 1 },
  mqTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  mqTagGold: { backgroundColor: 'rgba(240,192,64,0.45)' },
  mqTagText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  mqSpacer: { flex: 1 },
  mqAll: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', flexShrink: 1 },
  mqMainRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10, gap: 12 },
  mqNameCol: { flex: 1, minWidth: 0 },
  mqName: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, lineHeight: 32 },
  mqTimesRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 2, marginTop: 2 },
  mqTime: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  mqTimeVal: { color: '#fff', fontWeight: '800', fontVariant: ['tabular-nums'] },
  mqCountCol: { alignItems: 'flex-end' },
  mqCount: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5, fontVariant: ['tabular-nums'], writingDirection: 'ltr' },
  mqCountLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  mqNote: { fontSize: 11, lineHeight: 15, color: 'rgba(255,255,255,0.72)', marginTop: 10 },
  // Azan cədvəli
  mqGrid: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  mqGridCol: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 4, borderRadius: BorderRadius.sm },
  mqGridColOn: { backgroundColor: 'rgba(255,255,255,0.16)' },
  mqGridName: { fontSize: 11, lineHeight: 15, fontWeight: '700', color: 'rgba(255,255,255,0.82)' },
  mqGridNameGold: { color: '#fde68a' },
  mqGridAdhan: { fontSize: 14, lineHeight: 20, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] },
  mqFriday: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  mqFridayText: { flexShrink: 1, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  mqStatus: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  mqRetry: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, minHeight: 40, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  mqRetryText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  flipX: { transform: [{ scaleX: -1 }] },

  // 4 sürətli düymə (Vaxtlar · Camaat · Elanlar · Xeyriyyə)
  mqQuickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  mqQuick: {
    flex: 1,
    minHeight: 78,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mqQuickIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  mqQuickLabel: { fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 15 },
  heroCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)', top: -100, right: -80 },
  heroCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -60, left: -50 },
  heroCircle3: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.03)', top: '50%', right: -40 },

  // Content wrap
  contentWrap: { marginTop: -24 },
  annWrap: { paddingHorizontal: 4 },

  // Floating daily hadith card
  floatingCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dailyIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dailyLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  dailyArabic: { fontSize: 22, textAlign: 'right', lineHeight: 38, marginBottom: 14, writingDirection: 'rtl' },
  dailyText: { fontSize: 15, lineHeight: 24, marginBottom: 14 },
  sourceChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  sourceChipText: { fontSize: 12, fontWeight: '700' },

  // Ayah card
  ayahCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 28,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ayahIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ayahText: { fontSize: 17, fontStyle: 'italic', textAlign: 'center', lineHeight: 28, marginBottom: 14 },
  ayahRefBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  ayahRef: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

  // Dua card
  duaCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },

  // Section
  sec: { paddingHorizontal: 20, marginTop: 40 },
  secTitle: { fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  secSub: { fontSize: 14, marginBottom: 22, lineHeight: 22 },

  // Quick links
  quickScroll: { paddingVertical: 8, gap: 12, paddingHorizontal: 2 },
  quickLink: { width: 92, paddingVertical: 16, paddingHorizontal: 8, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center' },
  quickIconW: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // 5 Pillars
  pillarCard: { padding: 22, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  pillarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 14 },
  pillarNumBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pillarNum: { fontSize: 17, fontWeight: '800', color: '#fff' },
  pillarIcon: { fontSize: 32 },
  pillarTitle: { flex: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  pillarDesc: { fontSize: 14, lineHeight: 22 },

  // Tawheed
  tawheedCard: { padding: 22, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 14, overflow: 'hidden', position: 'relative' },
  twIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  twAr: { fontSize: 22, textAlign: 'right', marginBottom: 10, marginLeft: 10, lineHeight: 36 },
  twTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, marginLeft: 10, letterSpacing: -0.3 },
  twDesc: { fontSize: 14, lineHeight: 23, marginBottom: 16, marginLeft: 10 },
  twAyahBox: { padding: 18, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', marginLeft: 10 },
  twAyah: { fontSize: 18, textAlign: 'center', lineHeight: 32 },
  twAyahRef: { fontSize: 11, fontWeight: '700', marginTop: 8, letterSpacing: 0.3 },

  // Allah names
  nameChip: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: BorderRadius.lg, borderWidth: 1.5, alignItems: 'center', minWidth: 100 },
  nameAr: { fontSize: 26, marginBottom: 6 },
  nameTr: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  nameEn: { fontSize: 10, fontWeight: '500' },

  // Features
  featureCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 12 },
  featureIconW: { width: 56, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  featureTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
  featureDesc: { fontSize: 13, lineHeight: 20 },
  featureArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // CTA
  ctaCard: {
    marginHorizontal: 20,
    marginTop: 40,
    padding: 36,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 12, letterSpacing: -0.5, textAlign: 'center' },
  ctaDesc: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 28, lineHeight: 24 },
  ctaBtn: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 16, borderRadius: BorderRadius.xl, flexDirection: 'row', alignItems: 'center' },
  ctaBtnText: { fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
  ctaCircle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.06)', top: -80, left: -60 },
  ctaCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -60, right: -40 },
});
