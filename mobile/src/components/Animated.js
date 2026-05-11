import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Easing, View, TouchableOpacity, Dimensions, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');

// ═══ iOS-tərzi spring preset-lər ═══
const SPRING_CONFIG = {
  soft:   { friction: 7, tension: 60, useNativeDriver: true },
  medium: { friction: 6, tension: 100, useNativeDriver: true },
  bouncy: { friction: 4, tension: 120, useNativeDriver: true },
  extraBouncy: { friction: 3, tension: 140, useNativeDriver: true },
  tight:  { friction: 10, tension: 150, useNativeDriver: true },
};

// ═══ FadeUp ═══
export function FadeUp({ children, delay = 0, duration = 600, style, offset = 30 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, ...SPRING_CONFIG.soft }),
    ]).start();
  }, []);

  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

// ═══ FadeIn ═══
export function FadeIn({ children, delay = 0, duration = 500, style }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
}

// ═══ ScaleIn ═══
export function ScaleIn({ children, delay = 0, style, initialScale = 0.9 }) {
  const scale = useRef(new Animated.Value(initialScale)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, delay, ...SPRING_CONFIG.bouncy }),
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

// ═══ SlideIn ═══
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
    ? [{ translateX: translate }]
    : [{ translateY: translate }];

  return <Animated.View style={[{ opacity, transform }, style]}>{children}</Animated.View>;
}

// ═══ BounceIn — güclü bouncy ═══
export function BounceIn({ children, delay = 0, style }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, delay, ...SPRING_CONFIG.extraBouncy }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

// ═══ Shake — səhv/diqqət ═══
export function Shake({ children, trigger, style }) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(x, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(x, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(x, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(x, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(x, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  return <Animated.View style={[{ transform: [{ translateX: x }] }, style]}>{children}</Animated.View>;
}

// ═══ Wiggle — yüngül hərlənmə ═══
export function Wiggle({ children, trigger, style }) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(rot, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(rot, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(rot, { toValue: 0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(rot, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  const rotate = rot.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] });

  return <Animated.View style={[{ transform: [{ rotate }] }, style]}>{children}</Animated.View>;
}

// ═══ HeartBeat — ürək döyüntüsü ═══
export function HeartBeat({ children, trigger, style, continuous = false }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const beat = () => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      ]).start(() => {
        if (continuous) setTimeout(beat, 1500);
      });
    };
    if (trigger || continuous) beat();
  }, [trigger]);

  return <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

// ═══ Pulse ═══
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

// ═══ Float ═══
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

// ═══ Rotate ═══
export function Rotate({ children, duration = 20000, style }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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

  return <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

// ═══ AnimatedNumber — rəqəm count-up ═══
export function AnimatedNumber({ value, duration = 1500, style, prefix = '', suffix = '', decimals = 0 }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(v);
    });
    Animated.timing(animValue, {
      toValue: parseFloat(value) || 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animValue.removeListener(listener);
  }, [value]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString();

  return <Text style={style}>{prefix}{formatted}{suffix}</Text>;
}

// ═══ WaveLoader — dalğalı loading ═══
export function WaveLoader({ size = 40, color = '#1a6b3a', style }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const createAnim = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: -12, duration: 400, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    createAnim(dots[0], 0).start();
    createAnim(dots[1], 150).start();
    createAnim(dots[2], 300).start();
  }, []);

  const dotSize = size / 4;

  return (
    <View style={[{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }, style]}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            transform: [{ translateY: d }],
          }}
        />
      ))}
    </View>
  );
}

// ═══ Confetti — kiçik zərrəcik partlayış ═══
export function Confetti({ trigger, count = 20, colors = ['#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#a855f7'], style }) {
  const particles = useRef(Array.from({ length: count }).map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    rotate: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (trigger) {
      particles.forEach((p) => {
        p.x.setValue(0);
        p.y.setValue(0);
        p.opacity.setValue(1);
        p.rotate.setValue(0);
        p.scale.setValue(1);

        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 150;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance + Math.random() * 100;

        Animated.parallel([
          Animated.timing(p.x, { toValue: endX, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.y, { toValue: endY, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.rotate, { toValue: Math.random() * 720, duration: 1200, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(800),
            Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]).start();
      });
    }
  }, [trigger]);

  if (!trigger) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }, style]}>
      {particles.map((p, i) => {
        const rotateStr = p.rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: colors[i % colors.length],
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: rotateStr },
                { scale: p.scale },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

// ═══ SuccessCheck — uğur işarəsi animasiyası ═══
export function SuccessCheck({ trigger, color = '#10b981', size = 80, style }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      scale.setValue(0);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, ...SPRING_CONFIG.extraBouncy }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  if (!trigger) return null;

  return (
    <Animated.View style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: [{ scale }],
      },
      style,
    ]}>
      <Text style={{ color: '#fff', fontSize: size * 0.5, fontWeight: '800' }}>✓</Text>
    </Animated.View>
  );
}

// ═══ Press animasiya ═══
export function usePressAnimation(config = 'medium') {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, ...SPRING_CONFIG.tight }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, ...SPRING_CONFIG[config] }).start();
  };

  return { scale, onPressIn, onPressOut };
}

// ═══ PressableCard ═══
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

// ═══ StaggeredList ═══
export function StaggeredList({ children, staggerDelay = 80 }) {
  return React.Children.map(children, (child, i) => (
    <FadeUp delay={i * staggerDelay} key={i}>{child}</FadeUp>
  ));
}

// ═══ Shimmer ═══
export function Shimmer({ width, height, style }) {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, { toValue: width, duration: 1500, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  return (
    <View style={[{ width, height, backgroundColor: '#e0e0e0', borderRadius: 8, overflow: 'hidden' }, style]}>
      <Animated.View style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', transform: [{ translateX }] }} />
    </View>
  );
}

// ═══ Parallax Hero ═══
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

// ═══ Glow — işıqlandırma effekti ═══
export function Glow({ children, color = '#1a6b3a', style, active = true }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    }
  }, [active]);

  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  const shadowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [8, 20] });

  return (
    <Animated.View
      style={[
        { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity, shadowRadius, elevation: 10 },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ═══ Swing — yelləncək ═══
export function Swing({ children, style }) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rot, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rot, { toValue: -1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = rot.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });

  return <Animated.View style={[{ transform: [{ rotate }] }, style]}>{children}</Animated.View>;
}

// ═══ AnimatedProgressBar ═══
export function AnimatedProgressBar({ progress = 0, color = '#10b981', bgColor = '#e5e7eb', height = 8, style, duration = 800 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[{ height, backgroundColor: bgColor, borderRadius: height / 2, overflow: 'hidden' }, style]}>
      <Animated.View style={{ height: '100%', width, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

// ═══ BreathingDot — canlı nöqtə ═══
export function BreathingDot({ color = '#10b981', size = 10, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ scale }], opacity },
        style,
      ]}
    />
  );
}
