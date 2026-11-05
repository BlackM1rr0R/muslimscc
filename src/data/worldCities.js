// ═══════════════════════════════════════════════════════
// Dünya şəhərləri — yalnız vizual xəritələr üçün (azan dalğası, Qiblə xətləri)
// Koordinatlar ~0.01° dəqiqliklə (şəhər mərkəzi); namaz vaxtı hesabı üçün
// DEYİL — onun üçün utils/prayerLocation.js-dəki yoxlanılmış siyahı işlədilir.
// Bu siyahı prayerLocation-un Azərbaycandan kənar şəhərləri ilə birləşdirilir (worldPoints).
// ═══════════════════════════════════════════════════════
import { PRAYER_CITIES } from '../utils/prayerLocation'

export const WORLD_CITIES = [
  ['Karachi', 24.86, 67.01], ['Lahore', 31.55, 74.34], ['Islamabad', 33.68, 73.05], ['Dhaka', 23.81, 90.41], ['Delhi', 28.61, 77.21],
  ['Mumbai', 19.08, 72.88], ['Hyderabad', 17.39, 78.49], ['Colombo', 6.93, 79.86], ['Malé', 4.18, 73.51], ['Kabul', 34.53, 69.17],
  ['Baghdad', 33.31, 44.36], ['Damascus', 33.51, 36.29], ['Amman', 31.95, 35.93], ['Beirut', 33.89, 35.5], ['Al-Quds', 31.78, 35.23],
  ['Riyadh', 24.71, 46.68], ['Jeddah', 21.49, 39.19], ['Kuwait', 29.38, 47.98], ['Manama', 26.23, 50.59], ['Doha', 25.29, 51.53],
  ['Abu Dhabi', 24.45, 54.38], ['Muscat', 23.59, 58.41], ['Sanaa', 15.37, 44.19], ['Khartoum', 15.5, 32.56], ['Addis Ababa', 9.03, 38.74],
  ['Mogadishu', 2.05, 45.32], ['Nairobi', -1.29, 36.82], ['Dar es Salaam', -6.79, 39.21], ['Lagos', 6.52, 3.38], ['Kano', 12.0, 8.52],
  ['Dakar', 14.72, -17.47], ['Bamako', 12.64, -8.0], ['Algiers', 36.75, 3.06], ['Tunis', 36.81, 10.18], ['Tripoli', 32.89, 13.19],
  ['Casablanca', 33.57, -7.59], ['Rabat', 34.02, -6.84], ['Sarajevo', 43.86, 18.41], ['Tirana', 41.33, 19.82], ['Bishkek', 42.87, 74.59],
  ['Dushanbe', 38.56, 68.79], ['Ashgabat', 37.96, 58.33], ['Samarkand', 39.65, 66.96], ['Grozny', 43.32, 45.69], ['Makhachkala', 42.98, 47.5],
  ['Johannesburg', -26.2, 28.05], ['Cape Town', -33.92, 18.42], ['Sydney', -33.87, 151.21], ['Melbourne', -37.81, 144.96], ['Singapore', 1.35, 103.82],
  ['Manila', 14.6, 120.98], ['Bangkok', 13.76, 100.5], ['Beijing', 39.9, 116.41], ['Ürümqi', 43.83, 87.62], ['Tokyo', 35.68, 139.69],
  ['Los Angeles', 34.05, -118.24], ['Chicago', 41.88, -87.63], ['Mexico City', 19.43, -99.13], ['São Paulo', -23.55, -46.63], ['Buenos Aires', -34.6, -58.38],
  ['Madrid', 40.42, -3.7], ['Rome', 41.9, 12.5], ['Amsterdam', 52.37, 4.9], ['Stockholm', 59.33, 18.07], ['Bandung', -6.92, 107.61],
  ['Surabaya', -7.25, 112.75], ['Makassar', -5.15, 119.43],
]

/** Bütün nöqtələr: { name, lat, lng } — prayerLocation (AZ-dan kənar + Bakı) + WORLD_CITIES, təkrarsız */
export function worldPoints() {
  const out = [], seen = new Set()
  const add = (name, lat, lng) => {
    const k = `${lat.toFixed(1)},${lng.toFixed(1)}`
    if (seen.has(k)) return
    seen.add(k); out.push({ name, lat, lng })
  }
  for (const c of PRAYER_CITIES) if (c.country !== 'AZ' || c.id === 'Baku') add(c.label?.en || c.id, c.lat, c.lng)
  for (const [name, lat, lng] of WORLD_CITIES) add(name, lat, lng)
  return out
}
