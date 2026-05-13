import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';
import { subscribeToPlaces } from '../data/adminContent';

const PLACES = [
  { coords:'21.4225,39.8262', color:'#10b981', gradient:['#10b981','#059669'], icon:'hajjguide', emoji:'🕋',
    name:{az:'Kəbə',en:'Kaaba',ru:'Кааба',ar:'الكعبة',tr:'Kabe'},
    city:{az:'Məkkə',en:'Mecca',ru:'Мекка',ar:'مكة',tr:'Mekke'},
    desc:{az:'Müsəlmanların ən müqəddəs yeri. Həcc və ümrənin mərkəzi. İbrahim və İsmail peyğəmbərlər tərəfindən tikilib.',en:'The holiest site in Islam. Center of Hajj and Umrah. Built by Prophets Ibrahim and Ismail.',ru:'Самое святое место в исламе. Центр хаджа и умры.',ar:'أقدس مكان في الإسلام. مركز الحج والعمرة.',tr:'İslamın en kutsal yeri. Hac ve umrenin merkezi.'} },
  { coords:'24.4672,39.6112', color:'#3b82f6', gradient:['#3b82f6','#2563eb'], icon:'prayer', emoji:'🕌',
    name:{az:'Məscidün-Nəbəvi',en:"Prophet's Mosque",ru:'Мечеть Пророка',ar:'المسجد النبوي',tr:'Mescid-i Nebevi'},
    city:{az:'Mədinə',en:'Medina',ru:'Медина',ar:'المدينة',tr:'Medine'},
    desc:{az:'Peyğəmbərin ﷺ məscidi və dəfn yeri. Dünyanın ən əhəmiyyətli ikinci məscididir.',en:"Prophet's ﷺ mosque and burial place. The second most important mosque in the world.",ru:'Мечеть и место погребения Пророка ﷺ.',ar:'مسجد النبي ﷺ ومكان دفنه.',tr:'Peygamber ﷺ\'in mescidi ve defin yeri.'} },
  { coords:'31.7761,35.2358', color:'#f59e0b', gradient:['#f59e0b','#d97706'], icon:'prayer', emoji:'🕌',
    name:{az:'Məscidül-Əqsa',en:'Al-Aqsa Mosque',ru:'Аль-Акса',ar:'المسجد الأقصى',tr:'Mescid-i Aksa'},
    city:{az:'Qüds',en:'Jerusalem',ru:'Иерусалим',ar:'القدس',tr:'Kudüs'},
    desc:{az:'İlk qibla istiqaməti. İsra gecəsinin məkanı. İslamın üçüncü ən müqəddəs məscidi.',en:'First qibla direction. Site of the Night Journey. Third holiest mosque in Islam.',ru:'Первая кибла. Место Ночного путешествия.',ar:'أولى القبلتين. مكان الإسراء.',tr:'İlk kıble yönü. İsra gecesinin mekanı.'} },
  { coords:'21.4573,39.8583', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'], icon:'history', emoji:'⛰️',
    name:{az:'Hira Mağarası',en:'Cave of Hira',ru:'Пещера Хира',ar:'غار حراء',tr:'Hira Mağarası'},
    city:{az:'Məkkə',en:'Mecca',ru:'Мекка',ar:'مكة',tr:'Mekke'},
    desc:{az:'İlk vəhyin nazil olduğu yer. Peyğəmbər ﷺ burada düşüncəyə dalardı.',en:'Where the first revelation was received. The Prophet ﷺ used to meditate here.',ru:'Место ниспослания первого откровения.',ar:'مكان نزول أول وحي.',tr:'İlk vahyin indirildiği yer.'} },
  { coords:'24.4401,39.6170', color:'#ec4899', gradient:['#ec4899','#db2777'], icon:'mosques', emoji:'🕌',
    name:{az:'Quba Məscidi',en:'Quba Mosque',ru:'Мечеть Куба',ar:'مسجد قباء',tr:'Kuba Mescidi'},
    city:{az:'Mədinə',en:'Medina',ru:'Медина',ar:'المدينة',tr:'Medine'},
    desc:{az:'İslamda inşa edilən ilk məscid. Peyğəmbər ﷺ tərəfindən qurulub.',en:'First mosque built in Islam. Founded by the Prophet ﷺ himself.',ru:'Первая мечеть в исламе.',ar:'أول مسجد بني في الإسلام.',tr:'İslamda inşa edilen ilk mescit.'} },
  { coords:'21.3549,39.9838', color:'#ef4444', gradient:['#ef4444','#dc2626'], icon:'hajjguide', emoji:'⛰️',
    name:{az:'Ərəfat Dağı',en:'Mount Arafat',ru:'Гора Арафат',ar:'جبل عرفات',tr:'Arafat Dağı'},
    city:{az:'Məkkə',en:'Mecca',ru:'Мекка',ar:'مكة',tr:'Mekke'},
    desc:{az:'Həccin ən əhəmiyyətli rüknünün icra olunduğu yer. Vida xütbəsinin oxunduğu dağ.',en:'Where the most important pillar of Hajj is performed. Where the Farewell Sermon was given.',ru:'Место совершения важнейшего столпа хаджа.',ar:'مكان أداء أهم ركن من أركان الحج.',tr:'Haccın en önemli rüknünün eda edildiği yer.'} },
  { coords:'21.4225,39.8262', color:'#06b6d4', gradient:['#06b6d4','#0891b2'], icon:'holyplaces', emoji:'💎',
    name:{az:'Həcərül-Əsvəd',en:'Black Stone',ru:'Чёрный Камень',ar:'الحجر الأسود',tr:'Hacer-ül Esved'},
    city:{az:'Məkkə',en:'Mecca',ru:'Мекка',ar:'مكة',tr:'Mekke'},
    desc:{az:'Cənnətdən gətirilən qara daş. Təvaf əsnasında öpülür.',en:'Black stone brought from Paradise. Kissed during Tawaf.',ru:'Чёрный камень из Рая.',ar:'الحجر الأسود من الجنة.',tr:'Cennetten gelen siyah taş.'} },
  { coords:'21.4225,39.8264', color:'#14b8a6', gradient:['#14b8a6','#0d9488'], icon:'prayer', emoji:'🏛️',
    name:{az:'Məqami-İbrahim',en:'Maqam Ibrahim',ru:'Макам Ибрахим',ar:'مقام إبراهيم',tr:'Makam-ı İbrahim'},
    city:{az:'Məkkə',en:'Mecca',ru:'Мекка',ar:'مكة',tr:'Mekke'},
    desc:{az:'İbrahim peyğəmbərin ayağının izi olan yer. Kəbənin yaxınlığında.',en:"Place containing the footprints of Prophet Ibrahim. Near the Kaaba.",ru:'Место следов пророка Ибрагима.',ar:'مكان أثر قدم إبراهيم عليه السلام.',tr:'İbrahim peygamberin ayak izinin olduğu yer.'} },
];

