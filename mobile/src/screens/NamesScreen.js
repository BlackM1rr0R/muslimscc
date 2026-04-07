import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import PageHero from '../components/PageHero';

const NAMES = [
  {n:1,ar:'الرَّحْمَنُ',tr:'Ar-Rahman',az:'Mərhəmətli',en:'The Most Gracious',ru:'Милостивый',tur:'Rahman'},
  {n:2,ar:'الرَّحِيمُ',tr:'Ar-Rahim',az:'Rəhmli',en:'The Most Merciful',ru:'Милосердный',tur:'Rahim'},
  {n:3,ar:'الْمَلِكُ',tr:'Al-Malik',az:'Hökmdar',en:'The King',ru:'Царь',tur:'Melik'},
  {n:4,ar:'الْقُدُّوسُ',tr:'Al-Quddus',az:'Pak olan',en:'The Most Holy',ru:'Святой',tur:'Kuddüs'},
  {n:5,ar:'السَّلَامُ',tr:'As-Salam',az:'Sülh verən',en:'The Source of Peace',ru:'Мир',tur:'Selam'},
  {n:6,ar:'الْمُؤْمِنُ',tr:'Al-Mu\'min',az:'İman verən',en:'The Guardian of Faith',ru:'Дарующий веру',tur:'Mümin'},
  {n:7,ar:'الْمُهَيْمِنُ',tr:'Al-Muhaymin',az:'Qoruyan',en:'The Protector',ru:'Хранитель',tur:'Müheymin'},
  {n:8,ar:'الْعَزِيزُ',tr:'Al-Aziz',az:'Qüdrətli',en:'The Almighty',ru:'Могущественный',tur:'Aziz'},
  {n:9,ar:'الْجَبَّارُ',tr:'Al-Jabbar',az:'Qadir',en:'The Compeller',ru:'Могучий',tur:'Cebbar'},
  {n:10,ar:'الْمُتَكَبِّرُ',tr:'Al-Mutakabbir',az:'Uca',en:'The Greatest',ru:'Величайший',tur:'Mütekebbir'},
  {n:11,ar:'الْخَالِقُ',tr:'Al-Khaliq',az:'Yaradan',en:'The Creator',ru:'Творец',tur:'Halık'},
  {n:12,ar:'الْبَارِئُ',tr:'Al-Bari',az:'Formalaşdıran',en:'The Maker',ru:'Создатель',tur:'Bari'},
  {n:13,ar:'الْمُصَوِّرُ',tr:'Al-Musawwir',az:'Şəkil verən',en:'The Fashioner',ru:'Формирующий',tur:'Musavvir'},
  {n:14,ar:'الْغَفَّارُ',tr:'Al-Ghaffar',az:'Çox bağışlayan',en:'The Forgiver',ru:'Прощающий',tur:'Gaffar'},
  {n:15,ar:'الْقَهَّارُ',tr:'Al-Qahhar',az:'Qalib gələn',en:'The Subduer',ru:'Покоритель',tur:'Kahhar'},
  {n:16,ar:'الْوَهَّابُ',tr:'Al-Wahhab',az:'Bəxş edən',en:'The Bestower',ru:'Дарующий',tur:'Vehhab'},
  {n:17,ar:'الرَّزَّاقُ',tr:'Ar-Razzaq',az:'Ruzi verən',en:'The Provider',ru:'Дающий пропитание',tur:'Rezzak'},
  {n:18,ar:'الْفَتَّاحُ',tr:'Al-Fattah',az:'Açan',en:'The Opener',ru:'Открывающий',tur:'Fettah'},
  {n:19,ar:'الْعَلِيمُ',tr:'Al-Alim',az:'Hər şeyi bilən',en:'The All-Knowing',ru:'Всезнающий',tur:'Alim'},
  {n:20,ar:'الْقَابِضُ',tr:'Al-Qabid',az:'Daraldان',en:'The Constrictor',ru:'Сжимающий',tur:'Kabız'},
  {n:21,ar:'الْبَاسِطُ',tr:'Al-Basit',az:'Genişlədən',en:'The Expander',ru:'Расширяющий',tur:'Basıt'},
  {n:22,ar:'الْخَافِضُ',tr:'Al-Khafid',az:'Alçaldan',en:'The Abaser',ru:'Унижающий',tur:'Hafıd'},
  {n:23,ar:'الرَّافِعُ',tr:'Ar-Rafi',az:'Yüksəldən',en:'The Exalter',ru:'Возвышающий',tur:'Rafi'},
  {n:24,ar:'الْمُعِزُّ',tr:'Al-Mu\'izz',az:'İzzət verən',en:'The Honourer',ru:'Дающий честь',tur:'Muiz'},
  {n:25,ar:'الْمُذِلُّ',tr:'Al-Mudhill',az:'Zəlil edən',en:'The Dishonourer',ru:'Унижающий',tur:'Müzill'},
  {n:26,ar:'السَّمِيعُ',tr:'As-Sami',az:'Eşidən',en:'The All-Hearing',ru:'Слышащий',tur:'Semi'},
  {n:27,ar:'الْبَصِيرُ',tr:'Al-Basir',az:'Görən',en:'The All-Seeing',ru:'Видящий',tur:'Basir'},
  {n:28,ar:'الْحَكَمُ',tr:'Al-Hakam',az:'Hökm edən',en:'The Judge',ru:'Судья',tur:'Hakem'},
  {n:29,ar:'الْعَدْلُ',tr:'Al-Adl',az:'Ədalətli',en:'The Just',ru:'Справедливый',tur:'Adl'},
  {n:30,ar:'اللَّطِيفُ',tr:'Al-Latif',az:'Lütfkar',en:'The Subtle',ru:'Мягкий',tur:'Latif'},
  {n:31,ar:'الْخَبِيرُ',tr:'Al-Khabir',az:'Xəbərdar olan',en:'The All-Aware',ru:'Осведомлённый',tur:'Habir'},
  {n:32,ar:'الْحَلِيمُ',tr:'Al-Halim',az:'Həlim',en:'The Forbearing',ru:'Кроткий',tur:'Halim'},
  {n:33,ar:'الْعَظِيمُ',tr:'Al-Azim',az:'Əzəmətli',en:'The Magnificent',ru:'Великий',tur:'Azim'},
  {n:34,ar:'الْغَفُورُ',tr:'Al-Ghafur',az:'Bağışlayan',en:'The All-Forgiving',ru:'Всепрощающий',tur:'Gafur'},
  {n:35,ar:'الشَّكُورُ',tr:'Ash-Shakur',az:'Şükür edən',en:'The Appreciative',ru:'Благодарный',tur:'Şekur'},
  {n:36,ar:'الْعَلِيُّ',tr:'Al-Ali',az:'Uca',en:'The Most High',ru:'Высочайший',tur:'Ali'},
  {n:37,ar:'الْكَبِيرُ',tr:'Al-Kabir',az:'Böyük',en:'The Greatest',ru:'Великий',tur:'Kebir'},
  {n:38,ar:'الْحَفِيظُ',tr:'Al-Hafiz',az:'Qoruyan',en:'The Preserver',ru:'Хранитель',tur:'Hafız'},
  {n:39,ar:'الْمُقِيتُ',tr:'Al-Muqit',az:'Bəsləyən',en:'The Nourisher',ru:'Питающий',tur:'Mukit'},
  {n:40,ar:'الْحَسِيبُ',tr:'Al-Hasib',az:'Hesab aparan',en:'The Reckoner',ru:'Считающий',tur:'Hasib'},
  {n:41,ar:'الْجَلِيلُ',tr:'Al-Jalil',az:'Ulu',en:'The Majestic',ru:'Величественный',tur:'Celil'},
  {n:42,ar:'الْكَرِيمُ',tr:'Al-Karim',az:'Kərim',en:'The Generous',ru:'Щедрый',tur:'Kerim'},
  {n:43,ar:'الرَّقِيبُ',tr:'Ar-Raqib',az:'Nəzarət edən',en:'The Watchful',ru:'Наблюдающий',tur:'Rakib'},
  {n:44,ar:'الْمُجِيبُ',tr:'Al-Mujib',az:'Qəbul edən',en:'The Responsive',ru:'Отвечающий',tur:'Mücib'},
  {n:45,ar:'الْوَاسِعُ',tr:'Al-Wasi',az:'Geniş olan',en:'The All-Encompassing',ru:'Объемлющий',tur:'Vasi'},
  {n:46,ar:'الْحَكِيمُ',tr:'Al-Hakim',az:'Hikmətli',en:'The Wise',ru:'Мудрый',tur:'Hakim'},
  {n:47,ar:'الْوَدُودُ',tr:'Al-Wadud',az:'Sevən',en:'The Loving',ru:'Любящий',tur:'Vedud'},
  {n:48,ar:'الْمَجِيدُ',tr:'Al-Majid',az:'Şanlı',en:'The Glorious',ru:'Славный',tur:'Mecid'},
  {n:49,ar:'الْبَاعِثُ',tr:'Al-Ba\'ith',az:'Dirildən',en:'The Resurrector',ru:'Воскрешающий',tur:'Bais'},
  {n:50,ar:'الشَّهِيدُ',tr:'Ash-Shahid',az:'Şahid',en:'The Witness',ru:'Свидетель',tur:'Şehid'},
  {n:51,ar:'الْحَقُّ',tr:'Al-Haqq',az:'Haqq',en:'The Truth',ru:'Истина',tur:'Hak'},
  {n:52,ar:'الْوَكِيلُ',tr:'Al-Wakil',az:'Vəkil',en:'The Trustee',ru:'Доверенный',tur:'Vekil'},
  {n:53,ar:'الْقَوِيُّ',tr:'Al-Qawiy',az:'Güclü',en:'The Strong',ru:'Сильный',tur:'Kavi'},
  {n:54,ar:'الْمَتِينُ',tr:'Al-Matin',az:'Möhkəm',en:'The Firm',ru:'Прочный',tur:'Metin'},
  {n:55,ar:'الْوَلِيُّ',tr:'Al-Waliy',az:'Dost',en:'The Protecting Friend',ru:'Покровитель',tur:'Veli'},
  {n:56,ar:'الْحَمِيدُ',tr:'Al-Hamid',az:'Həmd olunan',en:'The Praiseworthy',ru:'Достохвальный',tur:'Hamid'},
  {n:57,ar:'الْمُحْصِي',tr:'Al-Muhsi',az:'Sayan',en:'The Counter',ru:'Считающий',tur:'Muhsi'},
  {n:58,ar:'الْمُبْدِئُ',tr:'Al-Mubdi',az:'Başladan',en:'The Originator',ru:'Начинающий',tur:'Mübdi'},
  {n:59,ar:'الْمُعِيدُ',tr:'Al-Mu\'id',az:'Geri qaytaran',en:'The Restorer',ru:'Возвращающий',tur:'Muid'},
  {n:60,ar:'الْمُحْيِي',tr:'Al-Muhyi',az:'Həyat verən',en:'The Giver of Life',ru:'Оживляющий',tur:'Muhyi'},
  {n:61,ar:'الْمُمِيتُ',tr:'Al-Mumit',az:'Ölüm verən',en:'The Taker of Life',ru:'Умертвляющий',tur:'Mümit'},
  {n:62,ar:'الْحَيُّ',tr:'Al-Hayy',az:'Diri',en:'The Ever Living',ru:'Живой',tur:'Hay'},
  {n:63,ar:'الْقَيُّومُ',tr:'Al-Qayyum',az:'Əbədi dayanan',en:'The Self-Subsisting',ru:'Самодостаточный',tur:'Kayyum'},
  {n:64,ar:'الْوَاجِدُ',tr:'Al-Wajid',az:'Tapan',en:'The Finder',ru:'Находящий',tur:'Vacid'},
  {n:65,ar:'الْمَاجِدُ',tr:'Al-Majid',az:'Şərəfli',en:'The Noble',ru:'Благородный',tur:'Macid'},
  {n:66,ar:'الْوَاحِدُ',tr:'Al-Wahid',az:'Tək',en:'The One',ru:'Единый',tur:'Vahid'},
  {n:67,ar:'الصَّمَدُ',tr:'As-Samad',az:'Ehtiyacsız',en:'The Eternal',ru:'Вечный',tur:'Samed'},
  {n:68,ar:'الْقَادِرُ',tr:'Al-Qadir',az:'Qadir',en:'The Able',ru:'Способный',tur:'Kadir'},
  {n:69,ar:'الْمُقْتَدِرُ',tr:'Al-Muqtadir',az:'Hər şeyə qadir',en:'The Powerful',ru:'Могущественный',tur:'Muktedir'},
  {n:70,ar:'الْمُقَدِّمُ',tr:'Al-Muqaddim',az:'Öndə tutan',en:'The Expediter',ru:'Выдвигающий',tur:'Mukaddim'},
  {n:71,ar:'الْمُؤَخِّرُ',tr:'Al-Mu\'akhkhir',az:'Geri saxlayan',en:'The Delayer',ru:'Откладывающий',tur:'Muahhir'},
  {n:72,ar:'الْأَوَّلُ',tr:'Al-Awwal',az:'İlk',en:'The First',ru:'Первый',tur:'Evvel'},
  {n:73,ar:'الْآخِرُ',tr:'Al-Akhir',az:'Son',en:'The Last',ru:'Последний',tur:'Ahir'},
  {n:74,ar:'الظَّاهِرُ',tr:'Az-Zahir',az:'Zahir',en:'The Manifest',ru:'Явный',tur:'Zahir'},
  {n:75,ar:'الْبَاطِنُ',tr:'Al-Batin',az:'Gizli',en:'The Hidden',ru:'Скрытый',tur:'Batın'},
  {n:76,ar:'الْوَالِي',tr:'Al-Wali',az:'İdarə edən',en:'The Governor',ru:'Правитель',tur:'Vali'},
  {n:77,ar:'الْمُتَعَالِي',tr:'Al-Muta\'ali',az:'Yüksək olan',en:'The Most Exalted',ru:'Превознесённый',tur:'Müteali'},
  {n:78,ar:'الْبَرُّ',tr:'Al-Barr',az:'Yaxşılıq edən',en:'The Doer of Good',ru:'Благодетель',tur:'Berr'},
  {n:79,ar:'التَّوَّابُ',tr:'At-Tawwab',az:'Tövbə qəbul edən',en:'The Acceptor of Repentance',ru:'Принимающий покаяние',tur:'Tevvab'},
  {n:80,ar:'الْمُنْتَقِمُ',tr:'Al-Muntaqim',az:'İntiqam alan',en:'The Avenger',ru:'Мститель',tur:'Müntakim'},
  {n:81,ar:'الْعَفُوُّ',tr:'Al-Afuw',az:'Əfv edən',en:'The Pardoner',ru:'Прощающий',tur:'Afüv'},
  {n:82,ar:'الرَّءُوفُ',tr:'Ar-Ra\'uf',az:'Şəfqətli',en:'The Compassionate',ru:'Сострадательный',tur:'Rauf'},
  {n:83,ar:'مَالِكُ الْمُلْكِ',tr:'Malik al-Mulk',az:'Mülkün sahibi',en:'Owner of Sovereignty',ru:'Владыка царства',tur:'Malikül Mülk'},
  {n:84,ar:'ذُو الْجَلَالِ وَالْإِكْرَامِ',tr:'Dhul-Jalali wal-Ikram',az:'Əzəmət sahibi',en:'Lord of Majesty',ru:'Обладатель величия',tur:'Zülcelali vel İkram'},
  {n:85,ar:'الْمُقْسِطُ',tr:'Al-Muqsit',az:'Ədalətlə hökm edən',en:'The Equitable',ru:'Справедливый',tur:'Muksit'},
  {n:86,ar:'الْجَامِعُ',tr:'Al-Jami',az:'Toplayan',en:'The Gatherer',ru:'Собирающий',tur:'Cami'},
  {n:87,ar:'الْغَنِيُّ',tr:'Al-Ghani',az:'Ehtiyacsız',en:'The Self-Sufficient',ru:'Богатый',tur:'Gani'},
  {n:88,ar:'الْمُغْنِي',tr:'Al-Mughni',az:'Zəngin edən',en:'The Enricher',ru:'Обогащающий',tur:'Muğni'},
  {n:89,ar:'الْمَانِعُ',tr:'Al-Mani',az:'Mane olan',en:'The Preventer',ru:'Удерживающий',tur:'Mani'},
  {n:90,ar:'الضَّارُّ',tr:'Ad-Darr',az:'Zərər verən',en:'The Distresser',ru:'Причиняющий вред',tur:'Darr'},
  {n:91,ar:'النَّافِعُ',tr:'An-Nafi',az:'Fayda verən',en:'The Benefiter',ru:'Приносящий пользу',tur:'Nafi'},
  {n:92,ar:'النُّورُ',tr:'An-Nur',az:'Nur',en:'The Light',ru:'Свет',tur:'Nur'},
  {n:93,ar:'الْهَادِي',tr:'Al-Hadi',az:'Hidayət edən',en:'The Guide',ru:'Ведущий',tur:'Hadi'},
  {n:94,ar:'الْبَدِيعُ',tr:'Al-Badi',az:'Yaradan',en:'The Incomparable',ru:'Создатель',tur:'Bedi'},
  {n:95,ar:'الْبَاقِي',tr:'Al-Baqi',az:'Əbədi',en:'The Everlasting',ru:'Вечный',tur:'Baki'},
  {n:96,ar:'الْوَارِثُ',tr:'Al-Warith',az:'Varis',en:'The Inheritor',ru:'Наследник',tur:'Varis'},
  {n:97,ar:'الرَّشِيدُ',tr:'Ar-Rashid',az:'Doğru yola yönəldən',en:'The Guide to the Right Path',ru:'Направляющий',tur:'Reşid'},
  {n:98,ar:'الصَّبُورُ',tr:'As-Sabur',az:'Çox səbirli',en:'The Patient',ru:'Терпеливый',tur:'Sabur'},
  {n:99,ar:'اللَّهُ',tr:'Allah',az:'Allah',en:'Allah',ru:'Аллах',tur:'Allah'},
];

