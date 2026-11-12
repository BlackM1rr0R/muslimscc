// ═══════════════════════════════════════════════════════
// Ay tutulmaları 2026–2040 (v6.5) — components/LunarEclipses.jsx (/calendar)
//
// Mənbə: NASA Goddard, F. Espenak — "Decade Tables of Lunar Eclipses"
// (eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html, …2031.html; 2026-11-12 götürülüb, ictimai mülkiyyət).
// Yalnız kölgə (umbra) tutulmaları — qismən (P) və tam (T). Yarımkölgə tutulmaları gözlə demək olar
// seçilmir, siyahıda yoxdur.
// Sahələr: d — tarix (UTC), td — ən böyük fazanın anı (Yerin dinamik vaxtı, TD), t — növ,
// mag — kölgə fazası, par — qismən fazanın müddəti (dəq), tot — tam fazanın müddəti (dəq).
// ═══════════════════════════════════════════════════════
export const LUNAR_ECLIPSES = [
  { d: '2026-03-03', td: '11:34:52', t: 'T', mag: 1.151, par: 207, tot: 58 },
  { d: '2026-08-28', td: '04:14:04', t: 'P', mag: 0.930, par: 198, tot: 0 },
  { d: '2028-01-12', td: '04:14:13', t: 'P', mag: 0.066, par: 56, tot: 0 },
  { d: '2028-07-06', td: '18:20:57', t: 'P', mag: 0.389, par: 141, tot: 0 },
  { d: '2028-12-31', td: '16:53:15', t: 'T', mag: 1.246, par: 209, tot: 71 },
  { d: '2029-06-26', td: '03:23:22', t: 'T', mag: 1.844, par: 220, tot: 102 },
  { d: '2029-12-20', td: '22:43:12', t: 'T', mag: 1.117, par: 213, tot: 54 },
  { d: '2030-06-15', td: '18:34:34', t: 'P', mag: 0.502, par: 144, tot: 0 },
  { d: '2032-04-25', td: '15:14:51', t: 'T', mag: 1.191, par: 211, tot: 66 },
  { d: '2032-10-18', td: '19:03:40', t: 'T', mag: 1.103, par: 196, tot: 47 },
  { d: '2033-04-14', td: '19:13:51', t: 'T', mag: 1.094, par: 215, tot: 49 },
  { d: '2033-10-08', td: '10:56:23', t: 'T', mag: 1.350, par: 202, tot: 79 },
  { d: '2034-09-28', td: '02:47:37', t: 'P', mag: 0.014, par: 27, tot: 0 },
  { d: '2035-08-19', td: '01:12:15', t: 'P', mag: 0.104, par: 77, tot: 0 },
  { d: '2036-02-11', td: '22:13:06', t: 'T', mag: 1.299, par: 202, tot: 74 },
  { d: '2036-08-07', td: '02:52:32', t: 'T', mag: 1.454, par: 231, tot: 95 },
  { d: '2037-01-31', td: '14:01:38', t: 'T', mag: 1.207, par: 197, tot: 64 },
  { d: '2037-07-27', td: '04:09:53', t: 'P', mag: 0.809, par: 192, tot: 0 },
  { d: '2039-06-06', td: '18:54:25', t: 'P', mag: 0.885, par: 179, tot: 0 },
  { d: '2039-11-30', td: '16:56:28', t: 'P', mag: 0.943, par: 206, tot: 0 },
  { d: '2040-05-26', td: '11:46:22', t: 'T', mag: 1.535, par: 211, tot: 92 },
  { d: '2040-11-18', td: '19:04:41', t: 'T', mag: 1.397, par: 220, tot: 88 },
]
