import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Share, StyleSheet, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import { HADITHS } from '../data/hadiths';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, usePressAnimation } from '../components/Animated';

const CATS = {
  az:['Hamısı','İman','Əxlaq','İbadət','Namaz','Quran','Elm','Oruc','Zəkat','Zikr','Sədəqə','Səbr','Dünya','Axirət','Salavat','Səfər','Ailə'],
  en:['All','Faith','Character','Worship','Prayer','Quran','Knowledge','Fasting','Zakat','Dhikr','Charity','Patience','World','Afterlife','Salawat','Travel','Family'],
  ru:['Все','Вера','Нрав','Поклонение','Намаз','Коран','Знание','Пост','Закят','Зикр','Милостыня','Терпение','Мир','Ахират','Салават','Путешествие','Семья'],
  ar:['الكل','الإيمان','الأخلاق','العبادة','الصلاة','القرآن','العلم','الصيام','الزكاة','الذكر','الصدقة','الصبر','الدنيا','الآخرة','الصلوات','السفر','الأسرة'],
  tr:['Tümü','İman','Ahlak','İbadet','Namaz','Kuran','İlim','Oruç','Zekât','Zikir','Sadaka','Sabır','Dünya','Ahiret','Salavat','Seyahat','Aile'],
};

const PER_PAGE = 20;

