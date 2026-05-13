import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const CATS = [
  { key:'personal', icon:'heart', color:'#ec4899', gradient:['#ec4899','#db2777'] },
  { key:'family', icon:'sahaba', color:'#10b981', gradient:['#10b981','#059669'] },
  { key:'health', icon:'check', color:'#14b8a6', gradient:['#14b8a6','#0d9488'] },
  { key:'work', icon:'analytics', color:'#3b82f6', gradient:['#3b82f6','#2563eb'] },
  { key:'ummah', icon:'mosques', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'] },
];

const PRIORITIES = [
  { key:'low', color:'#10b981' },
  { key:'medium', color:'#f59e0b' },
  { key:'high', color:'#ef4444' },
];

const LABELS = {
  az: { title:'Dua Jurnalı', sub:'Şəxsi dualarınız', personal:'Şəxsi', family:'Ailə', health:'Sağlamlıq', work:'İş', ummah:'Ümmət', add:'Əlavə et', text:'Duanızı yazın...', active:'Aktiv', answered:'Qəbul olunmuş', low:'Aşağı', medium:'Orta', high:'Yüksək', markAnswered:'Qəbul oldu', delete:'Sil', noEntries:'Hələ dua yoxdur', priority:'Prioritet', category:'Kateqoriya' },
  en: { title:'Dua Journal', sub:'Your personal duas', personal:'Personal', family:'Family', health:'Health', work:'Work', ummah:'Ummah', add:'Add', text:'Write your dua...', active:'Active', answered:'Answered', low:'Low', medium:'Medium', high:'High', markAnswered:'Mark Answered', delete:'Delete', noEntries:'No duas yet', priority:'Priority', category:'Category' },
  ru: { title:'Журнал Дуа', sub:'Ваши личные дуа', personal:'Личное', family:'Семья', health:'Здоровье', work:'Работа', ummah:'Умма', add:'Добавить', text:'Напишите дуа...', active:'Активные', answered:'Принятые', low:'Низкий', medium:'Средний', high:'Высокий', markAnswered:'Принято', delete:'Удалить', noEntries:'Нет дуа', priority:'Приоритет', category:'Категория' },
  ar: { title:'دفتر الدعاء', sub:'أدعيتك الشخصية', personal:'شخصي', family:'عائلة', health:'صحة', work:'عمل', ummah:'أمة', add:'إضافة', text:'اكتب دعاءك...', active:'نشط', answered:'مستجاب', low:'منخفض', medium:'متوسط', high:'عالي', markAnswered:'تم الاستجابة', delete:'حذف', noEntries:'لا توجد أدعية', priority:'الأولوية', category:'الفئة' },
  tr: { title:'Dua Günlüğü', sub:'Kişisel dualarınız', personal:'Kişisel', family:'Aile', health:'Sağlık', work:'İş', ummah:'Ümmet', add:'Ekle', text:'Duanızı yazın...', active:'Aktif', answered:'Kabul edilmiş', low:'Düşük', medium:'Orta', high:'Yüksek', markAnswered:'Kabul edildi', delete:'Sil', noEntries:'Henüz dua yok', priority:'Öncelik', category:'Kategori' },
};

export default function DuaJournalScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [duas, setDuas] = useState([]);
  const [tab, setTab] = useState('active');
  const [text, setText] = useState('');
  const [catIdx, setCatIdx] = useState(0);
  const [priIdx, setPriIdx] = useState(1);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('dua_journal').then(v => {
      try { const d = JSON.parse(v); if (d?.duas) setDuas(d.duas); } catch {}
    });
  }, []);

  const save = async (newDuas) => {
    setDuas(newDuas);
    await AsyncStorage.setItem('dua_journal', JSON.stringify({ duas: newDuas }));
  };

  const addDua = () => {
    if (!text.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dua = { id: Date.now(), text: text.trim(), cat: CATS[catIdx].key, priority: PRIORITIES[priIdx].key, date: new Date().toISOString().slice(0, 10), answered: false };
    save([dua, ...duas]);
    setText(''); setShowForm(false);
  };

  const markAnswered = (id) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    save(duas.map(d => d.id === id ? { ...d, answered: true, answeredDate: new Date().toISOString().slice(0, 10) } : d));
  };

  const deleteDua = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    save(duas.filter(d => d.id !== id));
  };

  const filtered = duas.filter(d => tab === 'active' ? !d.answered : d.answered);
  const activeCount = duas.filter(d => !d.answered).length;
  const answeredCount = duas.filter(d => d.answered).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="دَفْتَرُ الدُّعَاء" title={l.title} subtitle={l.sub} theme="duajournal" />

      <View style={styles.content}>

        {/* Stats */}
        <FadeUp delay={100}>
          <View style={styles.statsRow}>
            <LinearGradient colors={['#8b5cf6','#7c3aed']} style={[styles.statCard, sh]}>
              <AppIcon name="duas" size={22} color="#fff" />
              <Text style={styles.statNum}>{activeCount}</Text>
              <Text style={styles.statLabel}>{l.active}</Text>
            </LinearGradient>
            <LinearGradient colors={['#10b981','#059669']} style={[styles.statCard, sh]}>
              <AppIcon name="check" size={22} color="#fff" />
              <Text style={styles.statNum}>{answeredCount}</Text>
              <Text style={styles.statLabel}>{l.answered}</Text>
            </LinearGradient>
          </View>
        </FadeUp>

        {/* Tabs */}
        <FadeUp delay={200}>
          <View style={[styles.tabRow, { backgroundColor: c.surfaceAlt }]}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'active' && { backgroundColor: c.card }, tab === 'active' && shS]}
              onPress={() => { Haptics.selectionAsync(); setTab('active'); }}
              activeOpacity={0.8}
            >
              <AppIcon name="duas" size={14} color={tab === 'active' ? c.primary : c.textMuted} />
              <Text style={[styles.tabText, { color: tab === 'active' ? c.primary : c.textMuted }]}>{l.active}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'answered' && { backgroundColor: c.card }, tab === 'answered' && shS]}
              onPress={() => { Haptics.selectionAsync(); setTab('answered'); }}
              activeOpacity={0.8}
            >
              <AppIcon name="check" size={14} color={tab === 'answered' ? '#10b981' : c.textMuted} />
              <Text style={[styles.tabText, { color: tab === 'answered' ? '#10b981' : c.textMuted }]}>{l.answered}</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>

        {/* Add button */}
        <FadeUp delay={300}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowForm(!showForm); }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[c.primary, c.primaryDark]} style={[styles.addToggle, Shadows.button]}>
              <AppIcon name={showForm ? 'close' : 'add'} size={20} color="#fff" />
              <Text style={styles.addToggleText}>{showForm ? l.close || 'Close' : l.add}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </FadeUp>

        {/* Form */}
        {showForm && (
          <FadeUp duration={300}>
            <View style={[styles.formCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <TextInput
                style={[styles.textInput, { backgroundColor: c.surfaceAlt, color: c.text }]}
                placeholder={l.text}
                placeholderTextColor={c.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.formLabel, { color: c.textMuted }]}>{l.category}</Text>
              <View style={styles.catGrid}>
                {CATS.map((cat, i) => {
                  const active = catIdx === i;
                  return (
                    <TouchableOpacity key={cat.key} onPress={() => { Haptics.selectionAsync(); setCatIdx(i); }} activeOpacity={0.8}>
                      {active ? (
                        <LinearGradient colors={cat.gradient} style={[styles.catBtn, Shadows.button]}>
                          <AppIcon name={cat.icon} size={14} color="#fff" />
                          <Text style={[styles.catText, { color: '#fff' }]}>{l[cat.key]}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.catBtn, { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border }]}>
                          <AppIcon name={cat.icon} size={14} color={cat.color} />
                          <Text style={[styles.catText, { color: c.textSecondary }]}>{l[cat.key]}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.formLabel, { color: c.textMuted }]}>{l.priority}</Text>
              <View style={styles.priRow}>
                {PRIORITIES.map((p, i) => {
                  const active = priIdx === i;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      style={[
                        styles.priBtn,
                        {
                          backgroundColor: active ? p.color : c.surfaceAlt,
                          borderColor: p.color,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setPriIdx(i); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.priText, { color: active ? '#fff' : p.color }]}>{l[p.key]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, Shadows.button]}
                onPress={addDua}
                activeOpacity={0.85}
              >
                <LinearGradient colors={CATS[catIdx].gradient} style={styles.submitGrad}>
                  <Text style={styles.submitText}>{l.add}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </FadeUp>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <ScaleIn>
            <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryBg }]}>
                <AppIcon name="duas" size={36} color={c.primary} />
              </View>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{l.noEntries}</Text>
            </View>
          </ScaleIn>
        ) : (
          filtered.map((d, i) => {
            const cat = CATS.find(cc => cc.key === d.cat) || CATS[0];
            const pri = PRIORITIES.find(pp => pp.key === d.priority) || PRIORITIES[1];
            return (
              <FadeUp key={d.id} delay={Math.min(i * 50, 300)}>
                <View style={[styles.duaCard, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
                  <View style={[styles.colorBar, { backgroundColor: pri.color }]} />
                  <LinearGradient
                    colors={[cat.color + '10', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                  <View style={styles.duaHeader}>
                    <LinearGradient colors={cat.gradient} style={styles.duaCatIcon}>
                      <AppIcon name={cat.icon} size={14} color="#fff" />
                    </LinearGradient>
                    <View style={[styles.duaCatBadge, { backgroundColor: cat.color + '18', borderColor: cat.color + '30' }]}>
                      <Text style={[styles.duaCatText, { color: cat.color }]}>{l[d.cat]}</Text>
                    </View>
                    <View style={[styles.priBadge, { backgroundColor: pri.color + '18', borderColor: pri.color + '40' }]}>
                      <Text style={[styles.priBadgeText, { color: pri.color }]}>{l[d.priority]}</Text>
                    </View>
                  </View>

                  <Text style={[styles.duaText, { color: c.text }]}>{d.text}</Text>
                  <Text style={[styles.duaDate, { color: c.textMuted }]}>{d.date}</Text>

                  <View style={[styles.duaActions, { borderTopColor: c.border }]}>
                    {!d.answered && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: c.primaryBg, borderColor: c.primaryBorder }]}
                        onPress={() => markAnswered(d.id)}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="check" size={14} color={c.primary} />
                        <Text style={[styles.actionText, { color: c.primary }]}>{l.markAnswered}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}
                      onPress={() => deleteDua(d.id)}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="delete" size={14} color={c.error} />
                      <Text style={[styles.actionText, { color: c.error }]}>{l.delete}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </FadeUp>
            );
          })
        )}
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 20, borderRadius: BorderRadius.xl, alignItems: 'center', overflow: 'hidden' },
  statNum: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 8, letterSpacing: -1 },
  statLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3, textTransform: 'uppercase' },

  // Tabs
  tabRow: { flexDirection: 'row', padding: 4, borderRadius: BorderRadius.md, marginBottom: 14 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: BorderRadius.sm },
  tabText: { fontSize: 13, fontWeight: '700' },

  // Add button
  addToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: BorderRadius.md, marginBottom: 14 },
  addToggleText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Form
  formCard: { padding: 18, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 16 },
  textInput: { borderRadius: BorderRadius.md, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: 'top', marginBottom: 14, fontWeight: '500' },
  formLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full },
  catText: { fontSize: 12, fontWeight: '700' },
  priRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  priBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 2, alignItems: 'center' },
  priText: { fontSize: 13, fontWeight: '800' },
  submitBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  submitGrad: { paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Empty
  empty: { alignItems: 'center', padding: 40, borderRadius: BorderRadius.xl, borderWidth: 1 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyText: { fontSize: 14, fontWeight: '600' },

  // Dua card
  duaCard: {
    padding: 18,
    paddingLeft: 22,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  duaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  duaCatIcon: { width: 26, height: 26, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  duaCatBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  duaCatText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  priBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  priBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  duaText: { fontSize: 15, lineHeight: 24, marginBottom: 8, fontWeight: '500' },
  duaDate: { fontSize: 11, fontWeight: '600', marginBottom: 12 },
  duaActions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.sm, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '700' },
});
