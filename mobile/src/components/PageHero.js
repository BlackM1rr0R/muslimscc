import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import { FadeUp, FadeIn } from './Animated';

export default function PageHero({ arabic, title, subtitle }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;

  return (
    <LinearGradient
      colors={dark ? ['#1a1a2e', '#0f0f1a', '#1a2a1e'] : ['#e8f4ee', '#ffffff', '#f0faf4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      {arabic && (
        <FadeIn delay={100}>
          <Text style={[styles.arabic, { color: dark ? c.gold : c.primary }]}>{arabic}</Text>
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
      {/* Decorative dot */}
      <View style={[styles.dot, { backgroundColor: c.primaryBg }]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  arabic: {
    fontSize: 32,
    marginBottom: 10,
    fontWeight: '400',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 22,
  },
  dot: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -60,
    opacity: 0.5,
  },
});
