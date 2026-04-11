import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLang } from '../contexts/LangContext';
import { Colors, BorderRadius } from '../theme/colors';

// iOS-style glass morphism card
export function BlurCard({ children, style, intensity = 60, tint }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const blurTint = tint || (dark ? 'dark' : 'light');

  return (
    <View style={[styles.wrap, style]}>
      <BlurView intensity={intensity} tint={blurTint} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { backgroundColor: dark ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.5)' }]}>
        {children}
      </View>
    </View>
  );
}

// iOS-style solid card with large radius + soft shadow
export function IOSCard({ children, style, onPress }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;

  const baseStyle = [
    styles.iosCard,
    {
      backgroundColor: c.card,
      borderColor: c.cardBorder,
      shadowColor: dark ? '#000' : '#1a6b3a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: dark ? 0.35 : 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    style,
  ];

  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  iosCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 20,
  },
});
