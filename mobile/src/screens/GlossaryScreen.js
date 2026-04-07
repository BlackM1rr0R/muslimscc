import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const TERMS = [
  { term:'Allah', ar:'الله', def:{az:'Yeganə tanrı, yaradan',en:'The One God, the Creator',ru:'Единый Бог, Творец',ar:'الإله الواحد الخالق',tr:'Tek Tanrı, Yaratıcı'} },
  { term:'Islam', ar:'الإسلام', def:{az:'Allaha təslim olmaq',en:'Submission to God',ru:'Покорность Богу',ar:'الخضوع لله',tr:'Allah\'a teslim olmak'} },
  { term:'Muslim', ar:'مسلم', def:{az:'Allaha təslim olan',en:'One who submits to God',ru:'Тот, кто покоряется Богу',ar:'المنقاد لله',tr:'Allah\'a teslim olan'} },
  { term:'Quran', ar:'القرآن', def:{az:'Allahın son kitabı',en:"Allah's final book",ru:'Последняя книга Аллаха',ar:'كتاب الله الأخير',tr:'Allah\'ın son kitabı'} },
  { term:'Hadith', ar:'الحديث', def:{az:'Peyğəmbərin ﷺ sözləri',en:"Prophet's ﷺ sayings",ru:'Высказывания Пророка ﷺ',ar:'أقوال النبي ﷺ',tr:'Peygamber ﷺ\'in sözleri'} },
  { term:'Sunnah', ar:'السنة', def:{az:'Peyğəmbərin ﷺ yolu',en:"Prophet's ﷺ way",ru:'Путь Пророка ﷺ',ar:'طريقة النبي ﷺ',tr:'Peygamber ﷺ\'in yolu'} },
  { term:'Salah', ar:'الصلاة', def:{az:'Namaz, 5 vaxtlıq ibadət',en:'Prayer, 5 daily worship',ru:'Намаз, 5 ежедневных молитв',ar:'الصلوات الخمس',tr:'Namaz, 5 vakit ibadet'} },
  { term:'Sawm', ar:'الصوم', def:{az:'Oruc, Ramazan orucu',en:'Fasting, especially in Ramadan',ru:'Пост, особенно в Рамадан',ar:'الصيام، خاصة في رمضان',tr:'Oruç, özellikle Ramazan'} },
  { term:'Zakat', ar:'الزكاة', def:{az:'Vacib sədəqə, malın 2.5%-i',en:'Obligatory charity, 2.5% of wealth',ru:'Обязательная милостыня, 2.5% имущества',ar:'الصدقة الواجبة',tr:'Vacip sadaka, malın %2.5\'i'} },
  { term:'Hajj', ar:'الحج', def:{az:'Məkkəyə ziyarət',en:'Pilgrimage to Mecca',ru:'Паломничество в Мекку',ar:'الحج إلى مكة',tr:'Mekke\'ye hac'} },
  { term:'Shahada', ar:'الشهادة', def:{az:'İman şəhadəti',en:'Declaration of faith',ru:'Свидетельство веры',ar:'شهادة الإيمان',tr:'İman şehadeti'} },
  { term:'Dua', ar:'الدعاء', def:{az:'Allaha yalvarış',en:'Supplication to God',ru:'Мольба к Богу',ar:'التضرع إلى الله',tr:'Allah\'a yakarış'} },
  { term:'Dhikr', ar:'الذكر', def:{az:'Allahı anma',en:'Remembrance of God',ru:'Поминание Бога',ar:'ذكر الله',tr:'Allah\'ı anma'} },
  { term:'Tawhid', ar:'التوحيد', def:{az:'Allahın birliyi',en:'Oneness of God',ru:'Единобожие',ar:'توحيد الله',tr:'Allah\'ın birliği'} },
  { term:'Iman', ar:'الإيمان', def:{az:'İman, inanc',en:'Faith, belief',ru:'Вера',ar:'الإيمان',tr:'İman, inanç'} },
  { term:'Ihsan', ar:'الإحسان', def:{az:'Gözəllik, mükəmməllik',en:'Excellence in worship',ru:'Совершенство в поклонении',ar:'الإحسان في العبادة',tr:'İbadette mükemmellik'} },
  { term:'Ummah', ar:'الأمة', def:{az:'Müsəlman icması',en:'Muslim community',ru:'Мусульманская община',ar:'المجتمع الإسلامي',tr:'Müslüman topluluk'} },
  { term:'Halal', ar:'حلال', def:{az:'İcazə verilmiş',en:'Permissible',ru:'Дозволенное',ar:'المباح',tr:'Helal, izin verilen'} },
  { term:'Haram', ar:'حرام', def:{az:'Qadağan edilmiş',en:'Forbidden',ru:'Запретное',ar:'المحرّم',tr:'Haram, yasak'} },
  { term:'Jannah', ar:'الجنة', def:{az:'Cənnət',en:'Paradise',ru:'Рай',ar:'الجنة',tr:'Cennet'} },
  { term:'Tawbah', ar:'التوبة', def:{az:'Tövbə, günahdan dönmə',en:'Repentance',ru:'Покаяние',ar:'التوبة',tr:'Tövbe'} },
  { term:'Sadaqah', ar:'صدقة', def:{az:'Könüllü sədəqə',en:'Voluntary charity',ru:'Добровольная милостыня',ar:'الصدقة التطوعية',tr:'Gönüllü sadaka'} },
  { term:'Wudu', ar:'الوضوء', def:{az:'Dəstəmaz',en:'Ablution before prayer',ru:'Омовение перед молитвой',ar:'الوضوء قبل الصلاة',tr:'Abdest'} },
  { term:'Masjid', ar:'المسجد', def:{az:'Məscid',en:'Mosque',ru:'Мечеть',ar:'المسجد',tr:'Cami'} },
  { term:'Khutbah', ar:'الخطبة', def:{az:'Cümə xütbəsi',en:'Friday sermon',ru:'Пятничная проповедь',ar:'خطبة الجمعة',tr:'Cuma hutbesi'} },
];

