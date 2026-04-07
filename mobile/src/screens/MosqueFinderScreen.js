import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LABELS = {
  az: { title:'Yaxınlıqdakı Məscidlər', sub:'GPS ilə məscid tapın', search:'Axtar', searching:'Axtarılır...', noResult:'Məscid tapılmadı', distance:'Məsafə', directions:'Yol tarifi', km:'km', error:'GPS icazəsi lazımdır', found:'məscid tapıldı' },
  en: { title:'Nearby Mosques', sub:'Find mosques by GPS', search:'Search', searching:'Searching...', noResult:'No mosques found', distance:'Distance', directions:'Directions', km:'km', error:'GPS permission required', found:'mosques found' },
  ru: { title:'Ближайшие Мечети', sub:'Найдите мечети по GPS', search:'Искать', searching:'Поиск...', noResult:'Мечети не найдены', distance:'Расстояние', directions:'Маршрут', km:'км', error:'Требуется разрешение GPS', found:'мечетей найдено' },
  ar: { title:'المساجد القريبة', sub:'ابحث عن المساجد بالـ GPS', search:'بحث', searching:'...جارٍ البحث', noResult:'لم يتم العثور على مساجد', distance:'المسافة', directions:'الاتجاهات', km:'كم', error:'مطلوب إذن GPS', found:'مسجد' },
  tr: { title:'Yakındaki Camiler', sub:'GPS ile cami bulun', search:'Ara', searching:'Aranıyor...', noResult:'Cami bulunamadı', distance:'Mesafe', directions:'Yol tarifi', km:'km', error:'GPS izni gerekli', found:'cami bulundu' },
};

export default function MosqueFinderScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true); setError(null); setMosques([]); setSearched(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setError(l.error); setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const radius = 10000;
      const query = `[out:json];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude});way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${latitude},${longitude}););out center;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}` });
      const data = await res.json();
      const results = (data.elements || []).map(el => {
        const lat = el.lat || el.center?.lat;
        const lng = el.lon || el.center?.lon;
        return {
          id: el.id,
          name: el.tags?.name || (lang === 'az' ? 'Məscid' : lang === 'ar' ? 'مسجد' : 'Mosque'),
          lat, lng,
          dist: haversine(latitude, longitude, lat, lng),
        };
      }).filter(m => m.lat).sort((a, b) => a.dist - b.dist);
      setMosques(results);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const openMaps = (m) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="المساجد" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: c.primary }]} onPress={search} disabled={loading}>
          <Text style={styles.searchBtnText}>{loading ? l.searching : `🔍 ${l.search}`}</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 30 }} />}
        {error && <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>}

        {searched && !loading && mosques.length === 0 && !error && (
          <View style={styles.empty}><Text style={{ fontSize: 48 }}>🕌</Text><Text style={{ color: c.textMuted, marginTop: 8 }}>{l.noResult}</Text></View>
        )}

        {mosques.length > 0 && (
          <Text style={[styles.resultCount, { color: c.textSecondary }]}>{mosques.length} {l.found}</Text>
        )}

        {mosques.map(m => (
          <View key={m.id} style={[styles.mosqueCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={styles.mosqueIcon}>🕌</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mosqueName, { color: c.text }]}>{m.name}</Text>
              <Text style={[styles.mosqueDist, { color: c.primary }]}>{m.dist.toFixed(1)} {l.km}</Text>
            </View>
            <TouchableOpacity style={[styles.dirBtn, { backgroundColor: c.primary }]} onPress={() => openMaps(m)}>
              <Text style={styles.dirBtnText}>📍 {l.directions}</Text>
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
  searchBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorText: { textAlign: 'center', marginTop: 16, fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 40 },
  resultCount: { fontSize: 14, marginBottom: 12 },
  mosqueCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  mosqueIcon: { fontSize: 28, marginRight: 12 },
  mosqueName: { fontSize: 15, fontWeight: '600' },
  mosqueDist: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  dirBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dirBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
