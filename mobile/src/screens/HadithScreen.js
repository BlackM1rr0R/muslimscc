import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Share, StyleSheet, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import { HADITHS } from '../data/hadiths';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, PressableCard, HeartBeat } from '../components/Animated';

const CATS = {
  az:['Hamısı','İman','Əxlaq','İbadət','Namaz','Quran','Elm','Oruc','Zəkat','Zikr','Sədəqə','Səbr','Dünya','Axirət','Salavat','Səfər','Ailə'],
  en:['All','Faith','Character','Worship','Prayer','Quran','Knowledge','Fasting','Zakat','Dhikr','Charity','Patience','World','Afterlife','Salawat','Travel','Family'],
  ru:['Все','Вера','Нрав','Поклонение','Намаз','Коран','Знание','Пост','Закят','Зикр','Милостыня','Терпение','Мир','Ахират','Салават','Путешествие','Семья'],
  ar:['الكل','الإيمان','الأخلاق','العبادة','الصلاة','القرآن','العلم','الصيام','الزكاة','الذكر','الصدقة','الصبر','الدنيا','الآخرة','الصلوات','السفر','الأسرة'],
  tr:['Tümü','İman','Ahlak','İbadet','Namaz','Kuran','İlim','Oruç','Zekât','Zikir','Sadaka','Sabır','Dünya','Ahiret','Salavat','Seyahat','Aile'],
};

// Kateqoriya rəngləri
const CAT_COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#f97316','#84cc16','#14b8a6','#6366f1','#ef4444','#a855f7','#eab308','#0ea5e9','#d946ef','#f43f5e','#22c55e'];

const PER_PAGE = 20;

