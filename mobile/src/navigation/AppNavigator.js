import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import { FadeUp, Float, Rotate } from '../components/Animated';

import HomeScreen from '../screens/HomeScreen';
import QuranScreen from '../screens/QuranScreen';
import PrayerScreen from '../screens/PrayerScreen';
import HadithScreen from '../screens/HadithScreen';
import DuasScreen from '../screens/DuasScreen';
import DhikrScreen from '../screens/DhikrScreen';
import NamesScreen from '../screens/NamesScreen';
import ZakatScreen from '../screens/ZakatScreen';
import QiblaScreen from '../screens/QiblaScreen';
import CalendarScreen from '../screens/CalendarScreen';
import QuizScreen from '../screens/QuizScreen';
import GlossaryScreen from '../screens/GlossaryScreen';
import PrayerGuideScreen from '../screens/PrayerGuideScreen';
import HifzScreen from '../screens/HifzScreen';
import KidsScreen from '../screens/KidsScreen';
import HolyPlacesScreen from '../screens/HolyPlacesScreen';
import DailyTrackerScreen from '../screens/DailyTrackerScreen';
import QuranGameScreen from '../screens/QuranGameScreen';
import CharityScreen from '../screens/CharityScreen';
import HajjGuideScreen from '../screens/HajjGuideScreen';
import QuoteGeneratorScreen from '../screens/QuoteGeneratorScreen';
import DuaJournalScreen from '../screens/DuaJournalScreen';
import MosqueFinderScreen from '../screens/MosqueFinderScreen';
import IslamicHistoryScreen from '../screens/IslamicHistoryScreen';
import SahabeScreen from '../screens/SahabeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AboutScreen from '../screens/AboutScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const { width: SW } = Dimensions.get('window');
const Drawer = createDrawerNavigator();

