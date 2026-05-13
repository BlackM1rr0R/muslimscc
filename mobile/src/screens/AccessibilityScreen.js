import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLang } from '../contexts/LangContext'
import { Colors } from '../theme/colors'
import PageHero from '../components/PageHero'

const STORAGE_KEY = 'mobile_a11y_prefs'
const DEFAULTS = {
  fontSize: 0,         // -1, 0, +1, +2
  contrast: 'normal',  // normal | high
  theme: 'auto',       // auto | light | dark
  reduceMotion: false,
  underlineLinks: false,
  highlightFocus: false,
  largerTargets: false,
  pauseMedia: false,
  saturation: 100,
}

const PROFILES = {
  lowVision:  { fontSize: 2, contrast:'high', largerTargets: true },
  dyslexia:   { fontSize: 1, underlineLinks: true },
  motor:      { largerTargets: true, fontSize: 1 },
  colorblind: { saturation: 0, underlineLinks: true },
  calm:       { reduceMotion: true, theme:'dark', pauseMedia: true },
  seizure:    { reduceMotion: true, pauseMedia: true },
}

const LABELS = {
  az: {
    title:'Əlçatanlıq', subtitle:'Tətbiqi öz ehtiyaclarınıza uyğunlaşdırın',
    preview:'Önizləmə', sampleH:'Bismillah — Mərhəmətli Allahın adı ilə',
    sampleP:'Bu mətn ayarlamaları görmək üçündür.',
    profiles:'Hazır profillər',
    profileLowVision:'Zəif görmə', profileDyslexia:'Disleksiya', profileMotor:'Motor',
    profileColorblind:'Rəngkorluk', profileCalm:'Sakit', profileSeizure:'Tutmalardan qoruma',
    text:'Mətn ölçüsü', smaller:'Kiçik', normal:'Normal', larger:'Böyük', xlarger:'Ən böyük',
    contrast:'Yüksək kontrast', contrastSub:'Daha aydın mətn',
    theme:'Tema', themeAuto:'Avto', themeLight:'İşıqlı', themeDark:'Tünd',
    reduceMotion:'Animasiyaları azalt', reduceMotionSub:'Bütün hərəkətlər söndürülür',
    underlineLinks:'Linklərin altını çək', underlineLinksSub:'Bütün linklər vurğulansın',
    highlightFocus:'Fokusu vurğula', highlightFocusSub:'Klaviatura naviqasiyası',
    largerTargets:'Böyük düymələr', largerTargetsSub:'Daha asan toxunma',
    pauseMedia:'Media-nı dayandır', pauseMediaSub:'Auto-play söndürülür',
    reset:'Hamısını sıfırla',
  },
  en: {
    title:'Accessibility', subtitle:'Customize the app to your needs',
    preview:'Preview', sampleH:'Bismillah — In the name of Allah',
    sampleP:'This text shows how settings affect display.',
    profiles:'Quick profiles',
    profileLowVision:'Low vision', profileDyslexia:'Dyslexia', profileMotor:'Motor',
    profileColorblind:'Color blind', profileCalm:'Calm', profileSeizure:'Seizure safe',
    text:'Text size', smaller:'Smaller', normal:'Normal', larger:'Larger', xlarger:'Largest',
    contrast:'High contrast', contrastSub:'Clearer text',
    theme:'Theme', themeAuto:'Auto', themeLight:'Light', themeDark:'Dark',
    reduceMotion:'Reduce motion', reduceMotionSub:'Disable all animations',
    underlineLinks:'Underline links', underlineLinksSub:'Highlight all links',
    highlightFocus:'Highlight focus', highlightFocusSub:'Keyboard navigation',
    largerTargets:'Larger targets', largerTargetsSub:'Easier to tap',
    pauseMedia:'Pause media', pauseMediaSub:'Stop auto-play',
    reset:'Reset all',
  },
  ru: { title:'Доступность', subtitle:'Настройте под себя', preview:'Превью', sampleH:'Бисмиллах', sampleP:'Этот текст показывает применение настроек.', profiles:'Быстрые профили', profileLowVision:'Слабовидящие', profileDyslexia:'Дислексия', profileMotor:'Моторика', profileColorblind:'Дальтонизм', profileCalm:'Спокойный', profileSeizure:'Без вспышек', text:'Размер текста', smaller:'Меньше', normal:'Нормальный', larger:'Больше', xlarger:'Большой', contrast:'Высокий контраст', contrastSub:'Яснее текст', theme:'Тема', themeAuto:'Авто', themeLight:'Светлая', themeDark:'Тёмная', reduceMotion:'Меньше анимации', reduceMotionSub:'Отключение движения', underlineLinks:'Подчеркнуть ссылки', underlineLinksSub:'Выделить все ссылки', highlightFocus:'Подсветка фокуса', highlightFocusSub:'Клавиатура', largerTargets:'Большие кнопки', largerTargetsSub:'Проще нажимать', pauseMedia:'Пауза медиа', pauseMediaSub:'Стоп авто-воспроизв.', reset:'Сбросить' },
  ar: { title:'إمكانية الوصول', subtitle:'خصص حسب احتياجاتك', preview:'معاينة', sampleH:'بسم الله الرحمن الرحيم', sampleP:'هذا النص يوضح الإعدادات.', profiles:'إعدادات سريعة', profileLowVision:'ضعف البصر', profileDyslexia:'عسر القراءة', profileMotor:'حركة', profileColorblind:'عمى الألوان', profileCalm:'هادئ', profileSeizure:'آمن للنوبات', text:'حجم النص', smaller:'أصغر', normal:'عادي', larger:'أكبر', xlarger:'الأكبر', contrast:'تباين عالي', contrastSub:'نص أوضح', theme:'النمط', themeAuto:'تلقائي', themeLight:'فاتح', themeDark:'داكن', reduceMotion:'تقليل الحركة', reduceMotionSub:'إيقاف الرسوم', underlineLinks:'تسطير الروابط', underlineLinksSub:'إبراز كل الروابط', highlightFocus:'إبراز التركيز', highlightFocusSub:'لوحة المفاتيح', largerTargets:'أزرار أكبر', largerTargetsSub:'أسهل للضغط', pauseMedia:'إيقاف الوسائط', pauseMediaSub:'إيقاف التشغيل التلقائي', reset:'إعادة تعيين' },
  tr: { title:'Erişilebilirlik', subtitle:'İhtiyaçlarınıza göre özelleştirin', preview:'Önizleme', sampleH:'Bismillah', sampleP:'Bu metin ayarların etkisini gösterir.', profiles:'Hazır profiller', profileLowVision:'Az gören', profileDyslexia:'Disleksi', profileMotor:'Motor', profileColorblind:'Renk körü', profileCalm:'Sakin', profileSeizure:'Nöbet güvenli', text:'Yazı boyutu', smaller:'Küçük', normal:'Normal', larger:'Büyük', xlarger:'En büyük', contrast:'Yüksek kontrast', contrastSub:'Daha net metin', theme:'Tema', themeAuto:'Oto', themeLight:'Açık', themeDark:'Koyu', reduceMotion:'Hareketi azalt', reduceMotionSub:'Animasyonları kapat', underlineLinks:'Linklerin altını çiz', underlineLinksSub:'Tüm linkler vurgulansın', highlightFocus:'Odağı vurgula', highlightFocusSub:'Klavye', largerTargets:'Büyük hedefler', largerTargetsSub:'Daha kolay tıklama', pauseMedia:'Medyayı durdur', pauseMediaSub:'Otomatik oynatmayı durdur', reset:'Sıfırla' },
}

