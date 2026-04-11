import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, Float, Rotate } from '../components/Animated';

export default function AboutScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.about || T.az.about;
  const sh = dark ? Shadows.dark.md : Shadows.md;

  const VALUES = [
    { iconKey:'check', color:'#10b981', gradient:['#10b981','#059669'], title:t.v1t, desc:t.v1d },
    { iconKey:'heart', color:'#ec4899', gradient:['#ec4899','#db2777'], title:t.v2t, desc:t.v2d },
    { iconKey:'home', color:'#3b82f6', gradient:['#3b82f6','#2563eb'], title:t.v3t, desc:t.v3d },
    { iconKey:'settings', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'], title:t.v4t, desc:t.v4d },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="عَنِ المَوْقِع" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>

        {/* Logo hero */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={[c.primary, c.primaryDark, c.ctaGradStart]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.logoHero, sh]}
          >
            <Rotate duration={30000} style={styles.rotatingRing}>
              <View style={styles.rotatingRingInner} />
            </Rotate>

            <Float>
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>☽</Text>
              </View>
            </Float>

            <Text style={styles.logoTitle}>Muslim.cc</Text>
            <View style={styles.logoVersion}>
              <Text style={styles.logoVersionText}>v1.0.0</Text>
            </View>

            <View style={styles.logoCircle1} />
            <View style={styles.logoCircle2} />
          </LinearGradient>
        </ScaleIn>

        {/* Mission */}
        <FadeUp delay={200}>
          <View style={[styles.missionCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
            <LinearGradient
              colors={[c.primary + '10', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
            />
            <View style={[styles.missionIconWrap, { backgroundColor: c.primaryBg }]}>
              <AppIcon name="star" size={24} color={c.primary} />
            </View>
            <Text style={[styles.missionTitle, { color: c.primary }]}>{t.mission}</Text>
            <Text style={[styles.missionText, { color: c.textSecondary }]}>{t.missionText}</Text>
          </View>
        </FadeUp>

        {/* Values */}
        <FadeUp delay={300}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
            {t.values?.toUpperCase() || 'VALUES'}
          </Text>
        </FadeUp>

        {VALUES.map((v, i) => (
          <FadeUp key={i} delay={400 + i * 80}>
            <View style={[styles.valueCard, { backgroundColor: c.card, borderColor: c.cardBorder }, dark ? Shadows.dark.sm : Shadows.sm]}>
              <LinearGradient
                colors={[v.color + '15', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
              />
              <View style={[styles.colorBar, { backgroundColor: v.color }]} />
              <LinearGradient colors={v.gradient} style={styles.valueIconWrap}>
                <AppIcon name={v.iconKey} size={22} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.valueTitle, { color: c.text }]}>{v.title}</Text>
                <Text style={[styles.valueDesc, { color: c.textSecondary }]}>{v.desc}</Text>
              </View>
            </View>
          </FadeUp>
        ))}

        {/* Stats */}
        <FadeUp delay={700}>
          <View style={[styles.statsCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: c.primary }]}>27</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>
                {lang==='az'?'Xidmət':lang==='ru'?'Сервисов':lang==='ar'?'خدمة':lang==='tr'?'Hizmet':'Services'}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: c.primary }]}>5</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>
                {lang==='az'?'Dil':lang==='ru'?'Языков':lang==='ar'?'لغات':lang==='tr'?'Dil':'Languages'}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: c.gold }]}>∞</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>
                {lang==='az'?'Pulsuz':lang==='ru'?'Бесплатно':lang==='ar'?'مجاني':lang==='tr'?'Ücretsiz':'Free'}
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Footer */}
        <FadeUp delay={900}>
          <View style={styles.footerCard}>
            <Text style={[styles.footerCopy, { color: c.textMuted }]}>
              © 2025 muslim.cc — {lang === 'az' ? 'Ümmət üçün sevgi ilə' : lang === 'ru' ? 'Для уммы с любовью' : lang === 'ar' ? 'صُنع بمحبة للأمة' : lang === 'tr' ? 'Ümmet için sevgiyle' : 'Made with love for the Ummah'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL('https://muslim.cc');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.link, { color: c.primary }]}>muslim.cc</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  // Logo hero
  logoHero: {
    padding: 40,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  rotatingRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.12,
  },
  rotatingRingInner: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoIcon: { fontSize: 48, color: '#fff' },
  logoTitle: { fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 10, letterSpacing: -0.5 },
  logoVersion: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  logoVersionText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  logoCircle1: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -60 },
  logoCircle2: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -50, left: -40 },

  // Mission
  missionCard: {
    padding: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  missionIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  missionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  missionText: { fontSize: 15, lineHeight: 24, textAlign: 'center', fontWeight: '500' },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, marginTop: 8 },

  // Value card
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    paddingLeft: 22,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  valueIconWrap: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  valueTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  valueDesc: { fontSize: 13, lineHeight: 20, fontWeight: '500' },

  // Stats
  statsCard: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: BorderRadius.xl, borderWidth: 1, marginTop: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 36 },

  // Footer
  footerCard: { alignItems: 'center', marginTop: 24 },
  footerCopy: { fontSize: 12, textAlign: 'center', fontWeight: '600', marginBottom: 8 },
  link: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
});
