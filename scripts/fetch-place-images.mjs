#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// YER FOTOLARI — bir dəfəlik skript: node scripts/fetch-place-images.mjs
//
// Wikimedia Commons-dan seçilmiş yer fotoşəkillərini (insan/heyvan təsviri
// olmayan və ya insanların uzaqdan seçilmədiyi kadrlar — Sələf mənhəci)
// çəkir, 3:2 nisbətinə kəsir və public/images/places/<açar>-{800,1600}.webp
// kimi yazır (hər biri ≤150 KB). Lisenziya HƏR fayl üçün API ilə yoxlanır:
// yalnız CC0 / Public domain / CC BY / CC BY-SA (NC, ND qəbul edilmir).
// Nəticə: src/data/imageCredits.js (müəllif, lisenziya, mənbə, ölçülər) —
// əl ilə dəyişmə, skripti yenidən işlət.
//
// Asılılıq: sharp (devDependency). Şəbəkə lazımdır.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/images/places')
const UA = { 'User-Agent': 'MuslimsCC-images/1.0 (https://muslims.cc)' }
const SIZES = [800, 1600]
const MAX_BYTES = 150 * 1024

// açar → Commons faylı; crop: əvvəlcə kəsiləcək hissə (nisbi), pos: 3:2 kəsimdə fokus
const IMAGES = [
  { key: 'masjid-al-haram', file: 'Masjidul-HaramAerialView (cropped).jpg', pos: 'centre' },
  { key: 'masjid-an-nabawi', file: 'Outsideofmasjedolnabi6.JPG', pos: 'centre' },
  { key: 'quba', file: 'Quba Mosque Full Picture (2024).jpg', pos: 'top' },
  { key: 'al-aqsa', file: 'Jerusalem-2013-Temple Mount-Al-Aqsa Mosque (NE exposure).jpg', pos: 'centre' },
  { key: 'jabal-an-nur', file: 'Jabal al-Nur, Mecca, Saudi Arabia (2).jpg', pos: 'centre' },
  { key: 'jabal-thawr', file: 'Jabele thor - panoramio.jpg', crop: { top: 0, height: 0.6 }, pos: 'centre' },
  { key: 'uhud', file: 'Mount Uhud Green.jpg', pos: 'top' },
  { key: 'badr', file: 'General view of the battlefield and burial ground of Badr, Saudi Arabia, site of the historic battle between the Prophet Muhammad and the Quraysh in 624 (4).jpg', pos: 'centre' },
  { key: 'mina', file: 'Mina Overview.JPG', pos: 'centre' },
  { key: 'al-baqi', file: 'Makam Al-Baqi (Umroh Ramadhan 2023)-9.jpg', pos: 'centre' },
  { key: 'taif', file: 'Al-Hada mountain road, al-Taif, Saudi Arabia (3).jpg', pos: 'centre' },
]

const strip = (html) => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

async function info(file) {
  const p = new URLSearchParams({
    action: 'query', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1920',
    titles: `File:${file}`, format: 'json',
  })
  const r = await (await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, { headers: UA })).json()
  const ii = Object.values(r.query.pages)[0].imageinfo?.[0]
  if (!ii) throw new Error(`tapılmadı: ${file}`)
  const m = ii.extmetadata || {}
  const license = strip(m.LicenseShortName?.value)
  if (!/^(CC0|Public domain|CC BY(-SA)? [\d.]+)/i.test(license) || /NC|ND/.test(license)) throw new Error(`lisenziya uyğun deyil: ${file} — ${license}`)
  return {
    url: ii.thumburl || ii.url,
    page: ii.descriptionurl,
    author: strip(m.Artist?.value).replace(/\s*\(talk\)$/, '') || 'Unknown',
    license,
    licenseUrl: m.LicenseUrl?.value || (/public domain/i.test(license) ? '' : ''),
  }
}

// Keyfiyyəti addım-addım endir (≥52); yenə böyükdürsə eni 8% kiçilt —
// detallı (daşlı, qumlu) kadrlarda 1600w ≤150 KB-a yalnız belə sığır
async function encode(img, w) {
  let q = 78
  let width = w
  for (;;) {
    const buf = await img.clone().resize({ width, height: Math.round(width * 2 / 3), fit: 'cover', withoutEnlargement: true }).webp({ quality: q, effort: 6 }).toBuffer()
    if (buf.length <= MAX_BYTES) return buf
    if (q > 52) q -= 6
    else width = Math.round(width * 0.92)
  }
}

fs.mkdirSync(OUT, { recursive: true })
const credits = []
for (const it of IMAGES) {
  const meta = await info(it.file)
  const src = Buffer.from(await (await fetch(meta.url, { headers: UA })).arrayBuffer())
  let img = sharp(src).rotate()
  const { width, height } = await img.metadata()
  if (it.crop) {
    const top = Math.round(height * it.crop.top)
    img = sharp(await img.extract({ left: 0, top, width, height: Math.round(height * it.crop.height) }).toBuffer())
  }
  // Əvvəlcə 3:2-yə kəs (fokus ilə), sonra hər ölçü
  const cw = (await img.metadata()).width
  const ch = (await img.metadata()).height
  const tw = Math.min(cw, Math.round(ch * 1.5))
  const based = sharp(await img.resize({ width: tw, height: Math.round(tw / 1.5), fit: 'cover', position: it.pos }).toBuffer())
  const out = { key: it.key, file: `File:${it.file}`, page: meta.page, author: meta.author, license: meta.license, licenseUrl: meta.licenseUrl, sizes: {} }
  for (const w of SIZES) {
    const buf = await encode(based, w)
    const m = await sharp(buf).metadata()
    fs.writeFileSync(path.join(OUT, `${it.key}-${w}.webp`), buf)
    out.sizes[w] = { w: m.width, h: m.height, kb: Math.round(buf.length / 1024) }
  }
  credits.push(out)
  console.log(it.key.padEnd(18), meta.license.padEnd(16), JSON.stringify(out.sizes), '·', meta.author)
}

const js = `// ═══════════════════════════════════════════════════════
// Yer fotoşəkillərinin atribusiyası — AVTOMATİK YARADILIB:
//   node scripts/fetch-place-images.mjs  (əl ilə dəyişmə)
// Mənbə: Wikimedia Commons; lisenziya hər fayl üçün API ilə yoxlanıb.
// CC BY / CC BY-SA müəllif və lisenziyanın göstərilməsini tələb edir —
// şəkil altında (PlacePhoto) və /licenses səhifəsində göstərilir.
// ═══════════════════════════════════════════════════════
export const IMAGE_CREDITS = ${JSON.stringify(Object.fromEntries(credits.map(c => [c.key, c])), null, 2)}
`
fs.writeFileSync(path.join(ROOT, 'src/data/imageCredits.js'), js)
console.log('yazıldı: src/data/imageCredits.js')
