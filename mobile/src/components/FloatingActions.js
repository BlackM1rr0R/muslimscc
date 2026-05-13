import React, { useRef, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, Platform, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

// ─── Reusable animated FAB ────────────────────────────────────────────────
function AnimatedFab({
  onPress,
  colors,
  shadowColor,
  ringColor,
  children,
  size = 60,
  label,
  spin = false,
  delay = 0,
  testID,
}) {
  // Inner press scale
  const press = useRef(new Animated.Value(1)).current
  // Outer pulse ring (continuous)
  const ring1 = useRef(new Animated.Value(0)).current
  const ring2 = useRef(new Animated.Value(0)).current
  // Gentle vertical float
  const float = useRef(new Animated.Value(0)).current
  // Slow icon rotation (optional)
  const rot = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = (anim, duration, d = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true, delay: d, easing: Easing.out(Easing.quad) }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start()

    loop(ring1, 2200, delay)
    loop(ring2, 2200, delay + 1100)

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(float, { toValue: 0, duration: 2400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start()

    if (spin) {
      Animated.loop(
        Animated.timing(rot, { toValue: 1, duration: 6000, useNativeDriver: true, easing: Easing.linear })
      ).start()
    }
  }, [])

  const ring1Scale = ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] })
  const ring1Opacity = ring1.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.55, 0.2, 0] })
  const ring2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] })
  const ring2Opacity = ring2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 0.12, 0] })
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })
  const spinDeg = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  const onPressIn = () => {
    Animated.spring(press, { toValue: 0.9, useNativeDriver: true, speed: 40, bounciness: 0 }).start()
  }
  const onPressOut = () => {
    Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()
  }
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress?.()
  }

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ translateY }] }} testID={testID}>
      {/* Outer pulse rings */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseRing,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: ringColor, opacity: ring1Opacity, transform: [{ scale: ring1Scale }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseRing,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: ringColor, opacity: ring2Opacity, transform: [{ scale: ring2Scale }] },
        ]}
      />

      <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut} accessibilityLabel={label}>
        <Animated.View
          style={[
            styles.fab,
            { width: size, height: size, borderRadius: size / 2, transform: [{ scale: press }] },
            Platform.select({
              ios: { shadowColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.45, shadowRadius: 18 },
              android: { elevation: 12 },
            }),
          ]}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { borderRadius: size / 2 }]}
          >
            {/* Inner glassy highlight */}
            <View style={[styles.highlight, { borderRadius: size / 2 }]} />
            {/* Icon (optionally spinning) */}
            <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
              {children}
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

// ─── Floating overlay ─────────────────────────────────────────────────────
export default function FloatingActions({ navRef }) {
  const insets = useSafeAreaInsets()
  const bottomBase = 18 + (insets.bottom || 0)

  const openAI = () => { try { navRef?.navigate('AIChat') } catch {} }
  const openA11y = () => { try { navRef?.navigate('Accessibility') } catch {} }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Accessibility (top) */}
      <View pointerEvents="box-none" style={[styles.slot, { right: 18, bottom: bottomBase + 78 }]}>
        <AnimatedFab
          onPress={openA11y}
          label="Accessibility menu"
          size={56}
          colors={['#60a5fa', '#3b82f6', '#1d4ed8']}
          shadowColor="#3b82f6"
          ringColor="#3b82f6"
          delay={400}
        >
          <MaterialCommunityIcons name="wheelchair-accessibility" size={28} color="#fff" />
        </AnimatedFab>
      </View>

      {/* AI (bottom) */}
      <View pointerEvents="box-none" style={[styles.slot, { right: 18, bottom: bottomBase }]}>
        <AnimatedFab
          onPress={openAI}
          label="MuslimAI chat"
          size={62}
          colors={['#34d399', '#10b981', '#047857']}
          shadowColor="#10b981"
          ringColor="#10b981"
          spin
          delay={0}
        >
          <MaterialIcons name="auto-awesome" size={30} color="#fff" />
        </AnimatedFab>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
  fab: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
})
