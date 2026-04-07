import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Spacing, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import PageHero from '../components/PageHero';

const EDITION_MAP = { az:'az.mammadaliyev', en:'en.asad', ru:'ru.kuliev', ar:'ar.muyassar', tr:'tr.diyanet' };

const SEARCH_LABELS = {
  az: { surahSearch:'Surə axtar', verseSearch:'Ayə axtar', searching:'Axtarılır...', noResults:'Nəticə tapılmadı', result:'nəticə' },
  en: { surahSearch:'Search surahs', verseSearch:'Search verses', searching:'Searching...', noResults:'No results found', result:'results' },
  ru: { surahSearch:'Поиск сур', verseSearch:'Поиск аятов', searching:'Поиск...', noResults:'Ничего не найдено', result:'результатов' },
  ar: { surahSearch:'بحث السور', verseSearch:'بحث الآيات', searching:'جارٍ البحث...', noResults:'لا نتائج', result:'نتائج' },
  tr: { surahSearch:'Sure ara', verseSearch:'Ayet ara', searching:'Aranıyor...', noResults:'Sonuç bulunamadı', result:'sonuç' },
};

const BOOKMARK_LABELS = { az:'Oxumağa davam et', en:'Continue reading', ru:'Продолжить чтение', ar:'أكمل القراءة', tr:'Okumaya devam et' };
const TAFSIR_LABELS = { az:'Təfsir', en:'Tafsir', ru:'Тафсир', ar:'تفسير', tr:'Tefsir' };

