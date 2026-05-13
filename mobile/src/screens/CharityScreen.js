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

const TYPES = [
  { key:'money', icon:'zakat', color:'#10b981', gradient:['#10b981','#059669'] },
  { key:'food', icon:'charity', color:'#f59e0b', gradient:['#f59e0b','#d97706'] },
  { key:'smile', icon:'heart', color:'#ec4899', gradient:['#ec4899','#db2777'] },
  { key:'knowledge', icon:'glossary', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'] },
  { key:'dua', icon:'duas', color:'#3b82f6', gradient:['#3b82f6','#2563eb'] },
  { key:'helping', icon:'sahaba', color:'#14b8a6', gradient:['#14b8a6','#0d9488'] },
  { key:'clothing', icon:'charity', color:'#f97316', gradient:['#f97316','#ea580c'] },
  { key:'other', icon:'charity', color:'#6366f1', gradient:['#6366f1','#4f46e5'] },
];

const LABELS = {
  az: { title:'Sədəqə Jurnalı', sub:'Xeyir işlərinizi qeyd edin', money:'Pul', food:'Yemək', smile:'Təbəssüm', knowledge:'Bilik', dua:'Dua', helping:'Kömək', clothing:'Geyim', other:'Digər', add:'Əlavə et', desc:'Təsvir', amount:'Məbləğ', total:'Ümumi', deeds:'Əməl', delete:'Sil', noEntries:'Hələ qeyd yoxdur' },
  en: { title:'Charity Journal', sub:'Track your good deeds', money:'Money', food:'Food', smile:'Smile', knowledge:'Knowledge', dua:'Dua', helping:'Helping', clothing:'Clothing', other:'Other', add:'Add', desc:'Description', amount:'Amount', total:'Total', deeds:'Deeds', delete:'Delete', noEntries:'No entries yet' },
  ru: { title:'Журнал Садаки', sub:'Отслеживайте добрые дела', money:'Деньги', food:'Еда', smile:'Улыбка', knowledge:'Знание', dua:'Дуа', helping:'Помощь', clothing:'Одежда', other:'Другое', add:'Добавить', desc:'Описание', amount:'Сумма', total:'Всего', deeds:'Дел', delete:'Удалить', noEntries:'Пока нет записей' },
  ar: { title:'سجل الصدقة', sub:'تتبع أعمالك الخيرية', money:'مال', food:'طعام', smile:'ابتسامة', knowledge:'علم', dua:'دعاء', helping:'مساعدة', clothing:'ملابس', other:'أخرى', add:'إضافة', desc:'الوصف', amount:'المبلغ', total:'الإجمالي', deeds:'الأعمال', delete:'حذف', noEntries:'لا توجد إدخالات' },
  tr: { title:'Sadaka Günlüğü', sub:'İyiliklerinizi kaydedin', money:'Para', food:'Yiyecek', smile:'Gülümseme', knowledge:'Bilgi', dua:'Dua', helping:'Yardım', clothing:'Giysi', other:'Diğer', add:'Ekle', desc:'Açıklama', amount:'Miktar', total:'Toplam', deeds:'İşler', delete:'Sil', noEntries:'Henüz kayıt yok' },
};

export default function CharityScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const entry = { id: Date.now(), type: TYPES[typeIdx].key, desc: desc.trim(), amount: parseFloat(amount) || 0, date: new Date().toISOString().slice(0, 10) };
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    await AsyncStorage.setItem('charity_log', JSON.stringify(newEntries));
    setDesc(''); setAmount('');
  };

  const deleteEntry = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    await AsyncStorage.setItem('charity_log', JSON.stringify(newEntries));
  };

  const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الصَّدَقَة" title={l.title} subtitle={l.sub} theme="charity" />

      <View style={styles.content}>

        {/* Stats banner */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={['#f59e0b','#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, sh]}
          >
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />
            <View style={styles.bannerRow}>
              <View style={styles.bannerStat}>
                <Text style={styles.bannerNum}>{entries.length}</Text>
                <Text style={styles.bannerLabel}>{l.deeds}</Text>
              </View>
              <View style={styles.bannerDivider} />
              <View style={styles.bannerStat}>
                <Text style={styles.bannerNum}>{totalAmount.toFixed(0)}</Text>
                <Text style={styles.bannerLabel}>{l.total}</Text>
              </View>
            </View>
          </LinearGradient>
        </ScaleIn>

        {/* Type selector */}
        <FadeUp delay={200}>
          <Text style={[styles.label, { color: c.textMuted }]}>
            {lang==='az'?'NÖVÜ SEÇ':lang==='ru'?'ВЫБЕРИТЕ ТИП':lang==='ar'?'اختر النوع':lang==='tr'?'TÜRÜ SEÇ':'SELECT TYPE'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
            {TYPES.map((t, i) => {
              const active = typeIdx === i;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTypeIdx(i);
                  }}
                  activeOpacity={0.8}
                >
                  {active ? (
                    <LinearGradient colors={t.gradient} style={[styles.typeBtn, Shadows.button]}>
                      <AppIcon name={t.icon} size={20} color="#fff" />
                      <Text style={[styles.typeLabel, { color: '#fff' }]}>{l[t.key]}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.typeBtn, { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1.5 }, shS]}>
                      <AppIcon name={t.icon} size={20} color={t.color} />
                      <Text style={[styles.typeLabel, { color: c.textSecondary }]}>{l[t.key]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* Form */}
        <FadeUp delay={300}>
          <View style={[styles.formCard, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
            <TextInput
              style={[styles.input, { backgroundColor: c.surfaceAlt, color: c.text }]}
              placeholder={l.desc}
              placeholderTextColor={c.textMuted}
              value={desc}
              onChangeText={setDesc}
            />
            <TextInput
              style={[styles.input, { backgroundColor: c.surfaceAlt, color: c.text }]}
              placeholder={l.amount}
              placeholderTextColor={c.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.addBtn, Shadows.button]}
              onPress={addEntry}
              activeOpacity={0.85}
            >
              <LinearGradient colors={TYPES[typeIdx].gradient} style={styles.addBtnGrad}>
                <AppIcon name="add" size={20} color="#fff" />
                <Text style={styles.addBtnText}>{l.add}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </FadeUp>

        {/* Entries */}
        <FadeUp delay={400}>
          <Text style={[styles.label, { color: c.textMuted, marginTop: 8 }]}>
            {lang==='az'?'QEYDLƏR':lang==='ru'?'ЗАПИСИ':lang==='ar'?'السجلات':lang==='tr'?'KAYITLAR':'ENTRIES'}
          </Text>
        </FadeUp>

        {entries.length === 0 ? (
          <ScaleIn>
            <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryBg }]}>
                <AppIcon name="charity" size={36} color={c.primary} />
              </View>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{l.noEntries}</Text>
            </View>
          </ScaleIn>
        ) : (
          entries.map((e, i) => {
            const type = TYPES.find(t => t.key === e.type) || TYPES[0];
            return (
              <FadeUp key={e.id} delay={Math.min(i * 50, 300)}>
                <View style={[styles.entryCard, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
                  <LinearGradient colors={type.gradient} style={styles.entryIconWrap}>
                    <AppIcon name={type.icon} size={18} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryDesc, { color: c.text }]}>{e.desc}</Text>
                    <View style={styles.entryMeta}>
                      <Text style={[styles.entryDate, { color: c.textMuted }]}>{e.date}</Text>
                      {e.amount > 0 && (
                        <>
                          <View style={[styles.entryDot, { backgroundColor: c.textMuted }]} />
                          <Text style={[styles.entryAmount, { color: type.color }]}>{e.amount}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteEntry(e.id)}
                    style={[styles.deleteBtn, { backgroundColor: c.error + '15' }]}
                  >
                    <AppIcon name="delete" size={16} color={c.error} />
                  </TouchableOpacity>
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

  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  // Banner
  banner: {
    padding: 24,
    borderRadius: BorderRadius.xl,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  bannerCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  bannerRow: { flexDirection: 'row', alignItems: 'center' },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerNum: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  bannerLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  bannerDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)' },

  // Type row
  typeRow: { gap: 10, paddingBottom: 8 },
  typeBtn: { alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 14, borderRadius: BorderRadius.md, minWidth: 84 },
  typeLabel: { fontSize: 11, fontWeight: '700' },

  // Form
  formCard: { padding: 16, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 16, marginTop: 16 },
  input: { height: 50, borderRadius: BorderRadius.md, paddingHorizontal: 16, fontSize: 15, fontWeight: '600', marginBottom: 10 },
  addBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  addBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Empty
  empty: { alignItems: 'center', padding: 40, borderRadius: BorderRadius.xl, borderWidth: 1 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyText: { fontSize: 14, fontWeight: '600' },

  // Entry card
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  entryIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  entryDesc: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryDate: { fontSize: 11, fontWeight: '600' },
  entryDot: { width: 3, height: 3, borderRadius: 1.5 },
  entryAmount: { fontSize: 13, fontWeight: '800' },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
