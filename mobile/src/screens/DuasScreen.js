import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Share, StyleSheet, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import { DUAS_DATA, subscribeToCustomDuas } from '../data/duas';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, Float } from '../components/Animated';

// Kateqoriya rəngləri və ikonlar
const CAT_META = {
  morning:    { color:'#f59e0b', gradient:['#fbbf24','#d97706'], icon:'fajr' },
  evening:    { color:'#8b5cf6', gradient:['#a855f7','#7c3aed'], icon:'isha' },
  eating:     { color:'#ec4899', gradient:['#f472b6','#db2777'], icon:'duas' },
  sleeping:   { color:'#6366f1', gradient:['#818cf8','#4338ca'], icon:'moon' },
  waking:     { color:'#10b981', gradient:['#34d399','#059669'], icon:'sunrise' },
  anxiety:    { color:'#ef4444', gradient:['#f87171','#dc2626'], icon:'duas' },
  gratitude:  { color:'#14b8a6', gradient:['#2dd4bf','#0d9488'], icon:'heart' },
  forgiveness:{ color:'#a855f7', gradient:['#c084fc','#7e22ce'], icon:'duas' },
  prayer:     { color:'#3b82f6', gradient:['#60a5fa','#2563eb'], icon:'prayer' },
  travel:     { color:'#f97316', gradient:['#fb923c','#ea580c'], icon:'location' },
};

const CAT_ORDER = ['all','morning','evening','eating','sleeping','waking','anxiety','gratitude','forgiveness','prayer','travel'];

