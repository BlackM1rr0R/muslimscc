import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const EVENTS = [
  { year:'570', icon:'⭐', az:'Hz. Muhəmməd ﷺ-in doğulması', en:'Birth of Prophet Muhammad ﷺ', ru:'Рождение Пророка Мухаммада ﷺ', ar:'ولادة النبي محمد ﷺ', tr:'Hz. Muhammed ﷺ\'in doğumu' },
  { year:'610', icon:'📖', az:'İlk vəhy — Hira mağarası', en:'First Revelation — Cave of Hira', ru:'Первое откровение — Пещера Хира', ar:'أول وحي — غار حراء', tr:'İlk vahiy — Hira mağarası' },
  { year:'613', icon:'📢', az:'Açıq dəvətin başlanması', en:'Beginning of public preaching', ru:'Начало открытой проповеди', ar:'بداية الدعوة الجهرية', tr:'Açık davetin başlangıcı' },
  { year:'615', icon:'🚢', az:'Həbəşistana hicrət', en:'Migration to Abyssinia', ru:'Переселение в Абиссинию', ar:'الهجرة إلى الحبشة', tr:'Habeşistan\'a hicret' },
  { year:'619', icon:'🌙', az:'İsra və Merac', en:"Isra and Mi'raj", ru:'Ночной перенос и Вознесение', ar:'الإسراء والمعراج', tr:'İsra ve Miraç' },
  { year:'622', icon:'🏙️', az:'Mədinəyə hicrət — İslam təqviminin başlanğıcı', en:'Migration to Medina — Start of Islamic calendar', ru:'Хиджра в Медину — начало исламского календаря', ar:'الهجرة إلى المدينة', tr:'Medine\'ye hicret' },
  { year:'624', icon:'⚔️', az:'Bədr döyüşü', en:'Battle of Badr', ru:'Битва при Бадре', ar:'غزوة بدر', tr:'Bedir Savaşı' },
  { year:'625', icon:'⚔️', az:'Uhud döyüşü', en:'Battle of Uhud', ru:'Битва при Ухуде', ar:'غزوة أحد', tr:'Uhud Savaşı' },
  { year:'627', icon:'🏗️', az:'Xəndək döyüşü', en:'Battle of the Trench', ru:'Битва у рва', ar:'غزوة الخندق', tr:'Hendek Savaşı' },
  { year:'628', icon:'📜', az:'Hüdeybiyyə sülhü', en:'Treaty of Hudaybiyyah', ru:'Худайбийский договор', ar:'صلح الحديبية', tr:'Hudeybiye Antlaşması' },
  { year:'630', icon:'🕋', az:'Məkkənin fəthi', en:'Conquest of Mecca', ru:'Завоевание Мекки', ar:'فتح مكة', tr:'Mekke\'nin Fethi' },
  { year:'632', icon:'💔', az:'Hz. Muhəmməd ﷺ-in vəfatı', en:'Death of Prophet Muhammad ﷺ', ru:'Смерть Пророка Мухаммада ﷺ', ar:'وفاة النبي محمد ﷺ', tr:'Hz. Muhammed ﷺ\'in vefatı' },
  { year:'632-661', icon:'👑', az:'Raşidi xəlifələr dövrü', en:'Rashidun Caliphate', ru:'Праведные халифы', ar:'الخلفاء الراشدون', tr:'Raşidin Halifeliği' },
  { year:'661-750', icon:'🏛️', az:'Əməvi xilafəti', en:'Umayyad Caliphate', ru:'Омейяды', ar:'الخلافة الأموية', tr:'Emevi Halifeliği' },
  { year:'750-1258', icon:'🌟', az:'Abbasi xilafəti — İslam Qızıl Dövrü', en:'Abbasid Caliphate — Islamic Golden Age', ru:'Аббасиды — Золотой век ислама', ar:'الخلافة العباسية — العصر الذهبي', tr:'Abbasi Halifeliği — İslam Altın Çağı' },
];

const LABELS = {
  az: { title:'İslam Tarixi', sub:'Əhəmiyyətli hadisələr', timeline:'Xronologiya' },
  en: { title:'Islamic History', sub:'Significant events', timeline:'Timeline' },
  ru: { title:'Исламская История', sub:'Значимые события', timeline:'Хронология' },
  ar: { title:'التاريخ الإسلامي', sub:'أحداث مهمة', timeline:'الخط الزمني' },
  tr: { title:'İslam Tarihi', sub:'Önemli olaylar', timeline:'Kronoloji' },
};

export default function IslamicHistoryScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="التاريخ الإسلامي" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        {EVENTS.map((event, i) => (
          <View key={i} style={styles.timelineItem}>
            <View style={styles.timelineLine}>
              <View style={[styles.dot, { backgroundColor: c.primary }]} />
              {i < EVENTS.length - 1 && <View style={[styles.line, { backgroundColor: c.border }]} />}
            </View>
            <View style={[styles.eventCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventIcon}>{event.icon}</Text>
                <Text style={[styles.eventYear, { color: c.primary }]}>{event.year}</Text>
              </View>
              <Text style={[styles.eventName, { color: c.text }]}>{event[lang] || event.en}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLine: { width: 30, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 14 },
  line: { width: 2, flex: 1, marginTop: 4 },
  eventCard: { flex: 1, marginLeft: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  eventIcon: { fontSize: 20, marginRight: 8 },
  eventYear: { fontSize: 14, fontWeight: '700' },
  eventName: { fontSize: 15, lineHeight: 22 },
});
