// ═══════════════════════════════════════════════════════
// Muslims.cc namaz vaxtları vidceti — OXUNAQLI MƏNBƏ
//
// public/widget.js bu fayldan qurulur:  node scripts/build-widget.mjs
// (Azərbaycan şəhərlərinin cədvəli src/utils/prayerLocation.js-dən
// avtomatik götürülür, esbuild ilə sıxılır, ölçü < 6 KB yoxlanılır).
// React yoxdur, asılılıq yoxdur, Shadow DOM-da öz kiçik CSS-i ilə.
//
// İstifadə (başqa saytda):
//   <script src="https://muslims.cc/widget.js" data-city="Baku" data-lang="az" data-theme="light"></script>
//   data-city   — Azərbaycan şəhərinin id-si (prayerLocation.js-dəki kimi: Baku, Ganja, Sheki …)
//   data-lat / data-lng / data-tz — istənilən yer (IANA saat qurşağı)
//   data-label  — göstəriləcək ad (yoxdursa data-city)
//   data-lang   — az | en | ru | ar | tr;   data-theme — light | dark
//   data-method — 'abubakr' (yerli hesab) və ya aladhan metod nömrəsi (susma: 13)
//   data-manual — avtomatik göstərmə; əvəzinə MuslimsWidget.mount(el, opts)
//
// HESAB (src/utils/prayCalc.js ilə EYNİ — tests/unit/widget.test.js tutuşdurur):
//   Azərbaycan (Asia/Baku) — Əbu Bəkr məscidinin cədvəli: sübh 18.5°,
//   günəş 0.833°, əsr kölgə 1x, işa = məğrib + 90 dəq.
//   Qalan yerlər — api.aladhan.com, method=13 (Diyanet), timezonestring.
// ═══════════════════════════════════════════════════════
(function () {
  var W = window, D = document, S = D.currentScript, M = Math, R = M.PI / 180, BAKU = 'Asia/Baku'
  // Ardıcıl 'Ad' + enlik*1e4 (base36, 4 simvol) + uzunluq*1e4 (base36, 4 simvol).
  // Ad böyük hərflə başlayır, base36 kiçik hərfdir — ayırıcı lazım deyil.
  var CITIES = '@@CITIES@@'
  var NAMES = {
    az: 'Sübh Günəş Zöhr Əsr Məğrib İşa',
    en: 'Fajr Sunrise Dhuhr Asr Maghrib Isha',
    ru: 'Фаджр Восход Зухр Аср Магриб Иша',
    ar: 'الفجر الشروق الظهر العصر المغرب العشاء',
    tr: 'Sabah Güneş Öğle İkindi Akşam Yatsı',
  }
  var NEXT = { az: 'Növbəti namaz', en: 'Next prayer', ru: 'Следующий намаз', ar: 'الصلاة القادمة', tr: 'Sıradaki namaz' }
  var API_KEYS = NAMES.en.split(' ') // aladhan cavabının açarları ingiliscə adlarla eynidir
  // Rənglər saytın tokenlərinin dəyərləridir (Shadow DOM-a sayt CSS-i çatmır)
  var CSS = ':host{all:initial}' +
    '.w{--b:#fff;--t:#1b2a25;--l:#e3ded2;--p:#0f5a47;--o:#fff;font:14px/1.4 system-ui;font-variant-numeric:tabular-nums;background:var(--b);color:var(--t);border:1px solid var(--l);border-radius:14px;padding:14px;max-width:340px}' +
    '.d{--b:#111921;--t:#e3dfd5;--l:#22303b;--p:#5fc8a5;--o:#06201a}' +
    '.n{margin:10px 0;padding:10px 12px;border-radius:10px;background:var(--p);color:var(--o);display:flex;justify-content:space-between;align-items:center}' +
    'small{display:block;font-size:12px}i{font:600 22px system-ui}' +
    'ul{list-style:none;margin:0;padding:0}li{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--l)}' +
    '.x,b{font-weight:600}.x{color:var(--p)}a{display:block;margin-top:8px;text-align:end;font-size:12px;color:inherit}'

  // ── Günəşin mövqeyi (prayCalc.js-in köçürməsi) ──
  function sin(d) { return M.sin(d * R) }
  function cos(d) { return M.cos(d * R) }
  function fix(a, b) { a = a - b * M.floor(a / b); return a < 0 ? a + b : a }
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12 }
    var A = M.floor(y / 100)
    return M.floor(365.25 * (y + 4716)) + M.floor(30.6001 * (m + 1)) + d + 2 - A + M.floor(A / 4) - 1524.5
  }
  function sunPos(jd) {
    var n = jd - 2451545.0
    var g = fix(357.529 + 0.98560028 * n, 360)
    var q = fix(280.459 + 0.98564736 * n, 360)
    var L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360)
    var e = 23.439 - 0.00000036 * n
    var RA = M.atan2(cos(e) * sin(L), cos(L)) / R / 15
    return { decl: M.asin(sin(e) * sin(L)) / R, eqt: q / 15 - fix(RA, 24) }
  }
  /** Bir günün vaxtları — gecə yarısından dəqiqələr [sübh, günəş, zöhr, əsr, məğrib, işa]. */
  function calc(y, m, d, lat, lng, tzH) {
    var jd = julian(y, m, d) - lng / (15 * 24)
    function mid(t) { return fix(12 - sunPos(jd + t).eqt, 24) }
    function angle(a, t, ccw) {
      var s = sunPos(jd + t)
      var T = M.acos((-sin(a) - sin(s.decl) * sin(lat)) / (cos(s.decl) * cos(lat))) / R / 15
      return mid(t) + (ccw ? -T : T)
    }
    var sa = sunPos(jd + 13 / 24)
    var asrAngle = -M.atan(1 / (1 + M.tan(M.abs(lat - sa.decl) * R))) / R
    var adj = tzH - lng / 15
    var fajr = angle(18.5, 5 / 24, 1) + adj
    var rise = angle(0.833, 6 / 24, 1) + adj
    var dhuhr = mid(12 / 24) + adj
    var asr = angle(asrAngle, 13 / 24) + adj
    var maghrib = angle(0.833, 18 / 24) + adj
    var isha = maghrib + 90 / 60
    var half = fix(rise - maghrib, 24) / 2
    if (!isFinite(fajr) || fix(rise - fajr, 24) > half) fajr = rise - half
    if (!isFinite(isha) || fix(isha - maghrib, 24) > half) isha = maghrib + half
    return [fajr, rise, dhuhr, asr, maghrib, isha].map(function (t) {
      var x = fix(t + 0.5 / 60, 24), h = M.floor(x)
      return h * 60 + M.floor((x - h) * 60)
    })
  }

  // ── Saat qurşağı ──
  function parts(tz, ms) {
    var o = {}, opt = { timeZone: tz, hourCycle: 'h23' }
    'year month day hour minute second'.split(' ').forEach(function (k) { opt[k] = 'numeric' })
    try {
      new Intl.DateTimeFormat('en-GB', opt).formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = +p.value })
    } catch (e) {
      return parts(void 0, ms) // tanınmayan saat qurşağı — cihazın saatı
    }
    o.hour %= 24
    return o
  }
  function tzOffset(tz, y, m, d) {
    var u = Date.UTC(y, m - 1, d, 12), p = parts(tz, u)
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - u) / 36e5
  }
  function p2(n) { return (n < 10 ? '0' : '') + n }
  function hm(n) { return p2(M.floor(n / 60) % 24) + ':' + p2(n % 60) }
  function findCity(id) {
    var list = CITIES.match(/[A-Z][^A-Z]+/g)
    for (var i = 0; i < list.length; i++) {
      var e = list[i]
      if (e.slice(0, -8) === id) return [parseInt(e.slice(-8, -4), 36) / 1e4, parseInt(e.slice(-4), 36) / 1e4]
    }
  }

  function mount(el, o) {
    o = o || {}
    if (el.__mw) el.__mw()
    var lang = NAMES[o.lang] ? o.lang : 'az'
    // Şəhər tapılmırsa və koordinat yoxdursa — Bakı
    var city = findCity(o.city) || (!o.lat && findCity('Baku'))
    var lat = +o.lat || city[0]
    var lng = +o.lng || city[1]
    var tz = o.tz || (city ? BAKU : Intl.DateTimeFormat().resolvedOptions().timeZone)
    var local = o.method === 'abubakr' || (!o.method && tz === BAKU)
    var root = el.shadowRoot || el.attachShadow({ mode: 'open' })
    var names = NAMES[lang].split(' ')
    var day = '', T = null, next = -1, timer

    function load(p) {
      var y = p.year, m = p.month, d = p.day
      var key = p2(d) + '-' + p2(m) + '-' + y
      day = key
      if (local) {
        var t = new Date(Date.UTC(y, m - 1, d + 1)), off = tzOffset(tz, y, m, d)
        T = calc(y, m, d, lat, lng, off)
        // Sabahın sübhü (işadan sonrakı geri sayım üçün); saat qurşağı fərqi eyni götürülür
        T.f = calc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), lat, lng, off)[0]
        return draw()
      }
      fetch('https://api.aladhan.com/v1/timings/' + key + '?latitude=' + lat + '&longitude=' + lng +
        '&method=' + (+o.method || 13) + '&timezonestring=' + encodeURIComponent(tz))
        .then(function (r) { return r.json() })
        .then(function (j) {
          T = API_KEYS.map(function (k) { var x = /(\d+):(\d+)/.exec(j.data.timings[k]); return x[1] * 60 + +x[2] })
          T.f = T[0] // sabahın sübhü — bugünkü ilə təxmini
          draw()
        })
        .catch(function () { setTimeout(function () { day = '' }, 6e4) }) // bir dəqiqədən sonra yenidən cəhd
    }

    function draw() {
      var h = `<style>${CSS}</style><div class="w${o.theme === 'dark' ? ' d' : ''}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><b></b>`
      if (T) {
        h += `<div class="n"><span><small>${NEXT[lang]}</small><b>${names[next < 0 ? 0 : next]}</b></span><i></i></div><ul>`
        T.forEach(function (t, i) { h += `<li${i === next ? ' class="x"' : ''}><span>${names[i]}</span><b>${hm(t)}</b></li>` })
        h += '</ul>'
      }
      root.innerHTML = h + '<a href="https://muslims.cc" target="_blank">Muslims.cc</a></div>'
      root.querySelector('b').textContent = o.label || o.city || '' // mətn kimi — HTML yox
      tick()
    }

    function tick() {
      var p = parts(tz, Date.now()), s = p.hour * 3600 + p.minute * 60 + p.second, i, left
      if (p2(p.day) + '-' + p2(p.month) + '-' + p.year !== day) return load(p)
      if (!T) return
      // Növbəti FƏRZ namaz (günəşin çıxması — 1 — sayılmır)
      for (i = 0; i < 6; i++) if (i !== 1 && T[i] * 60 > s) break
      left = i < 6 ? T[i] * 60 - s : 86400 - s + T.f * 60
      if (i === 6) i = 0
      if (i !== next) { next = i; return draw() }
      var e = root.querySelector('i')
      if (e) e.textContent = hm(M.floor(left / 60)) + ':' + p2(left % 60)
    }

    timer = setInterval(tick, 1000)
    tick()
    el.__mw = function () { clearInterval(timer); el.__mw = 0 }
    return el.__mw
  }

  W.MuslimsWidget = { mount: mount, calc: calc }
  if (S && !S.hasAttribute('data-manual')) {
    var host = D.createElement('div')
    S.parentNode.insertBefore(host, S.nextSibling)
    mount(host, S.dataset)
  }
})()
