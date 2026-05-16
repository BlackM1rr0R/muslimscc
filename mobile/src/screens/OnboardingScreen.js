import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, StatusBar, FlatList, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import { FadeUp, FadeIn, ScaleIn, Float, Rotate, Pulse, Glow, BreathingDot, Confetti } from '../components/Animated';

const { width: SW, height: SH } = Dimensions.get('window');

const SLIDES = [
  {
    iconKey:'crescent', emoji:'☽',
    gradient:['#0d4a27','#1a6b3a','#22874a'],
    accentColor:'#10b981',
    title:{
      az:'Muslims.cc-ə Xoş Gəldiniz',
      en:'Welcome to Muslims.cc',
      ru:'Добро пожаловать в Muslims.cc',
      ar:'مرحباً بكم في Muslims.cc',
      tr:'Muslims.cc\'ye Hoş Geldiniz',
    },
    desc:{
      az:'Tam İslami rəqəmsal ev. Quran, hədis, namaz vaxtları və daha çoxu bir yerdə.',
      en:'Your complete Islamic digital home. Quran, Hadith, prayer times and much more in one place.',
      ru:'Ваш полный исламский дом. Коран, хадисы, намаз и многое другое.',
      ar:'بيتك الإسلامي الرقمي الكامل. القرآن والحديث ومواقيت الصلاة.',
      tr:'Tam İslami dijital eviniz. Kuran, hadis, namaz vakitleri ve daha fazlası.',
    },
  },
  {
    iconKey:'quran', emoji:'📖',
    gradient:['#1e3a8a','#3b82f6','#60a5fa'],
    accentColor:'#3b82f6',
    title:{
      az:'Qurani-Kərim',
      en:'The Holy Quran',
      ru:'Священный Коран',
      ar:'القرآن الكريم',
      tr:'Kur\'an-ı Kerim',
    },
    desc:{
      az:'114 surə, səsli tilavət, 5 dildə tərcümə və təfsir. İstədiyiniz vaxt oxuyun.',
      en:'114 surahs, audio recitation, translation and tafsir in 5 languages. Read anytime.',
      ru:'114 сур, аудио чтение, перевод на 5 языках. Читайте в любое время.',
      ar:'١١٤ سورة، تلاوة صوتية، ترجمة بـ٥ لغات. اقرأ في أي وقت.',
      tr:'114 sure, sesli tilavet, 5 dilde çeviri. İstediğiniz zaman okuyun.',
    },
  },
  {
    iconKey:'prayer', emoji:'🕌',
    gradient:['#7c2d12','#ea580c','#f97316'],
    accentColor:'#f97316',
    title:{
      az:'Namaz Vaxtları',
      en:'Prayer Times',
      ru:'Время Намаза',
      ar:'مواقيت الصلاة',
      tr:'Namaz Vakitleri',
    },
    desc:{
      az:'Real vaxtlı namaz cədvəli, qibla istiqaməti, geri sayım və yada salma.',
      en:'Real-time prayer schedule, qibla direction, countdown and reminders.',
      ru:'Актуальное расписание намаза, кибла, обратный отсчёт и напоминания.',
      ar:'جدول الصلاة الفعلي، اتجاه القبلة، العد التنازلي والتذكيرات.',
      tr:'Gerçek zamanlı namaz takvimi, kıble yönü, geri sayım ve hatırlatmalar.',
    },
  },
  {
    iconKey:'duas', emoji:'🤲',
    gradient:['#4c1d95','#7c3aed','#a855f7'],
    accentColor:'#a855f7',
    title:{
      az:'Dualar və Zikr',
      en:'Du\'as and Dhikr',
      ru:'Дуа и Зикр',
      ar:'الأدعية والذكر',
      tr:'Dualar ve Zikir',
    },
    desc:{
      az:'100+ səhih dua, rəqəmsal təsbeh, gündəlik tracker və statistika.',
      en:'100+ authentic duas, digital tasbih, daily tracker and statistics.',
      ru:'100+ аутентичных дуа, цифровой тасбих, ежедневный трекер.',
      ar:'١٠٠+ دعاء صحيح، مسبحة رقمية، متابعة يومية وإحصائيات.',
      tr:'100+ sahih dua, dijital tespih, günlük takip ve istatistikler.',
    },
  },
  {
    iconKey:'settings', emoji:'🌍',
    gradient:['#0c4a6e','#0891b2','#06b6d4'],
    accentColor:'#06b6d4',
    title:{
      az:'5 Dildə Mövcuddur',
      en:'Available in 5 Languages',
      ru:'Доступно на 5 языках',
      ar:'متاح بـ ٥ لغات',
      tr:'5 Dilde Mevcut',
    },
    desc:{
      az:'Azərbaycan, İngilis, Rus, Ərəb və Türk dillərində tam dəstək.',
      en:'Full support in Azerbaijani, English, Russian, Arabic and Turkish.',
      ru:'Полная поддержка азербайджанского, английского, русского, арабского и турецкого.',
      ar:'دعم كامل للأذربيجانية والإنجليزية والروسية والعربية والتركية.',
      tr:'Azerice, İngilizce, Rusça, Arapça ve Türkçe tam destek.',
    },
    showLangs: true,
  },
];

