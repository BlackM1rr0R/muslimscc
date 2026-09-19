// ═══════════════════════════════════════════════════════
// Məscidə ianə — web /donate (src/pages/DonatePage.jsx) ilə eyni məzmun
//
// Qayda: bu REAL məscidin tətbiqidir. Rekvizitlər YALNIZ
// config/mosque.js → MOSQUE.donation-dan oxunur və yalnız doldurulubsa
// göstərilir. Ödəniş qəbulu, məbləğ, irəliləyiş zolağı, uydurma layihə YOXDUR.
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';
import { BRAND, MOSQUE, filled, tr } from '../config/mosque';

// data/hadiths.js id 624-dan olduğu kimi köçürülüb (mətni dəyişmə).
// (Böyük hadiths.js bir hədisə görə import edilmir.)
// Mənbə adı hər dildə öz yazılışı ilə (nömrə eynidir — Buxari 450).
const HADITH = {
  id: 624,
  source: { az: 'Buxari 450', en: 'Bukhari 450', ru: 'Бухари 450', ar: 'البخاري 450', tr: 'Buhârî 450' },
  ar: 'مَنْ بَنَى مَسْجِدًا لِلَّهِ بَنَى اللَّهُ لَهُ مِثْلَهُ فِي الْجَنَّةِ',
  az: 'Kim Allah üçün bir məscid tikərsə, Allah cənnətdə onun üçün bənzərini tikər.',
  en: 'Whoever builds a mosque for Allah, Allah will build for him something similar in Paradise.',
  ru: 'Кто построит мечеть ради Аллаха, тому Аллах построит подобное в раю.',
  tr: 'Kim Allah için bir mescit yaparsa, Allah cennette ona benzerini yapar.',
};

