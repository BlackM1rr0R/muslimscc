import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const PLACES = [
  { icon:'🕋', coords:'21.4225,39.8262', name:{az:'Kəbə — Məkkə',en:'Kaaba — Mecca',ru:'Кааба — Мекка',ar:'الكعبة — مكة',tr:'Kabe — Mekke'}, desc:{az:'Müsəlmanların ən müqəddəs yeri. Həcc və ümrənin mərkəzi.',en:'The holiest site in Islam. Center of Hajj and Umrah.',ru:'Самое святое место в исламе. Центр хаджа и умры.',ar:'أقدس مكان في الإسلام. مركز الحج والعمرة.',tr:'İslamın en kutsal yeri. Hac ve umrenin merkezi.'} },
  { icon:'🕌', coords:'24.4672,39.6112', name:{az:'Məscidün-Nəbəvi — Mədinə',en:"Prophet's Mosque — Medina",ru:'Мечеть Пророка — Медина',ar:'المسجد النبوي — المدينة',tr:'Mescid-i Nebevi — Medine'}, desc:{az:'Peyğəmbərin ﷺ məscidi və dəfn yeri.',en:"Prophet's ﷺ mosque and burial place.",ru:'Мечеть и место погребения Пророка ﷺ.',ar:'مسجد النبي ﷺ ومكان دفنه.',tr:'Peygamber ﷺ\'in mescidi ve defin yeri.'} },
  { icon:'🕌', coords:'31.7761,35.2358', name:{az:'Məscidül-Əqsa — Qüds',en:'Al-Aqsa Mosque — Jerusalem',ru:'Аль-Акса — Иерусалим',ar:'المسجد الأقصى — القدس',tr:'Mescid-i Aksa — Kudüs'}, desc:{az:'İlk qibla istiqaməti. İsra gecəsinin məkanı.',en:'First qibla direction. Site of the Night Journey.',ru:'Первая кибла. Место Ночного путешествия.',ar:'أولى القبلتين. مكان الإسراء.',tr:'İlk kıble yönü. İsra gecesinin mekanı.'} },
  { icon:'⛰️', coords:'21.4573,39.8583', name:{az:'Hira Mağarası',en:'Cave of Hira',ru:'Пещера Хира',ar:'غار حراء',tr:'Hira Mağarası'}, desc:{az:'İlk vəhyin nazil olduğu yer.',en:'Where the first revelation was received.',ru:'Место ниспослания первого откровения.',ar:'مكان نزول أول وحي.',tr:'İlk vahyin indirildiği yer.'} },
  { icon:'🕌', coords:'24.4401,39.6170', name:{az:'Quba Məscidi',en:'Quba Mosque',ru:'Мечеть Куба',ar:'مسجد قباء',tr:'Kuba Mescidi'}, desc:{az:'İslamda inşa edilən ilk məscid.',en:'First mosque built in Islam.',ru:'Первая мечеть, построенная в исламе.',ar:'أول مسجد بني في الإسلام.',tr:'İslamda inşa edilen ilk mescit.'} },
  { icon:'⛰️', coords:'21.3549,39.9838', name:{az:'Ərəfat Dağı',en:'Mount Arafat',ru:'Гора Арафат',ar:'جبل عرفات',tr:'Arafat Dağı'}, desc:{az:'Həccin ən əhəmiyyətli rüknünün icra olunduğu yer.',en:'Where the most important pillar of Hajj is performed.',ru:'Место совершения важнейшего столпа хаджа.',ar:'مكان أداء أهم ركن من أركان الحج.',tr:'Haccın en önemli rüknünün eda edildiği yer.'} },
];

const LABELS = {
  az: { title:'Müqəddəs Yerlər', sub:'İslamın əhəmiyyətli məkanları', map:'Xəritədə göstər' },
  en: { title:'Holy Places', sub:"Islam's significant locations", map:'Show on Map' },
  ru: { title:'Святые Места', sub:'Значимые места ислама', map:'Показать на карте' },
  ar: { title:'الأماكن المقدسة', sub:'أهم الأماكن في الإسلام', map:'عرض على الخريطة' },
  tr: { title:'Kutsal Yerler', sub:'İslamın önemli mekanları', map:'Haritada Göster' },
};

export default function HolyPlacesScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الأماكن المقدسة" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        {PLACES.map((place, i) => (
          <View key={i} style={[styles.placeCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={styles.placeHeader}>
              <Text style={styles.placeIcon}>{place.icon}</Text>
              <Text style={[styles.placeName, { color: c.text }]}>{place.name[lang] || place.name.en}</Text>
            </View>
            <Text style={[styles.placeDesc, { color: c.textSecondary }]}>{place.desc[lang] || place.desc.en}</Text>
            <TouchableOpacity style={[styles.mapBtn, { backgroundColor: c.primary }]} onPress={() => Linking.openURL(`https://www.google.com/maps?q=${place.coords}`)}>
              <Text style={styles.mapBtnText}>📍 {l.map}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  placeCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  placeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  placeIcon: { fontSize: 32, marginRight: 12 },
  placeName: { fontSize: 17, fontWeight: '600', flex: 1 },
  placeDesc: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  mapBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  mapBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