const BUTTONS = {
  az: { next:'Növbəti', skip:'Keç', start:'Başlayaq', langChoose:'Dilinizi seçin', getStarted:'İndi Başla' },
  en: { next:'Next', skip:'Skip', start:'Get Started', langChoose:'Choose your language', getStarted:'Start Now' },
  ru: { next:'Далее', skip:'Пропустить', start:'Начать', langChoose:'Выберите язык', getStarted:'Начать сейчас' },
  ar: { next:'التالي', skip:'تخطي', start:'ابدأ', langChoose:'اختر لغتك', getStarted:'ابدأ الآن' },
  tr: { next:'Sonraki', skip:'Atla', start:'Başlayalım', langChoose:'Dilinizi seçin', getStarted:'Hemen Başla' },
};

const LANG_LABELS = [
  { code:'az', name:'Azərbaycan', flag:'🇦🇿' },
  { code:'en', name:'English', flag:'🇬🇧' },
  { code:'ru', name:'Русский', flag:'🇷🇺' },
  { code:'ar', name:'العربية', flag:'🇸🇦' },
  { code:'tr', name:'Türkçe', flag:'🇹🇷' },
];

// ═══ ANIMATED PARTICLES (background) ═══
function FloatingParticles({ color = '#fff', count = 20 }) {
  const particles = useRef(
    Array.from({ length: count }).map(() => ({
      x: Math.random() * SW,
      y: Math.random() * SH,
      size: 2 + Math.random() * 4,
      duration: 4000 + Math.random() * 6000,
      delay: Math.random() * 2000,
      anim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.anim, {
            toValue: 1,
            duration: p.duration,
            delay: p.delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: p.duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
        const opacity = p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.9, 0.2] });
        const scale = p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.2, 0.5] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: color,
              opacity,
              transform: [{ translateY }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}

// ═══ SLIDE COMPONENT with 3D effects ═══
function Slide({ item, index, scrollX, lang, setLang, b }) {
  // Input range for scroll-based animations
  const inputRange = [(index - 1) * SW, index * SW, (index + 1) * SW];

  // 3D icon effects
  const iconRotateY = scrollX.interpolate({
    inputRange,
    outputRange: ['60deg', '0deg', '-60deg'],
    extrapolate: 'clamp',
  });
  const iconScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.3, 1, 0.3],
    extrapolate: 'clamp',
  });
  const iconOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  // Title parallax
  const titleTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [SW * 0.5, 0, -SW * 0.5],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  // Description parallax (slower)
  const descTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [SW * 0.3, 0, -SW * 0.3],
    extrapolate: 'clamp',
  });

  // Background rotation effect (very slow)
  const bgRotate = scrollX.interpolate({
    inputRange,
    outputRange: ['15deg', '0deg', '-15deg'],
    extrapolate: 'clamp',
  });

  return (
    <LinearGradient
      colors={item.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.slide}
    >
      {/* Rotating background ring */}
      <Rotate duration={30000} style={styles.rotatingRing}>
        <View style={[styles.rotatingRingInner, { borderColor: 'rgba(255,255,255,0.12)' }]} />
      </Rotate>
      <Rotate duration={45000} style={styles.rotatingRing2}>
        <View style={[styles.rotatingRingInner2, { borderColor: 'rgba(255,255,255,0.08)' }]} />
      </Rotate>

      {/* Floating particles */}
      <FloatingParticles color="#ffffff" count={25} />

      {/* Decorative circles */}
      <Animated.View style={[styles.slideCircle1, { transform: [{ rotate: bgRotate }] }]} />
      <Animated.View style={[styles.slideCircle2, { transform: [{ rotate: bgRotate }] }]} />
      <Animated.View style={[styles.slideCircle3, { transform: [{ rotate: bgRotate }] }]} />

      <View style={styles.slideContent}>
        {/* 3D Rotating icon with perspective */}
        <Animated.View
          style={{
            opacity: iconOpacity,
            transform: [
              { perspective: 1000 },
              { rotateY: iconRotateY },
              { scale: iconScale },
            ],
            marginBottom: 40,
          }}
        >
          <Float distance={10}>
            <Glow color="#fff" style={styles.iconGlow}>
              <View style={styles.iconBadgeOuter}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconBadgeInner}
                >
                  <Text style={styles.iconEmoji}>{item.emoji}</Text>
                </LinearGradient>
              </View>
            </Glow>
          </Float>
        </Animated.View>

        {/* Title with parallax */}
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateX: titleTranslate }], width: '100%' }}>
          <Text style={styles.slideTitle}>{item.title[lang] || item.title.en}</Text>
        </Animated.View>

        {/* Description with different parallax */}
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateX: descTranslate }], width: '100%' }}>
          <Text style={styles.slideDesc}>{item.desc[lang] || item.desc.en}</Text>
        </Animated.View>

        {/* Language chooser (last slide) */}
        {item.showLangs && (
          <Animated.View style={{ opacity: titleOpacity, width: '100%', marginTop: 32 }}>
            <Text style={styles.langChooseLabel}>{b.langChoose}</Text>
            <View style={styles.langsRow}>
              {LANG_LABELS.map((L, li) => {
                const active = lang === L.code;
                return (
                  <TouchableOpacity
                    key={L.code}
                    style={[
                      styles.langBtn,
                      active && { backgroundColor: '#fff', borderColor: '#fff' },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLang(L.code);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.langFlag}>{L.flag}</Text>
                    <Text style={[styles.langName, active && { color: item.gradient[1] }]}>{L.name}</Text>
                    {active && <BreathingDot color={item.gradient[1]} size={8} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
}

export default function OnboardingScreen({ onFinish }) {
  const { lang, setLang } = useLang();
  const [pageIdx, setPageIdx] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const b = BUTTONS[lang] || BUTTONS.az;

  // Pulse button
  const btnPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const goToNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (pageIdx < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: pageIdx + 1, animated: true });
      setPageIdx(pageIdx + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Final celebration
    setShowConfetti(true);
    setTimeout(async () => {
      await AsyncStorage.setItem('muslim_cc_onboarded', 'true');
      onFinish?.();
    }, 1200);
  };

  const renderSlide = ({ item, index }) => (
    <Slide item={item} index={index} scrollX={scrollX} lang={lang} setLang={setLang} b={b} />
  );

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Skip button */}
      {pageIdx < SLIDES.length - 1 && (
        <FadeIn>
          <TouchableOpacity style={styles.skipBtn} onPress={finish} activeOpacity={0.7}>
            <Text style={styles.skipText}>{b.skip}</Text>
            <AppIcon name="chevronRight" size={14} color="#fff" />
          </TouchableOpacity>
        </FadeIn>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
        removeClippedSubviews={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SW);
          setPageIdx(i);
          Haptics.selectionAsync();
        }}
      />

      {/* Final confetti */}
      <Confetti trigger={showConfetti} count={80} colors={['#fbbf24','#ec4899','#10b981','#3b82f6','#a855f7','#f97316']} />

      {/* Bottom controls */}
      <View style={styles.bottomWrap} pointerEvents="box-none">
        {/* Pagination dots — LIQUID morph */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * SW, i * SW, (i + 1) * SW];
            const w = scrollX.interpolate({ inputRange, outputRange: [10, 40, 10], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
            const h = scrollX.interpolate({ inputRange, outputRange: [10, 10, 10], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: w, height: h, opacity }]}
              />
            );
          })}
        </View>

        {/* Next button with pulse + glow */}
        <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
          <TouchableOpacity
            onPress={goToNext}
            activeOpacity={0.85}
          >
            <View style={[styles.nextBtn, Shadows.xl]}>
              <Text style={[styles.nextText, { color: SLIDES[pageIdx].gradient[1] }]}>
                {pageIdx === SLIDES.length - 1 ? b.getStarted : b.next}
              </Text>
              <View style={[styles.nextArrow, { backgroundColor: SLIDES[pageIdx].accentColor + '22' }]}>
                <AppIcon
                  name={pageIdx === SLIDES.length - 1 ? 'check' : 'chevronRight'}
                  size={18}
                  color={SLIDES[pageIdx].gradient[1]}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Page counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>{pageIdx + 1} / {SLIDES.length}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Skip
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },

  // Slide
  slide: {
    width: SW,
    height: SH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    overflow: 'hidden',
  },
  rotatingRing: {
    position: 'absolute',
    width: 550,
    height: 550,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  rotatingRingInner: {
    width: 540,
    height: 540,
    borderRadius: 270,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  rotatingRing2: {
    position: 'absolute',
    width: 700,
    height: 700,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  rotatingRingInner2: {
    width: 690,
    height: 690,
    borderRadius: 345,
    borderWidth: 1,
    borderStyle: 'dotted',
  },
  slideCircle1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.06)', top: -100, right: -80 },
  slideCircle2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -70, left: -50 },
  slideCircle3: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', top: '35%', right: -40 },

  slideContent: {
    alignItems: 'center',
    width: '100%',
    zIndex: 5,
  },

  // 3D Icon
  iconGlow: { shadowOffset: { width: 0, height: 0 } },
  iconBadgeOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  iconBadgeInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  iconEmoji: { fontSize: 80 },

  slideTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 16,
    lineHeight: 40,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  slideDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
    fontWeight: '500',
  },

  // Language chooser
  langChooseLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  langsRow: { gap: 8 },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langFlag: { fontSize: 22 },
  langName: { color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 },

  // Bottom
  bottomWrap: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 32,
    paddingRight: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xxl,
    minWidth: SW - 48,
    gap: 16,
  },
  nextText: { fontWeight: '800', fontSize: 16, letterSpacing: -0.3, flex: 1 },
  nextArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});