function HadithCard({ h, favs, toggleFav, shareHadith, expanded, setExpanded, t, lang, dark, index }) {
  const c = dark ? Colors.dark : Colors.light;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const isFav = favs.includes(h.id);
  const isOpen = expanded[h.id];

  const favScale = useRef(new RNAnimated.Value(1)).current;
  const animateFav = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    RNAnimated.sequence([
      RNAnimated.spring(favScale, { toValue: 1.4, friction: 3, tension: 80, useNativeDriver: true }),
      RNAnimated.spring(favScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();
    toggleFav(h.id);
  };

  // Kateqoriyadan rəng seç
  const catColor = CAT_COLORS[(h.id || 0) % CAT_COLORS.length];

  return (
    <View style={[styles.hadithCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
      {/* Gradient overlay */}
      <LinearGradient
        colors={[catColor + '12', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
      />

      {/* Sol tərəfdə rəngli bar */}
      <View style={[styles.colorBar, { backgroundColor: catColor }]} />

      {/* Header */}
      <View style={styles.hadithHeader}>
        <View style={[styles.numberBadge, { backgroundColor: catColor + '18', borderColor: catColor + '30' }]}>
          <AppIcon name="hadith" size={13} color={catColor} />
          <Text style={[styles.numberText, { color: catColor }]}>#{h.id}</Text>
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
              <AppIcon name={isFav ? 'heart' : 'heartOutline'} size={16} color={isFav ? c.error : c.textMuted} />
            </RNAnimated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              shareHadith(h);
            }}
            style={[styles.iconBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}
            activeOpacity={0.7}
          >
            <AppIcon name="share" size={16} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ərəb mətni */}
      {h.ar && (
        <View style={[styles.arabicBox, { backgroundColor: c.surfaceAlt + '80', borderLeftColor: catColor }]}>
          <Text style={[styles.arabicText, { color: c.text }]}>{h.ar}</Text>
        </View>
      )}

      {/* Translation toggle */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(prev => ({ ...prev, [h.id]: !prev[h.id] }));
        }}
        style={[styles.transToggle, { backgroundColor: catColor + '12', borderColor: catColor + '25' }]}
        activeOpacity={0.7}
      >
        <AppIcon name={isOpen ? 'chevronUp' : 'chevronDown'} size={14} color={catColor} />
        <Text style={[styles.transToggleText, { color: catColor }]}>
          {isOpen ? t.hideTrans : t.showTrans}
        </Text>
      </TouchableOpacity>

      {/* Translation */}
      {isOpen && (
        <FadeUp duration={300}>
          <View style={styles.translationBox}>
            <Text style={[styles.translationText, { color: c.textSecondary }]}>{h.text}</Text>
          </View>
        </FadeUp>
      )}

      {/* Footer */}
      <View style={[styles.hadithFooter, { borderTopColor: c.border }]}>
        <View style={[styles.sourceBadge, { backgroundColor: c.goldBg, borderColor: c.gold + '30' }]}>
          <AppIcon name="bookmark" size={12} color={c.gold} />
          <Text style={[styles.sourceText, { color: c.gold }]}>{h.source}</Text>
        </View>
      </View>
    </View>
  );
}

export default function HadithScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.hadith || T.az.hadith;
  const cats = CATS[lang] || CATS.az;
  const allHadiths = HADITHS[lang] || HADITHS.az || [];
  const sh = dark ? Shadows.dark.sm : Shadows.sm;

  const [cat, setCat] = useState(cats[0]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [favs, setFavs] = useState([]);
  const [showFavs, setShowFavs] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    AsyncStorage.getItem('hadith_favs').then(v => {
      try { if (v) setFavs(JSON.parse(v)); } catch {}
    });
  }, []);

  const toggleFav = async (id) => {
    const newFavs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    setFavs(newFavs);
    await AsyncStorage.setItem('hadith_favs', JSON.stringify(newFavs));
  };

  const filtered = useMemo(() => {
    let list = allHadiths;
    if (showFavs) list = list.filter(h => favs.includes(h.id));
    if (cat !== cats[0]) {
      const catIdx = cats.indexOf(cat);
      const enCats = CATS.en;
      if (catIdx > 0) list = list.filter(h => h.cat === enCats[catIdx]?.toLowerCase() || h.cat === cat.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h => h.text?.toLowerCase().includes(q) || h.ar?.toLowerCase().includes(q));
    }
    return list;
  }, [allHadiths, cat, search, showFavs, favs]);

  const paged = filtered.slice(0, (page + 1) * PER_PAGE);

  const shareHadith = async (h) => {
    try { await Share.share({ message: `${h.ar}\n\n${h.text}\n\n— ${h.source}\n\nmuslim.cc` }); } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الحديث الشريف" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>

        {/* ═══ SEARCH BAR ═══ */}
        <FadeUp delay={100}>
          <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
            <View style={[styles.searchIconWrap, { backgroundColor: c.primaryBg }]}>
              <AppIcon name="search" size={16} color={c.primary} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder={t.searchPh}
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={s => { setSearch(s); setPage(0); }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <AppIcon name="close" size={18} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </FadeUp>

        {/* ═══ TOP ROW: Count + Favs ═══ */}
        <FadeUp delay={150}>
          <View style={styles.topRow}>
            <View style={[styles.countBadge, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <AppIcon name="hadith" size={14} color={c.primary} />
              <Text style={[styles.countText, { color: c.text }]}>
                {filtered.length} {lang==='az'?'hədis':lang==='ru'?'хадисов':lang==='ar'?'حديث':lang==='tr'?'hadis':'hadiths'}
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
                setPage(0);
              }}
              activeOpacity={0.8}
            >
              <AppIcon name={showFavs ? 'heart' : 'heartOutline'} size={14} color={showFavs ? '#fff' : c.error} />
              <Text style={[styles.favToggleText, { color: showFavs ? '#fff' : c.text }]}>{favs.length}</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>

        {/* ═══ CATEGORIES ═══ */}
        <FadeUp delay={200}>
          <FlatList
            horizontal
            data={cats}
            keyExtractor={(item, i) => String(i)}
            renderItem={({ item: c2, index: i }) => {
              const active = cat === c2;
              const catColor = CAT_COLORS[i % CAT_COLORS.length];
              return (
                <TouchableOpacity
                  style={[
                    styles.catBtn,
                    {
                      backgroundColor: active ? catColor : c.card,
                      borderColor: active ? catColor : c.cardBorder,
                    },
                    active ? Shadows.button : {},
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCat(c2);
                    setPage(0);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catText, { color: active ? '#fff' : c.textSecondary }]}>{c2}</Text>
                </TouchableOpacity>
              );
            }}
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
          />
        </FadeUp>

        {/* ═══ HADITHS LIST ═══ */}
        <FlatList
          data={paged}
          keyExtractor={h => String(h.id)}
          renderItem={({ item: h, index: i }) => (
            <FadeUp delay={Math.min(i * 50, 300)}>
              <HadithCard
                h={h}
                favs={favs}
                toggleFav={toggleFav}
                shareHadith={shareHadith}
                expanded={expanded}
                setExpanded={setExpanded}
                t={t}
                lang={lang}
                dark={dark}
                index={i}
              />
            </FadeUp>
          )}
          onEndReached={() => { if (paged.length < filtered.length) setPage(p => p + 1); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <ScaleIn>
              <View style={styles.empty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryBg }]}>
                  <AppIcon name="hadith" size={48} color={c.primary} />
                </View>
                <Text style={[styles.emptyText, { color: c.text }]}>{t.noResult}</Text>
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
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 54,
    marginBottom: 12,
  },
  searchIconWrap: { width: 38, height: 38, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, height: 54, fontWeight: '500' },

  // Top row
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1 },
  countText: { fontSize: 13, fontWeight: '700' },
  favToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  favToggleText: { fontSize: 13, fontWeight: '800' },

  // Categories
  catScroll: { marginBottom: 14, maxHeight: 44 },
  catBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  catText: { fontSize: 13, fontWeight: '700' },

  // Hadith Card
  hadithCard: {
    padding: 20,
    paddingLeft: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  hadithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  numberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  numberText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Arabic
  arabicBox: {
    padding: 16,
    paddingRight: 18,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    marginBottom: 12,
  },
  arabicText: {
    fontSize: 19,
    textAlign: 'right',
    lineHeight: 36,
    writingDirection: 'rtl',
    fontWeight: '500',
  },

  // Translation toggle
  transToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  transToggleText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },

  // Translation
  translationBox: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '500',
  },

  // Footer
  hadithFooter: { borderTopWidth: 1, paddingTop: 12, flexDirection: 'row' },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sourceText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

  // Empty state
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