const FONT_SIZES = { '-1': 13, '0': 16, '1': 18, '2': 22 }

export default function AccessibilityScreen() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [prefs, setPrefs] = useState(DEFAULTS)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(s => {
      if (s) try { setPrefs({ ...DEFAULTS, ...JSON.parse(s) }) } catch {}
    })
  }, [])

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  const update = (key, val) => setPrefs(p => ({ ...p, [key]: val }))
  const toggle = (key) => { Haptics.selectionAsync(); setPrefs(p => ({ ...p, [key]: !p[key] })) }
  const applyProfile = (key) => { Haptics.impactAsync(); setPrefs(p => ({ ...DEFAULTS, ...PROFILES[key] })) }

  const fontSize = FONT_SIZES[String(prefs.fontSize)] || 16

  return (
    <ScrollView style={{ flex:1, backgroundColor: Colors.bg }}>
      <PageHero
        title={l.title}
        subtitle={l.subtitle}
        arabic="إِمْكَانِيَّةُ الوُصُول"
        gradient={['#3b82f6', '#2563eb', '#1d4ed8']}
        icon="♿"
      />

      <View style={styles.content}>
        {/* Live preview */}
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>👁️ {l.preview}</Text>
          <Text style={[styles.previewH, { fontSize: fontSize + 4 }, prefs.contrast === 'high' && { fontWeight: '900' }]}>
            {l.sampleH}
          </Text>
          <Text style={[styles.previewP, { fontSize }, prefs.contrast === 'high' && { color: '#000' }]}>
            {l.sampleP}
          </Text>
        </View>

        {/* Profiles */}
        <Text style={styles.sectionTitle}>⚡ {l.profiles}</Text>
        <View style={styles.profileGrid}>
          {[
            { k:'lowVision',  i:'👁️', label:l.profileLowVision },
            { k:'dyslexia',   i:'📖', label:l.profileDyslexia },
            { k:'motor',      i:'✋', label:l.profileMotor },
            { k:'colorblind', i:'🎨', label:l.profileColorblind },
            { k:'calm',       i:'🧘', label:l.profileCalm },
            { k:'seizure',    i:'🛡️', label:l.profileSeizure },
          ].map(p => (
            <TouchableOpacity key={p.k} style={styles.profile} onPress={() => applyProfile(p.k)}>
              <Text style={styles.profileIcon}>{p.i}</Text>
              <Text style={styles.profileLabel}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text size */}
        <Text style={styles.sectionTitle}>🔤 {l.text}</Text>
        <View style={styles.row}>
          {[
            { v: -1, s: 14, name: l.smaller },
            { v: 0,  s: 16, name: l.normal },
            { v: 1,  s: 19, name: l.larger },
            { v: 2,  s: 22, name: l.xlarger },
          ].map(opt => (
            <TouchableOpacity
              key={opt.v}
              style={[styles.optBtn, prefs.fontSize === opt.v && styles.optBtnActive]}
              onPress={() => update('fontSize', opt.v)}
            >
              <Text style={[{ fontSize: opt.s, fontWeight: '900' }, prefs.fontSize === opt.v && { color:'#fff' }]}>A</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme */}
        <Text style={styles.sectionTitle}>🎨 {l.theme}</Text>
        <View style={styles.row}>
          {[
            { k:'auto',  i:'🔄', name: l.themeAuto },
            { k:'light', i:'☀️', name: l.themeLight },
            { k:'dark',  i:'🌙', name: l.themeDark },
          ].map(t => (
            <TouchableOpacity
              key={t.k}
              style={[styles.optBtn, prefs.theme === t.k && styles.optBtnActive]}
              onPress={() => update('theme', t.k)}
            >
              <Text style={{ fontSize: 16 }}>{t.i}</Text>
              <Text style={[styles.optBtnText, prefs.theme === t.k && { color:'#fff' }]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggles */}
        <Text style={styles.sectionTitle}>✨ {l.title}</Text>
        <ToggleRow icon="🌗" label={l.contrast} sub={l.contrastSub}
          value={prefs.contrast === 'high'} onChange={() => update('contrast', prefs.contrast === 'high' ? 'normal' : 'high')} />
        <ToggleRow icon="🔗" label={l.underlineLinks} sub={l.underlineLinksSub}
          value={prefs.underlineLinks} onChange={() => toggle('underlineLinks')} />
        <ToggleRow icon="🎯" label={l.highlightFocus} sub={l.highlightFocusSub}
          value={prefs.highlightFocus} onChange={() => toggle('highlightFocus')} />
        <ToggleRow icon="🔘" label={l.largerTargets} sub={l.largerTargetsSub}
          value={prefs.largerTargets} onChange={() => toggle('largerTargets')} />
        <ToggleRow icon="⏸️" label={l.reduceMotion} sub={l.reduceMotionSub}
          value={prefs.reduceMotion} onChange={() => toggle('reduceMotion')} />
        <ToggleRow icon="⏹️" label={l.pauseMedia} sub={l.pauseMediaSub}
          value={prefs.pauseMedia} onChange={() => toggle('pauseMedia')} />

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={() => { Haptics.impactAsync(); setPrefs(DEFAULTS) }}>
          <Text style={styles.resetText}>🔄 {l.reset}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function ToggleRow({ icon, label, sub, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
        thumbColor="#fff"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16 },

  preview: {
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  previewH: { fontSize: 18, fontWeight: '800', color: Colors.text || '#1a2e1e', marginBottom: 8 },
  previewP: { fontSize: 14, color: Colors.text || '#1a2e1e', lineHeight: 20 },

  sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: Colors.text || '#1a2e1e', marginTop: 14, marginBottom: 10 },

  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  profile: {
    width: '31%',
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border || '#e2e8df',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  profileIcon: { fontSize: 24 },
  profileLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', color: Colors.text || '#1a2e1e' },

  row: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  optBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border || '#e2e8df',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  optBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  optBtnText: { fontSize: 11, fontWeight: '700', color: Colors.text || '#1a2e1e' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border || '#e2e8df',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  toggleIcon: { fontSize: 22 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: Colors.text || '#1a2e1e' },
  toggleSub: { fontSize: 11.5, color: Colors.textMuted || '#7a9b82', marginTop: 1 },

  resetBtn: {
    marginTop: 14,
    padding: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ef4444',
    borderRadius: 12,
    alignItems: 'center',
  },
  resetText: { color: '#dc2626', fontWeight: '800', fontSize: 14 },
})
