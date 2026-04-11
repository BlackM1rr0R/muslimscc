import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, Pulse } from '../components/Animated';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LABELS = {
  az: { title:'Yaxınlıqdakı Məscidlər', sub:'GPS ilə məscid tapın', search:'Axtar', searching:'Axtarılır...', noResult:'Məscid tapılmadı', distance:'Məsafə', directions:'Yol tarifi', km:'km', error:'GPS icazəsi lazımdır', found:'məscid tapıldı', tapSearch:'Axtarmaq üçün düyməni basın', mosque:'Məscid' },
  en: { title:'Nearby Mosques', sub:'Find mosques via GPS', search:'Search', searching:'Searching...', noResult:'No mosques found', distance:'Distance', directions:'Directions', km:'km', error:'GPS permission required', found:'mosques found', tapSearch:'Tap the button to search', mosque:'Mosque' },
  ru: { title:'Ближайшие Мечети', sub:'Найдите мечети по GPS', search:'Искать', searching:'Поиск...', noResult:'Не найдены', distance:'Расстояние', directions:'Маршрут', km:'км', error:'Требуется GPS', found:'мечетей', tapSearch:'Нажмите для поиска', mosque:'Мечеть' },
  ar: { title:'المساجد القريبة', sub:'ابحث بالـ GPS', search:'بحث', searching:'جارٍ البحث...', noResult:'لم يتم العثور', distance:'المسافة', directions:'الاتجاهات', km:'كم', error:'مطلوب GPS', found:'مسجد', tapSearch:'اضغط للبحث', mosque:'مسجد' },
  tr: { title:'Yakındaki Camiler', sub:'GPS ile bulun', search:'Ara', searching:'Aranıyor...', noResult:'Bulunamadı', distance:'Mesafe', directions:'Yol tarifi', km:'km', error:'GPS izni gerekli', found:'cami', tapSearch:'Aramak için tıklayın', mosque:'Cami' },
};

export default function MosqueFinderScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;

  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          name: el.tags?.name || l.mosque,
          lat, lng,
          dist: haversine(latitude, longitude, lat, lng),
        };
      }).filter(m => m.lat).sort((a, b) => a.dist - b.dist);
      setMosques(results);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const openMaps = (m) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="المَسَاجِد" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>

        {/* Search card */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={['#14b8a6','#0d9488','#0f766e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.searchCard, sh]}
          >
            <View style={styles.searchCircle1} />
            <View style={styles.searchCircle2} />

            <Pulse>
              <View style={styles.searchIconWrap}>
                <AppIcon name="mosques" size={40} color="#fff" />
              </View>
            </Pulse>

            <Text style={styles.searchTitle}>{l.tapSearch}</Text>

            <TouchableOpacity
              style={[styles.searchBtn, loading && { opacity: 0.7 }]}
              onPress={search}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#14b8a6" size="small" />
                  <Text style={[styles.searchBtnText, { color: '#14b8a6' }]}>{l.searching}</Text>
                </>
              ) : (
                <>
                  <AppIcon name="search" size={18} color="#14b8a6" />
                  <Text style={[styles.searchBtnText, { color: '#14b8a6' }]}>{l.search}</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </ScaleIn>

        {/* Error */}
        {error && (
          <FadeUp>
            <View style={[styles.errorCard, { backgroundColor: c.error + '15', borderColor: c.error + '40' }]}>
              <AppIcon name="close" size={18} color={c.error} />
              <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
            </View>
          </FadeUp>
        )}

        {/* No results */}
        {searched && !loading && mosques.length === 0 && !error && (
          <ScaleIn>
            <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryBg }]}>
                <AppIcon name="mosques" size={36} color={c.primary} />
              </View>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{l.noResult}</Text>
            </View>
          </ScaleIn>
        )}

        {/* Result count */}
        {mosques.length > 0 && (
          <FadeUp>
            <View style={[styles.countBadge, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <AppIcon name="check" size={14} color="#10b981" />
              <Text style={[styles.countText, { color: c.text }]}>{mosques.length} {l.found}</Text>
            </View>
          </FadeUp>
        )}

        {/* Mosques list */}
        {mosques.map((m, i) => (
          <FadeUp key={m.id} delay={i * 50}>
            <View style={[styles.mosqueCard, { backgroundColor: c.card, borderColor: c.cardBorder }, dark ? Shadows.dark.sm : Shadows.sm]}>
              <LinearGradient
                colors={['#14b8a615','transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
              />
              <View style={[styles.colorBar, { backgroundColor: '#14b8a6' }]} />

              <LinearGradient colors={['#14b8a6','#0d9488']} style={styles.mosqueIconWrap}>
                <AppIcon name="mosques" size={22} color="#fff" />
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text style={[styles.mosqueName, { color: c.text }]} numberOfLines={1}>{m.name}</Text>
                <View style={styles.distWrap}>
                  <AppIcon name="location" size={11} color="#14b8a6" />
                  <Text style={[styles.mosqueDist, { color: '#14b8a6' }]}>{m.dist.toFixed(1)} {l.km}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.dirBtn, { backgroundColor: '#14b8a6' }]}
                onPress={() => openMaps(m)}
                activeOpacity={0.8}
              >
                <AppIcon name="map" size={14} color="#fff" />
                <Text style={styles.dirBtnText}>{l.directions}</Text>
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

  // Search card
  searchCard: {
    padding: 32,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  searchCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  searchCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  searchIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 20, textAlign: 'center' },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  searchBtnText: { fontWeight: '800', fontSize: 15 },

  // Error
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 13, fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', padding: 40, borderRadius: BorderRadius.xl, borderWidth: 1 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyText: { fontSize: 14, fontWeight: '600' },

  // Count
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 14 },
  countText: { fontSize: 13, fontWeight: '800' },

  // Mosque card
  mosqueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  mosqueIconWrap: { width: 42, height: 42, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mosqueName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  distWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mosqueDist: { fontSize: 12, fontWeight: '700' },
  dirBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 9, borderRadius: BorderRadius.sm },
  dirBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
