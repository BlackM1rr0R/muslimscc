#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// DİL TƏMİZLİYİ YOXLAYICISI — node scripts/check-lang.mjs
//
// Çoxdilli məzmunda (az / en / ru / tr / ar) hər dilin mətni yalnız öz
// dilində olmalıdır: az mətnində türkcə söz, tr mətnində "ə", ru mətnində
// latın sözü və s. olmamalıdır; əskik tərcümə başqa dillə əvəz olunmamalıdır.
//
// Necə işləyir
// • Fayl JS/JSX kimi tokenlərə bölünür (JSX varsa əvvəlcə esbuild ilə adi
//   JS-ə çevrilir, sətir nömrəsi source map-dən bərpa olunur; esbuild yoxdursa
//   xam mətn oxunur). Asılılıq əlavə edilmir — esbuild Vite ilə gəlir.
// • Sətir "dil kontekstində"dirsə yoxlanır:
//     { az:'…', en:'…' }           — dil açarı (az, en_desc, ar_title …)
//     az: { title:'…' }, az: ['…']  — dil açarının altındakı hər şey
//     lang === 'tr' ? '…' : …       — ternar zəncir (son "else" qalan dillərə)
// • "source" sahəsi (hədis/dua/sitat mənbəyi) src/utils/sourceNames.js-in
//   localizeSource() funksiyası ilə hər dilə çevrilib yoxlanır.
// • Obyektdə dil açarlarından biri yoxdursa (və ya boşdursa) — "missing";
//   iki dilin mətni eynidirsə — "identical" (tərcümə edilməyib).
//
// İstisna: pozuntu olan sətirdə və ya bir sətir yuxarıda
//   // lang-ok: <səbəb>                 — həmin sətirdəki bütün pozuntular
//   // lang-ok[Söz1,Söz2]: <səbəb>     — yalnız nümunəsində bu sözlər olanlar
// şərhi olsun. Minimal işlət — səbəb mütləq yazılsın.
//
// İstifadə
//   node scripts/check-lang.mjs                    — hamısı; pozuntu varsa exit 1
//   node scripts/check-lang.mjs --only=hadiths      — yolunda "hadiths" olanlar
//   node scripts/check-lang.mjs --only=src/data,src/pages/QuranPage.jsx
//   node scripts/check-lang.mjs --report out.json   — tam siyahı JSON-a
//   node scripts/check-lang.mjs --max=20            — hər fayl üçün çap limiti
//   node scripts/check-lang.mjs --summary           — yalnız cədvəl
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const require = createRequire(import.meta.url)

// ── Arqumentlər ──
const argv = process.argv.slice(2)
const opt = { only: [], report: null, max: 30, summary: false }
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a.startsWith('--only=')) opt.only.push(...a.slice(7).split(',').filter(Boolean))
  else if (a === '--only') opt.only.push(...String(argv[++i] || '').split(',').filter(Boolean))
  else if (a.startsWith('--report=')) opt.report = a.slice(9)
  else if (a === '--report') opt.report = argv[++i]
  else if (a.startsWith('--max=')) opt.max = Number(a.slice(6)) || 0
  else if (a === '--summary') opt.summary = true
  else if (a === '-h' || a === '--help') {
    console.log('node scripts/check-lang.mjs [--only=<yol,...>] [--report <fayl.json>] [--max=N] [--summary]')
    process.exit(0)
  }
}

// ── Yoxlanan fayllar ──
const SCAN_DIRS = ['src/data', 'src/pages', 'src/components', 'src/seo', 'src/utils', 'mobile/src']
const SKIP_DIRS = new Set(['node_modules', 'firebase', 'assets', 'theme'])
function walk(dir, out) {
  const abs = path.join(ROOT, dir)
  if (!fs.existsSync(abs)) return
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out) }
    else if (/\.(jsx?|mjs)$/.test(e.name)) out.push(path.join(dir, e.name).replace(/\\/g, '/'))
  }
}
let FILES = []
for (const d of SCAN_DIRS) walk(d, FILES)
if (opt.only.length) FILES = FILES.filter(f => opt.only.some(o => f.includes(o.replace(/\\/g, '/'))))

// ═══ Hərf sinifləri və söz siyahıları ═══
const L = '\\p{L}\\p{M}'
// Unicode söz sərhədi (\b ə/ı/ş-də işləmir); apostrof sözün içidir: "I've", "Qur'an"
const W = (words) => new RegExp(`(?<![${L}'’])(?:${words.join('|')})(?![${L}'’])`, 'giu')