export default function NamesScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.names || T.az.names;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const getMeaning = (name) => {
    const map = { az: name.az, en: name.en, ru: name.ru, ar: name.ar, tr: name.tur };
    return map[lang] || name.en;
  };

  const filtered = useMemo(() => {
    if (!search) return NAMES;
    const q = search.toLowerCase();
    return NAMES.filter(n => n.ar.includes(search) || n.tr.toLowerCase().includes(q) || n.en.toLowerCase().includes(q) || (n.az && n.az.toLowerCase().includes(q)) || (n.ru && n.ru.toLowerCase().includes(q)));
  }, [search]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="أَسْمَاءُ اللَّهِ الْحُسْنَى" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>
        <View style={[styles.hadithCard, { backgroundColor: c.card, borderColor: c.gold + '50' }]}>
          <Text style={[styles.hadithText, { color: c.text }]}>"{t.hadith}"</Text>
          <Text style={[styles.hadithRef, { color: c.gold }]}>— {t.hadithRef}</Text>
        </View>

        <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Text style={{ marginRight: 8 }}>🔍</Text>
          <TextInput style={[styles.searchInput, { color: c.text }]} placeholder={t.searchPh} placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={n => String(n.n)}
          numColumns={2}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item: n }) => {
            const isSelected = selected === n.n;
            return (
              <TouchableOpacity
                style={[styles.nameCard, { backgroundColor: c.card, borderColor: isSelected ? c.primary : c.cardBorder, flex: 1 }]}
                onPress={() => setSelected(isSelected ? null : n.n)}
              >
                <View style={[styles.nameNum, { backgroundColor: c.primary + '20' }]}>
                  <Text style={[styles.nameNumText, { color: c.primary }]}>{n.n}</Text>
                </View>
                <Text style={[styles.nameArabic, { color: c.text }]}>{n.ar}</Text>
                <Text style={[styles.nameTranslit, { color: c.primary }]}>{n.tr}</Text>
                <Text style={[styles.nameMeaning, { color: c.textSecondary }]}>{getMeaning(n)}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  hadithCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
  hadithText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  hadithRef: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, height: 44 },
  nameCard: { padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8, alignItems: 'center' },
  nameNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  nameNumText: { fontSize: 12, fontWeight: '700' },
  nameArabic: { fontSize: 22, marginBottom: 4 },
  nameTranslit: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  nameMeaning: { fontSize: 12, textAlign: 'center' },
});
