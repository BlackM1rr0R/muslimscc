import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const PHASES = {
  az: [
    { title:'İhram', icon:'🧕', desc:'Mikat nöqtəsində ihrama girin. Kişilər iki ağ parça geyinir. Niyyət edin və Təlbiyə deyin.', arabic:'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ' },
    { title:'Təvaf', icon:'🕋', desc:'Kəbəni 7 dəfə saat əqrəbinin əksinə dolanın. Hər dövrədə dua edin.', arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً' },
    { title:'Səy', icon:'🏃', desc:'Səfa və Mərva təpələri arasında 7 dəfə gəzin.', arabic:'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ' },
    { title:'Minaya gedış', icon:'⛺', desc:'8 Zilhiccə — Minada gecələyin və ibadət edin.' },
    { title:'Ərəfə', icon:'🏔️', desc:'9 Zilhiccə — Ərəfə dağında duraq. Həccin ən əhəmiyyətli rüknü. Dua edin.', arabic:'خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ' },
    { title:'Müzdəlifə', icon:'🌙', desc:'Ərəfədən sonra Müzdəlifədə gecələyin. Daş yığın.' },
    { title:'Rəmy (Daş atma)', icon:'🪨', desc:'10 Zilhiccə — Böyük Cəmrəyə 7 daş atın. Hər atışda təkbir deyin.', arabic:'اللَّهُ أَكْبَرُ' },
    { title:'Qurban', icon:'🐑', desc:'Qurban kəsin. Hədyül-qurban vacibdir.' },
    { title:'Təraş/Qısaltma', icon:'✂️', desc:'Saçları qırxdırın (kişilər) və ya qısaldın (qadınlar). İhramdan çıxın.' },
    { title:'Vida Təvafı', icon:'🕌', desc:'Məkkəni tərk etmədən son təvafı edin. Həcc tamamdır!' },
  ],
  en: [
    { title:'Ihram', icon:'🧕', desc:'Enter Ihram at the Miqat. Men wear two white cloths. Make intention and recite Talbiyah.', arabic:'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ' },
    { title:'Tawaf', icon:'🕋', desc:'Circle the Kaaba 7 times counter-clockwise. Make dua at each round.', arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً' },
    { title:"Sa'i", icon:'🏃', desc:'Walk between Safa and Marwa hills 7 times.', arabic:'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ' },
    { title:'Going to Mina', icon:'⛺', desc:'8th Dhul Hijjah — Stay overnight in Mina and worship.' },
    { title:'Arafah', icon:'🏔️', desc:'9th Dhul Hijjah — Stand at Arafah. The most important pillar of Hajj.', arabic:'خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ' },
    { title:'Muzdalifah', icon:'🌙', desc:'Stay overnight at Muzdalifah after Arafah. Collect pebbles.' },
    { title:'Ramy (Stoning)', icon:'🪨', desc:'10th Dhul Hijjah — Throw 7 pebbles at Jamrat al-Aqabah.', arabic:'اللَّهُ أَكْبَرُ' },
    { title:'Sacrifice', icon:'🐑', desc:'Offer a sacrifice (Hady). This is obligatory for Hajj.' },
    { title:'Shaving/Trimming', icon:'✂️', desc:'Shave (men) or trim (women) hair. Exit the state of Ihram.' },
    { title:'Farewell Tawaf', icon:'🕌', desc:'Perform the farewell Tawaf before leaving Mecca. Hajj is complete!' },
  ],
};

const LABELS = {
  az: { title:'Həcc Bələdçisi', sub:'Addım-addım Həcc və Ümrə', hajj:'Həcc Mərhələləri', umrah:'Ümrə Mərhələləri' },
  en: { title:'Hajj Guide', sub:'Step-by-step Hajj & Umrah', hajj:'Hajj Phases', umrah:'Umrah Phases' },
  ru: { title:'Гид по Хаджу', sub:'Пошаговый Хадж и Умра', hajj:'Этапы Хаджа', umrah:'Этапы Умры' },
  ar: { title:'دليل الحج', sub:'الحج والعمرة خطوة بخطوة', hajj:'مراحل الحج', umrah:'مراحل العمرة' },
  tr: { title:'Hac Rehberi', sub:'Adım adım Hac ve Umre', hajj:'Hac Aşamaları', umrah:'Umre Aşamaları' },
};

export default function HajjGuideScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const phases = PHASES[lang] || PHASES.az;
  const [expanded, setExpanded] = useState({});

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الحج" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{l.hajj}</Text>

        {phases.map((phase, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.phaseCard, { backgroundColor: c.card, borderColor: expanded[i] ? c.primary : c.cardBorder }]}
            onPress={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
            activeOpacity={0.8}
          >
            <View style={styles.phaseHeader}>
              <View style={[styles.phaseNum, { backgroundColor: c.primary }]}>
                <Text style={styles.phaseNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.phaseIcon}>{phase.icon}</Text>
              <Text style={[styles.phaseTitle, { color: c.text }]}>{phase.title}</Text>
              <Text style={{ color: c.textMuted }}>{expanded[i] ? '▲' : '▼'}</Text>
            </View>
            {expanded[i] && (
              <View style={styles.phaseBody}>
                <Text style={[styles.phaseDesc, { color: c.textSecondary }]}>{phase.desc}</Text>
                {phase.arabic && (
                  <View style={[styles.arabicBox, { backgroundColor: c.surfaceAlt }]}>
                    <Text style={[styles.arabicText, { color: c.text }]}>{phase.arabic}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  phaseCard: { borderRadius: 12, borderWidth: 1.5, marginBottom: 10, overflow: 'hidden' },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  phaseNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  phaseNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  phaseIcon: { fontSize: 24, marginRight: 10 },
  phaseTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  phaseBody: { paddingHorizontal: 16, paddingBottom: 16 },
  phaseDesc: { fontSize: 14, lineHeight: 22 },
  arabicBox: { padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  arabicText: { fontSize: 20, textAlign: 'center' },
});
