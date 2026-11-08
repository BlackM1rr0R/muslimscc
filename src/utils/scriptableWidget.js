// ═══════════════════════════════════════════════════════
// iPhone ana ekran vidceti — Scriptable tətbiqi üçün skript generatoru (v5.7)
//
// Ana ekrana əlavə olunmuş sayt (PWA) iOS-da vidcet yarada bilmir. Pulsuz
// Scriptable tətbiqi isə JS skriptini əsl iOS vidceti kimi göstərir. Bu fayl
// istifadəçinin şəhəri ilə hazır skript qurur (components/prayer/HomeScreenWidget).
//
//   buildScriptableWidget({ url, lang }) → skript mətni
//   url — /api/prayer.json?… (server/ics.js; vaxtlar sayt və təqvimlə EYNİDİR)
//
// Skript: növbəti namaz + canlı geri sayım (applyTimerStyle), 5 vaxt; kiçik,
// orta, böyük və kilid ekranı (accessory) ölçüləri. Son cavab keşdə saxlanır —
// internet olmasa da göstərir. Vidcet növbəti azan anında özü yenilənir.
// ═══════════════════════════════════════════════════════

const UI = {
  az: { next: 'Növbəti', left: 'qalıb', today: 'Bu gün', err: 'Namaz vaxtları yüklənmədi' },
  en: { next: 'Next', left: 'left', today: 'Today', err: 'Could not load prayer times' },
  ru: { next: 'Следующий', left: 'осталось', today: 'Сегодня', err: 'Не удалось загрузить время намаза' },
  tr: { next: 'Sıradaki', left: 'kaldı', today: 'Bugün', err: 'Namaz vakitleri yüklenemedi' },
  ar: { next: 'التالي', left: 'متبقٍّ', today: 'اليوم', err: 'تعذّر تحميل مواقيت الصلاة' },
}

export function widgetJsonUrl(icsLikeUrl) {
  return icsLikeUrl.replace('/api/prayer.ics?', '/api/prayer.json?')
}

