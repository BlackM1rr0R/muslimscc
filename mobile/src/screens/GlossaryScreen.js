import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const TERMS = [
  { term:'Allah', ar:'الله', color:'#10b981', def:{az:'Yeganə tanrı, yaradan',en:'The One God, the Creator',ru:'Единый Бог, Творец',ar:'الإله الواحد الخالق',tr:'Tek Tanrı, Yaratıcı'} },
  { term:'Islam', ar:'الإسلام', color:'#3b82f6', def:{az:'Allaha təslim olmaq',en:'Submission to God',ru:'Покорность Богу',ar:'الخضوع لله',tr:'Allah\'a teslim olmak'} },
  { term:'Muslim', ar:'مسلم', color:'#8b5cf6', def:{az:'Allaha təslim olan',en:'One who submits to God',ru:'Покорный Богу',ar:'المنقاد لله',tr:'Teslim olan'} },
  { term:'Quran', ar:'القرآن', color:'#f59e0b', def:{az:'Allahın son kitabı',en:"Allah's final book",ru:'Последняя книга Аллаха',ar:'كتاب الله',tr:'Allah\'ın kitabı'} },
  { term:'Hadith', ar:'الحديث', color:'#ec4899', def:{az:'Peyğəmbərin sözləri',en:"Prophet's sayings",ru:'Высказывания Пророка',ar:'أقوال النبي',tr:'Peygamber sözleri'} },
  { term:'Sunnah', ar:'السنة', color:'#06b6d4', def:{az:'Peyğəmbərin yolu',en:"Prophet's way",ru:'Путь Пророка',ar:'طريقة النبي',tr:'Peygamber\'in yolu'} },
  { term:'Salah', ar:'الصلاة', color:'#14b8a6', def:{az:'Namaz, 5 vaxtlıq ibadət',en:'Prayer, 5 daily worship',ru:'Намаз',ar:'الصلوات الخمس',tr:'Namaz'} },
  { term:'Sawm', ar:'الصوم', color:'#6366f1', def:{az:'Oruc',en:'Fasting',ru:'Пост',ar:'الصيام',tr:'Oruç'} },
  { term:'Zakat', ar:'الزكاة', color:'#f97316', def:{az:'Vacib sədəqə 2.5%',en:'Obligatory charity 2.5%',ru:'Обязательная милостыня',ar:'الصدقة الواجبة',tr:'Vacip sadaka'} },
  { term:'Hajj', ar:'الحج', color:'#ef4444', def:{az:'Məkkəyə ziyarət',en:'Pilgrimage to Mecca',ru:'Паломничество',ar:'الحج',tr:'Mekke\'ye hac'} },
  { term:'Shahada', ar:'الشهادة', color:'#a855f7', def:{az:'İman şəhadəti',en:'Declaration of faith',ru:'Свидетельство веры',ar:'شهادة الإيمان',tr:'İman şehadeti'} },
  { term:'Dua', ar:'الدعاء', color:'#10b981', def:{az:'Allaha yalvarış',en:'Supplication to God',ru:'Мольба',ar:'التضرع',tr:'Yakarış'} },
  { term:'Dhikr', ar:'الذكر', color:'#84cc16', def:{az:'Allahı anma',en:'Remembrance of God',ru:'Поминание',ar:'ذكر الله',tr:'Allah\'ı anma'} },
  { term:'Tawhid', ar:'التوحيد', color:'#fbbf24', def:{az:'Allahın birliyi',en:'Oneness of God',ru:'Единобожие',ar:'توحيد الله',tr:'Allah\'ın birliği'} },
  { term:'Iman', ar:'الإيمان', color:'#06b6d4', def:{az:'İman, inanc',en:'Faith, belief',ru:'Вера',ar:'الإيمان',tr:'İman'} },
  { term:'Ihsan', ar:'الإحسان', color:'#f59e0b', def:{az:'Gözəllik, mükəmməllik',en:'Excellence in worship',ru:'Совершенство',ar:'الإحسان',tr:'Mükemmellik'} },
  { term:'Ummah', ar:'الأمة', color:'#8b5cf6', def:{az:'Müsəlman icması',en:'Muslim community',ru:'Община',ar:'المجتمع',tr:'Müslüman topluluk'} },
  { term:'Halal', ar:'حلال', color:'#10b981', def:{az:'İcazə verilmiş',en:'Permissible',ru:'Дозволенное',ar:'المباح',tr:'Helal'} },
  { term:'Haram', ar:'حرام', color:'#ef4444', def:{az:'Qadağan edilmiş',en:'Forbidden',ru:'Запретное',ar:'المحرّم',tr:'Haram'} },
  { term:'Jannah', ar:'الجنة', color:'#10b981', def:{az:'Cənnət',en:'Paradise',ru:'Рай',ar:'الجنة',tr:'Cennet'} },
  { term:'Tawbah', ar:'التوبة', color:'#14b8a6', def:{az:'Tövbə',en:'Repentance',ru:'Покаяние',ar:'التوبة',tr:'Tövbe'} },
  { term:'Sadaqah', ar:'صدقة', color:'#f97316', def:{az:'Könüllü sədəqə',en:'Voluntary charity',ru:'Добровольная милостыня',ar:'الصدقة التطوعية',tr:'Gönüllü sadaka'} },
  { term:'Wudu', ar:'الوضوء', color:'#06b6d4', def:{az:'Dəstəmaz',en:'Ablution',ru:'Омовение',ar:'الوضوء',tr:'Abdest'} },
  { term:'Masjid', ar:'المسجد', color:'#3b82f6', def:{az:'Məscid',en:'Mosque',ru:'Мечеть',ar:'المسجد',tr:'Cami'} },
  { term:'Khutbah', ar:'الخطبة', color:'#a855f7', def:{az:'Cümə xütbəsi',en:'Friday sermon',ru:'Пятничная проповедь',ar:'خطبة الجمعة',tr:'Cuma hutbesi'} },
];