function DuaCard({ d, favs, toggleFav, shareDua, expanded, setExpanded, t, lang, dark }) {
  const c = dark ? Colors.dark : Colors.light;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const isOpen = expanded[d.id];
  const isFav = favs.includes(d.id);
  const translation = d[lang] || d.en || d.az;
  const meta = CAT_META[d.cat] || CAT_META.morning;

  const favScale = useRef(new RNAnimated.Value(1)).current;
  const animateFav = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    RNAnimated.sequence([
      RNAnimated.spring(favScale, { toValue: 1.4, friction: 3, tension: 80, useNativeDriver: true }),
      RNAnimated.spring(favScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();
    toggleFav(d.id);
  };

  const catIdx = CAT_ORDER.indexOf(d.cat);
  const catLabel = t.categories[catIdx] || d.cat;

  return (
    <View style={[styles.duaCard, { backgroundColor: c.card, borderColor: isOpen ? meta.color + '80' : c.cardBorder }, sh]}>
      {/* Gradient background overlay */}
      <LinearGradient
        colors={[meta.color + '10', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
      />

      {/* Left color bar */}
      <View style={[styles.colorBar, { backgroundColor: meta.color }]} />

      {/* Header */}
      <View style={styles.duaHeader}>
        <View style={styles.catWrap}>
          <LinearGradient colors={meta.gradient} style={styles.catIconWrap}>
            <AppIcon name={meta.icon} size={14} color="#fff" />
          </LinearGradient>
          <View style={[styles.catBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '30' }]}>
            <Text style={[styles.catBadgeText, { color: meta.color }]}>{catLabel}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={animateFav}
            style={[
              styles.iconBtn,
              {
                backgroundColor: isFav ? c.error + '15' : c.surfaceAlt,
                borderColor: isFav ? c.error + '40' : c.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <RNAnimated.View style={{ transform: [{ scale: favScale }] }}>
              <AppIcon name={isFav ? 'heart' : 'heartOutline'} size={15} color={isFav ? c.error : c.textMuted} />
            </RNAnimated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              shareDua(d);
            }}
            style={[styles.iconBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}
            activeOpacity={0.7}
          >
            <AppIcon name="share" size={14} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Arabic */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(prev => ({ ...prev, [d.id]: !prev[d.id] }));
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.arabicBox, { backgroundColor: c.surfaceAlt + '60', borderLeftColor: meta.color }]}>
          <Text style={[styles.arabicText, { color: c.text }]}>{d.ar}</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded content */}
      {isOpen && (
        <FadeUp duration={300}>
          {d.translit && (
            <View style={styles.section}>
              <View style={[styles.sectionLabelWrap, { backgroundColor: meta.color + '15' }]}>
                <Text style={[styles.sectionLabel, { color: meta.color }]}>{t.translitLabel}</Text>
              </View>
              <Text style={[styles.translitText, { color: c.primaryDark }]}>{d.translit}</Text>
            </View>
          )}
          <View style={styles.section}>
            <View style={[styles.sectionLabelWrap, { backgroundColor: meta.color + '15' }]}>
              <Text style={[styles.sectionLabel, { color: meta.color }]}>{t.meaningLabel}</Text>
            </View>
            <Text style={[styles.meaningText, { color: c.textSecondary }]}>{translation}</Text>
          </View>
          <View style={[styles.sourceRow, { borderTopColor: c.border }]}>
            <View style={[styles.sourceBadge, { backgroundColor: c.goldBg, borderColor: c.gold + '30' }]}>
              <AppIcon name="bookmark" size={11} color={c.gold} />
              <Text style={[styles.sourceText, { color: c.gold }]}>{d.source}</Text>
            </View>
          </View>
        </FadeUp>
      )}

      {/* Tap hint */}
      {!isOpen && (
        <View style={styles.tapHintRow}>
          <AppIcon name="chevronDown" size={14} color={meta.color} />
          <Text style={[styles.tapHint, { color: meta.color }]}>{t.tapExpand}</Text>
        </View>
      )}
    </View>
  );
}

export default function DuasScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.duas || T.az.duas;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;

  const [selectedCat, setSelectedCat] = useState(0);
  const [favs, setFavs] = useState([]);
  const [showFavs, setShowFavs] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [customDuas, setCustomDuas] = useState([]);

  React.useEffect(() => {
    AsyncStorage.getItem('dua_favs').then(v => {
      try { if (v) setFavs(JSON.parse(v)); } catch {}
    });
  }, []);

  // Admin paneldən əlavə edilmiş duaları real-vaxtda dinlə (web ilə eyni)
  useEffect(() => {
    const unsubscribe = subscribeToCustomDuas((items) => {
      const mapped = (items || []).map(d => ({
        id: 'custom-' + d.id,
        cat: d.category || d.cat || 'All',
        ar: d.ar || d.arabic || '',
        translit: d.translit || d.transliteration || '',
        [lang]: d.text?.[lang] || d.text?.en || '',
        en: d.text?.en || '',
        az: d.text?.az || '',
        ru: d.text?.ru || '',
        ar2: d.text?.ar || '',
        tr: d.text?.tr || '',
        source: d.source || 'Admin',
      })).filter(d => d[lang] || d.ar)
      setCustomDuas(mapped)
    })
    return () => unsubscribe?.()
  }, [lang])

  const toggleFav = async (id) => {
    const newFavs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    setFavs(newFavs);
    await AsyncStorage.setItem('dua_favs', JSON.stringify(newFavs));
  };

  const filtered = useMemo(() => {
    // Custom dualar əvvələ + statik dualar (web ilə eyni)
    let list = [...customDuas, ...(DUAS_DATA || [])];
    if (showFavs) list = list.filter(d => favs.includes(d.id));
    if (selectedCat > 0) {
      list = list.filter(d => d.cat === CAT_ORDER[selectedCat]);
    }
    return list;
  }, [selectedCat, showFavs, favs, customDuas]);

  const shareDua = async (d) => {
    try {
      const text = d[lang] || d.en || d.az;
      await Share.share({ message: `${d.ar}\n\n${text}\n\n— ${d.source}\n\nmuslims.cc` });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الأَدْعِيَة" title={t.title} subtitle={t.subtitle} theme="duas" />

      <View style={styles.content}>

        {/* Top row */}
        <FadeUp delay={100}>
          <View style={styles.topRow}>
            <View style={[styles.countBadge, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <Float distance={3}>
                <AppIcon name="duas" size={14} color={c.primary} />
              </Float>
              <Text style={[styles.countText, { color: c.text }]}>
                {filtered.length} {lang==='az'?'dua':lang==='ru'?'дуа':lang==='ar'?'دعاء':lang==='tr'?'dua':'duas'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.favToggle,
                {
                  backgroundColor: showFavs ? c.error : c.card,
                  borderColor: showFavs ? c.error : c.cardBorder,
                },
                showFavs && Shadows.button,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFavs(!showFavs);
              }}
              activeOpacity={0.8}
            >
              <AppIcon name={showFavs ? 'heart' : 'heartOutline'} size={14} color={showFavs ? '#fff' : c.error} />
              <Text style={[styles.favToggleText, { color: showFavs ? '#fff' : c.text }]}>{favs.length}</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>

        {/* Categories */}
        <FadeUp delay={150}>
          <FlatList
            horizontal
            data={t.categories}
            keyExtractor={(item, i) => String(i)}
            renderItem={({ item, index }) => {
              const active = selectedCat === index;
              const catKey = CAT_ORDER[index];
              const meta = CAT_META[catKey] || { color: c.primary, gradient: [c.primary, c.primaryLight] };
              return (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCat(index);
                  }}
                  activeOpacity={0.8}
                >
                  {active ? (
                    <LinearGradient colors={meta.gradient} style={[styles.catBtn, Shadows.button]}>
                      <Text style={[styles.catText, { color: '#fff' }]}>{item}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.catBtn, { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1.5 }]}>
                      <Text style={[styles.catText, { color: c.textSecondary }]}>{item}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
          />
        </FadeUp>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={d => String(d.id)}
          renderItem={({ item: d, index: i }) => (
            <FadeUp delay={Math.min(i * 50, 300)}>
              <DuaCard
                d={d}
                favs={favs}
                toggleFav={toggleFav}
                shareDua={shareDua}
                expanded={expanded}
                setExpanded={setExpanded}
                t={t}
                lang={lang}
                dark={dark}
              />
            </FadeUp>
          )}
          ListEmptyComponent={
            <ScaleIn>
              <View style={styles.empty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryBg }]}>
                  <AppIcon name="duas" size={48} color={c.primary} />
                </View>
                <Text style={[styles.emptyText, { color: c.text }]}>
                  {lang==='az'?'Dua tapılmadı':lang==='ru'?'Дуа не найдено':lang==='ar'?'لم يتم العثور على أدعية':lang==='tr'?'Dua bulunamadı':'No duas found'}
                </Text>
              </View>
            </ScaleIn>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },

  // Top row
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1 },
  countText: { fontSize: 13, fontWeight: '700' },
  favToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  favToggleText: { fontSize: 13, fontWeight: '800' },

  // Categories
  catScroll: { marginBottom: 14, maxHeight: 44 },
  catBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.full },
  catText: { fontSize: 13, fontWeight: '700' },

  // Dua Card
  duaCard: {
    padding: 20,
    paddingLeft: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },

  // Header
  duaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  catWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIconWrap: { width: 30, height: 30, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  catBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Arabic
  arabicBox: {
    padding: 18,
    paddingRight: 20,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    marginBottom: 14,
  },
  arabicText: {
    fontSize: 21,
    textAlign: 'right',
    lineHeight: 40,
    writingDirection: 'rtl',
    fontWeight: '500',
  },

  // Sections
  section: { marginBottom: 12 },
  sectionLabelWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: 6,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  translitText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22, fontWeight: '600' },
  meaningText: { fontSize: 15, lineHeight: 25, fontWeight: '500' },

  // Source
  sourceRow: { borderTopWidth: 1, paddingTop: 12, flexDirection: 'row' },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sourceText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  // Tap hint
  tapHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  tapHint: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // Empty
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: '600' },
});