// ═══ MENU — kateqoriyalara bölünmüş, gradient rəngli ikonlar ═══
const MENU_GROUPS = [
  {
    categoryKey: 'main',
    items: [
      { name: 'Home', iconKey: 'home', labelKey: 'home', gradient: ['#10b981','#059669'] },
    ],
  },
  {
    categoryKey: 'worship',
    items: [
      { name: 'Quran', iconKey: 'quran', labelKey: 'quran', gradient: ['#10b981','#059669'] },
      { name: 'Prayer', iconKey: 'prayer', labelKey: 'prayer', gradient: ['#3b82f6','#2563eb'] },
      { name: 'Duas', iconKey: 'duas', labelKey: 'duas', gradient: ['#8b5cf6','#7c3aed'] },
      { name: 'Dhikr', iconKey: 'dhikr', labelKey: 'dhikr', gradient: ['#06b6d4','#0891b2'] },
      { name: 'Qibla', iconKey: 'qibla', labelKey: 'qibla', gradient: ['#ec4899','#db2777'] },
      { name: 'PrayerGuide', iconKey: 'prayerguide', labelKey: 'prayerguide', gradient: ['#f59e0b','#d97706'] },
      { name: 'HajjGuide', iconKey: 'hajjguide', labelKey: 'hajjguide', gradient: ['#ef4444','#dc2626'] },
    ],
  },
  {
    categoryKey: 'knowledge',
    items: [
      { name: 'Hadith', iconKey: 'hadith', labelKey: 'hadith', gradient: ['#f59e0b','#d97706'] },
      { name: 'Names', iconKey: 'names', labelKey: 'names', gradient: ['#f97316','#ea580c'] },
      { name: 'History', iconKey: 'history', labelKey: 'history', gradient: ['#6366f1','#4f46e5'] },
      { name: 'Sahabe', iconKey: 'sahaba', labelKey: 'sahaba', gradient: ['#14b8a6','#0d9488'] },
      { name: 'HolyPlaces', iconKey: 'holyplaces', labelKey: 'holyplaces', gradient: ['#a855f7','#9333ea'] },
      { name: 'Glossary', iconKey: 'glossary', labelKey: 'glossary', gradient: ['#64748b','#475569'] },
      { name: 'Kids', iconKey: 'kids', labelKey: 'kids', gradient: ['#ec4899','#db2777'] },
    ],
  },
  {
    categoryKey: 'tools',
    items: [
      { name: 'Calendar', iconKey: 'calendar', labelKey: 'calendar', gradient: ['#8b5cf6','#7c3aed'] },
      { name: 'Zakat', iconKey: 'zakat', labelKey: 'zakat', gradient: ['#f59e0b','#d97706'] },
      { name: 'DailyTracker', iconKey: 'dailytracker', labelKey: 'dailytracker', gradient: ['#10b981','#059669'] },
      { name: 'Hifz', iconKey: 'hifz', labelKey: 'hifz', gradient: ['#06b6d4','#0891b2'] },
      { name: 'Charity', iconKey: 'charity', labelKey: 'charity', gradient: ['#f97316','#ea580c'] },
      { name: 'DuaJournal', iconKey: 'duajournal', labelKey: 'duajournal', gradient: ['#a855f7','#9333ea'] },
      { name: 'Mosques', iconKey: 'mosques', labelKey: 'mosques', gradient: ['#14b8a6','#0d9488'] },
      { name: 'Analytics', iconKey: 'analytics', labelKey: 'analytics', gradient: ['#84cc16','#65a30d'] },
    ],
  },
  {
    categoryKey: 'games',
    items: [
      { name: 'Quiz', iconKey: 'quiz', labelKey: 'quiz', gradient: ['#ec4899','#db2777'] },
      { name: 'QuranGame', iconKey: 'qurangame', labelKey: 'qurangame', gradient: ['#10b981','#059669'] },
      { name: 'Quotes', iconKey: 'quotes', labelKey: 'quotes', gradient: ['#6366f1','#4f46e5'] },
    ],
  },
  {
    categoryKey: 'settings',
    items: [
      { name: 'Notifications', iconKey: 'settings', labelKey: 'notifications', gradient: ['#f59e0b','#d97706'] },
      { name: 'About', iconKey: 'about', labelKey: 'about', gradient: ['#64748b','#475569'] },
    ],
  },
];

const CATEGORY_LABELS = {
  az: { main:'Ana', worship:'İbadət', knowledge:'Bilik', tools:'Alətlər', games:'Əyləncə', settings:'Parametrlər' },
  en: { main:'Main', worship:'Worship', knowledge:'Knowledge', tools:'Tools', games:'Fun', settings:'Settings' },
  ru: { main:'Главное', worship:'Поклонение', knowledge:'Знание', tools:'Инструменты', games:'Развлечения', settings:'Настройки' },
  ar: { main:'الرئيسية', worship:'العبادة', knowledge:'المعرفة', tools:'الأدوات', games:'الترفيه', settings:'الإعدادات' },
  tr: { main:'Ana', worship:'İbadet', knowledge:'Bilgi', tools:'Araçlar', games:'Eğlence', settings:'Ayarlar' },
};

