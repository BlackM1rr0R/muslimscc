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

function AppInner() {
  const { dark } = useLang();
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
