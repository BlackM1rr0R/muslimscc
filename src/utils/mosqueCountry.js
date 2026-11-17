// ═══════════════════════════════════════════════════════
// Məscid kolleksiyası — ölkə sərhədləri (world-atlas countries-110m, saytın öz faylı — xarici
// xidmət yoxdur) və "ziyarət etdim" qeydi. Tənbəl modul: d3-geo + topojson yalnız lazım olanda.
//   countryAt(lat, lon) → ISO 3166-1 rəqəmli kod ('031') | null (kiçik ada / dəniz — tapılmaya bilər)
//   checkInMosque({ osm, n, la, lo, no }) → { entry, added }
// ═══════════════════════════════════════════════════════
import { geoContains } from 'd3-geo'
import { feature } from 'topojson-client'
import countriesUrl from 'world-atlas/countries-110m.json?url'
import { addVisit, readVisits, writeVisits } from './mosqueVisits'
import { todayKey } from './iftarLog'

let loading = null

/** Ölkə sərhədləri (GeoJSON features) — bir dəfə yüklənir */
export function loadCountries() {
  if (!loading) {
    loading = fetch(countriesUrl)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((topo) => feature(topo, topo.objects.countries).features)
      .catch((e) => { loading = null; throw e })
  }
  return loading
}

export async function countryAt(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  try {
    const fs = await loadCountries()
    const f = fs.find((x) => x.id != null && geoContains(x, [lon, lat]))
    return f ? String(f.id).padStart(3, '0') : null
  } catch { return null }
}

/** OSM nəticəsinin id-si ('way5', 'node8', 'w5') → 'w5' */
export const osmShortId = (id) => {
  const m = /^(n|w|r)[a-z]*(\d+)$/.exec(String(id || ''))
  return m ? `${m[1]}${m[2]}` : null
}

export async function checkInMosque(m, today = todayKey()) {
  const la = Number(m.la), lo = Number(m.lo)
  const cc = await countryAt(la, lo)
  const { data, entry, added } = addVisit(readVisits(), { ...m, la, lo, cc: cc || undefined, osm: osmShortId(m.osm) || undefined }, today)
  if (entry) writeVisits(data)
  return { entry, added }
}
