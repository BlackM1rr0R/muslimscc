import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FadeUp, FadeIn, Float } from './Animated'

const { width: SW } = Dimensions.get('window')

// Web .page-hero theme variants ilə eyni rənglər
export const HERO_THEMES = {
  quran:       ['#10b981', '#059669', '#047857'],
  hadith:      ['#ea580c', '#c2410c', '#9a3412'],
  prayer:      ['#6366f1', '#4f46e5', '#3730a3'],
  duas:        ['#a855f7', '#9333ea', '#7c3aed'],
  dhikr:       ['#ec4899', '#db2777', '#be185d'],
  names:       ['#8b5cf6', '#7c3aed', '#5b21b6'],
  zakat:       ['#14b8a6', '#0d9488', '#0f766e'],
  qibla:       ['#06b6d4', '#0891b2', '#0e7490'],
  calendar:    ['#4f46e5', '#4338ca', '#312e81'],
  about:       ['#475569', '#334155', '#1e293b'],
  quiz:        ['#3b82f6', '#2563eb', '#1d4ed8'],
  glossary:    ['#0d9488', '#0f766e', '#115e59'],
  prayerguide: ['#10b981', '#059669', '#065f46'],
  hifz:        ['#f97316', '#ea580c', '#c2410c'],
  kids:        ['#fbbf24', '#f59e0b', '#d97706'],
  dailytracker:['#22c55e', '#16a34a', '#15803d'],
  qurangame:   ['#d946ef', '#c026d3', '#a21caf'],
  charity:     ['#22c55e', '#16a34a', '#166534'],
  hajj:        ['#eab308', '#ca8a04', '#854d0e'],
  quotes:      ['#f43f5e', '#e11d48', '#be123c'],
  duajournal:  ['#6366f1', '#4f46e5', '#3730a3'],
  mosques:     ['#0ea5e9', '#0284c7', '#0369a1'],
  sahaba:      ['#d97706', '#b45309', '#78350f'],
  analytics:   ['#64748b', '#475569', '#334155'],
  history:     ['#92400e', '#78350f', '#451a03'],
  holy:        ['#ca8a04', '#a16207', '#713f12'],
  books:       ['#f59e0b', '#d97706', '#b45309'],
  videos:      ['#10b981', '#059669', '#047857'],
  aichat:      ['#10b981', '#059669', '#047857'],
  notifications:['#f59e0b', '#d97706', '#b45309'],
  accessibility:['#3b82f6', '#2563eb', '#1d4ed8'],
}

export default function PageHero({
  arabic,
  title,
  subtitle,
  icon,
  // Yeni: web theme variants ilə uyğun
  theme,         // 'quran' | 'hadith' | ... — HERO_THEMES açar
  gradient,      // və ya birbaşa 3-rəng array ['#start', '#mid', '#end']
}) {
  const colors = gradient || HERO_THEMES[theme] || HERO_THEMES.quran

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      {/* Dekorativ dairələr (rgba ağ) — web tərzində */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Arabic */}
      {arabic ? (
        <FadeIn delay={80}>
          <Float distance={3}>
            <Text style={styles.arabic}>{arabic}</Text>
          </Float>
        </FadeIn>
      ) : null}

      {/* Icon */}
      {icon ? (
        <FadeUp delay={150}>
          <Text style={styles.icon}>{icon}</Text>
        </FadeUp>
      ) : null}

      {/* Title */}
      <FadeUp delay={200}>
        <Text style={styles.title}>{title}</Text>
      </FadeUp>

      {/* Subtitle */}
      {subtitle ? (
        <FadeUp delay={300}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </FadeUp>
      ) : null}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 36,
    paddingBottom: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -100,
    right: -80,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  circle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: -80,
    left: -60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  arabic: {
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  icon: {
    fontSize: 38,
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '500',
    paddingHorizontal: 12,
    maxWidth: SW - 32,
  },
})