const LABELS = {
  az: {
    title: 'Məscidə ianə',
    subtitle: 'Məscidə dəstək olmaq istəyənlər üçün məlumat',
    hadith: 'Hədis',
    details: 'İanə rekvizitləri',
    recipient: 'Alıcı',
    bank: 'Bank',
    iban: 'IBAN',
    card: 'Kart nömrəsi',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    copyFail: 'Kopyalamaq alınmadı — mətni basıb saxlayaraq seçin.',
    noPayments: 'Bu tətbiq onlayn ödəniş qəbul etmir — köçürməni öz bankınız vasitəsilə edə bilərsiniz.',
    soon: 'İanə rekvizitləri tezliklə burada dərc olunacaq.',
    moreInfo: 'Ətraflı məlumat:',
    seeAlso: 'Həmçinin',
    journal: 'Şəxsi sədəqə gündəliyi',
    journalDesc: 'Öz xeyir əməllərinizi qeyd edin',
    zakat: 'Zəkat kalkulyatoru',
    zakatDesc: 'Zəkatınızı hesablayın',
  },
  en: {
    title: 'Donate to the Mosque',
    subtitle: 'Information for those who wish to support the mosque',
    hadith: 'Hadith',
    details: 'Donation details',
    recipient: 'Recipient',
    bank: 'Bank',
    iban: 'IBAN',
    card: 'Card number',
    copy: 'Copy',
    copied: 'Copied',
    copyFail: 'Could not copy — press and hold the text to select it.',
    noPayments: 'This app does not accept online payments — you can make a transfer through your own bank.',
    soon: 'Donation details will be published here soon.',
    moreInfo: 'More information:',
    seeAlso: 'See also',
    journal: 'Personal charity journal',
    journalDesc: 'Keep a record of your own good deeds',
    zakat: 'Zakat calculator',
    zakatDesc: 'Calculate your zakat',
  },
  ru: {
    title: 'Пожертвование мечети',
    subtitle: 'Информация для тех, кто хочет поддержать мечеть',
    hadith: 'Хадис',
    details: 'Реквизиты для пожертвований',
    recipient: 'Получатель',
    bank: 'Банк',
    iban: 'IBAN',
    card: 'Номер карты',
    copy: 'Копировать',
    copied: 'Скопировано',
    copyFail: 'Не удалось скопировать — нажмите и удерживайте текст, чтобы выделить его.',
    noPayments: 'Приложение не принимает онлайн-платежи — перевод можно сделать через ваш банк.',
    soon: 'Реквизиты для пожертвований скоро будут опубликованы здесь.',
    moreInfo: 'Подробнее:',
    seeAlso: 'См. также',
    journal: 'Личный дневник милостыни',
    journalDesc: 'Записывайте свои добрые дела',
    zakat: 'Калькулятор закята',
    zakatDesc: 'Рассчитайте свой закят',
  },
  ar: {
    title: 'التبرع للمسجد',
    subtitle: 'معلومات لمن يرغب في دعم المسجد',
    hadith: 'حديث',
    details: 'بيانات التبرع',
    recipient: 'المستفيد',
    bank: 'البنك',
    iban: 'IBAN',
    card: 'رقم البطاقة',
    copy: 'نسخ',
    copied: 'تم النسخ',
    copyFail: 'تعذّر النسخ — اضغط مطولًا على النص لتحديده.',
    noPayments: 'لا يقبل هذا التطبيق المدفوعات الإلكترونية — يمكنك التحويل عبر مصرفك.',
    soon: 'ستُنشر بيانات التبرع هنا قريبًا.',
    moreInfo: 'لمزيد من المعلومات:',
    seeAlso: 'انظر أيضًا',
    journal: 'يوميات الصدقة الشخصية',
    journalDesc: 'سجّل أعمالك الخيرية',
    zakat: 'حاسبة الزكاة',
    zakatDesc: 'احسب زكاتك',
  },
  tr: {
    title: 'Camiye Bağış',
    subtitle: 'Camiye destek olmak isteyenler için bilgi',
    hadith: 'Hadis',
    details: 'Bağış bilgileri',
    recipient: 'Alıcı',
    bank: 'Banka',
    iban: 'IBAN',
    card: 'Kart numarası',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    copyFail: 'Kopyalanamadı — metni seçmek için basılı tutun.',
    noPayments: 'Bu uygulama çevrimiçi ödeme kabul etmez — havaleyi kendi bankanız üzerinden yapabilirsiniz.',
    soon: 'Bağış bilgileri yakında burada yayımlanacak.',
    moreInfo: 'Ayrıntılı bilgi:',
    seeAlso: 'Ayrıca bakın',
    journal: 'Kişisel sadaka günlüğü',
    journalDesc: 'Kendi hayır işlerinizi kaydedin',
    zakat: 'Zekât hesaplayıcı',
    zakatDesc: 'Zekâtınızı hesaplayın',
  },
};

// Hero rəngi — web .theme-donate kimi yaşıl (HERO_THEMES.charity)
const HERO_THEME = 'charity';

// ── Köməkçilər ──

/** Boşluqları sil — kopyalanan dəyər bankın qəbul etdiyi formada olsun. */
function compact(v, { upper = false } = {}) {
  const s = String(v ?? '').replace(/[\s-]+/g, '');
  return upper ? s.toUpperCase() : s;
}

/** 4-lü qruplara böl: AZ21NABZ... → "AZ21 NABZ ..." (yalnız göstərmək üçün). */
function group4(s) {
  return s.replace(/(.{4})(?=.)/g, '$1 ');
}

/** Telefonu tel: linki üçün təmizlə (yalnız rəqəmlər və "+"). */
function telHref(phone) {
  return 'tel:' + String(phone).replace(/[^\d+]/g, '');
}