// Yalnız türkcədə olan sözlər (az-da qarşılığı başqadır: və, ilə, üçün, deyil …)
const TR_ONLY = [
  've', 'ile', 'için', 'icin', 'değil', 'değildir', 'değildi', 'gibi', 'kadar', 'olarak', 'çok',
  'şöyle', 'böyle', 'öyle', 'veya', 'ama', 'şu', 'şunu', 'şunlar', 'şunları', 'hiç', 'eğer', 'yani',
  'nasıl', 'neden', 'niçin', 'çünkü', 'şimdi', 'bugün', 'yok', 'evet', 'iyi', 'kötü', 'büyük', 'küçük',
  'güzel', 'kendi', 'kendisi', 'kendine', 'kendini', 'hep', 'ancak', 'fakat', 'sadece', 'bile', 'herkes',
  'önce', 'yapmak', 'yaptı', 'yapar', 'yapan', 'yapın', 'yapılır', 'yaparsa', 'peygamber', 'efendimiz',
  'hazret', 'hazreti', 'cennet', 'cehennem', 'melek', 'melekler', 'kuran', 'ayet', 'ayetler', 'hadis',
  'zaman', 'olsun', 'gelir', 'eder', 'etti', 'eden', 'ederse', 'ettiği', 'oldu', 'sivrisinek', 'önemli',
  'diye', 'dedi', 'sonra', 'daha', 'bir', 'her', 'en', 'bu', 'onu', 'ona', 'onun', 'ben', 'sen', 'biz',
]
// Yuxarıdakılardan az-da da işlənənlər — az mətnində türkcə izi SAYILMIR
const BOTH_AZ_TR = new Set(['zaman', 'olsun', 'sonra', 'daha', 'bir', 'bu', 'onu', 'ona', 'onun', 'biz', 'oldu', 'dedi'])
const TR_IN_AZ = W(TR_ONLY.filter(w => !BOTH_AZ_TR.has(w)))
// az mətnində türkcə apostrof şəkilçisi: "Allah'ın", "Kur'an'da"
const TR_APOS = new RegExp(`\\p{Lu}[${L}]{2,}['’](?:ın|in|un|ün|a|e|ya|ye|da|de|ta|te|dan|den|tan|ten|ı|i|u|ü|yı|yi|yu|yü|nın|nin|nun|nün|la|le|yla|yle|dır|dir|tır|tir|lar|ler|ına|ine|ına|una|üne|ındaki|indeki|daki|deki|ın)(?![${L}])`, 'gu')

// Yalnız az-da olan sözlər (tr/en/ru mətnində az izi)
const AZ_ONLY = ['və', 'ilə', 'üçün', 'deyil', 'deyildir', 'çox', 'heç', 'yox', 'edir', 'edən', 'edər', 'olaraq', 'necə', 'yaxşı', 'böyük', 'kiçik', 'həm', 'həmin', 'lakin', 'bütün', 'hər', 'ən']
const AZ_IN_TR = W(AZ_ONLY.filter(w => !['lakin', 'bütün'].includes(w)))
const AZTR_IN_EN = W(['və', 've', 'ilə', 'ile', 'üçün', 'için', 'deyil', 'değil', 'bir', 'çox', 'çok', 'heç', 'hiç', 'gibi', 'kimi', 'olan', 'olaraq', 'olarak', 'bu', 'ən'])
// İngilis köməkçi sözləri — az/tr/ru mətnində ingilis sızması
// ("her", "on", "and", "his", "in" kimi tr/az-da da söz olanlar çıxarılıb)
const EN_WORDS = W(['the', 'of', 'is', 'are', 'to', 'with', 'for', 'you', 'your', 'who', 'which', 'that', 'this', 'from', 'will', 'was', 'were', 'their', 'not', 'she', 'have', 'has'])

