import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const CATS = ['personal','family','health','work','ummah'];
const CAT_ICONS = { personal:'🙏', family:'👨‍👩‍👧‍👦', health:'💚', work:'💼', ummah:'🌍' };
const PRIORITIES = ['low','medium','high'];
const PRIORITY_COLORS = { low:'#4caf50', medium:'#ff9800', high:'#f44336' };

const LABELS = {
  az: { title:'Dua Jurnalı', sub:'Şəxsi dualarınız', personal:'Şəxsi', family:'Ailə', health:'Sağlamlıq', work:'İş', ummah:'Ümmət', add:'Əlavə et', text:'Duanızı yazın...', active:'Aktiv', answered:'Qəbul olunmuş', low:'Aşağı', medium:'Orta', high:'Yüksək', markAnswered:'Qəbul olundu', delete:'Sil', noEntries:'Hələ dua yoxdur', priority:'Prioritet', category:'Kateqoriya' },
  en: { title:'Dua Journal', sub:'Your personal duas', personal:'Personal', family:'Family', health:'Health', work:'Work', ummah:'Ummah', add:'Add', text:'Write your dua...', active:'Active', answered:'Answered', low:'Low', medium:'Medium', high:'High', markAnswered:'Mark Answered', delete:'Delete', noEntries:'No duas yet', priority:'Priority', category:'Category' },
  ru: { title:'Журнал Дуа', sub:'Ваши личные дуа', personal:'Личное', family:'Семья', health:'Здоровье', work:'Работа', ummah:'Умма', add:'Добавить', text:'Напишите дуа...', active:'Активные', answered:'Принятые', low:'Низкий', medium:'Средний', high:'Высокий', markAnswered:'Принято', delete:'Удалить', noEntries:'Нет дуа', priority:'Приоритет', category:'Категория' },
  ar: { title:'دفتر الدعاء', sub:'أدعيتك الشخصية', personal:'شخصي', family:'عائلة', health:'صحة', work:'عمل', ummah:'أمة', add:'إضافة', text:'...اكتب دعاءك', active:'نشط', answered:'مستجاب', low:'منخفض', medium:'متوسط', high:'عالي', markAnswered:'تم الاستجابة', delete:'حذف', noEntries:'لا توجد أدعية بعد', priority:'الأولوية', category:'الفئة' },
  tr: { title:'Dua Günlüğü', sub:'Kişisel dualarınız', personal:'Kişisel', family:'Aile', health:'Sağlık', work:'İş', ummah:'Ümmet', add:'Ekle', text:'Duanızı yazın...', active:'Aktif', answered:'Kabul edilmiş', low:'Düşük', medium:'Orta', high:'Yüksek', markAnswered:'Kabul edildi', delete:'Sil', noEntries:'Henüz dua yok', priority:'Öncelik', category:'Kategori' },
};

