import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const { width } = Dimensions.get('window');
const KAABA = { lat: 21.3891, lng: 39.8579 };

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function calcQibla(lat, lng) {
  const dLng = toRad(KAABA.lng - lng);
  const y = Math.sin(dLng) * Math.cos(toRad(KAABA.lat));
  const x = Math.cos(toRad(lat)) * Math.sin(toRad(KAABA.lat)) - Math.sin(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.cos(dLng);
  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LABELS = {
  az: { title:'Qibla İstiqaməti', sub:'Məkkəyə istiqamət', bearing:'Qibla bucağı', dist:'Məsafə', heading:'Cihaz istiqaməti', loading:'GPS yüklənir...', error:'GPS icazəsi lazımdır', manualBtn:'Bakı koordinatları ilə', km:'km' },
  en: { title:'Qibla Direction', sub:'Direction to Mecca', bearing:'Qibla bearing', dist:'Distance', heading:'Device heading', loading:'Loading GPS...', error:'GPS permission required', manualBtn:'Use Baku coordinates', km:'km' },
  ru: { title:'Направление Киблы', sub:'Направление на Мекку', bearing:'Угол Киблы', dist:'Расстояние', heading:'Курс устройства', loading:'Загрузка GPS...', error:'Требуется разрешение GPS', manualBtn:'Координаты Баку', km:'км' },
  ar: { title:'اتجاه القبلة', sub:'اتجاه مكة المكرمة', bearing:'زاوية القبلة', dist:'المسافة', heading:'اتجاه الجهاز', loading:'...جارٍ تحميل GPS', error:'مطلوب إذن GPS', manualBtn:'استخدم إحداثيات باكو', km:'كم' },
  tr: { title:'Kıble Yönü', sub:"Mekke'ye yön", bearing:'Kıble açısı', dist:'Mesafe', heading:'Cihaz yönü', loading:'GPS yükleniyor...', error:'GPS izni gerekli', manualBtn:'Bakü koordinatları ile', km:'km' },
};

export default function QiblaScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  const [coords, setCoords] = useState(null);
  const [qibla, setQibla] = useState(null);
  const [distance, setDistance] = useState(null);
  const [heading, setHeading] = useState(0);
  const [status, setStatus] = useState('loading');
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') { setStatus('error'); return; }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = loc.coords;
        setCoords({ lat: latitude, lng: longitude });
        setQibla(calcQibla(latitude, longitude));
        setDistance(haversine(latitude, longitude, KAABA.lat, KAABA.lng));
        setStatus('ready');
      } catch { setStatus('error'); }
    })();
  }, []);

  useEffect(() => {
    const sub = Magnetometer.addListener(({ x, y }) => {
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = (angle + 360) % 360;
      angle = (360 - angle) % 360;
      setHeading(Math.round(angle));
    });
    Magnetometer.setUpdateInterval(100);
    return () => sub.remove();
  }, []);

  const useManual = () => {
    const lat = 40.4093, lng = 49.8671;
    setCoords({ lat, lng });
    setQibla(calcQibla(lat, lng));
    setDistance(haversine(lat, lng, KAABA.lat, KAABA.lng));
    setStatus('ready');
  };

  const compassSize = width * 0.75;
  const needleRotation = qibla != null ? qibla - heading : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="القبلة" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        {status === 'loading' && (
          <View style={styles.center}>
            <Text style={{ fontSize: 48 }}>🧭</Text>
            <Text style={[styles.statusText, { color: c.textSecondary }]}>{l.loading}</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.center}>
            <Text style={{ fontSize: 48 }}>⚠️</Text>
            <Text style={[styles.statusText, { color: c.error }]}>{l.error}</Text>
            <TouchableOpacity style={[styles.manualBtn, { backgroundColor: c.primary }]} onPress={useManual}>
              <Text style={styles.manualBtnText}>{l.manualBtn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'ready' && (
          <>
            {/* Compass */}
            <View style={styles.compassWrap}>
              <View style={[styles.compassBg, { width: compassSize, height: compassSize, borderColor: c.border }]}>
                <Animated.View style={{ transform: [{ rotate: `${-heading}deg` }], width: compassSize - 20, height: compassSize - 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={compassSize - 20} height={compassSize - 20} viewBox="0 0 300 300">
                    {/* Cardinal directions */}
                    <SvgText x="150" y="30" fontSize="16" fontWeight="bold" fill={c.error || '#d32f2f'} textAnchor="middle">N</SvgText>
                    <SvgText x="280" y="155" fontSize="16" fontWeight="bold" fill={c.textMuted} textAnchor="middle">E</SvgText>
                    <SvgText x="150" y="285" fontSize="16" fontWeight="bold" fill={c.textMuted} textAnchor="middle">S</SvgText>
                    <SvgText x="20" y="155" fontSize="16" fontWeight="bold" fill={c.textMuted} textAnchor="middle">W</SvgText>
                    {/* Compass circle */}
                    <Circle cx="150" cy="150" r="120" fill="none" stroke={c.border} strokeWidth="2" />
                    {/* Qibla needle */}
                    <Line
                      x1="150" y1="150"
                      x2={150 + 100 * Math.sin(toRad(qibla))}
                      y2={150 - 100 * Math.cos(toRad(qibla))}
                      stroke={c.primary}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Kaaba icon position */}
                    <Circle
                      cx={150 + 105 * Math.sin(toRad(qibla))}
                      cy={150 - 105 * Math.cos(toRad(qibla))}
                      r="14" fill={c.primary}
                    />
                    <SvgText
                      x={150 + 105 * Math.sin(toRad(qibla))}
                      y={150 - 105 * Math.cos(toRad(qibla)) + 5}
                      fontSize="14" fill="#fff" textAnchor="middle"
                    >🕋</SvgText>
                  </Svg>
                </Animated.View>
              </View>
            </View>

            {/* Info cards */}
            <View style={styles.infoRow}>
              <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{l.bearing}</Text>
                <Text style={[styles.infoValue, { color: c.primary }]}>{qibla?.toFixed(1)}°</Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{l.dist}</Text>
                <Text style={[styles.infoValue, { color: c.primary }]}>{distance?.toFixed(0)} {l.km}</Text>
              </View>
            </View>
            <View style={[styles.headingCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{l.heading}</Text>
              <Text style={[styles.headingValue, { color: c.text }]}>{heading}°</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  center: { alignItems: 'center', marginTop: 60 },
  statusText: { fontSize: 16, marginTop: 12 },
  manualBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  manualBtnText: { color: '#fff', fontWeight: '600' },
  compassWrap: { alignItems: 'center', marginBottom: 24 },
  compassBg: { borderRadius: 999, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  infoCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 22, fontWeight: '700' },
  headingCard: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  headingValue: { fontSize: 28, fontWeight: '700' },
});
