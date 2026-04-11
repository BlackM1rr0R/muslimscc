import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing, View, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

// ═══ iOS-tərzi spring konfiqurasiyaları ═══
const SPRING_CONFIG = {
  soft: { friction: 7, tension: 60, useNativeDriver: true },
  medium: { friction: 6, tension: 100, useNativeDriver: true },
  bouncy: { friction: 4, tension: 120, useNativeDriver: true },
  tight: { friction: 10, tension: 150, useNativeDriver: true },
};

// ═══ FadeUp — iOS-style fade + slide ═══
export function FadeUp({ children, delay = 0, duration = 600, style, offset = 30 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        ...SPRING_CONFIG.soft,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ═══ FadeIn ═══
export function FadeIn({ children, delay = 0, duration = 500, style }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
}

// ═══ ScaleIn — iOS-style spring scale ═══
export function ScaleIn({ children, delay = 0, style, initialScale = 0.9 }) {
  const scale = useRef(new Animated.Value(initialScale)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, delay, ...SPRING_CONFIG.bouncy }),
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ═══ SlideIn — kənardan sürüşmə (iOS kimi) ═══
export function SlideIn({ children, delay = 0, direction = 'right', distance = 50, style }) {
  const translate = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translate, { toValue: 0, delay, ...SPRING_CONFIG.soft }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const transform = direction === 'left' || direction === 'right'
    ? [{ translateX: direction === 'left' ? translate : translate.interpolate({ inputRange: [0, distance], outputRange: [0, distance] }) }]
    : [{ translateY: direction === 'up' ? translate : translate.interpolate({ inputRange: [0, distance], outputRange: [0, distance] }) }];

  return (
    <Animated.View style={[{ opacity, transform }, style]}>
      {children}
    </Animated.View>
  );
}

// ═══ Pulse — nəbz ═══
export function Pulse({ children, style, minOpacity = 0.5 }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: minOpacity, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
}

// ═══ Float — yuxarı-aşağı ═══
export function Float({ children, style, distance = 6 }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -distance, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[{ transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

// ═══ Rotate — daimi dönmə ═══
export function Rotate({ children, duration = 20000, style }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return <Animated.View style={[{ transform: [{ rotate }] }, style]}>{children}</Animated.View>;
}

// ═══ CountUp — rəqəm pop ═══
export function CountUp({ children, style }) {
  const scale = useRef(new Animated.Value(1.2)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(1.2);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, ...SPRING_CONFIG.bouncy }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [children]);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ═══ Press animasiya (iOS kimi scale 0.96) ═══
export function usePressAnimation(config = 'medium') {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      ...SPRING_CONFIG.tight,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      ...SPRING_CONFIG[config],
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}

// ═══ PressableCard — iOS-style scale + haptic ═══
export function PressableCard({ children, style, onPress, haptic = 'light' }) {
  const { scale, onPressIn, onPressOut } = usePressAnimation();

  const handlePress = () => {
    if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptic === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (haptic === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

// ═══ Stagger — ardıcıl gecikməli ═══
export function StaggeredList({ children, staggerDelay = 80 }) {
  return React.Children.map(children, (child, i) => (
    <FadeUp delay={i * staggerDelay} key={i}>
      {child}
    </FadeUp>
  ));
}

// ═══ Shimmer loading ═══
export function Shimmer({ width, height, style }) {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={[{ width, height, backgroundColor: '#e0e0e0', borderRadius: 8, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}

// ═══ Parallax Hero — scroll ilə hero scale/translate ═══
export function useParallaxHero(scrollY, heroHeight = 300) {
  const heroScale = scrollY.interpolate({
    inputRange: [-heroHeight, 0, heroHeight],
    outputRange: [1.4, 1, 1],
    extrapolate: 'clamp',
  });

  const heroTranslate = scrollY.interpolate({
    inputRange: [-heroHeight, 0, heroHeight],
    outputRange: [0, 0, heroHeight / 2],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, heroHeight / 1.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return { heroScale, heroTranslate, heroOpacity };
}