function HadithCard({ h, favs, toggleFav, shareHadith, expanded, setExpanded, t, lang, dark }) {
  const c = dark ? Colors.dark : Colors.light;
  const shadow = dark ? Shadows.dark.sm : Shadows.sm;
  const { scale, onPressIn, onPressOut } = usePressAnimation();
  const isFav = favs.includes(h.id);

  // Fav button animation
  const favScale = useRef(new RNAnimated.Value(1)).current;
  const animateFav = () => {
    RNAnimated.sequence([
      RNAnimated.timing(favScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      RNAnimated.spring(favScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    toggleFav(h.id);
  };

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut}>
      <RNAnimated.View style={[styles.hadithCard, { backgroundColor: c.card, borderColor: c.cardBorder, transform: [{ scale }] }, shadow]}>
        {/* Header */}
        <View style={styles.hadithHeader}>
          <View style={[styles.hadithIdBadge, { backgroundColor: c.primaryBg }]}>
            <Text style={[styles.hadithId, { color: c.primary }]}>#{h.id}</Text>
          </View>
          <View style={styles.hadithActions}>
            <TouchableOpacity onPress={animateFav} style={[styles.actionBtn, { backgroundColor: c.surfaceAlt, borderColor: isFav ? c.primaryBorder : c.border }]}>
              <RNAnimated.Text style={{ fontSize: 17, transform: [{ scale: favScale }] }}>{isFav ? '❤️' : '🤍'}</RNAnimated.Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareHadith(h)} style={[styles.actionBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
              <Text style={{ fontSize: 15 }}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Arabic */}
        {h.ar && (
          <View style={[styles.arabicWrap, { borderRightColor: c.primaryBorder }]}>
            <Text style={[styles.hadithArabic, { color: c.text }]}>{h.ar}</Text>
          </View>
        )}

        {/* Translation toggle */}
        <TouchableOpacity onPress={() => setExpanded(prev => ({ ...prev, [h.id]: !prev[h.id] }))} style={[styles.transToggle, { backgroundColor: c.primaryBg }]}>
          <Text style={[styles.transToggleText, { color: c.primary }]}>
            {expanded[h.id] ? t.hideTrans : t.showTrans} {expanded[h.id] ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {/* Translation */}
        {expanded[h.id] && (
          <FadeUp duration={300}>
            <Text style={[styles.hadithText, { color: c.textSecondary }]}>{h.text}</Text>
          </FadeUp>
        )}

        {/* Footer */}
        <View style={[styles.hadithFooter, { borderTopColor: c.border }]}>
          <View style={[styles.sourceBadge, { backgroundColor: c.goldBg }]}>
            <Text style={[styles.hadithSource, { color: c.gold }]}>{h.source}</Text>
          </View>
        </View>
      </RNAnimated.View>
    </TouchableOpacity>
  );
}

export default function HadithScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.hadith || T.az.hadith;
  const cats = CATS[lang] || CATS.az;
  const allHadiths = HADITHS[lang] || HADITHS.az || [];
  const shadow = dark ? Shadows.dark.md : Shadows.md;

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
        {/* Search */}
        <FadeUp delay={100}>
          <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }, dark ? Shadows.dark.sm : Shadows.sm]}>
            <Text style={{ marginRight: 8, fontSize: 16 }}>🔍</Text>
            <TextInput style={[styles.searchInput, { color: c.text }]} placeholder={t.searchPh} placeholderTextColor={c.textMuted} value={search} onChangeText={s => { setSearch(s); setPage(0); }} />
          </View>
        </FadeUp>

        {/* Favs toggle */}
        <FadeUp delay={150}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={[styles.favToggle, { backgroundColor: showFavs ? c.gold : c.surfaceAlt, borderColor: showFavs ? c.gold : c.border }]}
              onPress={() => { setShowFavs(!showFavs); setPage(0); }}
            >
              <Text style={{ color: showFavs ? '#fff' : c.text, fontWeight: '700', fontSize: 13 }}>❤️ {favs.length}</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>

        {/* Categories */}
        <FadeUp delay={200}>
          <FlatList
            horizontal
            data={cats}
            keyExtractor={(item, i) => String(i)}
            renderItem={({ item: c2, index: i }) => (
              <TouchableOpacity
                style={[styles.catBtn, {
                  backgroundColor: cat === c2 ? c.primary : c.card,
                  borderColor: cat === c2 ? c.primary : c.cardBorder,
                }, cat === c2 ? Shadows.button : {}]}
                onPress={() => { setCat(c2); setPage(0); }}
              >
                <Text style={[styles.catText, { color: cat === c2 ? '#fff' : c.textSecondary }]}>{c2}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
          />
        </FadeUp>

        {/* Hadiths list */}
        <FlatList
          data={paged}
          keyExtractor={h => String(h.id)}
          renderItem={({ item: h, index: i }) => (
            <FadeUp delay={Math.min(i * 60, 300)}>
              <HadithCard h={h} favs={favs} toggleFav={toggleFav} shareHadith={shareHadith} expanded={expanded} setExpanded={setExpanded} t={t} lang={lang} dark={dark} />
            </FadeUp>
          )}
          onEndReached={() => { if (paged.length < filtered.length) setPage(p => p + 1); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <ScaleIn><View style={styles.empty}><Text style={{ fontSize: 48 }}>📚</Text><Text style={{ color: c.textMuted, marginTop: 8, fontSize: 15 }}>{t.noResult}</Text></View></ScaleIn>
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
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: BorderRadius.md, borderWidth: 1.5, height: 48, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, height: 48 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  favToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  catScroll: { marginBottom: 14 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  catText: { fontSize: 13, fontWeight: '600' },

  // Hadith Card
  hadithCard: { padding: 18, borderRadius: BorderRadius.lg, borderWidth: 1.5, marginBottom: 12 },
  hadithHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  hadithIdBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.sm },
  hadithId: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  hadithActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: BorderRadius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Arabic
  arabicWrap: { borderRightWidth: 3, paddingRight: 14, marginBottom: 14 },
  hadithArabic: { fontSize: 19, textAlign: 'right', lineHeight: 36, writingDirection: 'rtl' },

  // Translation toggle
  transToggle: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginBottom: 8 },
  transToggleText: { fontSize: 13, fontWeight: '600' },

  // Translation text
  hadithText: { fontSize: 14, lineHeight: 24, marginBottom: 12 },

  // Footer
  hadithFooter: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row' },
  sourceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  hadithSource: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  empty: { alignItems: 'center', marginTop: 40 },
});
