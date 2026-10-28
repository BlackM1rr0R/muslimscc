// ═══════════════════════════════════════════════════════
// Xeyriyyə və ianə — bələdçi (web /donate — src/pages/DonatePage.jsx ilə eyni ideya)
//
// Qayda: Muslims.cc ianə QƏBUL ETMİR və heç bir təşkilat adından pul
// toplamır — burada rekvizit, ödəniş, məbləğ, irəliləyiş zolağı YOXDUR.
// Ekran yalnız:
//   • sədəqənin fəzilətini — data/quotes.js-dəki mövcud hədislərdən OLDUĞU
//     KİMİ, mənbəsi ilə (mətn yaddaşdan yazılmır);
//   • zəkat / sədəqə / etibarlı ünvan haqqında qısa praktik bələdçini;
//   • Zəkat kalkulyatoru, Sədəqə gündəliyi və Məscid tapma ekranlarına
//     keçidləri göstərir.
// ═══════════════════════════════════════════════════════

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';
import { BRAND, filled } from '../config/brand';
import { localizeSource } from '../utils/sourceNames';
import { QUOTES } from '../data/quotes';

// Sədəqə hədisləri — data/quotes.js-dən mənbəyə görə seçilir (mətn dəyişmir).
// Sıra ekrandakı sıradır; faylda tapılmayan qeyd sadəcə göstərilmir.
const VIRTUE_SOURCES = ['Muslim 2588', 'Tirmizi 2616', 'Buxari 1426', 'Buxari 2989'];
const VIRTUES = VIRTUE_SOURCES
  .map(src => QUOTES.find(q => q.cat === 'hadith' && q.source === src && filled(q.ar)))
  .filter(Boolean);



