import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const TYPES = [
  { key:'money', icon:'💰' }, { key:'food', icon:'🍞' }, { key:'smile', icon:'😊' },
  { key:'knowledge', icon:'📚' }, { key:'dua', icon:'🤲' }, { key:'helping', icon:'🤝' },
  { key:'clothing', icon:'👕' }, { key:'other', icon:'🎁' },
];

const LABELS = {
  az: { title:'Sədəqə Jurnalı', sub:'Xeyir işlərinizi qeyd edin', money:'Pul', food:'Yemək', smile:'Təbəssüm', knowledge:'Bilik', dua:'Dua', helping:'Kömək', clothing:'Geyim', other:'Digər', add:'Əlavə et', desc:'Təsvir', amount:'Məbləğ', total:'Ümumi', deeds:'Əməl', delete:'Sil', noEntries:'Hələ qeyd yoxdur' },
  en: { title:'Charity Journal', sub:'Track your good deeds', money:'Money', food:'Food', smile:'Smile', knowledge:'Knowledge', dua:'Dua', helping:'Helping', clothing:'Clothing', other:'Other', add:'Add', desc:'Description', amount:'Amount', total:'Total', deeds:'Deeds', delete:'Delete', noEntries:'No entries yet' },
  ru: { title:'Журнал Садаки', sub:'Отслеживайте добрые дела', money:'Деньги', food:'Еда', smile:'Улыбка', knowledge:'Знание', dua:'Дуа', helping:'Помощь', clothing:'Одежда', other:'Другое', add:'Добавить', desc:'Описание', amount:'Сумма', total:'Итого', deeds:'Дела', delete:'Удалить', noEntries:'Пока нет записей' },
  ar: { title:'سجل الصدقة', sub:'تتبع أعمالك الخيرية', money:'مال', food:'طعام', smile:'ابتسامة', knowledge:'علم', dua:'دعاء', helping:'مساعدة', clothing:'ملابس', other:'أخرى', add:'إضافة', desc:'الوصف', amount:'المبلغ', total:'الإجمالي', deeds:'الأعمال', delete:'حذف', noEntries:'لا توجد إدخالات بعد' },
  tr: { title:'Sadaka Günlüğü', sub:'İyiliklerinizi kaydedin', money:'Para', food:'Yiyecek', smile:'Gülümseme', knowledge:'Bilgi', dua:'Dua', helping:'Yardım', clothing:'Giysi', other:'Diğer', add:'Ekle', desc:'Açıklama', amount:'Miktar', total:'Toplam', deeds:'İşler', delete:'Sil', noEntries:'Henüz kayıt yok' },
};

export default function CharityScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  const [entries, setEntries] = useState([]);
  const [typeIdx, setTypeIdx] = useState(0);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('charity_log').then(v => {
      try { if (v) setEntries(JSON.parse(v)); } catch {}
    });
  }, []);

  const addEntry = async () => {
    if (!desc.trim()) return;
    const entry = { id: Date.now(), type: TYPES[typeIdx].key, desc: desc.trim(), amount: parseFloat(amount) || 0, date: new Date().toISOString().slice(0, 10) };
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    await AsyncStorage.setItem('charity_log', JSON.stringify(newEntries));
    setDesc(''); setAmount('');
  };

  const deleteEntry = async (id) => {
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    await AsyncStorage.setItem('charity_log', JSON.stringify(newEntries));
  };

  const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الصدقة" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.statNum, { color: c.primary }]}>{entries.length}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.deeds}</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.statNum, { color: c.gold }]}>{totalAmount.toFixed(0)}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.total}</Text>
          </View>
        </View>

        {/* Type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {TYPES.map((t2, i) => (
            <TouchableOpacity key={i} style={[styles.typeBtn, typeIdx === i && { backgroundColor: c.primary }]} onPress={() => setTypeIdx(i)}>
              <Text style={styles.typeIcon}>{t2.icon}</Text>
              <Text style={[styles.typeLabel, typeIdx === i && { color: '#fff' }]}>{l[t2.key]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input form */}
        <View style={[styles.formCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <TextInput style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]} placeholder={l.desc} placeholderTextColor={c.textMuted} value={desc} onChangeText={setDesc} />
          <TextInput style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]} placeholder={l.amount} placeholderTextColor={c.textMuted} value={amount} onChangeText={setAmount} keyboardType="numeric" />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.primary }]} onPress={addEntry}>
            <Text style={styles.addBtnText}>{l.add}</Text>
          </TouchableOpacity>
        </View>

        {/* Entries */}
        {entries.length === 0 ? (
          <View style={styles.empty}><Text style={{ fontSize: 48 }}>🎁</Text><Text style={{ color: c.textMuted, marginTop: 8 }}>{l.noEntries}</Text></View>
        ) : (
          entries.map(e => (
            <View key={e.id} style={[styles.entryCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Text style={styles.entryIcon}>{TYPES.find(t2 => t2.key === e.type)?.icon || '🎁'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.entryDesc, { color: c.text }]}>{e.desc}</Text>
                <Text style={[styles.entryDate, { color: c.textMuted }]}>{e.date}{e.amount > 0 ? ` · ${e.amount}` : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteEntry(e.id)}>
                <Text style={{ color: c.error }}>🗑️</Text>
              </TouchableOpacity>
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
  stat: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  typeScroll: { marginBottom: 16, maxHeight: 60 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#eee', marginRight: 8, alignItems: 'center' },
  typeIcon: { fontSize: 24 },
  typeLabel: { fontSize: 11, fontWeight: '500', marginTop: 2, color: '#555' },
  formCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, marginBottom: 10 },
  addBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', marginTop: 30 },
  entryCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  entryIcon: { fontSize: 24, marginRight: 12 },
  entryDesc: { fontSize: 14, fontWeight: '500' },
  entryDate: { fontSize: 12, marginTop: 2 },
});
