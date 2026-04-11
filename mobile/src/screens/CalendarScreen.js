import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const EVENTS = {
  1: [
    { day:1, type:'major', color:'#10b981', az:'Hicri Yeni İl', en:'Islamic New Year', ru:'Новый Год', ar:'رأس السنة الهجرية', tr:'Hicri Yeni Yıl' },
    { day:10, type:'major', color:'#ef4444', az:'Aşura günü', en:'Day of Ashura', ru:'День Ашура', ar:'يوم عاشوراء', tr:'Aşure Günü' },
  ],
  3: [
    { day:12, type:'major', color:'#10b981', az:'Mövlud — Peyğəmbərin doğum günü', en:'Mawlid — Birthday of Prophet ﷺ', ru:'Мавлид', ar:'المولد النبوي', tr:'Mevlid Kandili' },
  ],
  7: [
    { day:1, type:'sunnah', color:'#3b82f6', az:'Rəcəb ayının başlanğıcı', en:'Beginning of Rajab', ru:'Начало Раджаба', ar:'بداية رجب', tr:'Recep başlangıcı' },
    { day:27, type:'night', color:'#8b5cf6', az:'İsra və Merac gecəsi', en:"Night of Isra and Mi'raj", ru:'Ночь Исра и Мирадж', ar:'ليلة الإسراء والمعراج', tr:'İsra ve Mirac Kandili' },
  ],
  8: [
    { day:15, type:'night', color:'#a855f7', az:'Bərat gecəsi', en:'Night of Barat', ru:'Ночь Барат', ar:'ليلة البراءة', tr:'Berat Kandili' },
  ],
  9: [
    { day:1, type:'major', color:'#10b981', az:'Ramazan ayının başlanğıcı', en:'Beginning of Ramadan', ru:'Начало Рамадана', ar:'بداية رمضان', tr:'Ramazan başlangıcı' },
    { day:27, type:'night', color:'#f59e0b', az:'Qədr gecəsi', en:'Laylat al-Qadr', ru:'Ночь Предопределения', ar:'ليلة القدر', tr:'Kadir Gecesi' },
  ],
  10: [
    { day:1, type:'major', color:'#10b981', az:'Ramazan Bayramı', en:'Eid al-Fitr', ru:'Ид аль-Фитр', ar:'عيد الفطر', tr:'Ramazan Bayramı' },
  ],
  12: [
    { day:8, type:'hajj', color:'#f97316', az:'Terviye günü', en:'Day of Tarwiyah', ru:'День Тарвия', ar:'يوم التروية', tr:'Terviye Günü' },
    { day:9, type:'hajj', color:'#f97316', az:'Ərəfə günü', en:'Day of Arafah', ru:'День Арафат', ar:'يوم عرفة', tr:'Arefe Günü' },
    { day:10, type:'major', color:'#ef4444', az:'Qurban Bayramı', en:'Eid al-Adha', ru:'Ид аль-Адха', ar:'عيد الأضحى', tr:'Kurban Bayramı' },
  ],
};

const TYPE_ICONS = { major:'star', night:'moon', sunnah:'dhikr', hajj:'hajjguide' };
const MONTH_GRADIENTS = [
  ['#10b981','#059669'],['#f59e0b','#d97706'],['#8b5cf6','#7c3aed'],['#3b82f6','#2563eb'],
  ['#ec4899','#db2777'],['#06b6d4','#0891b2'],['#f97316','#ea580c'],['#14b8a6','#0d9488'],
  ['#ef4444','#dc2626'],['#a855f7','#9333ea'],['#84cc16','#65a30d'],['#6366f1','#4f46e5'],
];