const NAV_LABELS = {
  az: { home:'Ana Səhifə', quran:'Quran', hadith:'Hədis', prayer:'Namaz', duas:'Dualar', dhikr:'Zikr', names:'99 Ad', calendar:'Təqvim', zakat:'Zəkat', about:'Haqqında', qibla:'Qibla', prayerguide:'Namaz Dərsliyi', hajjguide:'Həcc Bələdçisi', hifz:'Hifz', quiz:'Viktorina', qurangame:'Quran Oyunu', dailytracker:'Gündəlik İzləyici', charity:'Sədəqə', duajournal:'Dua Jurnalı', quotes:'Sitatlar', mosques:'Məscidlər', holyplaces:'Müqəddəs Yerlər', history:'Tarix', sahaba:'Səhabələr', kids:'Uşaqlar', glossary:'Lüğət', analytics:'Statistika', notifications:'Bildirişlər' },
  en: { home:'Home', quran:'Quran', hadith:'Hadith', prayer:'Prayer', duas:"Du'as", dhikr:'Dhikr', names:'99 Names', calendar:'Calendar', zakat:'Zakat', about:'About', qibla:'Qibla', prayerguide:'Prayer Guide', hajjguide:'Hajj Guide', hifz:'Hifz', quiz:'Quiz', qurangame:'Quran Game', dailytracker:'Daily Tracker', charity:'Charity', duajournal:'Dua Journal', quotes:'Quotes', mosques:'Mosques', holyplaces:'Holy Places', history:'History', sahaba:'Companions', kids:'Kids', glossary:'Glossary', analytics:'Analytics', notifications:'Notifications' },
  ru: { home:'Главная', quran:'Коран', hadith:'Хадисы', prayer:'Намаз', duas:'Дуа', dhikr:'Зикр', names:'99 Имён', calendar:'Календарь', zakat:'Закят', about:'О нас', qibla:'Кибла', prayerguide:'Намаз Гид', hajjguide:'Хадж Гид', hifz:'Хифз', quiz:'Викторина', qurangame:'Коран Игра', dailytracker:'Трекер', charity:'Садака', duajournal:'Журнал Дуа', quotes:'Цитаты', mosques:'Мечети', holyplaces:'Святые Места', history:'История', sahaba:'Сахабы', kids:'Детям', glossary:'Глоссарий', analytics:'Статистика', notifications:'Уведомления' },
  ar: { home:'الرئيسية', quran:'القرآن', hadith:'الحديث', prayer:'الصلاة', duas:'الأدعية', dhikr:'الذكر', names:'٩٩ اسم', calendar:'التقويم', zakat:'الزكاة', about:'عن الموقع', qibla:'القبلة', prayerguide:'دليل الصلاة', hajjguide:'دليل الحج', hifz:'الحفظ', quiz:'اختبار', qurangame:'لعبة القرآن', dailytracker:'المتابعة', charity:'الصدقة', duajournal:'دفتر الدعاء', quotes:'اقتباسات', mosques:'المساجد', holyplaces:'الأماكن المقدسة', history:'التاريخ', sahaba:'الصحابة', kids:'الأطفال', glossary:'المعجم', analytics:'الإحصائيات', notifications:'الإشعارات' },
  tr: { home:'Ana Sayfa', quran:"Kur'an", hadith:'Hadis', prayer:'Namaz', duas:'Dualar', dhikr:'Zikir', names:'99 İsim', calendar:'Takvim', zakat:'Zekât', about:'Hakkımızda', qibla:'Kıble', prayerguide:'Namaz Rehberi', hajjguide:'Hac Rehberi', hifz:'Hıfz', quiz:'Sınav', qurangame:'Kuran Oyunu', dailytracker:'Günlük Takip', charity:'Sadaka', duajournal:'Dua Günlüğü', quotes:'Alıntılar', mosques:'Camiler', holyplaces:'Kutsal Yerler', history:'Tarih', sahaba:'Sahabeler', kids:'Çocuklar', glossary:'Sözlük', analytics:'İstatistik', notifications:'Bildirimler' },
};

const SEARCH_PLACEHOLDERS = {
  az:'Axtar...', en:'Search...', ru:'Поиск...', ar:'...بحث', tr:'Ara...',
};

