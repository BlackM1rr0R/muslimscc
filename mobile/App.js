import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LangProvider, useLang } from './src/contexts/LangContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppInner() {
  const { dark } = useLang();
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
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
