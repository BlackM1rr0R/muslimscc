import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LangProvider, useLang } from './src/contexts/LangContext';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { Colors } from './src/theme/colors';
import { loadNotifSettings, saveNotifSettings, setupNotifications } from './src/services/NotificationService';

function AppInner() {
  const { dark, lang } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const [checked, setChecked] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      // Bir dəfəlik təmizləmə - yeni 3D onboarding göstərilsin
      const resetDone = await AsyncStorage.getItem('muslim_cc_reset_v3');
      if (!resetDone) {
        await AsyncStorage.removeItem('muslim_cc_onboarded');
        await AsyncStorage.setItem('muslim_cc_reset_v3', 'done');
      }
      const v = await AsyncStorage.getItem('muslim_cc_onboarded');
      setOnboarded(v === 'true');
      setChecked(true);
    })();
  }, []);

  // ═══ Bildirişləri ilk açılışda avtomatik yandır ═══
  // Default settings.enabled = true. Sistem permission-i bir dəfə soruşulur,
  // qəbul edilərsə bütün bildirişlər (namaz, əzkar, gündəlik hədis) planlaşdırılır.
  useEffect(() => {
    if (!onboarded) return;
    (async () => {
      try {
        const settings = await loadNotifSettings();
        const bootKey = 'muslim_cc_notif_bootstrap_v1';
        const alreadyBooted = await AsyncStorage.getItem(bootKey);
        // İlk açılış VƏ ya enabled=true olan default — permission soruş + planlaşdır
        if (!alreadyBooted && settings.enabled) {
          await setupNotifications(lang || 'az', settings);
          await saveNotifSettings(settings);
          await AsyncStorage.setItem(bootKey, '1');
        } else if (settings.enabled) {
          // Sonrakı açılışlarda — sakitcə yeniləmə (vaxtlar dəyişib bilər)
          setupNotifications(lang || 'az', settings).catch(() => {});
        }
      } catch (e) {
        console.warn('Notif bootstrap failed:', e);
      }
    })();
  }, [onboarded, lang]);

  if (!checked) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {onboarded ? <AppNavigator /> : <OnboardingScreen onFinish={() => setOnboarded(true)} />}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LangProvider>
          <AppInner />
        </LangProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
