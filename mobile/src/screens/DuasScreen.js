import React, { useState, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Share, StyleSheet, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import { DUAS_DATA } from '../data/duas';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, usePressAnimation } from '../components/Animated';

function DuaCard({ d, favs, toggleFav, shareDua, expanded, setExpanded, t, lang, dark }) {
  const c = dark ? Colors.dark : Colors.light;
  const shadow = dark ? Shadows.dark.sm : Shadows.sm;
  const { scale, onPressIn, onPressOut } = usePressAnimation();
  const isOpen = expanded[d.id];
  const isFav = favs.includes(d.id);
  const translation = d[lang] || d.en || d.az;

  const favScale = useRef(new RNAnimated.Value(1)).current;
  const animateFav = () => {
    RNAnimated.sequence([
      RNAnimated.timing(favScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      RNAnimated.spring(favScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    toggleFav(d.id);
  };

  const catNames = ['morning','evening','eating','sleeping','waking','anxiety','gratitude','forgiveness','prayer','travel'];
  const catIdx = catNames.indexOf(d.cat);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => setExpanded(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
    >
      <RNAnimated.View style={[styles.duaCard, { backgroundColor: c.card, borderColor: isOpen ? c.primaryBorder : c.cardBorder, transform: [{ scale }] }, shadow]}>
        {/* Header */}
        <View style={styles.duaHeader}>
          <View style={[styles.catBadge, { backgroundColor: c.primaryBg, borderColor: c.primaryBorder }]}>
            <Text style={[styles.catBadgeText, { color: c.primary }]}>
              {t.categories[catIdx + 1] || d.cat}
            </Text>
          </View>
          <View style={styles.duaActions}>
            <TouchableOpacity onPress={animateFav} style={[styles.actionBtn, { backgroundColor: c.surfaceAlt, borderColor: isFav ? c.primaryBorder : c.border }]}>
              <RNAnimated.Text style={{ fontSize: 15, transform: [{ scale: favScale }] }}>{isFav ? '❤️' : '🤍'}</RNAnimated.Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareDua(d)} style={[styles.actionBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
              <Text style={{ fontSize: 14 }}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Arabic */}
        <View style={[styles.arabicWrap, { borderRightColor: c.primaryBorder }]}>
          <Text style={[styles.duaArabic, { color: c.text }]}>{d.ar}</Text>
        </View>

        {/* Expanded content */}
        {isOpen && (
          <FadeUp duration={300}>
            {d.translit && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: c.primary }]}>{t.translitLabel}</Text>
                <Text style={[styles.translitText, { color: c.primaryDark }]}>{d.translit}</Text>
              </View>
            )}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: c.primary }]}>{t.meaningLabel}</Text>
              <Text style={[styles.meaningText, { color: c.textSecondary }]}>{translation}</Text>
            </View>
            <View style={[styles.sourceRow, { borderTopColor: c.border }]}>
              <View style={[styles.sourceBadge, { backgroundColor: c.goldBg }]}>
                <Text style={[styles.sourceText, { color: c.gold }]}>{t.sourceLabel}: {d.source}</Text>
              </View>
            </View>
          </FadeUp>
        )}

        {/* Tap hint */}
        {!isOpen && (
          <Text style={[styles.tapHint, { color: c.textMuted }]}>{t.tapExpand} ▼</Text>
        )}
      </RNAnimated.View>
    </TouchableOpacity>
  );
}

export default function DuasScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.duas || T.az.duas;

  const [selectedCat, setSelectedCat] = useState(0);
  const [favs, setFavs] = useState([]);
  const [showFavs, setShowFavs] = useState(false);
  const [expanded, setExpanded] = useState({});

  React.useEffect(() => {
    AsyncStorage.getItem('dua_favs').then(v => {
      try { if (v) setFavs(JSON.parse(v)); } catch {}
    });
  }, []);

  const toggleFav = async (id) => {
    const newFavs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    setFavs(newFavs);
    await AsyncStorage.setItem('dua_favs', JSON.stringify(newFavs));
  };

  const filtered = useMemo(() => {
    let list = DUAS_DATA || [];
    if (showFavs) list = list.filter(d => favs.includes(d.id));
    if (selectedCat > 0) {
      const catNames = ['morning','evening','eating','sleeping','waking','anxiety','gratitude','forgiveness','prayer','travel'];
      list = list.filter(d => d.cat === catNames[selectedCat - 1]);
    }
    return list;
  }, [selectedCat, showFavs, favs]);

  const shareDua = async (d) => {
    try {
      const text = d[lang] || d.en || d.az;
      await Share.share({ message: `${d.ar}\n\n${text}\n\n— ${d.source}\n\nmuslim.cc` });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الأدعية والأذكار" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>
        {/* Favs + Cat */}
        <FadeUp delay={100}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={[styles.favToggle, { backgroundColor: showFavs ? c.gold : c.surfaceAlt, borderColor: showFavs ? c.gold : c.border }]}
              onPress={() => setShowFavs(!showFavs)}
            >
              <Text style={{ color: showFavs ? '#fff' : c.text, fontWeight: '700', fontSize: 13 }}>❤️ {favs.length}</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>

        <FadeUp delay={150}>
          <FlatList
            horizontal
            data={t.categories}
            keyExtractor={(item, i) => String(i)}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.catBtn, {
                  backgroundColor: selectedCat === index ? c.primary : c.card,
                  borderColor: selectedCat === index ? c.primary : c.cardBorder,
                }, selectedCat === index ? Shadows.button : {}]}
                onPress={() => setSelectedCat(index)}
              >
                <Text style={[styles.catText, { color: selectedCat === index ? '#fff' : c.textSecondary }]}>{item}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
          />
        </FadeUp>

        {/* Duas list */}
        <FlatList
          data={filtered}
          keyExtractor={d => String(d.id)}
          renderItem={({ item: d, index: i }) => (
            <FadeUp delay={Math.min(i * 60, 300)}>
              <DuaCard d={d} favs={favs} toggleFav={toggleFav} shareDua={shareDua} expanded={expanded} setExpanded={setExpanded} t={t} lang={lang} dark={dark} />
            </FadeUp>
          )}
          ListEmptyComponent={
            <ScaleIn><View style={styles.empty}><Text style={{ fontSize: 48 }}>🤲</Text><Text style={{ color: c.textMuted, marginTop: 8 }}>No duas found</Text></View></ScaleIn>
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
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  favToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  catScroll: { marginBottom: 14 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  catText: { fontSize: 13, fontWeight: '600' },

  // Dua Card
  duaCard: { padding: 20, borderRadius: BorderRadius.lg, borderWidth: 1.5, marginBottom: 12 },
  duaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  catBadge: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  catBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  duaActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: BorderRadius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Arabic
  arabicWrap: { borderRightWidth: 3, paddingRight: 14, marginBottom: 14 },
  duaArabic: { fontSize: 21, textAlign: 'right', lineHeight: 38, writingDirection: 'rtl' },

  // Sections
  section: { marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  translitText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  meaningText: { fontSize: 14, lineHeight: 24 },

  // Source
  sourceRow: { borderTopWidth: 1, paddingTop: 10 },
  sourceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm, alignSelf: 'flex-start' },
  sourceText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // Tap hint
  tapHint: { fontSize: 12, textAlign: 'center', marginTop: 4 },

  empty: { alignItems: 'center', marginTop: 40 },
});