// ═══ Animated Drawer Item ═══
function DrawerItem({ item, isActive, onPress, label, delay, c }) {
  const scale = useRef(new Animated.Value(1)).current;
  const itemOpacity = useRef(new Animated.Value(0)).current;
  const itemTranslate = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(itemOpacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(itemTranslate, { toValue: 0, delay, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.96, friction: 10, tension: 150, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ opacity: itemOpacity, transform: [{ translateX: itemTranslate }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <Animated.View style={[
          styles.drawerItem,
          { backgroundColor: isActive ? c.primaryBg2 : 'transparent', transform: [{ scale }] },
        ]}>
          {isActive && <View style={[styles.activeBar, { backgroundColor: c.primary }]} />}

          {/* Gradient icon badge */}
          {isActive ? (
            <LinearGradient colors={item.gradient} style={styles.drawerIconWrap}>
              <AppIcon name={item.iconKey} size={18} color="#fff" />
            </LinearGradient>
          ) : (
            <View style={[styles.drawerIconWrap, { backgroundColor: c.primaryBg }]}>
              <AppIcon name={item.iconKey} size={18} color={c.textSecondary} />
            </View>
          )}

          <Text style={[styles.drawerLabel, { color: isActive ? c.primary : c.text, fontWeight: isActive ? '700' : '500' }]}>
            {label}
          </Text>

          {isActive && (
            <View style={[styles.activeIndicator, { backgroundColor: c.primary }]}>
              <AppIcon name="chevronRight" size={12} color="#fff" />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══ Custom Drawer Content ═══
function CustomDrawerContent({ navigation, state }) {
  const { lang, setLang, dark, toggleDark, LANGS } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const labels = NAV_LABELS[lang] || NAV_LABELS.az;
  const catLabels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.az;
  const activeRoute = state.routes[state.index]?.name;
  const [search, setSearch] = useState('');

  // Filter items based on search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return MENU_GROUPS;
    const q = search.toLowerCase();
    return MENU_GROUPS.map(g => ({
      ...g,
      items: g.items.filter(i => (labels[i.labelKey] || '').toLowerCase().includes(q)),
    })).filter(g => g.items.length > 0);
  }, [search, labels]);

  let itemIndex = 0;

  return (
    <View style={[styles.drawer, { backgroundColor: c.background }]}>

      {/* ═══ HEADER — Gradient with rotating ring ═══ */}
      <LinearGradient
        colors={dark ? [c.ctaGradStart, c.ctaGradMid, c.ctaGradEnd] : [c.primaryDark, c.primary, c.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.drawerHeader}
      >
        {/* Rotating decorative ring */}
        <Rotate duration={30000} style={styles.rotatingRing}>
          <View style={styles.rotatingRingInner} />
        </Rotate>

        {/* Logo badge */}
        <Float distance={4}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>☽</Text>
          </View>
        </Float>

        <Text style={styles.drawerLogo}>Muslim.cc</Text>
        <View style={styles.drawerSubBadge}>
          <Text style={styles.drawerSub}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        </View>

        {/* Stats row */}
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>27</Text>
            <Text style={styles.headerStatLabel}>
              {lang==='az'?'Xidmət':lang==='ru'?'Сервисов':lang==='ar'?'خدمة':lang==='tr'?'Hizmet':'Services'}
            </Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>5</Text>
            <Text style={styles.headerStatLabel}>
              {lang==='az'?'Dil':lang==='ru'?'Языков':lang==='ar'?'لغات':lang==='tr'?'Dil':'Languages'}
            </Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>∞</Text>
            <Text style={styles.headerStatLabel}>
              {lang==='az'?'Pulsuz':lang==='ru'?'Бесплатно':lang==='ar'?'مجاني':lang==='tr'?'Ücretsiz':'Free'}
            </Text>
          </View>
        </View>

        {/* Decorative circles */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
      </LinearGradient>

      {/* ═══ SEARCH BAR ═══ */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.cardBorder }, dark ? Shadows.dark.sm : Shadows.sm]}>
          <AppIcon name="search" size={16} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder={SEARCH_PLACEHOLDERS[lang] || SEARCH_PLACEHOLDERS.az}
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <AppIcon name="close" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ═══ MENU ═══ */}
      <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {filteredGroups.map((group, gi) => (
          <View key={group.categoryKey} style={styles.categoryWrap}>
            <Text style={[styles.categoryTitle, { color: c.textMuted }]}>
              {catLabels[group.categoryKey]}
            </Text>
            {group.items.map(item => {
              const isActive = activeRoute === item.name;
              const delay = (itemIndex++) * 30;
              return (
                <DrawerItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  label={labels[item.labelKey] || item.name}
                  onPress={() => navigation.navigate(item.name)}
                  delay={delay}
                  c={c}
                />
              );
            })}
          </View>
        ))}

        {filteredGroups.length === 0 && (
          <View style={styles.emptySearch}>
            <AppIcon name="search" size={32} color={c.textMuted} />
            <Text style={[styles.emptySearchText, { color: c.textMuted }]}>
              {lang==='az'?'Tapılmadı':lang==='ru'?'Не найдено':lang==='ar'?'لم يتم العثور':lang==='tr'?'Bulunamadı':'Not found'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ═══ FOOTER ═══ */}
      <View style={[styles.drawerFooter, { backgroundColor: c.card, borderTopColor: c.border }]}>
        {/* Language picker */}
        <Text style={[styles.footerLabel, { color: c.textMuted }]}>
          {lang==='az'?'Dil':lang==='ru'?'Язык':lang==='ar'?'اللغة':lang==='tr'?'Dil':'Language'}
        </Text>
        <View style={styles.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l}
              style={[styles.langBtn, lang === l ? { backgroundColor: c.primary } : { backgroundColor: c.surfaceAlt }]}
              onPress={() => {
                Haptics.selectionAsync();
                setLang(l);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.langText, { color: lang === l ? '#fff' : c.textSecondary }]}>
                {l.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dark mode toggle */}
        <View style={[styles.darkRow, { backgroundColor: c.surfaceAlt }]}>
          <View style={styles.darkRowLeft}>
            <View style={[styles.darkIconWrap, { backgroundColor: dark ? c.primaryBg : '#ffeaa7' }]}>
              <AppIcon name={dark ? 'moon' : 'sun'} size={16} color={dark ? c.primary : '#f59e0b'} />
            </View>
            <Text style={[styles.darkLabel, { color: c.text }]}>
              {dark
                ? (lang==='az'?'Qaranlıq rejim':lang==='ru'?'Тёмная тема':lang==='ar'?'الوضع الداكن':lang==='tr'?'Karanlık mod':'Dark Mode')
                : (lang==='az'?'İşıqlı rejim':lang==='ru'?'Светлая тема':lang==='ar'?'الوضع الفاتح':lang==='tr'?'Aydınlık mod':'Light Mode')}
            </Text>
          </View>
          <Switch
            value={dark}
            onValueChange={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleDark();
            }}
            trackColor={{ false: '#e5e7eb', true: c.primary }}
            thumbColor="#fff"
            ios_backgroundColor="#e5e7eb"
          />
        </View>

        <Text style={[styles.versionText, { color: c.textMuted }]}>v1.0.0 · muslim.cc</Text>
      </View>
    </View>
  );
}

const SCREENS = [
  { name: 'Home', component: HomeScreen, labelKey: 'home', fixedTitle: '☽ Muslim.cc' },
  { name: 'Quran', component: QuranScreen, labelKey: 'quran' },
  { name: 'Prayer', component: PrayerScreen, labelKey: 'prayer' },
  { name: 'Hadith', component: HadithScreen, labelKey: 'hadith' },
  { name: 'Duas', component: DuasScreen, labelKey: 'duas' },
  { name: 'Dhikr', component: DhikrScreen, labelKey: 'dhikr' },
  { name: 'Names', component: NamesScreen, labelKey: 'names' },
  { name: 'Zakat', component: ZakatScreen, labelKey: 'zakat' },
  { name: 'Qibla', component: QiblaScreen, labelKey: 'qibla' },
  { name: 'Calendar', component: CalendarScreen, labelKey: 'calendar' },
  { name: 'PrayerGuide', component: PrayerGuideScreen, labelKey: 'prayerguide' },
  { name: 'HajjGuide', component: HajjGuideScreen, labelKey: 'hajjguide' },
  { name: 'Hifz', component: HifzScreen, labelKey: 'hifz' },
  { name: 'Quiz', component: QuizScreen, labelKey: 'quiz' },
  { name: 'QuranGame', component: QuranGameScreen, labelKey: 'qurangame' },
  { name: 'DailyTracker', component: DailyTrackerScreen, labelKey: 'dailytracker' },
  { name: 'Charity', component: CharityScreen, labelKey: 'charity' },
  { name: 'DuaJournal', component: DuaJournalScreen, labelKey: 'duajournal' },
  { name: 'Quotes', component: QuoteGeneratorScreen, labelKey: 'quotes' },
  { name: 'Mosques', component: MosqueFinderScreen, labelKey: 'mosques' },
  { name: 'HolyPlaces', component: HolyPlacesScreen, labelKey: 'holyplaces' },
  { name: 'History', component: IslamicHistoryScreen, labelKey: 'history' },
  { name: 'Sahabe', component: SahabeScreen, labelKey: 'sahaba' },
  { name: 'Kids', component: KidsScreen, labelKey: 'kids' },
  { name: 'Glossary', component: GlossaryScreen, labelKey: 'glossary' },
  { name: 'Analytics', component: AnalyticsScreen, labelKey: 'analytics' },
  { name: 'Notifications', component: NotificationsScreen, labelKey: 'notifications' },
  { name: 'About', component: AboutScreen, labelKey: 'about' },
];

// Custom hamburger button with animation
function HamburgerButton({ navigation, color }) {
  const rotate = useRef(new Animated.Value(0)).current;

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(rotate, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
    navigation.toggleDrawer();
  };

  const rotation = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <TouchableOpacity onPress={open} style={styles.hamburger} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <View style={[styles.hamburgerLine, { backgroundColor: color, width: 22 }]} />
        <View style={[styles.hamburgerLine, { backgroundColor: color, width: 18, marginTop: 5 }]} />
        <View style={[styles.hamburgerLine, { backgroundColor: color, width: 22, marginTop: 5 }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AppNavigator() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const labels = NAV_LABELS[lang] || NAV_LABELS.az;

  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: c.headerBg,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: c.headerText,
          headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: -0.3 },
          headerLeft: () => <HamburgerButton navigation={navigation} color={c.headerText} />,
          drawerType: 'front',
          swipeEnabled: true,
          drawerStyle: {
            width: SW * 0.85,
            backgroundColor: 'transparent',
          },
          overlayColor: 'rgba(0,0,0,0.6)',
        })}
      >
        {SCREENS.map(screen => (
          <Drawer.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
            options={{ title: screen.fixedTitle || labels[screen.labelKey] || screen.name }}
          />
        ))}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawer: { flex: 1 },

  // Header
  drawerHeader: {
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  rotatingRing: {
    position: 'absolute',
    width: 350,
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.1,
  },
  rotatingRingInner: {
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoIcon: { fontSize: 32, color: '#fff' },
  drawerLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  drawerSubBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  drawerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 12,
  },
  headerStat: { alignItems: 'center', flex: 1 },
  headerStatNum: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '600' },
  headerStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -70,
    right: -60,
  },
  headerCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -40,
    left: -40,
  },

  // Search
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, height: 42 },

  // Menu
  drawerScroll: { flex: 1 },
  categoryWrap: { marginTop: 10 },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    marginBottom: 4,
  },

  // Drawer item
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: BorderRadius.md,
    position: 'relative',
    overflow: 'hidden',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  drawerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  drawerLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
    flex: 1,
  },
  activeIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty search
  emptySearch: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptySearchText: { fontSize: 14, marginTop: 10 },

  // Footer
  drawerFooter: {
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  langRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  langText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  darkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 10,
  },
  darkRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  darkIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkLabel: { fontSize: 13, fontWeight: '600' },
  versionText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Hamburger button
  hamburger: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  hamburgerLine: {
    height: 2.5,
    borderRadius: 2,
  },
});
