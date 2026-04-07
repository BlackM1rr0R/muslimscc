import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import PageHero from '../components/PageHero';

const EVENTS = {
  1: [ // Muharram
    { day: 1, type: 'major', az:'Hicri Yeni İl', en:'Islamic New Year', ru:'Исламский Новый Год', ar:'رأس السنة الهجرية', tr:'Hicri Yeni Yıl' },
    { day: 10, type: 'major', az:'Aşura günü', en:'Day of Ashura', ru:'День Ашура', ar:'يوم عاشوراء', tr:'Aşure Günü' },
  ],
  3: [ // Rabi al-Awwal
    { day: 12, type: 'major', az:'Mövlud — Peyğəmbərin ﷺ doğum günü', en:'Mawlid — Birthday of Prophet ﷺ', ru:'Мавлид — День рождения Пророка ﷺ', ar:'المولد النبوي الشريف', tr:'Mevlid Kandili' },
  ],
  7: [ // Rajab
    { day: 1, type: 'sunnah', az:'Rəcəb ayının başlanğıcı', en:'Beginning of Rajab', ru:'Начало Раджаба', ar:'بداية رجب', tr:'Recep ayının başlangıcı' },
    { day: 27, type: 'night', az:'İsra və Merac gecəsi', en:"Night of Isra and Mi'raj", ru:'Ночь Исра и Мирадж', ar:'ليلة الإسراء والمعراج', tr:'İsra ve Mirac Kandili' },
  ],
  8: [ // Sha'ban
    { day: 15, type: 'night', az:'Bərat gecəsi', en:'Night of Barat', ru:'Ночь Барат', ar:'ليلة البراءة', tr:'Berat Kandili' },
  ],
  9: [ // Ramadan
    { day: 1, type: 'major', az:'Ramazan ayının başlanğıcı', en:'Beginning of Ramadan', ru:'Начало Рамадана', ar:'بداية رمضان', tr:'Ramazan başlangıcı' },
    { day: 27, type: 'night', az:'Qədr gecəsi', en:'Laylat al-Qadr', ru:'Ночь Предопределения', ar:'ليلة القدر', tr:'Kadir Gecesi' },
  ],
  10: [ // Shawwal
    { day: 1, type: 'major', az:'Ramazan Bayramı', en:'Eid al-Fitr', ru:'Ид аль-Фитр', ar:'عيد الفطر', tr:'Ramazan Bayramı' },
  ],
  12: [ // Dhul Hijjah
    { day: 8, type: 'hajj', az:'Terviye günü — Həcc başlanğıcı', en:'Day of Tarwiyah — Start of Hajj', ru:'День Тарвия — Начало Хаджа', ar:'يوم التروية', tr:'Terviye Günü' },
    { day: 9, type: 'hajj', az:'Ərəfə günü', en:'Day of Arafah', ru:'День Арафат', ar:'يوم عرفة', tr:'Arefe Günü' },
    { day: 10, type: 'major', az:'Qurban Bayramı', en:'Eid al-Adha', ru:'Ид аль-Адха', ar:'عيد الأضحى', tr:'Kurban Bayramı' },
  ],
};

const TYPE_COLORS = { major: '#d32f2f', night: '#7b1fa2', sunnah: '#1565c0', hajj: '#e65100' };
const TYPE_ICONS = { major: '⭐', night: '🌙', sunnah: '📿', hajj: '🕋' };

export default function CalendarScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.calendar || T.az.calendar;
  const [selMonth, setSelMonth] = useState(1);

  const events = EVENTS[selMonth] || [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="التقويم الإسلامي" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>
        {/* Month selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
          {t.months.map((month, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.monthBtn, selMonth === i + 1 && { backgroundColor: c.primary }]}
              onPress={() => setSelMonth(i + 1)}
            >
              <Text style={[styles.monthNum, { color: selMonth === i + 1 ? '#fff' : c.textMuted }]}>{i + 1}</Text>
              <Text style={[styles.monthName, { color: selMonth === i + 1 ? '#fff' : c.text }]} numberOfLines={1}>{month}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Events */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t.events}</Text>
        {events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📅</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>{t.noEvents}</Text>
          </View>
        ) : (
          events.map((event, i) => (
            <View key={i} style={[styles.eventCard, { backgroundColor: c.card, borderColor: c.cardBorder, borderLeftColor: TYPE_COLORS[event.type] || c.primary }]}>
              <View style={styles.eventLeft}>
                <Text style={styles.eventIcon}>{TYPE_ICONS[event.type]}</Text>
                <View style={[styles.eventDay, { backgroundColor: TYPE_COLORS[event.type] + '20' }]}>
                  <Text style={[styles.eventDayText, { color: TYPE_COLORS[event.type] }]}>{event.day}</Text>
                </View>
              </View>
              <View style={styles.eventBody}>
                <Text style={[styles.eventName, { color: c.text }]}>{event[lang] || event.en}</Text>
                <Text style={[styles.eventType, { color: TYPE_COLORS[event.type] }]}>{event.type.toUpperCase()}</Text>
              </View>
            </View>
          ))
        )}

        {/* All months summary */}
        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24 }]}>
          {lang === 'az' ? 'Bütün aylar' : lang === 'ru' ? 'Все месяцы' : lang === 'ar' ? 'جميع الأشهر' : lang === 'tr' ? 'Tüm aylar' : 'All months'}
        </Text>
        {t.months.map((month, i) => {
          const monthEvents = EVENTS[i + 1] || [];
          return (
            <TouchableOpacity key={i} style={[styles.monthCard, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => setSelMonth(i + 1)}>
              <View style={[styles.monthBadge, { backgroundColor: c.primary + '15' }]}>
                <Text style={[styles.monthBadgeText, { color: c.primary }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.monthCardName, { color: c.text }]}>{month}</Text>
              <Text style={[styles.monthEventCount, { color: c.textMuted }]}>{monthEvents.length}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  monthScroll: { marginBottom: 20, maxHeight: 70 },
  monthBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#eee', marginRight: 8, alignItems: 'center', minWidth: 70 },
  monthNum: { fontSize: 12 },
  monthName: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  empty: { alignItems: 'center', marginTop: 30 },
  emptyText: { fontSize: 15, marginTop: 8 },
  eventCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, marginBottom: 10 },
  eventLeft: { alignItems: 'center', marginRight: 14 },
  eventIcon: { fontSize: 24, marginBottom: 4 },
  eventDay: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  eventDayText: { fontSize: 14, fontWeight: '700' },
  eventBody: { flex: 1, justifyContent: 'center' },
  eventName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  eventType: { fontSize: 11, fontWeight: '600' },
  monthCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  monthBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  monthBadgeText: { fontSize: 14, fontWeight: '700' },
  monthCardName: { flex: 1, fontSize: 15, fontWeight: '500' },
  monthEventCount: { fontSize: 13 },
});