export default function CalendarScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.calendar || T.az.calendar;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [selMonth, setSelMonth] = useState(1);
  const events = EVENTS[selMonth] || [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="التَّقْوِيمُ الإِسْلَامِيّ" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>

        {/* Current month card */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={MONTH_GRADIENTS[selMonth - 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.currentCard, sh]}
          >
            <View style={styles.currentCircle1} />
            <View style={styles.currentCircle2} />
            <View style={styles.currentNum}>
              <Text style={styles.currentNumText}>{selMonth}</Text>
            </View>
            <Text style={styles.currentMonthName}>{t.months[selMonth - 1]}</Text>
            <Text style={styles.currentYear}>{lang==='ar'?'هـ ١٤٤٧':'1447 AH'}</Text>
            <View style={styles.currentEventCount}>
              <AppIcon name="calendar" size={14} color="#fff" />
              <Text style={styles.currentEventCountText}>
                {events.length} {lang==='az'?'hadisə':lang==='ru'?'событий':lang==='ar'?'حدث':lang==='tr'?'etkinlik':'events'}
              </Text>
            </View>
          </LinearGradient>
        </ScaleIn>

        {/* Month selector */}
        <FadeUp delay={200}>
          <Text style={[styles.label, { color: c.textMuted }]}>
            {lang==='az'?'AY SEÇ':lang==='ru'?'ВЫБЕРИТЕ МЕСЯЦ':lang==='ar'?'اختر الشهر':lang==='tr'?'AY SEÇ':'SELECT MONTH'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthRow}>
            {t.months.map((month, i) => {
              const active = selMonth === i + 1;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelMonth(i + 1);
                  }}
                  activeOpacity={0.8}
                >
                  {active ? (
                    <LinearGradient colors={MONTH_GRADIENTS[i]} style={[styles.monthBtn, Shadows.button]}>
                      <Text style={styles.monthNum}>{i + 1}</Text>
                      <Text style={styles.monthName} numberOfLines={1}>{month}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.monthBtn, { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1.5 }, shS]}>
                      <Text style={[styles.monthNum, { color: c.textMuted }]}>{i + 1}</Text>
                      <Text style={[styles.monthName, { color: c.text }]} numberOfLines={1}>{month}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* Events */}
        <FadeUp delay={300}>
          <Text style={[styles.label, { color: c.textMuted, marginTop: 20 }]}>
            {lang==='az'?'HADİSƏLƏR':lang==='ru'?'СОБЫТИЯ':lang==='ar'?'الأحداث':lang==='tr'?'OLAYLAR':'EVENTS'}
          </Text>
        </FadeUp>

        {events.length === 0 ? (
          <ScaleIn delay={400}>
            <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryBg }]}>
                <AppIcon name="calendar" size={36} color={c.primary} />
              </View>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noEvents}</Text>
            </View>
          </ScaleIn>
        ) : (
          events.map((event, i) => (
            <FadeUp key={i} delay={400 + i * 80}>
              <View style={[styles.eventCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                <LinearGradient
                  colors={[event.color + '15', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.5 }}
                />
                <View style={[styles.colorBar, { backgroundColor: event.color }]} />

                <LinearGradient colors={[event.color, event.color + 'cc']} style={styles.eventIconWrap}>
                  <AppIcon name={TYPE_ICONS[event.type] || 'star'} size={20} color="#fff" />
                </LinearGradient>

                <View style={styles.eventBody}>
                  <View style={[styles.dayBadge, { backgroundColor: event.color + '18', borderColor: event.color + '30' }]}>
                    <Text style={[styles.dayText, { color: event.color }]}>
                      {lang==='az'?'Gün':lang==='ru'?'День':lang==='ar'?'يوم':lang==='tr'?'Gün':'Day'} {event.day}
                    </Text>
                  </View>
                  <Text style={[styles.eventName, { color: c.text }]}>{event[lang] || event.en}</Text>
                  <Text style={[styles.eventType, { color: c.textMuted }]}>{event.type.toUpperCase()}</Text>
                </View>
              </View>
            </FadeUp>
          ))
        )}
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },

  // Current month card
  currentCard: {
    padding: 32,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  currentCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  currentCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  currentNum: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  currentNumText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  currentMonthName: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  currentYear: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 16, fontWeight: '600' },
  currentEventCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  currentEventCountText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Month selector
  monthRow: { gap: 10, paddingBottom: 8 },
  monthBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: BorderRadius.md, minWidth: 80, alignItems: 'center' },
  monthNum: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  monthName: { fontSize: 13, fontWeight: '800', color: '#fff', marginTop: 2 },

  // Empty
  empty: { alignItems: 'center', padding: 40, borderRadius: BorderRadius.xl, borderWidth: 1 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyText: { fontSize: 14, fontWeight: '600' },

  // Event card
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingLeft: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  eventIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  eventBody: { flex: 1 },
  dayBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1, marginBottom: 6 },
  dayText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  eventName: { fontSize: 15, fontWeight: '700', marginBottom: 4, letterSpacing: -0.2 },
  eventType: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});