const LABELS = {
  az:{ title:'Müqəddəs Yerlər', sub:'İslamın əhəmiyyətli məkanları', map:'Xəritədə göstər' },
  en:{ title:'Holy Places', sub:"Islam's significant locations", map:'Show on Map' },
  ru:{ title:'Святые Места', sub:'Значимые места ислама', map:'Показать на карте' },
  ar:{ title:'الأماكن المقدسة', sub:'أهم الأماكن', map:'عرض على الخريطة' },
  tr:{ title:'Kutsal Yerler', sub:'İslamın önemli mekanları', map:'Haritada Göster' },
};

export default function HolyPlacesScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;

  // Admin paneldən custom yerlər real-time
  const [customPlaces, setCustomPlaces] = useState([])
  useEffect(() => {
    const unsubscribe = subscribeToPlaces((items) => {
      const mapped = (items || []).map(p => ({
        coords: p.coords || `${p.lat || 0},${p.lng || 0}`,
        color: p.color || '#10b981',
        gradient: p.gradient || ['#10b981','#059669'],
        icon: p.icon || 'mosques',
        emoji: p.emoji || '🕌',
        name: p.name || { az: p.title?.az, en: p.title?.en, ru: p.title?.ru, ar: p.title?.ar, tr: p.title?.tr },
        city: p.city || { az: '', en: '', ru: '', ar: '', tr: '' },
        desc: p.description || p.desc || { az: '', en: '', ru: '', ar: '', tr: '' },
        isCustom: true,
      }))
      setCustomPlaces(mapped)
    })
    return () => unsubscribe?.()
  }, [])

  const allPlaces = [...customPlaces, ...PLACES]

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الأَمَاكِنُ المُقَدَّسَة" title={l.title} subtitle={l.sub} theme="holy" />

      <View style={styles.content}>
        {allPlaces.map((place, i) => (
          <FadeUp key={i} delay={100 + i * 80}>
            <View style={[styles.placeCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <LinearGradient
                colors={[place.color + '18', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
              />
              <View style={[styles.colorBar, { backgroundColor: place.color }]} />

              <View style={styles.placeHeader}>
                <LinearGradient colors={place.gradient} style={styles.placeIconWrap}>
                  <Text style={styles.placeEmoji}>{place.emoji}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.placeName, { color: c.text }]}>{place.name[lang] || place.name.en}</Text>
                  <View style={[styles.cityBadge, { backgroundColor: place.color + '18', borderColor: place.color + '30' }]}>
                    <AppIcon name="location" size={10} color={place.color} />
                    <Text style={[styles.cityText, { color: place.color }]}>{place.city[lang] || place.city.en}</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.placeDesc, { color: c.textSecondary }]}>{place.desc[lang] || place.desc.en}</Text>

              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(`https://www.google.com/maps?q=${place.coords}`);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient colors={place.gradient} style={styles.mapBtnGrad}>
                  <AppIcon name="map" size={16} color="#fff" />
                  <Text style={styles.mapBtnText}>{l.map}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </FadeUp>
        ))}
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  placeCard: {
    padding: 20,
    paddingLeft: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  placeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  placeIconWrap: { width: 56, height: 56, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  placeEmoji: { fontSize: 32 },
  placeName: { fontSize: 18, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  cityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  cityText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  placeDesc: { fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 14 },
  mapBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  mapBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  mapBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