// az-da "e" hərfi adətən yalnız birinci hecada olur; sonrakı hecada "e" —
// türkcə şəkilçi/yazılış izidir: "zikrinde", "sözlerin", "önemli", "Firdevs".
// Burada az-ın öz alınma sözləri və et-/ed- birləşmələri istisnadır.
const AZ_E_OK = /^(saleh|qane|valideyn|mane|əleyh|aleyh|əleyk|aleyk|ileyk|tabe|laqeyd|teleqram|telefon|internet|proyekt|kilometr|santimetr|sekund|detal|element|effekt|problem|sistem|model|seriya|seans|qrafik|interfeys|versiya|kateqoriya|test|teatr|tekst|redaktə|resept|reklam|rejim|region|respublika|reytinq|komment|kompleks|kontekst|qeyd|qeyri|beynəlxalq|feysbuk|youtube|ehtiyac|ehtiram|ehtimal|ehtiyat|mesaj|meyit|meyvə|meydan|sevgi|seyr|neyin|heyvan|heyrət|deyə|beyt|beyin|geyim|geyin|qeyb|leyl|leylət|leyla|şeyx|şeytan|meyl|seçe|eyni|imperat|strateg|federa|proses|priorit|video|disleks|aprel|metr|fateh|diyanet|kapitel|kateq|aspekt|kredit|paket|premium|protokol|efekt|ekspert|planet|rekord|sement|telev|kabinet|kontent|veb|onlayn|tablet|komplekt|imperi|napoleon|toleran|iberi|akademi|ekstrem|kollekt|kolleks|tale$|tale[lnsy]|panel|translit|tualet|martel|mövqe|sileyi|təsbeh|kvadrat|konfedera|prosedur|investis|bonapart|modern|sentyabr|oktyabr|noyabr|dekabr|fevral|aprel|avqust|tərcümey|kateqori|mobil|demokrat|elektron|ekoloji|enerji|generasiya|kompüter|maneə|parametr|server|brauzer|planşet|generator|universitet|amerika|intellekt|okean|lisenz|istehlak|kommers)/
const AZ_E_COMPOUND = /\p{L}{2,}(?:edici|edən|etmə|edir|etdi|edər|edil|edə|verən|verici|sevər|sevən)/u
function azTurkishSpelling(s) {
  for (const w of s.match(/[\p{L}]+/gu) || []) {
    if (/^\p{Lu}{2,}$/u.test(w)) continue // qısaltma
    if (LATIN_OK.has(w.toLowerCase()) || /^\p{Lu}\p{Ll}+\p{Lu}/u.test(w)) continue // brend: Firebase, OpenStreetMap
    const lw = w.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
    // birinci saitdən sonrakı "e" — "ey/ye" diftonqu (Hüseyn, Qüreyş, Umeyr) və "-yev" soyadı istisna
    const rest = lw.replace(/^[^aeıioöuüə]*[aeıioöuüə]/, '').replace(/ey|ye|yev$/g, '')
    if (!rest.includes('e')) continue
    if (AZ_E_OK.test(lw) || AZ_E_COMPOUND.test(lw)) continue
    return w
  }
  return null
}

