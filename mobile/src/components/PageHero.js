import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../contexts/LangContext';
import { Colors, BorderRadius } from '../theme/colors';
import { FadeUp, FadeIn, Float } from './Animated';

const { width: SW } = Dimensions.get('window');

export default function PageHero({ arabic, title, subtitle, icon }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;

  return (
    <LinearGradient
      colors={dark ? [c.heroGradStart, c.background, c.heroGradEnd] : [c.heroGradStart, '#ffffff', c.heroGradEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      {/* Dekorativ dairələr */}
      <View style={[styles.circle1, { backgroundColor: c.primaryBg }]} />
      <View style={[styles.circle2, { backgroundColor: c.goldBg }]} />

      {arabic && (
        <FadeIn delay={100}>
          <Float distance={4}>
            <View style={[styles.arBadge, { backgroundColor: c.primaryBg2, borderColor: c.primaryBorder }]}>
              <Text style={[styles.arabic, { color: dark ? c.primary : c.primaryDark }]}>{arabic}</Text>
            </View>
          </Float>
        </FadeIn>
      )}
      <FadeUp delay={200}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      </FadeUp>
      {subtitle && (
        <FadeUp delay={300}>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
        </FadeUp>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -80,
    right: -60,
    opacity: 0.6,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -50,
    left: -40,
    opacity: 0.5,
  },
  arBadge: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 14,
  },
  arabic: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
});