const LABELS = {
  az: { title:'İslami Lüğət', sub:'Əsas İslami terminlər', searchPh:'Termin axtar...' },
  en: { title:'Islamic Glossary', sub:'Essential Islamic terms', searchPh:'Search terms...' },
  ru: { title:'Исламский Глоссарий', sub:'Основные исламские термины', searchPh:'Поиск терминов...' },
  ar: { title:'المعجم الإسلامي', sub:'المصطلحات الإسلامية الأساسية', searchPh:'...ابحث عن مصطلح' },
  tr: { title:'İslami Sözlük', sub:'Temel İslami terimler', searchPh:'Terim ara...' },
};

export default function GlossaryScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return TERMS;
    const q = search.toLowerCase();
    return TERMS.filter(t => t.term.toLowerCase().includes(q) || t.ar.includes(search) || (t.def[lang] || t.def.en).toLowerCase().includes(q));
  }, [search, lang]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="المعجم" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Text style={{ marginRight: 8 }}>🔍</Text>
          <TextInput style={[styles.searchInput, { color: c.text }]} placeholder={l.searchPh} placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(t, i) => t.term + i}
          renderItem={({ item: t }) => (
            <View style={[styles.termCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={styles.termHeader}>
                <Text style={[styles.termName, { color: c.primary }]}>{t.term}</Text>
                <Text style={[styles.termAr, { color: c.text }]}>{t.ar}</Text>
              </View>
              <Text style={[styles.termDef, { color: c.textSecondary }]}>{t.def[lang] || t.def.en}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, height: 44 },
  termCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  termHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  termName: { fontSize: 16, fontWeight: '700' },
  termAr: { fontSize: 18 },
  termDef: { fontSize: 14, lineHeight: 20 },
});