function AyahCard({ verse, showTrans, showTafsir, tafsirLabel, fontSize, dark }) {
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef(null);
  const c = dark ? Colors.dark : Colors.light;

  const toggle = async () => {
    if (playing) {
      if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); }
      setPlaying(false);
    } else {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: verse.audio });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.didJustFinish) { setPlaying(false); sound.unloadAsync(); }
        });
        await sound.playAsync();
        setPlaying(true);
      } catch { setPlaying(false); }
    }
  };

  useEffect(() => {
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  return (
    <View style={[styles.ayahCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={[styles.ayahNum, { backgroundColor: c.primary }]}>
        <Text style={styles.ayahNumText}>{verse.n}</Text>
      </View>
      <View style={styles.ayahBody}>
        <Text style={[styles.ayahArabic, { color: c.text, fontSize: fontSize * 16 }]}>{verse.ar}</Text>
        {showTrans && verse.tr && !showTafsir && (
          <Text style={[styles.ayahTrans, { color: c.textSecondary }]}>{verse.tr}</Text>
        )}
        {showTafsir && verse.tr && (
          <View style={[styles.tafsirBox, { backgroundColor: c.surfaceAlt }]}>
            <Text style={[styles.tafsirLabel, { color: c.primary }]}>{tafsirLabel}</Text>
            <Text style={[styles.tafsirText, { color: c.textSecondary }]}>{verse.tr}</Text>
          </View>
        )}
      </View>
      {verse.audio && (
        <TouchableOpacity style={[styles.playBtn, playing && { backgroundColor: c.primary }]} onPress={toggle}>
          <Text style={styles.playIcon}>{playing ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function QuranScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.quran || T.az.quran;
  const sl = SEARCH_LABELS[lang] || SEARCH_LABELS.az;

  const [surahs, setSurahs] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [surah, setSurah] = useState(null);
  const [surahLoading, setSurahLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showTrans, setShowTrans] = useState(true);
  const [showTafsir, setShowTafsir] = useState(false);
  const [fontSize, setFontSize] = useState(1.65);
  const [bookmark, setBookmark] = useState(null);
  const [searchMode, setSearchMode] = useState('surah');
  const [verseSearch, setVerseSearch] = useState('');
  const [verseResults, setVerseResults] = useState([]);
  const [verseSearching, setVerseSearching] = useState(false);
  const verseTimerRef = useRef(null);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json()).then(d => setSurahs(d.data))
      .catch(() => {})
      .finally(() => setListLoading(false));
    AsyncStorage.getItem('quran_bookmark').then(v => { try { if (v) setBookmark(JSON.parse(v)); } catch {} });
  }, []);

  useEffect(() => {
    if (searchMode !== 'verse' || verseSearch.length < 3) { setVerseResults([]); return; }
    setVerseSearching(true);
    if (verseTimerRef.current) clearTimeout(verseTimerRef.current);
    verseTimerRef.current = setTimeout(() => {
      const edition = EDITION_MAP[lang] || 'en.asad';
      fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(verseSearch)}/all/${edition}`)
        .then(r => r.json())
        .then(d => setVerseResults(d.code === 200 && d.data?.matches ? d.data.matches : []))
        .catch(() => setVerseResults([]))
        .finally(() => setVerseSearching(false));
    }, 500);
    return () => { if (verseTimerRef.current) clearTimeout(verseTimerRef.current); };
  }, [verseSearch, searchMode, lang]);

  const openSurah = async (num, name) => {
    setSelected(num);
    setSurahLoading(true);
    const edition = EDITION_MAP[lang] || 'en.asad';
    const eds = lang === 'ar' ? 'ar.alafasy,ar.muyassar' : `ar.alafasy,${edition}`;
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/${eds}`);
      const d = await res.json();
      const [arabic, trans] = d.data;
      setSurah({
        ...arabic,
        verses: arabic.ayahs.map((v, i) => ({
          n: v.numberInSurah, ar: v.text,
          audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${v.number}.mp3`,
          tr: trans?.ayahs[i]?.text || ''
        }))
      });
      const bm = { surah: num, name: name || '', time: Date.now() };
      await AsyncStorage.setItem('quran_bookmark', JSON.stringify(bm));
      setBookmark(bm);
    } catch {}
    setSurahLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return surahs.filter(s => {
      const matchQ = !q || s.englishName.toLowerCase().includes(q) || s.name.includes(search) || String(s.number).includes(q);
      const matchF = filter === 'all' || (filter === 'meccan' && s.revelationType === 'Meccan') || (filter === 'medinan' && s.revelationType === 'Medinan');
      return matchQ && matchF;
    });
  }, [surahs, search, filter]);

  // Reader view
  if (selected && surah) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.toolbar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => { setSelected(null); setSurah(null); }}>
            <Text style={[styles.backBtn, { color: c.primary }]}>{t.backBtn}</Text>
          </TouchableOpacity>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => setFontSize(f => Math.max(f - 0.1, 1.2))}>
              <Text style={{ color: c.text }}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => setFontSize(f => Math.min(f + 0.1, 2.2))}>
              <Text style={{ color: c.text }}>A+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctrlBtn, showTrans && { backgroundColor: c.primary + '30' }]} onPress={() => setShowTrans(s => !s)}>
              <Text style={{ color: c.text, fontSize: 11 }}>{t.translationLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctrlBtn, showTafsir && { backgroundColor: c.primary + '30' }]} onPress={() => setShowTafsir(s => !s)}>
              <Text style={{ color: c.text, fontSize: 11 }}>{TAFSIR_LABELS[lang]}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.readerHeader, { backgroundColor: c.primary }]}>
          <View style={styles.readerNumBadge}><Text style={styles.readerNum}>{surah.number}</Text></View>
          <Text style={styles.readerArabicName}>{surah.name}</Text>
          <Text style={styles.readerEnName}>{surah.englishName}</Text>
          <Text style={styles.readerMeta}>{surah.englishNameTranslation} · {surah.numberOfAyahs} {t.verses}</Text>
        </View>

        {surah.number !== 9 && (
          <View style={[styles.basmalah, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.basmalahAr, { color: c.text }]}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</Text>
            <Text style={[styles.basmalahTr, { color: c.textSecondary }]}>{t.basmalah}</Text>
          </View>
        )}

        {surahLoading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={surah.verses}
            keyExtractor={v => String(v.n)}
            renderItem={({ item }) => (
              <AyahCard verse={item} showTrans={showTrans} showTafsir={showTafsir} tafsirLabel={TAFSIR_LABELS[lang]} fontSize={fontSize} dark={dark} />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          />
        )}

        <View style={[styles.navRow, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          <TouchableOpacity disabled={selected <= 1} onPress={() => openSurah(selected - 1)} style={styles.navBtn}>
            <Text style={[styles.navBtnText, { color: selected <= 1 ? c.textMuted : c.primary }]}>{t.prevSurah}</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={selected >= 114} onPress={() => openSurah(selected + 1)} style={styles.navBtn}>
            <Text style={[styles.navBtnText, { color: selected >= 114 ? c.textMuted : c.primary }]}>{t.nextSurah}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // List view
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="القرآن الكريم" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>
        {bookmark && (
          <TouchableOpacity style={[styles.bookmarkCard, { backgroundColor: c.card, borderColor: c.gold }]} onPress={() => openSurah(bookmark.surah, bookmark.name)}>
            <Text style={{ fontSize: 24 }}>🔖</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.bookmarkLabel, { color: c.textSecondary }]}>{BOOKMARK_LABELS[lang]}</Text>
              <Text style={[styles.bookmarkName, { color: c.text }]}>{bookmark.name}</Text>
            </View>
            <Text style={{ color: c.textMuted, fontSize: 20 }}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.searchModeRow}>
          <TouchableOpacity style={[styles.searchModeBtn, searchMode === 'surah' && { backgroundColor: c.primary }]} onPress={() => setSearchMode('surah')}>
            <Text style={[styles.searchModeText, searchMode === 'surah' && { color: '#fff' }]}>{sl.surahSearch}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.searchModeBtn, searchMode === 'verse' && { backgroundColor: c.primary }]} onPress={() => setSearchMode('verse')}>
            <Text style={[styles.searchModeText, searchMode === 'verse' && { color: '#fff' }]}>{sl.verseSearch}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder={searchMode === 'surah' ? t.searchPh : sl.verseSearch}
            placeholderTextColor={c.textMuted}
            value={searchMode === 'surah' ? search : verseSearch}
            onChangeText={searchMode === 'surah' ? setSearch : setVerseSearch}
          />
        </View>

        {searchMode === 'surah' && (
          <>
            <View style={styles.filterRow}>
              {[{k:'all',l:t.all},{k:'meccan',l:t.meccan},{k:'medinan',l:t.medinan}].map(f => (
                <TouchableOpacity key={f.k} style={[styles.filterBtn, filter === f.k && { backgroundColor: c.primary }]} onPress={() => setFilter(f.k)}>
                  <Text style={[styles.filterText, filter === f.k && { color: '#fff' }]}>{f.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {listLoading ? (
              <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 30 }} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={s => String(s.number)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.surahCard, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => openSurah(item.number, item.englishName)}>
                    <View style={[styles.surahNum, { backgroundColor: c.primary + '15' }]}>
                      <Text style={[styles.surahNumText, { color: c.primary }]}>{item.number}</Text>
                    </View>
                    <View style={styles.surahBody}>
                      <Text style={[styles.surahNameEn, { color: c.text }]}>{item.englishName}</Text>
                      <Text style={[styles.surahMeta, { color: c.textSecondary }]}>{item.englishNameTranslation} · {item.numberOfAyahs} {t.verses}</Text>
                    </View>
                    <Text style={[styles.surahNameAr, { color: c.text }]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </>
        )}

        {searchMode === 'verse' && (
          <>
            {verseSearching && <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 30 }} />}
            {!verseSearching && verseSearch.length >= 3 && verseResults.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48 }}>📖</Text>
                <Text style={{ color: c.textMuted, marginTop: 8 }}>{sl.noResults}</Text>
              </View>
            )}
            {verseResults.length > 0 && (
              <FlatList
                data={verseResults}
                keyExtractor={(v, i) => String(i)}
                ListHeaderComponent={<Text style={[styles.resultsCount, { color: c.textSecondary }]}>{verseResults.length} {sl.result}</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.verseResultCard, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => openSurah(item.surah.number, item.surah.englishName)}>
                    <View style={styles.vrHeader}>
                      <Text style={[styles.vrSurah, { color: c.primary }]}>{item.surah.englishName} ({item.surah.name})</Text>
                      <Text style={[styles.vrAyah, { color: c.textMuted }]}>{item.numberInSurah}</Text>
                    </View>
                    <Text style={[styles.vrArabic, { color: c.text }]}>{item.text}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  backBtn: { fontSize: 15, fontWeight: '600' },
  controls: { flexDirection: 'row', gap: 6 },
  ctrlBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  readerHeader: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  readerNumBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  readerNum: { color: '#fff', fontWeight: '700', fontSize: 16 },
  readerArabicName: { fontSize: 28, color: '#fff', marginBottom: 4 },
  readerEnName: { fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  readerMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  basmalah: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  basmalahAr: { fontSize: 22 },
  basmalahTr: { fontSize: 13, marginTop: 4 },
  ayahCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  ayahNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  ayahNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  ayahBody: { flex: 1 },
  ayahArabic: { textAlign: 'right', lineHeight: 36, marginBottom: 8 },
  ayahTrans: { fontSize: 14, lineHeight: 22 },
  tafsirBox: { padding: 10, borderRadius: 8, marginTop: 6 },
  tafsirLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  tafsirText: { fontSize: 14, lineHeight: 22 },
  playBtn: { padding: 8, borderRadius: 20, marginLeft: 8 },
  playIcon: { fontSize: 18 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1 },
  navBtn: {},
  navBtnText: { fontSize: 15, fontWeight: '600' },
  bookmarkCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 16 },
  bookmarkLabel: { fontSize: 12 },
  bookmarkName: { fontSize: 16, fontWeight: '600' },
  searchModeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchModeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#eee' },
  searchModeText: { fontWeight: '600', fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, height: 44 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee' },
  filterText: { fontSize: 13, fontWeight: '500' },
  surahCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  surahNum: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  surahNumText: { fontWeight: '700', fontSize: 14 },
  surahBody: { flex: 1 },
  surahNameEn: { fontSize: 15, fontWeight: '600' },
  surahMeta: { fontSize: 12, marginTop: 2 },
  surahNameAr: { fontSize: 20, marginLeft: 8 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  resultsCount: { fontSize: 13, marginBottom: 8 },
  verseResultCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  vrHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  vrSurah: { fontWeight: '600', fontSize: 14 },
  vrAyah: { fontSize: 13 },
  vrArabic: { fontSize: 18, textAlign: 'right', lineHeight: 30 },
});
