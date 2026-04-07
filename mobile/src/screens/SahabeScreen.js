import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const SAHABA = [
  { name:{az:'Əbu Bəkr əs-Siddiq',en:'Abu Bakr as-Siddiq',ru:'Абу Бакр ас-Сиддик',ar:'أبو بكر الصديق',tr:'Ebu Bekir es-Sıddık'}, title:{az:'1-ci Xəlifə, ən yaxın dost',en:'1st Caliph, closest companion',ru:'1-й халиф, ближайший друг',ar:'الخليفة الأول، أقرب صحابي',tr:'1. Halife, en yakın dost'}, icon:'👑' },
  { name:{az:'Ömər ibn Xəttab',en:'Umar ibn al-Khattab',ru:'Умар ибн аль-Хаттаб',ar:'عمر بن الخطاب',tr:'Ömer ibn Hattab'}, title:{az:'2-ci Xəlifə, ədalətin rəmzi',en:'2nd Caliph, symbol of justice',ru:'2-й халиф, символ справедливости',ar:'الخليفة الثاني، رمز العدل',tr:'2. Halife, adaletin simgesi'}, icon:'⚔️' },
  { name:{az:'Osman ibn Affan',en:'Uthman ibn Affan',ru:'Усман ибн Аффан',ar:'عثمان بن عفان',tr:'Osman ibn Affan'}, title:{az:'3-cü Xəlifə, iki nur sahibi',en:'3rd Caliph, possessor of two lights',ru:'3-й халиф, обладатель двух светов',ar:'الخليفة الثالث، ذو النورين',tr:'3. Halife, iki nurun sahibi'}, icon:'💡' },
  { name:{az:'Əli ibn Əbu Talib',en:'Ali ibn Abi Talib',ru:'Али ибн Абу Талиб',ar:'علي بن أبي طالب',tr:'Ali ibn Ebi Talib'}, title:{az:'4-cü Xəlifə, elmin qapısı',en:'4th Caliph, gate of knowledge',ru:'4-й халиф, врата знания',ar:'الخليفة الرابع، باب العلم',tr:'4. Halife, ilmin kapısı'}, icon:'📚' },
  { name:{az:'Xədicə bint Xüveylid',en:'Khadijah bint Khuwaylid',ru:'Хадиджа бинт Хувайлид',ar:'خديجة بنت خويلد',tr:'Hatice bint Hüveylid'}, title:{az:'İlk müsəlman qadın, Peyğəmbərin ﷺ xanımı',en:"First Muslim woman, Prophet's ﷺ wife",ru:'Первая мусульманка, жена Пророка ﷺ',ar:'أول مسلمة، زوجة النبي ﷺ',tr:'İlk Müslüman kadın, Peygamber ﷺ eşi'}, icon:'💎' },
  { name:{az:'Bilal ibn Rəbah',en:'Bilal ibn Rabah',ru:'Билал ибн Рабах',ar:'بلال بن رباح',tr:'Bilal ibn Rebah'}, title:{az:'İlk müəzzin',en:'First muezzin',ru:'Первый муэдзин',ar:'المؤذن الأول',tr:'İlk müezzin'}, icon:'🔊' },
  { name:{az:'Əbu Hüreyrə',en:'Abu Hurayrah',ru:'Абу Хурайра',ar:'أبو هريرة',tr:'Ebu Hüreyre'}, title:{az:'Ən çox hədis rəvayət edən',en:'Most prolific hadith narrator',ru:'Передал наибольшее число хадисов',ar:'أكثر الصحابة رواية للحديث',tr:'En çok hadis rivayet eden'}, icon:'📝' },
  { name:{az:'Aişə bint Əbu Bəkr',en:'Aisha bint Abu Bakr',ru:'Аиша бинт Абу Бакр',ar:'عائشة بنت أبي بكر',tr:'Ayşe bint Ebu Bekir'}, title:{az:'Ümmül-möminin, böyük alimə',en:'Mother of believers, great scholar',ru:'Мать верующих, великий учёный',ar:'أم المؤمنين، عالمة كبيرة',tr:'Müminlerin annesi, büyük alim'}, icon:'🌹' },
  { name:{az:'Xalid ibn Vəlid',en:'Khalid ibn al-Walid',ru:'Халид ибн аль-Валид',ar:'خالد بن الوليد',tr:'Halid bin Velid'}, title:{az:'Allahın qılıncı',en:"Sword of Allah",ru:'Меч Аллаха',ar:'سيف الله المسلول',tr:'Allah\'ın kılıcı'}, icon:'⚔️' },
  { name:{az:'Səd ibn Əbu Vaqqas',en:"Sa'd ibn Abi Waqqas",ru:'Саад ибн Абу Ваккас',ar:'سعد بن أبي وقاص',tr:'Sa\'d ibn Ebi Vakkas'}, title:{az:'İlk ox atan, duası qəbul olunan',en:'First to shoot an arrow, his prayers were answered',ru:'Первый стрелок, чьи молитвы были приняты',ar:'أول من رمى بسهم، مستجاب الدعوة',tr:'İlk ok atan, duası kabul edilen'}, icon:'🏹' },
];

const LABELS = {
  az: { title:'Səhabələr', sub:'Peyğəmbərin ﷺ əshabı', searchPh:'Səhabə axtar...' },
  en: { title:'Companions', sub:"Prophet's ﷺ companions", searchPh:'Search companions...' },
  ru: { title:'Сподвижники', sub:'Сподвижники Пророка ﷺ', searchPh:'Поиск сподвижников...' },
  ar: { title:'الصحابة', sub:'أصحاب النبي ﷺ', searchPh:'...ابحث عن صحابي' },
  tr: { title:'Sahabeler', sub:'Peygamber ﷺ\'in ashabı', searchPh:'Sahabe ara...' },
};

export default function SahabeScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const filtered = SAHABA.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(s.name).some(n => n.toLowerCase().includes(q));
  });

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الصحابة" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Text style={{ marginRight: 8 }}>🔍</Text>
          <TextInput style={[styles.searchInput, { color: c.text }]} placeholder={l.searchPh} placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(s, i) => String(i)}
          renderItem={({ item: s, index: i }) => (
            <TouchableOpacity style={[styles.sahabaCard, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}>
              <View style={styles.sahabaHeader}>
                <Text style={styles.sahabaIcon}>{s.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sahabaName, { color: c.text }]}>{s.name[lang] || s.name.en}</Text>
                  {s.name.ar && lang !== 'ar' && <Text style={[styles.sahabaAr, { color: c.textMuted }]}>{s.name.ar}</Text>}
                </View>
              </View>
              {expanded[i] && (
                <Text style={[styles.sahabaTitle, { color: c.textSecondary }]}>{s.title[lang] || s.title.en}</Text>
              )}
            </TouchableOpacity>
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
  sahabaCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  sahabaHeader: { flexDirection: 'row', alignItems: 'center' },
  sahabaIcon: { fontSize: 28, marginRight: 14 },
  sahabaName: { fontSize: 16, fontWeight: '600' },
  sahabaAr: { fontSize: 14, marginTop: 2 },
  sahabaTitle: { fontSize: 14, marginTop: 10, lineHeight: 20 },
});
