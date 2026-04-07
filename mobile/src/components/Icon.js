// Modern vector icons — emoji əvəzinə @expo/vector-icons istifadə edir
import React from 'react';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';

// Bütün app-da istifadə olunan icon mapping
const ICON_MAP = {
  // Navigation & Pages
  home:        { lib: Ionicons, name: 'home', fallback: '🏠' },
  quran:       { lib: MaterialCommunityIcons, name: 'book-open-page-variant', fallback: '📖' },
  prayer:      { lib: MaterialCommunityIcons, name: 'mosque', fallback: '🕌' },
  hadith:      { lib: MaterialCommunityIcons, name: 'book-multiple', fallback: '📚' },
  duas:        { lib: MaterialCommunityIcons, name: 'hands-pray', fallback: '🤲' },
  dhikr:       { lib: MaterialCommunityIcons, name: 'counter', fallback: '📿' },
  names:       { lib: MaterialCommunityIcons, name: 'star-four-points', fallback: '✨' },
  zakat:       { lib: MaterialCommunityIcons, name: 'hand-coin', fallback: '💰' },
  qibla:       { lib: MaterialCommunityIcons, name: 'compass', fallback: '🧭' },
  calendar:    { lib: Ionicons, name: 'calendar', fallback: '📅' },
  prayerguide: { lib: MaterialCommunityIcons, name: 'human-handsup', fallback: '🙏' },
  hajjguide:   { lib: MaterialCommunityIcons, name: 'kabaddi', fallback: '🕋' },
  hifz:        { lib: Ionicons, name: 'school', fallback: '🎓' },
  quiz:        { lib: MaterialCommunityIcons, name: 'help-circle', fallback: '❓' },
  qurangame:   { lib: Ionicons, name: 'game-controller', fallback: '🎮' },
  dailytracker:{ lib: Ionicons, name: 'checkmark-circle', fallback: '✅' },
  charity:     { lib: MaterialCommunityIcons, name: 'gift', fallback: '🎁' },
  duajournal:  { lib: MaterialCommunityIcons, name: 'notebook-edit', fallback: '📝' },
  quotes:      { lib: MaterialCommunityIcons, name: 'format-quote-close', fallback: '💬' },
  mosques:     { lib: MaterialCommunityIcons, name: 'map-marker-radius', fallback: '📍' },
  holyplaces:  { lib: MaterialCommunityIcons, name: 'star-circle', fallback: '⭐' },
  history:     { lib: MaterialCommunityIcons, name: 'timeline-clock', fallback: '📜' },
  sahaba:      { lib: Ionicons, name: 'people', fallback: '👥' },
  kids:        { lib: MaterialCommunityIcons, name: 'baby-face', fallback: '👶' },
  glossary:    { lib: MaterialCommunityIcons, name: 'book-alphabet', fallback: '📕' },
  analytics:   { lib: Ionicons, name: 'stats-chart', fallback: '📊' },
  about:       { lib: Ionicons, name: 'information-circle', fallback: 'ℹ️' },

  // Actions
  search:      { lib: Ionicons, name: 'search', fallback: '🔍' },
  share:       { lib: Ionicons, name: 'share-outline', fallback: '📤' },
  heart:       { lib: Ionicons, name: 'heart', fallback: '❤️' },
  heartOutline:{ lib: Ionicons, name: 'heart-outline', fallback: '🤍' },
  bookmark:    { lib: Ionicons, name: 'bookmark', fallback: '🔖' },
  play:        { lib: Ionicons, name: 'play', fallback: '▶️' },
  pause:       { lib: Ionicons, name: 'pause', fallback: '⏸' },
  reset:       { lib: Ionicons, name: 'refresh', fallback: '🔄' },
  delete:      { lib: Ionicons, name: 'trash-outline', fallback: '🗑️' },
  copy:        { lib: Ionicons, name: 'copy-outline', fallback: '📋' },
  check:       { lib: Ionicons, name: 'checkmark-circle', fallback: '✅' },
  close:       { lib: Ionicons, name: 'close', fallback: '✕' },
  chevronDown: { lib: Ionicons, name: 'chevron-down', fallback: '▼' },
  chevronUp:   { lib: Ionicons, name: 'chevron-up', fallback: '▲' },
  chevronRight:{ lib: Ionicons, name: 'chevron-forward', fallback: '›' },
  arrowBack:   { lib: Ionicons, name: 'arrow-back', fallback: '←' },
  add:         { lib: Ionicons, name: 'add', fallback: '+' },
  settings:    { lib: Ionicons, name: 'settings-outline', fallback: '⚙️' },
  moon:        { lib: Ionicons, name: 'moon', fallback: '🌙' },
  sun:         { lib: Ionicons, name: 'sunny', fallback: '☀️' },
  location:    { lib: Ionicons, name: 'location', fallback: '📍' },
  map:         { lib: Ionicons, name: 'map', fallback: '🗺️' },
  time:        { lib: Ionicons, name: 'time', fallback: '⏰' },
  trophy:      { lib: Ionicons, name: 'trophy', fallback: '🏆' },

  // Prayer times
  fajr:        { lib: Ionicons, name: 'sunny-outline', fallback: '🌅' },
  sunrise:     { lib: Ionicons, name: 'sunny', fallback: '☀️' },
  dhuhr:       { lib: MaterialCommunityIcons, name: 'white-balance-sunny', fallback: '🌤️' },
  asr:         { lib: MaterialCommunityIcons, name: 'weather-sunset-down', fallback: '🌇' },
  maghrib:     { lib: MaterialCommunityIcons, name: 'weather-sunset', fallback: '🌆' },
  isha:        { lib: Ionicons, name: 'moon', fallback: '🌙' },

  // Crescent (branding)
  crescent:    { lib: MaterialCommunityIcons, name: 'moon-waning-crescent', fallback: '☽' },
};

export default function AppIcon({ name, size = 24, color = '#1a6b3a', style }) {
  const icon = ICON_MAP[name];
  if (!icon) return null;

  const IconComponent = icon.lib;
  return <IconComponent name={icon.name} size={size} color={color} style={style} />;
}

// Export map for drawer navigation
export { ICON_MAP };
