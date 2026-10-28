import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, ActivityIndicator, Animated, AccessibilityInfo } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Spacing, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import { getSurahLocal } from '../data/surahNamesAz';
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

// "Ayəyə keç" (veb QuranPage.jsx ilə eyni mətnlər)
const JUMP_LABELS = {
  az: { jump:'Ayəyə keç', field:'Ayənin nömrəsi', go:'Keç', range: n => `1 ilə ${n} arasında rəqəm yazın` },
  en: { jump:'Go to verse', field:'Verse number', go:'Go', range: n => `Enter a number from 1 to ${n}` },
  ru: { jump:'Перейти к аяту', field:'Номер аята', go:'Перейти', range: n => `Введите число от 1 до ${n}` },
  ar: { jump:'انتقل إلى آية', field:'رقم الآية', go:'انتقل', range: n => `أدخل رقمًا من 1 إلى ${n}` },
  tr: { jump:'Ayete git', field:'Ayet numarası', go:'Git', range: n => `1 ile ${n} arasında bir sayı yazın` },
};
const ERROR_LABELS = {
  az: { msg:'Surə yüklənmədi. İnternet bağlantısını yoxlayın.', retry:'Yenidən cəhd et' },
  en: { msg:'The surah could not be loaded. Please check your connection.', retry:'Try again' },
  ru: { msg:'Не удалось загрузить суру. Проверьте подключение к интернету.', retry:'Повторить' },
  ar: { msg:'تعذّر تحميل السورة. تحقّق من الاتصال بالإنترنت.', retry:'أعد المحاولة' },
  tr: { msg:'Sure yüklenemedi. İnternet bağlantınızı kontrol edin.', retry:'Tekrar dene' },
};

// Azərbaycan dilində sıra şəkilçisi rəqəmin oxunuşuna görədir: 1-ci, 3-cü, 6-cı, 9-cu, 40-cı, 100-cü
const AZ_ONES = ['', 'ci', 'ci', 'cü', 'cü', 'ci', 'cı', 'ci', 'ci', 'cu'];
const AZ_TENS = ['', 'cu', 'ci', 'cu', 'cı', 'ci', 'cı', 'ci', 'ci', 'cı'];
function azOrdinal(n) {
  if (n % 10) return `${n}-${AZ_ONES[n % 10]}`;
  if (n % 100) return `${n}-${AZ_TENS[(n % 100) / 10]}`;
  return `${n}-cü`;
}
function ayahLabel(n, lang) {
  switch (lang) {
    case 'az': return `${azOrdinal(n)} ayə`;
    case 'ru': return `аят ${n}`;
    case 'ar': return `الآية ${n}`;
    case 'tr': return `${n}. ayet`;
    default:   return `verse ${n}`;
  }
}
// "Bəqərə, 50-ci ayə"
const placeLabel = (name, n, lang) => `${name}${lang === 'ar' ? '، ' : ', '}${ayahLabel(n, lang)}`;

// ── Oxuma yeri ── açar veb ilə eynidir: { surah, ayah?, time }. Köhnə yazıda
// ayah yoxdursa surə əvvəldən açılır (geriyə uyğun).
const BOOKMARK_KEY = 'quran_bookmark';
function parseBookmark(raw) {
  try {
    const bm = JSON.parse(raw);
    const surah = Number(bm?.surah);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null;
    const ayah = Number(bm.ayah);
    return { ...bm, surah, ayah: Number.isInteger(ayah) && ayah > 1 ? ayah : undefined };
  } catch { return null; }
}

// ── Surənin adı və mənası cari dildə (veb QuranPage.jsx ilə eyni) ──
// az/ru/tr: yerli yazılış (surahNamesAz.js); ar: API-dəki ərəb adı ("سُورَةُ" sözü olmadan);
// en: API-nin transliterasiyası və mənası. ru/tr/ar-da ingiliscə məna göstərilmir.
const stripSurahWord = (name) => String(name || '').replace(/^سُورَةُ\s+/, '');
function surahTitle(s, lang) {
  if (!s) return '';
  const local = getSurahLocal(s.number, lang);
  if (local) return local.name;
  if (lang === 'ar') return stripSurahWord(s.name);
  return s.englishName;
}
function surahMeaning(s, lang) {
  if (!s || lang === 'ar') return '';
  const local = getSurahLocal(s.number, lang);
  if (local) return local.meaning;
  return lang === 'en' ? s.englishNameTranslation : '';
}

