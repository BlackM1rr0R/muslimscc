import { StatusBar } from 'expo-status-bar';
import { LangProvider, useLang } from './src/contexts/LangContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppInner() {
  const { dark } = useLang();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'light'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
