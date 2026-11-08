// Ana səhifə salamı (components/home/HeroGreeting): səma fazası (utils/livingSky → html[data-sky]) + saat → günün vaxtı
export function partOfDay(sky, h) {
  if (sky === 'fajr' || sky === 'sunrise') return 'morning'
  if (sky === 'day') return h < 11 ? 'morning' : 'day'
  if (sky === 'asr') return 'day'
  if (sky === 'maghrib') return 'evening'
  if (sky === 'isha') return h >= 22 || h < 4 ? 'night' : 'evening'
  if (sky === 'night') return h >= 4 && h < 12 ? 'morning' : h >= 12 && h < 22 ? 'evening' : 'night'
  return h < 5 ? 'night' : h < 11 ? 'morning' : h < 17 ? 'day' : h < 22 ? 'evening' : 'night'
}
