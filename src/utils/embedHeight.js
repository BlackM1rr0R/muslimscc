// ═══════════════════════════════════════════════════════
// Yerləşdirilmiş məscid ekranının (iframe, /mosque-tv?compact=1) avtomatik hündürlüyü
//
// • iframe tərəfi (MosqueTvPage): məzmunun təbii hündürlüyünü ölçür (ResizeObserver,
//   seyrəkləşdirilmiş) və ana səhifəyə YALNIZ rəqəm göndərir:
//     window.parent.postMessage({ type: 'muslimscc:height', h: 562 }, '*')
//   Hündürlük sirr deyil, ona görə hədəf '*'; başqa heç nə göndərilmir.
// • Ana səhifə tərəfi — kiçik dinləyici (autoHeightScript): WordPress plagini onu inline
//   skript kimi əlavə edir (wordpress/…/includes/render.php → MUSLIMSCC_PRAYER_AUTOHEIGHT_JS —
//   EYNİ mətn, unit test yoxlayır), /widget səhifəsi isə əl ilə yerləşdirmə üçün təklif edir.
//   Qaydalar: mesaj yalnız https://muslims.cc mənşəyindən, iframe isə event.source ilə tapılır
//   (iframe.contentWindow === event.source); hündürlük 200–1600 px, iframe-in öz hündürlüyündən
//   (data-muslimscc-min və ya height atributu) heç vaxt aşağı düşmür.
// • Niyə kiçilmir: yığcam görünüşün şriftləri vmin ilə ölçülür — iframe eninə görə alçaq olanda
//   kiçiltmək şrifti də kiçildirdi (hər addımda bir az da). Yalnız böyümək — dövr yoxdur.
// Brauzer API-si yoxdur (saf funksiyalar) — tests/unit/embed-height.test.js.
// ═══════════════════════════════════════════════════════

export const EMBED_HEIGHT_MSG = 'muslimscc:height'
export const EMBED_MIN = 200
export const EMBED_MAX = 1600
// Mesajlar arası ən az fasilə (ms) — şrift yüklənməsi, məlumatın gəlməsi bir neçə dəyişiklik verir
export const EMBED_THROTTLE_MS = 200

/**
 * Məzmunun hündürlüyü: axındakı (mütləq/sabit olmayan, görünən) blokların birincisinin yuxarısından
 * sonuncusunun aşağısına qədər + konteynerin yuxarı/aşağı boşluğu (padding). Konteyner sürüşsə də
 * (məzmun sığmır) nəticə eynidir — fərq sürüşmədən asılı deyil.
 * @param {{ top: number, bottom: number, height: number }[]} boxes — getBoundingClientRect() nəticələri
 * @returns {number} tam piksel (yuxarı yuvarlaqlaşdırılır), ölçmək olmursa 0
 */
export function contentHeight(boxes, padTop = 0, padBottom = 0) {
  let top = Infinity
  let bottom = -Infinity
  for (const b of boxes || []) {
    if (!b || !(b.height > 0) || !Number.isFinite(b.top) || !Number.isFinite(b.bottom)) continue
    if (b.top < top) top = b.top
    if (b.bottom > bottom) bottom = b.bottom
  }
  if (!Number.isFinite(top)) return 0
  const pad = (Number(padTop) || 0) + (Number(padBottom) || 0)
  return Math.ceil(bottom - top + pad)
}

/** Göndəriləcək mesaj — yalnız növ və tam ədəd (başqa sahə yoxdur). */
export function heightMessage(h) {
  return { type: EMBED_HEIGHT_MSG, h: Math.ceil(Number(h) || 0) }
}

/**
 * Ana səhifənin iframe-ə verəcəyi hündürlük — dinləyici skriptdəki EYNİ qayda:
 * h → 200…1600 aralığına sıxılır, sonra iframe-in öz hündürlüyündən (min) aşağı düşmür.
 * Etibarsız mesaj (rəqəm deyil) → null.
 */
export function clampEmbedHeight(h, min = EMBED_MIN) {
  if (typeof h !== 'number' || !Number.isFinite(h)) return null
  const m = Number.parseInt(min, 10) || EMBED_MIN
  return Math.max(m, Math.min(EMBED_MAX, Math.max(EMBED_MIN, Math.round(h))))
}

/** Mesaj bizim formatdadırmı (yalnız növ + sonlu rəqəm)? */
export function isHeightMessage(d) {
  return Boolean(d) && typeof d === 'object' && d.type === EMBED_HEIGHT_MSG && typeof d.h === 'number' && Number.isFinite(d.h)
}

// Dinləyicinin gövdəsi — ES5, yalnız qoşa dırnaq (PHP tək dırnaqlı sətrində dəyişmədən durur).
// O — icazəli mənşə (wrapper-də təyin olunur). PHP güzgüsü: render.php → MUSLIMSCC_PRAYER_AUTOHEIGHT_JS.
export const AUTOHEIGHT_JS_BODY =
  'window.addEventListener("message",function(e){var d=e.data,l,f,i,m,h;' +
  'if(e.origin!==O||!d||d.type!=="muslimscc:height"||typeof d.h!=="number"||!isFinite(d.h)){return;}' +
  'l=document.getElementsByTagName("iframe");' +
  'for(i=0;i<l.length;i++){f=l[i];if(f.contentWindow!==e.source){continue;}' +
  'm=parseInt(f.getAttribute("data-muslimscc-min")||f.getAttribute("height"),10)||200;' +
  'h=Math.max(m,Math.min(1600,Math.max(200,Math.round(d.h))));' +
  'if(f.style.height!==h+"px"){f.style.height=h+"px";}return;}});'

/**
 * Ana səhifə üçün dinləyici skript (iki dəfə əlavə olunsa da bir dəfə işləyir).
 * @param {string} origin — iframe-in mənşəyi (susmaya görə https://muslims.cc)
 */
export function autoHeightScript(origin = 'https://muslims.cc') {
  return '(function(){if(window.muslimsccPrayerHeight){return;}window.muslimsccPrayerHeight=1;' +
    `var O=${JSON.stringify(String(origin))};` + AUTOHEIGHT_JS_BODY + '}());'
}