const RX_CYR = /[Ѐ-ӿ]/
const RX_ARAB = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/
const RX_ARAB_G = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g
const RX_SCHWA = /[əƏ]/
const RX_CIRC = /[âîûÂÎÛ]/
const RX_LATIN_WORD = /(?<![\p{L}\p{M}])[A-Za-zÀ-ÖØ-öø-ɏḀ-ỿ][A-Za-zÀ-ÖØ-öø-ɏḀ-ỿ'’-]*(?![\p{L}\p{M}])/gu

// ru və ar mətnində icazəli latın sözləri (qısaltmalar, brendlər, vahidlər)
const LATIN_OK = new Set([
  'pdf', 'sms', 'gps', 'qr', 'ai', 'id', 'url', 'ok', 'wi-fi', 'wifi', 'ios', 'android', 'google', 'youtube',
  'instagram', 'facebook', 'whatsapp', 'telegram', 'tiktok', 'twitter', 'x', 'firebase', 'muslims', 'cc',
  'muslims.cc', 'km', 'kg', 'g', 'm', 'h', 'min', 'am', 'pm', 'gmt', 'utc', 'i', 'ii', 'iii', 'iv', 'v', 'vi',
  'vii', 'viii', 'ix', 'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx', 'xxi', 'azn',
  'usd', 'eur', 'try', 'rub', 'sar', 'api', 'apple', 'play', 'store', 'app', 'claude', 'anthropic', 'ics',
  'csv', 'json', 'png', 'jpg', 'mp3', 'mp4', 'html', 'www', 'https', 'http', 'com', 'org', 'az', 'en', 'ru',
  'tr', 'ar', 'c', 'n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se', 'n/a', 'cdn', 'openstreetmap', 'javascript',
  'rtl', 'ltr',
])

// Göstərilən mətn deyil: kod, açar, URL, rəng, yol …
function isCodeLike(s) {
  const t = s.trim()
  if (!t) return true
  if (!/[\p{L}]/u.test(t)) return true
  if (/^(https?:|mailto:|tel:|data:|\/|#|\.\/|\.\.\/)/.test(t)) return true
  if (/^[a-z][a-zA-Z0-9]*$/.test(t) && /[A-Z]/.test(t)) return true // camelCase
  if (/^[a-z0-9_\-.:/#?=&%]+$/.test(t) && /[-_./:#]/.test(t)) return true
  if (/^[A-Z_]{2,}$/.test(t)) return true
  if (/^[a-z]{2,3}(-[A-Z][A-Za-z]{1,3})?$/.test(t) && /-/.test(t)) return true // ru-RU, az-Latn
  if (/^[a-z]{2}\.[a-z-]+(,[a-z]{2}\.[a-z-]+|,\{\})*$/.test(t)) return true // ar.alafasy,ar.muyassar
  if (/^[a-z]{2}_[A-Z]{2}$/.test(t)) return true // og:locale — ar_SA
  return false
}

const letterCount = (s, re) => (s.match(re) || []).length

// ── Bir sətrin dil yoxlaması → [{ rule, sample }] ──
function checkText(lang, raw) {
  const out = []
  if (isCodeLike(raw)) return out
  // Göstərilən mətnin parçası olmayanlar: {city} kimi yer tutucular və domen adları (aladhan.com)
  const s = String(raw).replace(/\{\w*\}/g, ' ').replace(/(?<![\p{L}\p{M}])[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|net|cc|az|io|app)(?![\p{L}\p{M}])/gu, ' ')
  if (isCodeLike(s)) return out
  const add = (rule, sample) => out.push({ rule, sample })
  const firstMatch = (re) => { re.lastIndex = 0; const m = re.exec(s); re.lastIndex = 0; return m ? m[0] : null }

  if (lang !== 'ru' && RX_CYR.test(s)) add('cyrillic', s.match(RX_CYR)[0])
  if (lang === 'az') {
    let m
    if (RX_CIRC.test(s)) add('tr-circumflex', s.match(RX_CIRC)[0])
    if ((m = firstMatch(TR_IN_AZ))) add('tr-word', m)
    if ((m = firstMatch(TR_APOS))) add('tr-apostrophe', m)
    const letters = letterCount(s, /[\p{L}]/gu) - letterCount(s, RX_ARAB_G)
    if (letters >= 100 && !/[əƏqQxX]/.test(s)) add('az-without-ə', s.slice(0, 40))
    if ((m = azTurkishSpelling(s))) add('tr-spelling', m)
    const en = s.match(EN_WORDS) || []
    if (en.length >= 2) add('en-words', en.slice(0, 3).join(' '))
  } else if (lang === 'tr') {
    let m
    if (RX_SCHWA.test(s)) add('az-ə', s.match(RX_SCHWA)[0])
    if ((m = firstMatch(AZ_IN_TR))) add('az-word', m)
    const qx = (s.match(/(?<![\p{L}\p{M}'’])[\p{L}'’]*[qxQX][\p{L}'’]*/gu) || []).filter(w => !/^(x+|qr|xi+|xv|xx|xl|qatar|iqra|taqwa|max)$/i.test(w))
    if (qx.length) add('az-letter-qx', qx[0])
    const en = s.match(EN_WORDS) || []
    if (en.length >= 2) add('en-words', en.slice(0, 3).join(' '))
  } else if (lang === 'en') {
    let m
    if (RX_SCHWA.test(s)) add('az-ə', s.match(RX_SCHWA)[0])
    const tw = s.match(/(?<![\p{L}\p{M}])[\p{L}'’]*[ıİğĞşŞ][\p{L}'’]*/gu)
    if (tw) add('tr/az-letter', tw[0])
    if ((m = firstMatch(AZTR_IN_EN))) add('az/tr-word', m)
  } else if (lang === 'ru') {
    if (/[əƏığĞşŞ]/.test(s)) add('az/tr-letter', s.match(/[əƏığĞşŞ]/)[0])
    const words = (s.match(RX_LATIN_WORD) || []).filter(w => !LATIN_OK.has(w.toLowerCase().replace(/[’']/g, "'")))
    if (words.length) add('latin-word', words.slice(0, 3).join(' '))
  } else if (lang === 'ar') {
    if (RX_SCHWA.test(s)) add('az-ə', 'ə')
    const words = (s.match(RX_LATIN_WORD) || []).filter(w => !LATIN_OK.has(w.toLowerCase()))
    if (words.length) add('latin-word', words.slice(0, 3).join(' '))
    else if (!RX_ARAB.test(s) && /[\p{L}]{3}/u.test(s.replace(RX_LATIN_WORD, w => LATIN_OK.has(w.toLowerCase()) ? '' : w))) add('not-arabic', s.slice(0, 40))
  }
  return out
}

// ═══ Tokenizer ═══
// Tokenlər: { t:'s'|'i'|'n'|'p', v, pos }  (s — sətir/şablon, i — identifikator)
const ID_START = /[\p{L}_$]/u
const ID_PART = /[\p{L}\p{N}_$‌‍]/u
const REGEX_PREV_ID = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await'])
const PUNCT3 = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=']
const PUNCT2 = ['=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '**']

function tokenize(src) {
  const toks = []
  let i = 0
  const n = src.length
  const prevSig = () => toks[toks.length - 1]
  const regexAllowed = () => {
    const p = prevSig()
    if (!p) return true
    if (p.t === 'p') return !(p.v === ')' || p.v === ']' || p.v === '}')
    if (p.t === 'i') return REGEX_PREV_ID.has(p.v)
    return false
  }
  function readString(q) {
    const start = i
    i++
    let v = ''
    while (i < n) {
      const c = src[i]
      if (c === '\\') {
        const d = src[i + 1]
        const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }
        if (d === 'u') {
          if (src[i + 2] === '{') { const e = src.indexOf('}', i); v += String.fromCodePoint(parseInt(src.slice(i + 3, e), 16)); i = e + 1 }
          else { v += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16)); i += 6 }
          continue
        }
        if (d === 'x') { v += String.fromCharCode(parseInt(src.slice(i + 2, i + 4), 16)); i += 4; continue }
        if (d === '\r' || d === '\n') { i += 2; continue }
        v += map[d] ?? d
        i += 2
        continue
      }
      if (c === q) { i++; break }
      v += c
      i++
    }
    toks.push({ t: 's', v, pos: start })
  }
  function readTemplate() {
    const start = i
    i++
    let v = ''
    const inner = []
    while (i < n) {
      const c = src[i]
      if (c === '\\') { v += src[i + 1]; i += 2; continue }
      if (c === '`') { i++; break }
      if (c === '$' && src[i + 1] === '{') {
        // ${ … } — içini ayrıca tokenlə
        let depth = 1, j = i + 2
        while (j < n && depth) {
          const d = src[j]
          if (d === '{') depth++
          else if (d === '}') depth--
          else if (d === "'" || d === '"' || d === '`') {
            // içdəki sətri ötür
            const q = d; j++
            while (j < n && src[j] !== q) { if (src[j] === '\\') j++; j++ }
          }
          j++
        }
        const sub = tokenize(src.slice(i + 2, j - 1)).map(t => ({ ...t, pos: t.pos + i + 2 }))
        inner.push(...sub)
        v += '{}'
        i = j
        continue
      }
      v += c
      i++
    }
    toks.push({ t: 's', v, pos: start, tpl: true })
    if (inner.length) { toks.push({ t: 'p', v: '(', pos: start }); toks.push(...inner); toks.push({ t: 'p', v: ')', pos: start }) }
  }
  while (i < n) {
    const c = src[i]
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '﻿') { i++; continue }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue }
    if (c === "'" || c === '"') { readString(c); continue }
    if (c === '`') { readTemplate(); continue }
    if (c === '/' && regexAllowed()) {
      let j = i + 1, cls = false
      while (j < n) {
        const d = src[j]
        if (d === '\\') { j += 2; continue }
        if (d === '\n') break
        if (cls) { if (d === ']') cls = false }
        else if (d === '[') cls = true
        else if (d === '/') break
        j++
      }
      j++
      while (j < n && /[a-z]/i.test(src[j])) j++
      toks.push({ t: 'r', v: src.slice(i, j), pos: i })
      i = j
      continue
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) {
      let j = i + 1
      while (j < n && /[0-9a-zA-Z_.]/.test(src[j])) j++
      toks.push({ t: 'n', v: src.slice(i, j), pos: i })
      i = j
      continue
    }
    if (ID_START.test(c)) {
      let j = i + 1
      while (j < n && ID_PART.test(src[j])) j++
      toks.push({ t: 'i', v: src.slice(i, j), pos: i })
      i = j
      continue
    }
    const p3 = PUNCT3.find(p => src.startsWith(p, i))
    if (p3) { toks.push({ t: 'p', v: p3, pos: i }); i += p3.length; continue }
    const p2 = PUNCT2.find(p => src.startsWith(p, i))
    if (p2) { toks.push({ t: 'p', v: p2, pos: i }); i += 2; continue }
    toks.push({ t: 'p', v: c, pos: i })
    i++
  }
  return toks
}

// ═══ esbuild (JSX → JS) və source map ═══
let esbuild = null
try { esbuild = require('esbuild') } catch { esbuild = null }

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function decodeMappings(mappings) {
  // → hər çıxış sətri üçün [[genCol, srcLine], …]
  const lines = []
  let srcLine = 0, srcCol = 0, srcIdx = 0, name = 0
  for (const lineStr of mappings.split(';')) {
    const segs = []
    let genCol = 0
    if (lineStr) for (const seg of lineStr.split(',')) {
      const vals = []
      let shift = 0, value = 0
      for (const ch of seg) {
        let d = B64.indexOf(ch)
        const cont = d & 32
        d &= 31
        value += d << shift
        if (cont) shift += 5
        else { vals.push(value & 1 ? -(value >>> 1) : value >>> 1); value = 0; shift = 0 }
      }
      genCol += vals[0]
      if (vals.length >= 4) { srcIdx += vals[1]; srcLine += vals[2]; srcCol += vals[3]; if (vals.length === 5) name += vals[4]; segs.push([genCol, srcLine]) }
    }
    lines.push(segs)
  }
  return lines
}

function lineStarts(text) {
  const a = [0]
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) a.push(i + 1)
  return a
}
function posToLineCol(starts, pos) {
  let lo = 0, hi = starts.length - 1
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= pos) lo = mid; else hi = mid - 1 }
  return [lo, pos - starts[lo]]
}

function prepare(rel, original) {
  const needsJsx = /\.jsx$/.test(rel) || /<\/?[A-Za-z][^>]*>/.test(original) && /\breturn\s*\(|=>\s*\(?\s*</.test(original)
  if (esbuild && needsJsx) {
    try {
      const r = esbuild.transformSync(original, { loader: 'jsx', charset: 'utf8', sourcemap: 'external', sourcefile: rel, jsx: 'transform' })
      const map = JSON.parse(r.map)
      const segs = decodeMappings(map.mappings)
      const starts = lineStarts(r.code)
      return {
        code: r.code,
        lineOf(pos) {
          const [l, c] = posToLineCol(starts, pos)
          let best = null
          for (let k = l; k >= 0 && best == null; k--) {
            const s = segs[k] || []
            for (const [gc, sl] of s) { if (k < l || gc <= c) best = sl }
          }
          return (best ?? l) + 1
        },
      }
    } catch { /* xam mətnə düş */ }
  }
  const starts = lineStarts(original)
  return { code: original, lineOf: (pos) => posToLineCol(starts, pos)[0] + 1 }
}

// ═══ Mənbə adları (localizeSource) ═══
let localizeSource = null
try {
  localizeSource = (await import(pathToFileURL(path.join(ROOT, 'src/utils/sourceNames.js')).href)).localizeSource
} catch { localizeSource = null }

function checkSource(src) {
  const out = []
  if (!localizeSource || !src || isCodeLike(src)) return out
  for (const lang of ['en', 'ru', 'tr', 'ar']) {
    const s = localizeSource(src, lang)
    let bad = null
    if (lang === 'en') bad = s.match(/[əƏığĞşŞöÖüÜçÇ]/)
    else if (lang === 'tr') bad = s.match(/[əƏ]|(?<![\p{L}])[\p{L}]*[qxQX][\p{L}]*/u)
    else if (lang === 'ru' || lang === 'ar') bad = s.match(/[A-Za-zəƏıİğĞşŞöÖüÜçÇ][\p{L}'’-]*/u)
    if (bad) out.push({ lang, rule: 'source-untranslated', sample: `${src} → ${s}` })
  }
  return out
}

// ═══ Faylın analizi ═══
const LANG_KEY = /^(az|en|ru|tr|ar)(?:_(\w+))?$/
// Bəzi fayllarda dil adlı açar dil mətni deyil — açıq siyahı
const NOT_LANG_KEYS = {
  // NAMES_99: "tr" türkcə deyil, latın transliterasiyasıdır (Ar-Rahman) — hər dildə göstərilir
  'src/data/names99.js': ['tr'],
}
// Açar başqa adla yazılmış dil sahəsidir: { fayl: { açar: dil } }
const LANG_ALIASES = {
  // NAMES_99: türkcə məna "tr_meaning"-dədir (çünki "tr" transliterasiyadır)
  'src/data/names99.js': { tr_meaning: 'tr' },
  'mobile/src/screens/NamesScreen.js': { tr_meaning: 'tr' },
}
// "missing" yoxlanmayan fayllar: az → digər dillər tərcümə cədvəlləri (az açarı yoxdur)
const SKIP_MISSING = ['src/utils/sourceNames.js']
const LANG_ID = new Set(['lang', 'language', 'l', 'lng', 'locale', 'currentLang', 'curLang'])

function analyze(rel) {
  const original = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  const origLines = original.split(/\r?\n/)
  const { code, lineOf } = prepare(rel, original)
  const aliases = Object.assign({}, ...Object.entries(LANG_ALIASES).filter(([f]) => rel.endsWith(f)).map(([, a]) => a))
  const skipMissing = SKIP_MISSING.some(f => rel.endsWith(f))
  const notLang = new Set(Object.entries(NOT_LANG_KEYS).filter(([f]) => rel.endsWith(f)).flatMap(([, ks]) => ks))
  const toks = tokenize(code)
  const viol = []
  const okRule = (txt, v) => {
    const m = /lang-ok(?:\[([^\]]*)\])?\s*:/.exec(txt || '')
    if (!m) return false
    if (!m[1]) return true
    return m[1].split(',').map(w => w.trim()).filter(Boolean).some(w => String(v.sample).includes(w))
  }
  const isOk = (v) => okRule(origLines[v.line - 1], v) || (/^\s*(\/\/|\{\/\*)/.test(origLines[v.line - 2] || '') && okRule(origLines[v.line - 2], v))
  const push = (v) => { if (!isOk(v)) viol.push({ file: rel, ...v }) }

  // 1) Ternar zəncirlər: lang === 'xx' ? '…' : lang === 'yy' ? '…' : '…'
  const override = new Map()
  const chainCmp = new Set() // zəncirə artıq daxil olmuş müqayisələr
  const isLangCmp = (k) => {
    const a = toks[k], b = toks[k + 1], c = toks[k + 2], d = toks[k + 3]
    if (!a || !b || !c || !d) return null
    if (a.t === 'i' && LANG_ID.has(a.v) && (b.v === '===' || b.v === '==') && c.t === 's' && LANGS.includes(c.v) && d.v === '?') return c.v
    return null
  }
  for (let k = 0; k < toks.length; k++) {
    const first = isLangCmp(k)
    if (!first) continue
    if (chainCmp.has(k)) continue // zəncirin ortası
    const set = new Set()
    let j = k
    while (true) {
      const lg = isLangCmp(j)
      if (!lg) break
      chainCmp.add(j)
      set.add(lg)
      const val = toks[j + 4]
      if (val && val.t === 's' && toks[j + 5] && toks[j + 5].v === ':') override.set(j + 4, [lg])
      else break
      const nx = j + 6
      if (isLangCmp(nx)) { j = nx; continue }
      const e = toks[nx]
      if (e && e.t === 's' && !(toks[nx + 1] && ['?', '===', '==', '+', '.'].includes(toks[nx + 1].v))) {
        override.set(nx, LANGS.filter(x => !set.has(x)))
      }
      break
    }
  }

  // 2) Kontekst yığını
  const objects = []
  const root = { open: null, lang: null, valueLang: null, expectKey: false, entries: [], keys: new Set(), parent: null, key: null }
  const stack = [root]
  let curKey = null
  for (let k = 0; k < toks.length; k++) {
    const tk = toks[k]
    const top = stack[stack.length - 1]
    if (tk.t === 'p') {
      if (tk.v === '{' || tk.v === '[' || tk.v === '(') {
        const fr = { open: tk.v, lang: top.valueLang ?? top.lang, valueLang: null, expectKey: tk.v === '{', entries: [], keys: new Set(), parent: top, key: top.curKey ?? null, line: null, pos: tk.pos }
        if (tk.v === '{') {
          objects.push(fr)
          // { az: { … }, en: { … } } — dil alt-obyektləri (açar dəstləri müqayisə olunur)
          if (top.valueLang && top.open === '{' && LANG_KEY.test(top.curKey || '') && !/_/.test(top.curKey)) {
            top.langChildren = top.langChildren || {}
            top.langChildren[top.curKey] = fr
            fr.firstLine = lineOf(tk.pos)
          }
        }
        stack.push(fr)
        continue
      }
      if (tk.v === '}' || tk.v === ']' || tk.v === ')') {
        if (stack.length > 1) stack.pop()
        continue
      }
      if (tk.v === ',') {
        top.valueLang = null
        top.curKey = null
        if (top.open === '{') top.expectKey = true
        continue
      }
      if (tk.v === '...') { top.expectKey = false; continue }
      continue
    }
    // açar?
    if (top.open === '{' && top.expectKey && (tk.t === 'i' || tk.t === 's' || tk.t === 'n') && toks[k + 1] && toks[k + 1].v === ':') {
      const key = tk.v
      top.keys.add(key)
      top.curKey = key
      top.expectKey = false
      const m = aliases[key] ? [key, aliases[key], ''] : notLang.has(key) ? null : LANG_KEY.exec(key)
      top.valueLang = m ? m[1] : null
      if (m) {
        const val = toks[k + 2]
        const simple = val && val.t === 's' && toks[k + 3] && [',', '}'].includes(toks[k + 3].v)
        top.entries.push({ lang: m[1], field: m[2] || '', value: simple ? val.v : null, line: lineOf((val || tk).pos), complex: !simple })
      }
      k++ // ':' ötür
      continue
    }
    if (top.open === '{' && top.expectKey) top.expectKey = false
    if (tk.t !== 's') continue

    // sətir
    const langs = override.get(k) || ((top.valueLang ?? top.lang) ? [top.valueLang ?? top.lang] : null)
    const line = lineOf(tk.pos)
    if (langs) {
      for (const lg of langs) {
        for (const r of checkText(lg, tk.v)) push({ line, lang: lg, rule: override.has(k) && langs.length > 1 ? `fallback:${r.rule}` : r.rule, sample: r.sample, text: tk.v.slice(0, 160) })
      }
    } else if (top.curKey === 'source' && top.open === '{' && toks[k + 1] && [',', '}'].includes(toks[k + 1].v)) {
      for (const r of checkSource(tk.v)) push({ line, lang: r.lang, rule: r.rule, sample: r.sample })
    }
  }

  // 3) Əskik / eyni tərcümələr
  for (const o of objects) {
    // LABELS = { az:{a,b}, en:{a} } — bir dildə açar yoxdursa o sətir boş/başqa dildə görünür
    if (o.langChildren && Object.keys(o.langChildren).length >= 3) {
      const all = new Set(Object.values(o.langChildren).flatMap(c => [...c.keys]))
      for (const [lg, c] of Object.entries(o.langChildren)) {
        const miss = [...all].filter(k => !c.keys.has(k))
        if (miss.length) push({ line: c.firstLine, lang: lg, rule: 'missing-key', sample: `${lg}: ${miss.slice(0, 6).join(', ')}${miss.length > 6 ? ' …' : ''}` })
      }
      // { az:{…}, en:{…}, ru:{…} } — bütöv dil bloku yoxdursa, kod "|| LABELS.az" ilə başqa dilə düşür
      for (const lg of LANGS) {
        if (!o.langChildren[lg] && !o.keys.has(lg)) push({ line: o.langChildren[Object.keys(o.langChildren)[0]].firstLine, lang: lg, rule: 'missing-lang', sample: `{ ${Object.keys(o.langChildren).join(', ')} } — ${lg} bloku yoxdur` })
      }
    }
    const groups = new Map()
    for (const e of o.entries) {
      if (!groups.has(e.field)) groups.set(e.field, [])
      groups.get(e.field).push(e)
    }
    for (const [field, es] of groups) {
      // boş sahə — yalnız başqa dil doludursa (forma şablonu {az:'', en:''} deyil)
      if (es.some(e => e.value && e.value.trim())) {
        for (const e of es) if (e.value != null && !e.value.trim()) push({ line: e.line, lang: e.lang, rule: 'empty', sample: `${e.lang}: '' (başqa dillər dolu)` })
      }
      const filled = new Set(es.filter(e => e.complex || (e.value && e.value.trim())).map(e => e.lang))
      // "en_desc" kimi sahə "en"-in əvəzidir (KidsPage: obj.en_desc || obj.en)
      const have = new Set([...es.map(e => e.lang), ...o.entries.filter(e => e.field === 'desc').map(e => e.lang)])
      if (field !== '' || filled.size < 2) continue
      // { az:'az.mammadaliyev', en:'en.asad' } — kod/nəşr xəritəsi, mətn deyil
      if (es.every(e => e.value != null && isCodeLike(e.value))) continue
      // ar: obyektdə və ya valideyndə ərəb mətni (ar/arabic) varsa ar-sız obyekt normaldır
      const parentHasAr = o.parent && (o.parent.keys.has('ar') || o.parent.keys.has('arabic'))
      const need = ['az', 'en', 'ru', 'tr']
      if (!parentHasAr && !o.keys.has('arabic')) need.push('ar')
      // yalnız {az, en} kimi cüt — məqsədli ikidilli sahə ola bilər; 3+ dil olanda tələb et
      if (have.size < 3 && !have.has('az')) continue
      const miss = need.filter(l => !have.has(l))
      if (miss.length && have.size >= 2 && !skipMissing) {
        const line = es[0].line
        for (const l of miss) push({ line, lang: l, rule: 'missing', sample: `{ ${[...have].join(', ')} } — ${l} yoxdur` })
      }
      // eyni mətn
      const vals = es.filter(e => e.value != null)
      for (let a = 0; a < vals.length; a++) for (let b = a + 1; b < vals.length; b++) {
        const x = vals[a], y = vals[b]
        if (x.lang === y.lang) continue
        const v = x.value.trim()
        if (v !== y.value.trim() || isCodeLike(v)) continue
        const words = v.split(/\s+/).filter(w => /\p{L}/u.test(w)).length
        if (words < 3) continue
        push({ line: y.line, lang: y.lang, rule: 'identical', sample: `${y.lang} = ${x.lang}: "${v.slice(0, 60)}"` })
      }
    }
  }
  return viol
}

// ═══ İcra ═══
const all = []
for (const f of FILES) {
  try { all.push(...analyze(f)) } catch (e) { console.error(`! ${f}: ${e.message}`) }
}
all.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

if (opt.report) {
  fs.writeFileSync(path.resolve(opt.report), JSON.stringify(all, null, 2), 'utf8')
}

// Cədvəl: fayl × dil
const table = new Map()
for (const v of all) {
  if (!table.has(v.file)) table.set(v.file, Object.fromEntries(LANGS.map(l => [l, 0])))
  table.get(v.file)[v.lang] = (table.get(v.file)[v.lang] || 0) + 1
}
if (!opt.summary) {
  const perFile = new Map()
  for (const v of all) {
    const c = perFile.get(v.file) || 0
    perFile.set(v.file, c + 1)
    if (opt.max && c >= opt.max) continue
    console.log(`${v.file}:${v.line}  [${v.lang}] ${v.rule}  — ${v.sample}`)
  }
  for (const [f, c] of perFile) if (opt.max && c > opt.max) console.log(`  … ${f}: daha ${c - opt.max} pozuntu (--max=0 ilə hamısı)`)
}
if (all.length) {
  const pad = (s, n) => String(s).padEnd(n)
  const w = Math.max(...[...table.keys()].map(k => k.length), 4)
  console.log('\n' + pad('Fayl', w) + '  ' + LANGS.map(l => pad(l, 5)).join(' ') + ' cəmi')
  for (const [f, c] of table) console.log(pad(f, w) + '  ' + LANGS.map(l => pad(c[l] || '', 5)).join(' ') + ' ' + LANGS.reduce((s, l) => s + (c[l] || 0), 0))
  console.log(`\n✗ ${all.length} dil pozuntusu (${table.size} fayl).`)
  if (!esbuild) console.log('  (esbuild tapılmadı — JSX faylları xam mətn kimi oxundu)')
  process.exit(1)
}
console.log(`✓ Dil pozuntusu yoxdur (${FILES.length} fayl).`)
