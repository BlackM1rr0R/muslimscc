// Namaz vaxtları təqvim abunəliyinin URL-i (server/ics.js → GET /api/prayer.ics).
// Koordinat 4 rəqəmə yuvarlaqlaşır (~11 m) — keş açarı sabit qalsın.
export function icsUrl(origin, loc, lang, city) {
  const q = new URLSearchParams({
    lat: String(Math.round(loc.lat * 1e4) / 1e4), lng: String(Math.round(loc.lng * 1e4) / 1e4),
    tz: loc.tz, method: String(loc.method), lang,
  })
  if (city) q.set('city', city)
  return `${origin}/api/prayer.ics?${q}`
}
