import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, I18nManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';

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

const Drawer = createDrawerNavigator();

const MENU_ITEMS = [
  { name: 'Home', iconKey: 'home', labelKey: 'home' },
  { name: 'Quran', iconKey: 'quran', labelKey: 'quran' },
  { name: 'Prayer', iconKey: 'prayer', labelKey: 'prayer' },
  { name: 'Hadith', iconKey: 'hadith', labelKey: 'hadith' },
  { name: 'Duas', iconKey: 'duas', labelKey: 'duas' },
  { name: 'Dhikr', iconKey: 'dhikr', labelKey: 'dhikr' },
  { name: 'Names', iconKey: 'names', labelKey: 'names' },
  { name: 'Zakat', iconKey: 'zakat', labelKey: 'zakat' },
  { name: 'Qibla', iconKey: 'qibla', labelKey: 'qibla' },
  { name: 'Calendar', iconKey: 'calendar', labelKey: 'calendar' },
  { name: 'PrayerGuide', iconKey: 'prayerguide', labelKey: 'prayerguide' },
  { name: 'HajjGuide', iconKey: 'hajjguide', labelKey: 'hajjguide' },
  { name: 'Hifz', iconKey: 'hifz', labelKey: 'hifz' },
  { name: 'Quiz', iconKey: 'quiz', labelKey: 'quiz' },
  { name: 'QuranGame', iconKey: 'qurangame', labelKey: 'qurangame' },
  { name: 'DailyTracker', iconKey: 'dailytracker', labelKey: 'dailytracker' },
  { name: 'Charity', iconKey: 'charity', labelKey: 'charity' },
  { name: 'DuaJournal', iconKey: 'duajournal', labelKey: 'duajournal' },
  { name: 'Quotes', iconKey: 'quotes', labelKey: 'quotes' },
  { name: 'Mosques', iconKey: 'mosques', labelKey: 'mosques' },
  { name: 'HolyPlaces', iconKey: 'holyplaces', labelKey: 'holyplaces' },
  { name: 'History', iconKey: 'history', labelKey: 'history' },
  { name: 'Sahabe', iconKey: 'sahaba', labelKey: 'sahaba' },
  { name: 'Kids', iconKey: 'kids', labelKey: 'kids' },
  { name: 'Glossary', iconKey: 'glossary', labelKey: 'glossary' },
  { name: 'Analytics', iconKey: 'analytics', labelKey: 'analytics' },
  { name: 'About', iconKey: 'about', labelKey: 'about' },
];

const NAV_LABELS = {
  az: { home:'Ana Səhifə', quran:'Quran', hadith:'Hədis', prayer:'Namaz', duas:'Dualar', dhikr:'Zikr', names:'99 Ad', calendar:'Təqvim', zakat:'Zəkat', about:'Haqqında', qibla:'Qibla', prayerguide:'Namaz Dərsliyi', hajjguide:'Həcc Bələdçisi', hifz:'Hifz', quiz:'Viktorina', qurangame:'Quran Oyunu', dailytracker:'Gündəlik İzləyici', charity:'Sədəqə', duajournal:'Dua Jurnalı', quotes:'Sitatlar', mosques:'Məscidlər', holyplaces:'Müqəddəs Yerlər', history:'Tarix', sahaba:'Səhabələr', kids:'Uşaqlar', glossary:'Lüğət', analytics:'Statistika' },
  en: { home:'Home', quran:'Quran', hadith:'Hadith', prayer:'Prayer', duas:"Du'as", dhikr:'Dhikr', names:'99 Names', calendar:'Calendar', zakat:'Zakat', about:'About', qibla:'Qibla', prayerguide:'Prayer Guide', hajjguide:'Hajj Guide', hifz:'Hifz', quiz:'Quiz', qurangame:'Quran Game', dailytracker:'Daily Tracker', charity:'Charity', duajournal:'Dua Journal', quotes:'Quotes', mosques:'Mosques', holyplaces:'Holy Places', history:'History', sahaba:'Companions', kids:'Kids', glossary:'Glossary', analytics:'Analytics' },
  ru: { home:'Главная', quran:'Коран', hadith:'Хадисы', prayer:'Намаз', duas:'Дуа', dhikr:'Зикр', names:'99 Имён', calendar:'Календарь', zakat:'Закят', about:'О нас', qibla:'Кибла', prayerguide:'Намаз Гид', hajjguide:'Хадж Гид', hifz:'Хифз', quiz:'Викторина', qurangame:'Коран Игра', dailytracker:'Трекер', charity:'Садака', duajournal:'Журнал Дуа', quotes:'Цитаты', mosques:'Мечети', holyplaces:'Святые Места', history:'История', sahaba:'Сахабы', kids:'Детям', glossary:'Глоссарий', analytics:'Статистика' },
  ar: { home:'الرئيسية', quran:'القرآن', hadith:'الحديث', prayer:'الصلاة', duas:'الأدعية', dhikr:'الذكر', names:'٩٩ اسم', calendar:'التقويم', zakat:'الزكاة', about:'عن الموقع', qibla:'القبلة', prayerguide:'دليل الصلاة', hajjguide:'دليل الحج', hifz:'الحفظ', quiz:'اختبار', qurangame:'لعبة القرآن', dailytracker:'المتابعة', charity:'الصدقة', duajournal:'دفتر الدعاء', quotes:'اقتباسات', mosques:'المساجد', holyplaces:'الأماكن المقدسة', history:'التاريخ', sahaba:'الصحابة', kids:'الأطفال', glossary:'المعجم', analytics:'الإحصائيات' },
  tr: { home:'Ana Sayfa', quran:"Kur'an", hadith:'Hadis', prayer:'Namaz', duas:'Dualar', dhikr:'Zikir', names:'99 İsim', calendar:'Takvim', zakat:'Zekât', about:'Hakkımızda', qibla:'Kıble', prayerguide:'Namaz Rehberi', hajjguide:'Hac Rehberi', hifz:'Hıfz', quiz:'Sınav', qurangame:'Kuran Oyunu', dailytracker:'Günlük Takip', charity:'Sadaka', duajournal:'Dua Günlüğü', quotes:'Alıntılar', mosques:'Camiler', holyplaces:'Kutsal Yerler', history:'Tarih', sahaba:'Sahabeler', kids:'Çocuklar', glossary:'Sözlük', analytics:'İstatistik' },
};