const LABELS = {
  az: { title:'İslami Lüğət', sub:'Əsas İslami terminlər', searchPh:'Termin axtar...' },
  en: { title:'Islamic Glossary', sub:'Essential Islamic terms', searchPh:'Search terms...' },
  ru: { title:'Исламский Глоссарий', sub:'Основные термины', searchPh:'Поиск...' },
  ar: { title:'المعجم الإسلامي', sub:'المصطلحات الأساسية', searchPh:'ابحث...' },
  tr: { title:'İslami Sözlük', sub:'Temel terimler', searchPh:'Terim ara...' },
};

export default function GlossaryScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return TERMS;
    const q = search.toLowerCase();
    return TERMS.filter(t => t.term.toLowerCase().includes(q) || t.ar.includes(search) || (t.def[lang] || t.def.en).toLowerCase().includes(q));
  }, [search, lang]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="المُعْجَم" title={l.title} subtitle={l.sub} theme="glossary" />

      <View style={styles.content}>

        {/* Search */}
        <FadeUp delay={100}>
          <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
            <View style={[styles.searchIconWrap, { backgroundColor: c.primaryBg }]}>
              <AppIcon name="search" size={16} color={c.primary} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder={l.searchPh}
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <AppIcon name="close" size={18} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </FadeUp>

        {/* Count */}
        <FadeUp delay={150}>
          <View style={[styles.countBadge, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <AppIcon name="glossary" size={14} color={c.primary} />
            <Text style={[styles.countText, { color: c.text }]}>
              {filtered.length} {lang==='az'?'termin':lang==='ru'?'терминов':lang==='ar'?'مصطلح':lang==='tr'?'terim':'terms'}
            </Text>
          </View>
        </FadeUp>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(t, i) => t.term + i}
          renderItem={({ item: t, index: i }) => (
            <FadeUp delay={Math.min(i * 40, 300)}>
              <View style={[styles.termCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                <LinearGradient
                  colors={[t.color + '15', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.5 }}
                />
                <View style={[styles.colorBar, { backgroundColor: t.color }]} />

                <View style={styles.termHeader}>
                  <View style={[styles.termBadge, { backgroundColor: t.color + '18', borderColor: t.color + '30' }]}>
                    <Text style={[styles.termBadgeText, { color: t.color }]}>{t.term}</Text>
                  </View>
                  <Text style={[styles.termAr, { color: t.color }]}>{t.ar}</Text>
                </View>
                <Text style={[styles.termDef, { color: c.textSecondary }]}>{t.def[lang] || t.def.en}</Text>
              </View>
            </FadeUp>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14 },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 14, borderRadius: BorderRadius.lg, borderWidth: 1, height: 52, marginBottom: 12 },
  searchIconWrap: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, height: 52, fontWeight: '500' },

  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 14 },
  countText: { fontSize: 13, fontWeight: '700' },

  // Term card
  termCard: {
    padding: 16,
    paddingLeft: 22,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  termHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  termBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  termBadgeText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  termAr: { fontSize: 20, fontWeight: '500' },
  termDef: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
});
