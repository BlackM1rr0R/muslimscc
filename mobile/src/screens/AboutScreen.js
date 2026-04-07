import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import { T } from '../data/i18n';
import PageHero from '../components/PageHero';

export default function AboutScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.about || T.az.about;

  const VALUES = [
    { icon:'✅', title:t.v1t, desc:t.v1d },
    { icon:'🆓', title:t.v2t, desc:t.v2d },
    { icon:'🌍', title:t.v3t, desc:t.v3d },
    { icon:'💻', title:t.v4t, desc:t.v4d },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="عن الموقع" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>
        {/* Mission */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.primary }]}>{t.mission}</Text>
          <Text style={[styles.cardText, { color: c.textSecondary }]}>{t.missionText}</Text>
        </View>

        {/* Values */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t.values}</Text>
        {VALUES.map((v, i) => (
          <View key={i} style={[styles.valueCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={styles.valueIcon}>{v.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.valueTitle, { color: c.text }]}>{v.title}</Text>
              <Text style={[styles.valueDesc, { color: c.textSecondary }]}>{v.desc}</Text>
            </View>
          </View>
        ))}

        {/* App info */}
        <View style={[styles.infoCard, { backgroundColor: c.surfaceAlt }]}>
          <Text style={[styles.infoTitle, { color: c.text }]}>☽ Muslim.cc</Text>
          <Text style={[styles.infoVersion, { color: c.textMuted }]}>v1.0.0 — React Native</Text>
          <Text style={[styles.infoCopy, { color: c.textMuted }]}>
            © 2025 muslim.cc — {lang === 'az' ? 'Ümmət üçün sevgi ilə' : lang === 'ru' ? 'Сделано с любовью для уммы' : lang === 'ar' ? 'صُنع بمحبة للأمة' : lang === 'tr' ? 'Ümmet için sevgiyle' : 'Made with love for the Ummah'}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://muslim.cc')}>
            <Text style={[styles.link, { color: c.primary }]}>muslim.cc</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  card: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardText: { fontSize: 15, lineHeight: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  valueCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  valueIcon: { fontSize: 28, marginRight: 14 },
  valueTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  valueDesc: { fontSize: 13, lineHeight: 20 },
  infoCard: { padding: 24, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  infoTitle: { fontSize: 22, fontWeight: '700' },
  infoVersion: { fontSize: 13, marginTop: 4 },
  infoCopy: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  link: { fontSize: 15, fontWeight: '600', marginTop: 12 },
});