export function buildScriptableWidget({ url, lang = 'az', site = 'https://muslims.cc' }) {
  const t = UI[lang] || UI.en
  const rtl = lang === 'ar'
  return `// muslims.cc — namaz vaxtları vidceti (Scriptable)
// Mənbə: ${site}/prayer · vaxtlar saytdakı ilə eynidir.
// Vidcet: ana ekranı basıb saxla → + → Scriptable → ölçü seç → vidceti bas → Script: bu skript.

const DATA_URL = ${JSON.stringify(url)}
const OPEN_URL = ${JSON.stringify(`${site}/prayer`)}
const T = ${JSON.stringify(t)}
const RTL = ${rtl}
const GOLD = new Color("#e7c77d")
const SOFT = new Color("#ffffff", 0.72)

const fm = FileManager.local()
const CACHE = fm.joinPath(fm.cacheDirectory(), "muslimscc-prayer.json")

async function load() {
  try {
    const r = new Request(DATA_URL)
    r.timeoutInterval = 12
    const j = await r.loadJSON()
    if (j && Array.isArray(j.days) && j.days.length) {
      fm.writeString(CACHE, JSON.stringify(j))
      return j
    }
  } catch (e) { /* internet yoxdur — keşdən */ }
  if (fm.fileExists(CACHE)) {
    try { return JSON.parse(fm.readString(CACHE)) } catch (e) { /* */ }
  }
  return null
}

// Şəhərin saat qurşağında "YYYY-MM-DD" + "HH:MM" → Date
function tzOffsetMin(tz, ms) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms))
  const g = (k) => Number(p.find((x) => x.type === k).value)
  return (Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute")) - ms) / 60000
}
function at(date, hhmm, tz) {
  const [y, m, d] = date.split("-").map(Number)
  const [h, mi] = hhmm.split(":").map(Number)
  const guess = Date.UTC(y, m - 1, d, h, mi)
  return new Date(guess - tzOffsetMin(tz, guess) * 60000)
}

const KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"]
const ICON = { fajr: "sunrise.fill", dhuhr: "sun.max.fill", asr: "sun.min.fill", maghrib: "sunset.fill", isha: "moon.stars.fill" }

function plan(j) {
  const now = new Date()
  const events = []
  for (const day of j.days) for (const k of KEYS) {
    const v = day.times && day.times[k]
    if (/^\\d{2}:\\d{2}$/.test(v || "")) events.push({ k, time: v, date: at(day.date, v, j.tz), day: day.date })
  }
  const next = events.find((e) => e.date > now) || events[events.length - 1]
  const today = j.days[0]
  return { next, today, names: j.names || {} }
}

function sym(name, size, color) {
  const s = SFSymbol.named(name)
  s.applyFont(Font.systemFont(size))
  const img = s.image
  return { img, color }
}

function addIcon(stack, name, size, color) {
  const { img } = sym(name, size, color)
  const w = stack.addImage(img)
  w.tintColor = color
  w.imageSize = new Size(size, size)
  return w
}

function build(j) {
  const fam = config.widgetFamily || "medium"
  const w = new ListWidget()
  w.url = OPEN_URL
  if (!j) {
    const t = w.addText(T.err)
    t.font = Font.mediumSystemFont(13)
    w.refreshAfterDate = new Date(Date.now() + 15 * 60000)
    return w
  }
  const { next, today, names } = plan(j)
  w.refreshAfterDate = new Date(next.date.getTime() + 60000)

  // Kilid ekranı
  if (fam === "accessoryCircular") {
    w.addAccessoryWidgetBackground = true
    const s = w.addStack(); s.layoutVertically(); s.centerAlignContent()
    addIcon(s, ICON[next.k], 14, Color.white())
    const tt = s.addText(next.time); tt.font = Font.boldSystemFont(13); tt.minimumScaleFactor = 0.6
    return w
  }
  if (fam === "accessoryRectangular" || fam === "accessoryInline") {
    const top = w.addStack(); top.centerAlignContent()
    addIcon(top, ICON[next.k], 12, Color.white()); top.addSpacer(4)
    const n = top.addText(\`\${names[next.k] || next.k} \${next.time}\`); n.font = Font.boldSystemFont(14)
    if (fam === "accessoryRectangular") {
      const c = w.addDate(next.date); c.applyTimerStyle(); c.font = Font.systemFont(13)
    }
    return w
  }

  const g = new LinearGradient()
  g.colors = [new Color("#0f4a39"), new Color("#08261d")]
  g.locations = [0, 1]
  w.backgroundGradient = g
  w.setPadding(14, 14, 12, 14)

  // Başlıq: şəhər
  const head = w.addStack(); head.centerAlignContent()
  addIcon(head, "moon.stars.fill", 12, GOLD); head.addSpacer(5)
  const city = head.addText(j.city || "muslims.cc"); city.font = Font.semiboldSystemFont(12); city.textColor = SOFT; city.lineLimit = 1
  head.addSpacer()
  w.addSpacer(fam === "small" ? 6 : 8)

  // Növbəti namaz
  const body = w.addStack()
  const left = body.addStack(); left.layoutVertically()
  const lbl = left.addText(T.next.toUpperCase()); lbl.font = Font.semiboldSystemFont(10); lbl.textColor = GOLD
  const nm = left.addText(names[next.k] || next.k); nm.font = Font.boldSystemFont(fam === "small" ? 20 : 22); nm.textColor = Color.white(); nm.lineLimit = 1; nm.minimumScaleFactor = 0.7
  const tm = left.addText(next.time); tm.font = Font.boldRoundedSystemFont(fam === "small" ? 28 : 32); tm.textColor = Color.white()
  const cd = left.addStack(); cd.centerAlignContent()
  const timer = cd.addDate(next.date); timer.applyTimerStyle(); timer.font = Font.mediumMonospacedSystemFont(12); timer.textColor = GOLD
  if (!RTL) { cd.addSpacer(3); const lt = cd.addText(T.left); lt.font = Font.systemFont(11); lt.textColor = SOFT }

  if (fam === "small") { w.addSpacer(); return w }

  // 5 vaxt
  body.addSpacer()
  const list = body.addStack(); list.layoutVertically()
  for (const k of KEYS) {
    const row = list.addStack(); row.centerAlignContent(); row.size = new Size(fam === "large" ? 150 : 128, 0)
    const on = next.k === k && next.day === today.date
    if (on) { row.backgroundColor = new Color("#e7c77d", 0.18); row.cornerRadius = 6; row.setPadding(1, 5, 1, 5) } else row.setPadding(1, 5, 1, 5)
    addIcon(row, ICON[k], 10, on ? GOLD : SOFT); row.addSpacer(5)
    const a = row.addText(names[k] || k); a.font = on ? Font.boldSystemFont(12) : Font.systemFont(12); a.textColor = on ? GOLD : Color.white(); a.lineLimit = 1
    row.addSpacer()
    const b = row.addText((today.times && today.times[k]) || "—"); b.font = on ? Font.boldMonospacedSystemFont(12) : Font.monospacedSystemFont(12); b.textColor = on ? GOLD : Color.white()
    list.addSpacer(2)
  }
  w.addSpacer()
  return w
}

const data = await load()
const widget = build(data)
if (config.runsInWidget) Script.setWidget(widget)
else await widget.presentMedium()
Script.complete()
`
}