// Keçid edilən ayənin qızılı halqası: görünür və solur (yalnız opacity, native driver).
// Hərəkət azaldılıbsa — sabit görünür və 2.4 s sonra götürülür.
function AyahFlash({ flash, color }) {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!flash) { op.setValue(0); return undefined; }
    let alive = true;
    let timer = null;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduce => {
      if (!alive) return;
      if (reduce) { op.setValue(1); timer = setTimeout(() => op.setValue(0), 2400); return; }
      op.setValue(0);
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(op, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]).start();
    });
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [flash, op]);
  return <Animated.View pointerEvents="none" style={[styles.ayahFlash, { borderColor: color, opacity: op }]} />;
}

function AyahCard({ verse, showTrans, showTafsir, hasTafsir, tafsirLabel, fontSize, dark, flash }) {
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
      <AyahFlash flash={flash} color={c.gold} />
      <View style={[styles.ayahNum, { backgroundColor: c.primary }]}>
        <Text style={styles.ayahNumText}>{verse.n}</Text>
      </View>
      <View style={styles.ayahBody}>
        <Text style={[styles.ayahArabic, { color: c.text, fontSize: fontSize * 16 }]}>{verse.ar}</Text>
        {/* ar: ikinci nəşr (ar.muyassar) təfsirdir; digər dillərdə — seçilmiş dilin tərcüməsi */}
        {!hasTafsir && showTrans && verse.tr ? (
          <Text style={[styles.ayahTrans, { color: c.textSecondary }]}>{verse.tr}</Text>
        ) : null}
        {hasTafsir && showTafsir && verse.tr ? (
          <View style={[styles.tafsirBox, { backgroundColor: c.surfaceAlt }]}>
            <Text style={[styles.tafsirLabel, { color: c.primary }]}>{tafsirLabel}</Text>
            <Text style={[styles.tafsirText, { color: c.textSecondary }]}>{verse.tr}</Text>
          </View>
        ) : null}
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
  // Real təfsir yalnız ərəbcədədir (ar.muyassar); digər dillərin nəşri tərcümədir —
  // onu "Təfsir" adı ilə göstərmək yanıldıcı olardı (veb QuranPage ilə eyni)
  const hasTafsir = lang === 'ar';

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
  const [surahError, setSurahError] = useState(false);
  const jl = JUMP_LABELS[lang] || JUMP_LABELS.az;
  const el = ERROR_LABELS[lang] || ERROR_LABELS.az;

  // ── Ayəyə keçid və oxuma yeri ──
  const listRef = useRef(null);
  const [pendingAyah, setPendingAyah] = useState(null);   // surə yüklənəndən sonra keçiləcək ayə
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState('');
  const [jumpError, setJumpError] = useState(false);
  const [flash, setFlash] = useState({ n: 0, k: 0 });
  const currentAyahRef = useRef(null);
  const armedRef = useRef(false);        // yer yalnız istifadəçi özü sürüşdürəndən sonra yazılır
  const selectedRef = useRef(null);
  selectedRef.current = selected;
  const bookmarkRef = useRef(null);
  bookmarkRef.current = bookmark;
  const saveTimerRef = useRef(null);
  const pendingSaveRef = useRef(null);
  const lastSaveRef = useRef(0);
  const reqRef = useRef(0);

  // Yeri yaz. ayah verilməyibsə və eyni surədirsə köhnə ayə saxlanılır.
  const saveBookmark = useCallback((num, ayah) => {
    const prev = bookmarkRef.current;
    const keep = ayah === undefined && prev?.surah === num ? prev.ayah : ayah;
    const bm = { surah: num, ...(keep > 1 ? { ayah: keep } : {}), time: Date.now() };
    bookmarkRef.current = bm;
    setBookmark(bm);
    AsyncStorage.setItem(BOOKMARK_KEY, JSON.stringify(bm)).catch(() => {});
  }, []);
  // Throttle: ən çox saniyədə bir yazı, sonuncu dəyər itmir
  const flushSave = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    const p = pendingSaveRef.current;
    if (!p) return;
    pendingSaveRef.current = null;
    lastSaveRef.current = Date.now();
    saveBookmark(p.s, p.n);
  }, [saveBookmark]);
  const queueSave = useCallback((n) => {
    if (!selectedRef.current) return;
    pendingSaveRef.current = { s: selectedRef.current, n };
    const wait = 1000 - (Date.now() - lastSaveRef.current);
    if (wait <= 0) flushSave();
    else if (!saveTimerRef.current) saveTimerRef.current = setTimeout(flushSave, wait);
  }, [flushSave]);
  useEffect(() => () => flushSave(), [selected, flushSave]);

  // FlatList bu funksiyanın dəyişməsinə icazə vermir — ref ilə sabit saxlanılır
  const queueSaveRef = useRef(queueSave);
  queueSaveRef.current = queueSave;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const first = viewableItems.filter(v => v.isViewable && v.item?.n).sort((a, b) => a.index - b.index)[0];
    if (!first) return;
    currentAyahRef.current = first.item.n;
    if (armedRef.current) queueSaveRef.current(first.item.n);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 30, minimumViewTime: 150 }).current;

  const goToAyah = useCallback((n, { animated = true } = {}) => {
    if (!listRef.current) return;
    listRef.current.scrollToIndex({ index: n - 1, animated, viewPosition: 0, viewOffset: 8 });
    currentAyahRef.current = n;
    saveBookmark(selectedRef.current, n);
    setFlash(f => ({ n, k: f.k + 1 }));
  }, [saveBookmark]);
  // Hündürlüklər hələ ölçülməyibsə scrollToIndex alınmır: təxmini yerə
  // sürüşdür, sətirlər ölçüləndən sonra yenidən cəhd et
  const onScrollToIndexFailed = useCallback((info) => {
    listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0, viewOffset: 8 });
    }, 120);
  }, []);

  // Surə yükləndi və gözləyən ayə var ("davam et", axtarış nəticəsi)
  useEffect(() => {
    if (!surah || surah.number !== selected || !pendingAyah) return undefined;
    const n = Math.min(pendingAyah, surah.verses.length);
    const t = setTimeout(() => { setPendingAyah(null); goToAyah(n, { animated: false }); }, 60);
    return () => clearTimeout(t);
  }, [surah, selected, pendingAyah, goToAyah]);

  const submitJump = () => {
    const total = surah?.verses?.length || 0;
    const n = Number(String(jumpValue).trim());
    if (!Number.isInteger(n) || n < 1 || n > total) { setJumpError(true); return; }
    setJumpOpen(false);
    setJumpValue('');
    setJumpError(false);
    goToAyah(n);
  };

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json()).then(d => setSurahs(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setListLoading(false));
    AsyncStorage.getItem(BOOKMARK_KEY).then(v => { const bm = v ? parseBookmark(v) : null; if (bm) setBookmark(bm); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchMode !== 'verse' || verseSearch.length < 3) { setVerseResults([]); return; }
    setVerseSearching(true);
    if (verseTimerRef.current) clearTimeout(verseTimerRef.current);
    verseTimerRef.current = setTimeout(() => {
      // Axtarış seçilmiş dilin nəşrində aparılır (başqa dilə düşmür)
      const edition = EDITION_MAP[lang];
      fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(verseSearch)}/all/${edition}`)
        .then(r => r.json())
        .then(d => setVerseResults(d.code === 200 && d.data?.matches ? d.data.matches : []))
        .catch(() => setVerseResults([]))
        .finally(() => setVerseSearching(false));
    }, 500);
    return () => { if (verseTimerRef.current) clearTimeout(verseTimerRef.current); };
  }, [verseSearch, searchMode, lang]);

  // ayah > 1 verilibsə surə yüklənəndən sonra həmin ayəyə keçilir
  const openSurah = async (num, ayah) => {
    if (!num) return;
    const req = ++reqRef.current;   // tez-tez "Növbəti" basılanda köhnə cavab yenisini əzməsin
    setSelected(num);
    setSurah(null);
    setSurahError(false);
    setJumpOpen(false);
    setPendingAyah(ayah > 1 ? ayah : null);
    armedRef.current = false;
    currentAyahRef.current = null;
    // Siyahıdan təsadüfən açıb çıxmaq dünənki ayəni silməsin (eyni surədə saxlanılır)
    saveBookmark(num, ayah > 1 ? ayah : undefined);
    setSurahLoading(true);
    const edition = EDITION_MAP[lang];
    const eds = lang === 'ar' ? 'ar.alafasy,ar.muyassar' : `ar.alafasy,${edition}`;
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/${eds}`);
      const d = await res.json();
      if (req !== reqRef.current) return;
      const [arabic, trans] = Array.isArray(d?.data) ? d.data : [];
      // Tərcümə məhz seçilmiş dilin nəşrindən gəlməlidir — başqa nəşrə düşmür
      if (!arabic?.ayahs || trans?.edition?.identifier !== edition) throw new Error('edition-unavailable');
      setSurah({
        ...arabic,
        verses: arabic.ayahs.map((v, i) => ({
          n: v.numberInSurah, ar: v.text,
          audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${v.number}.mp3`,
          tr: trans?.ayahs[i]?.text || ''
        }))
      });
      // Ad saxlanmır — göstərərkən cari dildə hesablanır (dil dəyişəndə köhnə dil qalmasın)
    } catch {
      if (req === reqRef.current) setSurahError(true);
    }
    if (req === reqRef.current) setSurahLoading(false);
  };
  const closeReader = () => { flushSave(); reqRef.current++; setSelected(null); setSurah(null); setJumpOpen(false); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return surahs.filter(s => {
      const locals = ['az', 'ru', 'tr'].map(l => getSurahLocal(s.number, l)).filter(Boolean);
      const matchQ = !q || s.englishName.toLowerCase().includes(q) || s.name.includes(search) || String(s.number).includes(q) ||
        locals.some(x => x.name.toLowerCase().includes(q) || x.meaning.toLowerCase().includes(q));
      const matchF = filter === 'all' || (filter === 'meccan' && s.revelationType === 'Meccan') || (filter === 'medinan' && s.revelationType === 'Medinan');
      return matchQ && matchF;
    });
  }, [surahs, search, filter]);

  // Reader view — surə yüklənərkən də açılır (əvvəl siyahı ekranda qalırdı və
  // toxunuşun heç nə etmədiyi görünürdü)
  if (selected) {
    const ready = !!surah && surah.number === selected;
    const total = ready ? surah.verses.length : 0;
    // Başlıq və Bəsmələ siyahının içindədir (əvvəl ekranın üstündə sabit idi və
    // telefonda oxuma sahəsinin üçdə birini tuturdu)
    const listHeader = ready ? (
      <View>
        <View style={[styles.readerHeader, { backgroundColor: c.primary }]}>
          <View style={styles.readerNumBadge}><Text style={styles.readerNum}>{surah.number}</Text></View>
          <Text style={styles.readerArabicName}>{surah.name}</Text>
          {lang !== 'ar' ? <Text style={styles.readerEnName}>{surahTitle(surah, lang)}</Text> : null}
          <Text style={styles.readerMeta}>{[surahMeaning(surah, lang), `${surah.numberOfAyahs} ${t.verses}`].filter(Boolean).join(' · ')}</Text>
        </View>
        {/* Fatihədə Bəsmələ 1-ci ayənin özüdür, Tövbədə isə oxunmur (veb ilə eyni) */}
        {surah.number !== 1 && surah.number !== 9 && (
          <View style={[styles.basmalah, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.basmalahAr, { color: c.text }]}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</Text>
            {lang !== 'ar' ? <Text style={[styles.basmalahTr, { color: c.textSecondary }]}>{t.basmalah}</Text> : null}
          </View>
        )}
      </View>
    ) : null;
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.toolbar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={closeReader} style={styles.toolbarTap} accessibilityRole="button">
            <Text style={[styles.backBtn, { color: c.primary }]}>{t.backBtn}</Text>
          </TouchableOpacity>
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.ctrlBtn, jumpOpen && { backgroundColor: c.primary + '30' }]} disabled={!ready}
              accessibilityRole="button" accessibilityLabel={jl.jump} accessibilityState={{ expanded: jumpOpen, disabled: !ready }}
              onPress={() => { setJumpOpen(o => !o); setJumpError(false); }}>
              <Text style={{ color: ready ? c.text : c.textMuted, fontSize: 11, fontWeight: '600' }}>{jl.jump}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => setFontSize(f => Math.max(f - 0.1, 1.2))}>
              <Text style={{ color: c.text }}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => setFontSize(f => Math.min(f + 0.1, 2.2))}>
              <Text style={{ color: c.text }}>A+</Text>
            </TouchableOpacity>
            {!hasTafsir ? (
            <TouchableOpacity style={[styles.ctrlBtn, showTrans && { backgroundColor: c.primary + '30' }]} onPress={() => setShowTrans(s => !s)}>
              <Text style={{ color: c.text, fontSize: 11 }}>{t.translationLabel}</Text>
            </TouchableOpacity>
            ) : (
            <TouchableOpacity style={[styles.ctrlBtn, showTafsir && { backgroundColor: c.primary + '30' }]} onPress={() => setShowTafsir(s => !s)}>
              <Text style={{ color: c.text, fontSize: 11 }}>{TAFSIR_LABELS[lang]}</Text>
            </TouchableOpacity>
            )}
          </View>
        </View>

        {/* "Ayəyə keç": rəqəm sahəsi (1…N yoxlaması) + nömrələrin üfüqi siyahısı */}
        {jumpOpen && ready && (
          <View style={[styles.jumpPanel, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
            <Text style={[styles.jumpLabel, { color: c.textSecondary }]}>{jl.field}</Text>
            <View style={styles.jumpRow}>
              <TextInput
                style={[styles.jumpInput, { color: c.text, backgroundColor: c.inputBg, borderColor: jumpError ? c.error : c.border }]}
                value={jumpValue} onChangeText={v => { setJumpValue(v.replace(/[^0-9]/g, '')); setJumpError(false); }}
                keyboardType="number-pad" returnKeyType="go" autoFocus maxLength={3}
                placeholder={currentAyahRef.current ? String(currentAyahRef.current) : '1'} placeholderTextColor={c.textMuted}
                onSubmitEditing={submitJump} accessibilityLabel={jl.field}
              />
              <Text style={[styles.jumpOf, { color: c.textMuted }]}>/ {total}</Text>
              <TouchableOpacity style={[styles.jumpGo, { backgroundColor: c.primary }]} onPress={submitJump} accessibilityRole="button">
                <Text style={styles.jumpGoText}>{jl.go}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.jumpHint, { color: jumpError ? c.error : c.textMuted }]} accessibilityLiveRegion={jumpError ? 'polite' : 'none'}>
              {jl.range(total)}
            </Text>
            <FlatList
              horizontal
              data={surah.verses}
              keyExtractor={v => `j${v.n}`}
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              contentContainerStyle={{ gap: 6, paddingTop: 8 }}
              renderItem={({ item }) => {
                const cur = item.n === currentAyahRef.current;
                return (
                  <TouchableOpacity onPress={() => { setJumpOpen(false); goToAyah(item.n); }}
                    style={[styles.jumpChip, { borderColor: cur ? c.primary : c.border, backgroundColor: cur ? c.primary + '22' : c.card }]}
                    accessibilityRole="button" accessibilityLabel={ayahLabel(item.n, lang)}>
                    <Text style={{ color: cur ? c.primary : c.textSecondary, fontWeight: '600', fontSize: 13 }}>{item.n}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {surahError ? (
          <View style={styles.emptyState}>
            <Text style={{ color: c.textSecondary, textAlign: 'center', marginHorizontal: 24 }}>{el.msg}</Text>
            <TouchableOpacity style={[styles.jumpGo, { backgroundColor: c.primary, marginTop: 14 }]} onPress={() => openSurah(selected, pendingAyah || undefined)}>
              <Text style={styles.jumpGoText}>{el.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : !ready || surahLoading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={surah.verses}
            keyExtractor={v => String(v.n)}
            ListHeaderComponent={listHeader}
            renderItem={({ item }) => (
              <AyahCard verse={item} showTrans={showTrans} showTafsir={showTafsir} hasTafsir={hasTafsir} tafsirLabel={TAFSIR_LABELS[lang]} fontSize={fontSize} dark={dark}
                flash={flash.n === item.n ? flash.k : 0} />
            )}
            extraData={flash}
            // Uzaq ayəyə keçid üçün: əvvəlcə daha çox sətir çək, ölçülməyibsə ehtiyat yol
            initialNumToRender={Math.min(total, Math.max(12, (pendingAyah || 0) + 4))}
            windowSize={11}
            onScrollToIndexFailed={onScrollToIndexFailed}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            // Yer yalnız istifadəçinin öz sürüşməsindən sonra yazılır
            onScrollBeginDrag={() => { armedRef.current = true; }}
            onMomentumScrollEnd={() => { if (armedRef.current && currentAyahRef.current) queueSave(currentAyahRef.current); }}
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
      <PageHero arabic="القرآن الكريم" title={t.title} subtitle={t.subtitle} theme="quran" />

      <View style={styles.content}>
        {bookmark && (
          // Klikdə surə açılır və yüklənəndən sonra dəqiq həmin ayəyə keçilir
          <TouchableOpacity style={[styles.bookmarkCard, { backgroundColor: c.card, borderColor: c.gold }]} onPress={() => openSurah(bookmark.surah, bookmark.ayah)}
            accessibilityRole="button">
            <Text style={{ fontSize: 24 }}>🔖</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.bookmarkLabel, { color: c.textSecondary }]}>{BOOKMARK_LABELS[lang]}</Text>
              <Text style={[styles.bookmarkName, { color: c.text }]}>{(() => {
                const name = surahTitle(surahs.find(s => s.number === bookmark.surah), lang) || `${bookmark.surah}`;
                return bookmark.ayah ? placeLabel(name, bookmark.ayah, lang) : name;
              })()}</Text>
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
                renderItem={({ item }) => {
                  const displayName = surahTitle(item, lang);
                  const displayMeta = [surahMeaning(item, lang), `${item.numberOfAyahs} ${t.verses}`].filter(Boolean).join(' · ');
                  return (
                    <TouchableOpacity style={[styles.surahCard, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => openSurah(item.number)}>
                      <View style={[styles.surahNum, { backgroundColor: c.primary + '15' }]}>
                        <Text style={[styles.surahNumText, { color: c.primary }]}>{item.number}</Text>
                      </View>
                      <View style={styles.surahBody}>
                        <Text style={[styles.surahNameEn, { color: c.text }]}>{displayName}</Text>
                        <Text style={[styles.surahMeta, { color: c.textSecondary }]}>{displayMeta}</Text>
                      </View>
                      <Text style={[styles.surahNameAr, { color: c.text }]}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
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
                  <TouchableOpacity style={[styles.verseResultCard, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => openSurah(item.surah.number, item.numberInSurah)}>
                    <View style={styles.vrHeader}>
                      <Text style={[styles.vrSurah, { color: c.primary }]}>{lang === 'ar' ? stripSurahWord(item.surah.name) : `${surahTitle(item.surah, lang)} (${item.surah.name})`}</Text>
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
  // Keçid edilən ayənin qızılı halqası (AyahFlash)
  ayahFlash: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 12, borderWidth: 2 },
  toolbarTap: { minHeight: 44, justifyContent: 'center', paddingRight: 8 },
  jumpPanel: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1 },
  jumpLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  jumpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jumpInput: { flex: 1, height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  jumpOf: { fontSize: 14, fontWeight: '500' },
  jumpGo: { minHeight: 44, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  jumpGoText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  jumpHint: { fontSize: 12, marginTop: 6 },
  jumpChip: { minWidth: 44, height: 44, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
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