const LABELS = {
  az: {
    title: 'Xeyriyyə və ianə',
    subtitle: 'Sədəqə və zəkat üçün qısa bələdçi',
    virtues: 'Sədəqənin fəziləti',
    hadith: 'Hədis',
    guide: 'Necə kömək etmək olar',
    zakatT: 'Zəkat', zakatD: 'Malı nisab həddinə çatan müsəlmana fərzdir. Məbləği zəkat kalkulyatoru ilə hesablayın.',
    sadaqaT: 'Sədəqə', sadaqaD: 'Könüllü xeyir əməlidir — istənilən vaxt və istənilən miqdarda verilə bilər.',
    trustT: 'Etibarlı ünvan', trustD: 'İanəni rəsmi qeydiyyatlı xeyriyyə təşkilatlarına və ya tanıdığınız məscidin rəsmi hesabına edin. Pul istəyən şübhəli mesaj və linklərə diqqət edin.',
    noPayments: `${BRAND.name.az} ianə qəbul etmir və heç bir təşkilat adından pul toplamır.`,
    seeAlso: 'Faydalı alətlər',
    zakat: 'Zəkat kalkulyatoru', zakatDesc: 'Zəkatınızı hesablayın',
    journal: 'Şəxsi sədəqə gündəliyi', journalDesc: 'Öz xeyir əməllərinizi qeyd edin',
    mosques: 'Yaxınlıqdakı məscidlər', mosquesDesc: 'Xəritədə ən yaxın məscidləri tapın',
  },
  en: {
    title: 'Charity & Giving',
    subtitle: 'A short guide to sadaqah and zakat',
    virtues: 'The virtue of charity',
    hadith: 'Hadith',
    guide: 'How to help',
    zakatT: 'Zakat', zakatD: 'Obligatory for a Muslim whose wealth reaches the nisab threshold. Work out the amount with the zakat calculator.',
    sadaqaT: 'Sadaqah', sadaqaD: 'A voluntary good deed — it can be given at any time and in any amount.',
    trustT: 'A trusted recipient', trustD: 'Give to officially registered charities or to the official account of a mosque you know. Be careful with suspicious messages and links asking for money.',
    noPayments: `${BRAND.name.en} does not accept donations and does not collect money on behalf of any organisation.`,
    seeAlso: 'Useful tools',
    zakat: 'Zakat calculator', zakatDesc: 'Calculate your zakat',
    journal: 'Personal charity journal', journalDesc: 'Keep a record of your own good deeds',
    mosques: 'Nearby mosques', mosquesDesc: 'Find the closest mosques on the map',
  },
  ru: {
    title: 'Благотворительность и пожертвования',
    subtitle: 'Краткое руководство по садаке и закяту',
    virtues: 'Достоинство милостыни',
    hadith: 'Хадис',
    guide: 'Как помочь',
    zakatT: 'Закят', zakatD: 'Обязателен для мусульманина, чьё имущество достигло нисаба. Рассчитайте сумму в калькуляторе закята.',
    sadaqaT: 'Садака', sadaqaD: 'Добровольное доброе дело — её можно давать в любое время и в любом размере.',
    trustT: 'Надёжный получатель', trustD: 'Жертвуйте официально зарегистрированным благотворительным организациям или на официальный счёт знакомой вам мечети. Остерегайтесь подозрительных сообщений и ссылок с просьбой о деньгах.',
    noPayments: `${BRAND.name.ru} не принимает пожертвования и не собирает деньги от имени каких-либо организаций.`,
    seeAlso: 'Полезные инструменты',
    zakat: 'Калькулятор закята', zakatDesc: 'Рассчитайте свой закят',
    journal: 'Личный дневник милостыни', journalDesc: 'Записывайте свои добрые дела',
    mosques: 'Мечети поблизости', mosquesDesc: 'Найдите ближайшие мечети на карте',
  },
  ar: {
    title: 'الصدقة والتبرع',
    subtitle: 'دليل مختصر للصدقة والزكاة',
    virtues: 'فضل الصدقة',
    hadith: 'حديث',
    guide: 'كيف تساعد',
    zakatT: 'الزكاة', zakatD: 'فريضة على المسلم الذي بلغ ماله النصاب. احسب المبلغ بحاسبة الزكاة.',
    sadaqaT: 'الصدقة', sadaqaD: 'عمل خير تطوعي — يمكن إخراجها في أي وقت وبأي مقدار.',
    trustT: 'جهة موثوقة', trustD: 'تبرّع للجمعيات الخيرية المسجلة رسميًا أو للحساب الرسمي لمسجد تعرفه. واحذر من الرسائل والروابط المشبوهة التي تطلب المال.',
    noPayments: `${BRAND.name.ar} لا يقبل التبرعات ولا يجمع الأموال باسم أي جهة.`,
    seeAlso: 'أدوات مفيدة',
    zakat: 'حاسبة الزكاة', zakatDesc: 'احسب زكاتك',
    journal: 'يوميات الصدقة الشخصية', journalDesc: 'سجّل أعمالك الخيرية',
    mosques: 'المساجد القريبة', mosquesDesc: 'اعثر على أقرب المساجد على الخريطة',
  },
  tr: {
    title: 'Hayır ve Bağış',
    subtitle: 'Sadaka ve zekât için kısa rehber',
    virtues: 'Sadakanın fazileti',
    hadith: 'Hadis',
    guide: 'Nasıl yardım edilir',
    zakatT: 'Zekât', zakatD: 'Malı nisap miktarına ulaşan Müslümana farzdır. Miktarı zekât hesaplayıcı ile hesaplayın.',
    sadaqaT: 'Sadaka', sadaqaD: 'Gönüllü bir hayır işidir — her zaman ve her miktarda verilebilir.',
    trustT: 'Güvenilir adres', trustD: 'Bağışınızı resmî olarak kayıtlı hayır kurumlarına veya tanıdığınız caminin resmî hesabına yapın. Para isteyen şüpheli mesaj ve bağlantılara dikkat edin.',
    noPayments: `${BRAND.name.tr} bağış kabul etmez ve hiçbir kurum adına para toplamaz.`,
    seeAlso: 'Faydalı araçlar',
    zakat: 'Zekât hesaplayıcı', zakatDesc: 'Zekâtınızı hesaplayın',
    journal: 'Kişisel sadaka günlüğü', journalDesc: 'Kendi hayır işlerinizi kaydedin',
    mosques: 'Yakındaki camiler', mosquesDesc: 'Haritada en yakın camileri bulun',
  },
};

// Hero rəngi — web .theme-donate kimi yaşıl (HERO_THEMES.charity)
const HERO_THEME = 'charity';