export default function DuaJournalScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

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
    const dua = { id: Date.now(), text: text.trim(), cat: CATS[catIdx], priority: PRIORITIES[priIdx], date: new Date().toISOString().slice(0, 10), answered: false };
    save([dua, ...duas]);
    setText(''); setShowForm(false);
  };

  const markAnswered = (id) => {
    save(duas.map(d => d.id === id ? { ...d, answered: true, answeredDate: new Date().toISOString().slice(0, 10) } : d));
  };

  const deleteDua = (id) => {
    save(duas.filter(d => d.id !== id));
  };

  const filtered = duas.filter(d => tab === 'active' ? !d.answered : d.answered);
  const activeCount = duas.filter(d => !d.answered).length;
  const answeredCount = duas.filter(d => d.answered).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="دفتر الدعاء" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.statNum, { color: c.primary }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.active}</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.statNum, { color: c.gold }]}>{answeredCount}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.answered}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'active' && { backgroundColor: c.primary }]} onPress={() => setTab('active')}>
            <Text style={[styles.tabText, tab === 'active' && { color: '#fff' }]}>{l.active}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'answered' && { backgroundColor: c.gold }]} onPress={() => setTab('answered')}>
            <Text style={[styles.tabText, tab === 'answered' && { color: '#fff' }]}>{l.answered}</Text>
          </TouchableOpacity>
        </View>

        {/* Add button */}
        <TouchableOpacity style={[styles.addToggle, { backgroundColor: c.primary }]} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addToggleText}>{showForm ? '✕' : '+'} {l.add}</Text>
        </TouchableOpacity>

        {/* Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <TextInput style={[styles.textInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]} placeholder={l.text} placeholderTextColor={c.textMuted} value={text} onChangeText={setText} multiline numberOfLines={3} />
            <Text style={[styles.formLabel, { color: c.textSecondary }]}>{l.category}</Text>
            <View style={styles.catRow}>
              {CATS.map((cat, i) => (
                <TouchableOpacity key={cat} style={[styles.catBtn, catIdx === i && { backgroundColor: c.primary }]} onPress={() => setCatIdx(i)}>
                  <Text>{CAT_ICONS[cat]}</Text>
                  <Text style={[styles.catLabel, catIdx === i && { color: '#fff' }]}>{l[cat]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.formLabel, { color: c.textSecondary }]}>{l.priority}</Text>
            <View style={styles.priRow}>
              {PRIORITIES.map((p, i) => (
                <TouchableOpacity key={p} style={[styles.priBtn, { borderColor: PRIORITY_COLORS[p] }, priIdx === i && { backgroundColor: PRIORITY_COLORS[p] }]} onPress={() => setPriIdx(i)}>
                  <Text style={[styles.priText, priIdx === i && { color: '#fff' }]}>{l[p]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: c.primary }]} onPress={addDua}>
              <Text style={styles.submitText}>{l.add}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <View style={styles.empty}><Text style={{ fontSize: 48 }}>📝</Text><Text style={{ color: c.textMuted, marginTop: 8 }}>{l.noEntries}</Text></View>
        ) : (
          filtered.map(d => (
            <View key={d.id} style={[styles.duaCard, { backgroundColor: c.card, borderColor: c.cardBorder, borderLeftColor: PRIORITY_COLORS[d.priority] }]}>
              <View style={styles.duaHeader}>
                <Text>{CAT_ICONS[d.cat]}</Text>
                <Text style={[styles.duaCat, { color: c.primary }]}>{l[d.cat]}</Text>
                <View style={[styles.priBadge, { backgroundColor: PRIORITY_COLORS[d.priority] + '20' }]}>
                  <Text style={{ color: PRIORITY_COLORS[d.priority], fontSize: 11 }}>{l[d.priority]}</Text>
                </View>
              </View>
              <Text style={[styles.duaText, { color: c.text }]}>{d.text}</Text>
              <Text style={[styles.duaDate, { color: c.textMuted }]}>{d.date}</Text>
              <View style={styles.duaActions}>
                {!d.answered && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.primary + '15' }]} onPress={() => markAnswered(d.id)}>
                    <Text style={{ color: c.primary, fontSize: 13 }}>✅ {l.markAnswered}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f4433615' }]} onPress={() => deleteDua(d.id)}>
                  <Text style={{ color: '#f44336', fontSize: 13 }}>🗑️ {l.delete}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stat: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#eee' },
  tabText: { fontWeight: '600', fontSize: 14 },
  addToggle: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  addToggleText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  formCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  textInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  catBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee', gap: 4 },
  catLabel: { fontSize: 12, color: '#555' },
  priRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  priBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  priText: { fontSize: 13, fontWeight: '600' },
  submitBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', marginTop: 30 },
  duaCard: { padding: 16, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, marginBottom: 10 },
  duaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  duaCat: { fontSize: 13, fontWeight: '600' },
  priBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  duaText: { fontSize: 15, lineHeight: 22, marginBottom: 6 },
  duaDate: { fontSize: 12, marginBottom: 8 },
  duaActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
});