export default function DonateScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;
  const t = LABELS[lang] || LABELS.en;
  const isAr = lang === 'ar';

  // ── Rekvizitlər — yalnız config-dən ──
  const d = MOSQUE.donation || {};
  const iban = compact(d.iban, { upper: true });
  const card = compact(d.cardNumber);
  const hasBank = filled(iban) || filled(card);
  const note = tr(d.note, lang);
  const phone = filled(MOSQUE.phone) ? MOSQUE.phone.trim() : '';

  // ── Kopyalama vəziyyəti ──
  const [copyStatus, setCopyStatus] = useState(null); // { key, ok }
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = async (key, value) => {
    let ok = false;
    try {
      ok = await Clipboard.setStringAsync(value);
      if (ok !== false) ok = true;
    } catch {
      ok = false;
    }
    if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setCopyStatus({ key, ok });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopyStatus(null), ok ? 2000 : 5000);
  };

  const go = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { navigation?.navigate?.(route); } catch {}
  };

  const callPhone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(telHref(phone)).catch(() => {});
  };

  // Ərəbcədə yalnız əsl mətn göstərilir (tərcümə yoxdur)
  const hadithText = isAr ? '' : (HADITH[lang] || HADITH.en);

  const contactLine = phone ? (
    <TouchableOpacity onPress={callPhone} activeOpacity={0.7} style={styles.contactLine}>
      <Text style={[styles.contactText, { color: c.textSecondary }]}>
        {t.moreInfo}{' '}
        <Text style={[styles.ltr, { color: c.primary, fontWeight: '800' }]}>{phone}</Text>
      </Text>
    </TouchableOpacity>
  ) : null;

  // Kopyalana bilən sətir (IBAN, kart nömrəsi)
  const renderCopyRow = (id, label, value) => {
    const done = copyStatus?.key === id && copyStatus.ok;
    const failed = copyStatus?.key === id && !copyStatus.ok;
    return (
      <View key={id} style={[styles.row, { borderTopColor: c.border }]}>
        <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
        <Text selectable style={[styles.mono, styles.ltr, { color: c.text }]}>{group4(value)}</Text>
        <TouchableOpacity
          onPress={() => handleCopy(id, value)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${t.copy}: ${label}`}
          style={[
            styles.copyBtn,
            done
              ? { backgroundColor: c.primary, borderColor: c.primary }
              : { backgroundColor: c.primaryBg, borderColor: c.primaryBorder },
          ]}
        >
          <AppIcon name={done ? 'check' : 'copy'} size={15} color={done ? '#fff' : c.primary} />
          <Text style={[styles.copyText, { color: done ? '#fff' : c.primary }]}>{done ? t.copied : t.copy}</Text>
        </TouchableOpacity>
        {failed ? <Text style={[styles.copyFail, { color: c.error }]}>{t.copyFail}</Text> : null}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic={BRAND.arabicMotto} title={t.title} subtitle={t.subtitle} theme={HERO_THEME} />

      <View style={styles.content}>

        {/* ── Hədis — Buxari 450 ── */}
        <ScaleIn delay={100}>
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
            <Text style={[styles.hadithAr, { color: c.text }]}>{HADITH.ar}</Text>
            {hadithText ? (
              <Text style={[styles.hadithText, { color: c.textSecondary }]}>{hadithText}</Text>
            ) : null}
            <Text style={[styles.hadithSource, { color: c.gold }]}>— {tr(HADITH.source, lang)}</Text>
          </View>
        </ScaleIn>

        {hasBank ? (
          /* ── Bank rekvizitləri — yalnız IBAN və ya kart nömrəsi doldurulubsa ── */
          <FadeUp delay={180}>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <View style={styles.cardHead}>
                <View style={[styles.cardIconWrap, { backgroundColor: c.primaryBg2 }]}>
                  <AppIcon name="charity" size={20} color={c.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: c.text }]}>{t.details}</Text>
              </View>

              {filled(d.recipient) ? (
                <View style={[styles.row, { borderTopColor: c.border }]}>
                  <Text style={[styles.rowLabel, { color: c.textMuted }]}>{t.recipient}</Text>
                  <Text selectable style={[styles.rowValue, { color: c.text }]}>{String(d.recipient).trim()}</Text>
                </View>
              ) : null}
              {filled(d.bankName) ? (
                <View style={[styles.row, { borderTopColor: c.border }]}>
                  <Text style={[styles.rowLabel, { color: c.textMuted }]}>{t.bank}</Text>
                  <Text selectable style={[styles.rowValue, { color: c.text }]}>{String(d.bankName).trim()}</Text>
                </View>
              ) : null}
              {filled(iban) ? renderCopyRow('iban', t.iban, iban) : null}
              {filled(card) ? renderCopyRow('card', t.card, card) : null}

              {filled(note) ? (
                <Text style={[styles.note, { color: c.textSecondary, backgroundColor: c.surface }, isAr && styles.rtl]}>{note}</Text>
              ) : null}
              <Text style={[styles.footnote, { color: c.textMuted }, isAr && styles.rtl]}>{t.noPayments}</Text>
              {contactLine}
            </View>
          </FadeUp>
        ) : (
          /* ── Boş vəziyyət — rekvizitlər hələ əlavə olunmayıb ── */
          <FadeUp delay={180}>
            <View style={[styles.soonCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <Text style={styles.soonIcon}>🕌</Text>
              <Text style={[styles.soonText, { color: c.textSecondary }]}>{t.soon}</Text>
              {contactLine}
            </View>
          </FadeUp>
        )}

        {/* ── Əlaqəli alətlər ── */}
        <FadeUp delay={240}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t.seeAlso.toUpperCase()}</Text>
        </FadeUp>
        {[
          { route: 'Charity', icon: '🤲', title: t.journal, desc: t.journalDesc },
          { route: 'Zakat', icon: '🧮', title: t.zakat, desc: t.zakatDesc },
        ].map((item, i) => (
          <FadeUp key={item.route} delay={270 + i * 50}>
            <TouchableOpacity
              onPress={() => go(item.route)}
              activeOpacity={0.85}
              style={[styles.linkTile, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: c.primaryBg }]}>
                <Text style={styles.linkIcon}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkTitle, { color: c.text }]}>{item.title}</Text>
                <Text style={[styles.linkDesc, { color: c.textMuted }]}>{item.desc}</Text>
              </View>
              <AppIcon name="chevronRight" size={18} color={c.textMuted} />
            </TouchableOpacity>
          </FadeUp>
        ))}
      </View>

      {/* Üzən düymələr (FloatingActions) son məzmunu örtməsin */}
      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  ltr: { writingDirection: 'ltr' },

  // Hədis
  hadithCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  eyebrowPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, marginBottom: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  hadithAr: { fontSize: 24, lineHeight: 44, textAlign: 'center', writingDirection: 'rtl', marginBottom: 12 },
  hadithText: { fontSize: 15, lineHeight: 24, fontWeight: '500', fontStyle: 'italic', textAlign: 'center', marginBottom: 10 },
  hadithSource: { fontSize: 13, fontWeight: '800', writingDirection: 'ltr' },

  // Rekvizitlər
  card: {
    padding: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  cardIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  row: { borderTopWidth: 1, paddingVertical: 12 },
  rowLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  rowValue: { fontSize: 15, fontWeight: '700' },
  mono: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2, fontVariant: ['tabular-nums'], marginBottom: 8 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  copyText: { fontSize: 13, fontWeight: '800' },
  copyFail: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  note: { fontSize: 14, lineHeight: 21, fontWeight: '500', padding: 12, borderRadius: BorderRadius.sm, marginTop: 8, overflow: 'hidden' },
  footnote: { fontSize: 12, lineHeight: 18, fontWeight: '500', marginTop: 12 },
  contactLine: { marginTop: 10, alignSelf: 'center' },
  contactText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Boş vəziyyət
  soonCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  soonIcon: { fontSize: 34, marginBottom: 10 },
  soonText: { fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center' },

  // Həmçinin
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