export default function DonateScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;
  const t = LABELS[lang] || LABELS.en;
  const isAr = lang === 'ar';
  const rtl = isAr ? styles.rtl : null;

  const go = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { navigation?.navigate?.(route); } catch {}
  };

  const guide = [
    { key: 'zakat', icon: 'zakat', title: t.zakatT, desc: t.zakatD, route: 'Zakat' },
    { key: 'sadaqa', icon: 'charity', title: t.sadaqaT, desc: t.sadaqaD, route: 'Charity' },
    { key: 'trust', icon: 'heart', title: t.trustT, desc: t.trustD },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الصَّدَقَة" title={t.title} subtitle={t.subtitle} theme={HERO_THEME} />

      <View style={styles.content}>

        {/* ── Sədəqənin fəziləti — data/quotes.js-dən olduğu kimi ── */}
        {VIRTUES.length ? (
          <FadeUp delay={60}>
            <Text style={[styles.sectionLabel, { color: c.textMuted }, rtl]}>{t.virtues.toUpperCase()}</Text>
          </FadeUp>
        ) : null}
        {VIRTUES.map((q, i) => {
          // Ərəbcədə yalnız əsl mətn göstərilir (tərcümə yoxdur)
          const text = isAr ? '' : (q.text?.[lang] || '');
          return (
            <ScaleIn key={q.source} delay={100 + i * 60}>
              <View style={[styles.hadithCard, { backgroundColor: c.card, borderColor: c.gold + '40' }, sh]}>
                <LinearGradient
                  colors={[c.goldBg, 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={[styles.eyebrowPill, { backgroundColor: c.goldBg }]}>
                  <Text style={[styles.eyebrow, { color: c.gold }]}>{t.hadith.toUpperCase()}</Text>
                </View>
                <Text style={[styles.hadithAr, { color: c.text }]}>{q.ar}</Text>
                {filled(text) ? (
                  <Text style={[styles.hadithText, { color: c.textSecondary }]}>{text}</Text>
                ) : null}
                <Text style={[styles.hadithSource, { color: c.gold }]}>— {localizeSource(q.source, lang)}</Text>
              </View>
            </ScaleIn>
          );
        })}

        {/* ── Bələdçi ── */}
        <FadeUp delay={200}>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
            <Text style={[styles.cardTitle, { color: c.text }, rtl]}>{t.guide}</Text>
            {guide.map(g => (
              <TouchableOpacity
                key={g.key}
                disabled={!g.route}
                onPress={() => go(g.route)}
                activeOpacity={0.8}
                accessibilityRole={g.route ? 'button' : undefined}
                style={[styles.guideRow, { borderTopColor: c.border }]}
              >
                <View style={[styles.guideIcon, { backgroundColor: c.primaryBg }]}>
                  <AppIcon name={g.icon} size={18} color={c.primary} />
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.guideTitle, { color: c.text }, rtl]}>{g.title}</Text>
                  <Text style={[styles.guideDesc, { color: c.textSecondary }, rtl]}>{g.desc}</Text>
                </View>
                {g.route ? (
                  <AppIcon name="chevronRight" size={16} color={c.textMuted} style={isAr ? styles.flipX : null} />
                ) : null}
              </TouchableOpacity>
            ))}
            <Text style={[styles.footnote, { color: c.textMuted }, rtl]}>ⓘ {t.noPayments}</Text>
          </View>
        </FadeUp>

        {/* ── Faydalı alətlər ── */}
        <FadeUp delay={240}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }, rtl]}>{t.seeAlso.toUpperCase()}</Text>
        </FadeUp>
        {[
          { route: 'Zakat', icon: '🧮', title: t.zakat, desc: t.zakatDesc },
          { route: 'Charity', icon: '🤲', title: t.journal, desc: t.journalDesc },
          { route: 'Mosques', icon: '🕌', title: t.mosques, desc: t.mosquesDesc },
        ].map((item, i) => (
          <FadeUp key={item.route} delay={270 + i * 50}>
            <TouchableOpacity
              onPress={() => go(item.route)}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={[styles.linkTile, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: c.primaryBg }]}>
                <Text style={styles.linkIcon}>{item.icon}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.linkTitle, { color: c.text }, rtl]}>{item.title}</Text>
                <Text style={[styles.linkDesc, { color: c.textMuted }, rtl]}>{item.desc}</Text>
              </View>
              <AppIcon name="chevronRight" size={18} color={c.textMuted} style={isAr ? styles.flipX : null} />
            </TouchableOpacity>
          </FadeUp>
        ))}
      </View>

      {/* Alt boşluq — son məzmun ekranın kənarına yapışmasın */}
      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  flex1: { flex: 1, minWidth: 0 },

  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  flipX: { transform: [{ scaleX: -1 }] },

  // Hədis
  hadithCard: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  eyebrowPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, marginBottom: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  hadithAr: { fontSize: 22, lineHeight: 40, textAlign: 'center', writingDirection: 'rtl', marginBottom: 12 },
  hadithText: { fontSize: 15, lineHeight: 24, fontWeight: '500', fontStyle: 'italic', textAlign: 'center', marginBottom: 10 },
  hadithSource: { fontSize: 13, fontWeight: '800' },

  // Bələdçi
  card: {
    padding: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingVertical: 12 },
  guideIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  guideTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  guideDesc: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  footnote: { fontSize: 12, lineHeight: 18, fontWeight: '500', marginTop: 10 },

  // Faydalı alətlər
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 4, marginBottom: 10 },
  linkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkIconWrap: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  linkIcon: { fontSize: 22 },
  linkTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  linkDesc: { fontSize: 12, fontWeight: '500' },
});