function CustomDrawerContent({ navigation, state }) {
  const { lang, setLang, dark, toggleDark, LANGS } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const labels = NAV_LABELS[lang] || NAV_LABELS.az;
  const activeRoute = state.routes[state.index]?.name;

  return (
    <View style={[styles.drawer, { backgroundColor: c.surface }]}>
      <LinearGradient
        colors={dark ? [c.ctaGradStart, c.ctaGradMid] : [c.primaryDark, c.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.drawerHeader}
      >
        <Text style={styles.drawerLogo}>☽ Muslim.cc</Text>
        <Text style={styles.drawerSub}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
      </LinearGradient>

      <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map(item => {
          const isActive = activeRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.drawerItem,
                isActive && { backgroundColor: c.primaryBg2, borderLeftWidth: 3, borderLeftColor: c.primary }
              ]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <View style={styles.drawerIconWrap}>
                <AppIcon name={item.iconKey} size={20} color={isActive ? c.primary : c.textSecondary} />
              </View>
              <Text style={[styles.drawerLabel, { color: isActive ? c.primary : c.text, fontWeight: isActive ? '700' : '500' }]}>
                {labels[item.labelKey] || item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.drawerFooter, { borderTopColor: c.border }]}>
        <View style={styles.langRow}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l}
              style={[styles.langBtn, lang === l && { backgroundColor: c.primary }]}
              onPress={() => setLang(l)}
            >
              <Text style={[styles.langText, lang === l && { color: '#fff' }]}>
                {l.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.darkRow}>
          <Text style={[styles.darkLabel, { color: c.textSecondary }]}>
            {dark ? '🌙' : '☀️'} {lang === 'az' ? 'Qaranlıq rejim' : lang === 'ru' ? 'Тёмная тема' : lang === 'ar' ? 'الوضع الداكن' : lang === 'tr' ? 'Karanlık mod' : 'Dark Mode'}
          </Text>
          <Switch
            value={dark}
            onValueChange={toggleDark}
            trackColor={{ false: '#ccc', true: c.primary }}
            thumbColor={dark ? c.gold : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
}

function ScreenWithTitle({ name, component, labelKey }) {
  return { name, component, labelKey };
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
  { name: 'About', component: AboutScreen, labelKey: 'about' },
];

export default function AppNavigator() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const labels = NAV_LABELS[lang] || NAV_LABELS.az;

  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: c.headerBg,
            elevation: 4,
            shadowColor: '#1a6b3a',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          headerTintColor: c.headerText,
          headerTitleStyle: { fontWeight: '700', fontSize: 18, letterSpacing: -0.3 },
          drawerType: 'front',
          swipeEnabled: true,
        }}
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
  drawerHeader: {
    paddingTop: 55,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  drawerLogo: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  drawerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  drawerScroll: { flex: 1 },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  drawerIconWrap: { width: 28, alignItems: 'center', marginRight: 14 },
  drawerLabel: { fontSize: 15, fontWeight: '500' },
  drawerFooter: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#eee',
  },
  langText: { fontSize: 12, fontWeight: '700', color: '#555' },
  darkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  darkLabel: { fontSize: 14 },
});
