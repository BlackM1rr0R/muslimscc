import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

const LANGS = ['az', 'en', 'ru', 'ar', 'tr'];
const LangCtx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('az');
  const [dark, setDarkState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('muslim_cc_lang');
        const savedTheme = await AsyncStorage.getItem('muslim_cc_theme');
        if (savedLang && LANGS.includes(savedLang)) setLangState(savedLang);
        if (savedTheme === 'dark') setDarkState(true);
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  const setLang = useCallback(async (l) => {
    if (!LANGS.includes(l)) return;
    setLangState(l);
    await AsyncStorage.setItem('muslim_cc_lang', l);
    const isRTL = l === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }
  }, []);

  const toggleDark = useCallback(async () => {
    setDarkState(prev => {
      const next = !prev;
      AsyncStorage.setItem('muslim_cc_theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  if (!ready) return null;

  return (
    <LangCtx.Provider value={{ lang, setLang, dark, toggleDark, LANGS }}>
      {children}
    </LangCtx.Provider>
  );
}

export const useLang = () => useContext(LangCtx);
