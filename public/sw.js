// Muslims.cc — Service Worker + Push Notifications
// Keş adı dəyişəndə köhnə keş "activate" zamanı silinir:
// v4: /favicon.svg əvvəl public/-də yox idi — köhnə keşdə onun yerinə index.html
//     saxlanılıb (şəkillər keşdən birinci verilir).
// v5: brend yenidən Muslims.cc oldu — keşdə qalmış köhnə adlı index.html
//     və site.webmanifest təmizlənsin.
// v6: keş strategiyası yenidən yazıldı (performans) — bax aşağıdakı "Fetch".
//     Köhnə v5 keşində Firestore kanal URL-ləri, audio və digər üçüncü tərəf
//     cavabları yığılırdı; yeni ad onu bir dəfəlik təmizləyir.
const CACHE_NAME = 'muslims-cc-v6'
// Hash-li /assets/* faylları ayrıca keşdə: məzmun dəyişəndə ad da dəyişir,
// ona görə "əvvəl keş" təhlükəsizdir. Hər deploy köhnə hash-ləri yığmasın
// deyə ölçü həddi var (ən köhnələri silinir).
const ASSET_CACHE = 'muslims-cc-assets-v6'
const ASSET_CACHE_MAX = 200
// Bildiriş məlumatı keşləri (aşağıda) — activate zamanı SİLİNMƏMƏLİDİR.
// Əvvəl activate "CACHE_NAME-dən başqa hər şeyi" silirdi: hər SW yeniləməsində
// istifadəçinin əzan bildirişi ayarları da itirdi.
const KEEP_CACHES = [CACHE_NAME, ASSET_CACHE, 'muslims-notif-data', 'muslims-notif-shown']

const PRECACHE_URLS = [
  '/',
  '/favicon.svg',
  '/site.webmanifest',
]

// Şəbəkə-birinci keşlənən xarici API-lər (oflayn rejimdə son cavab qalır):
// əvvəlki qayda ilə eyni — host-da "api." (aladhan, alquran, open-meteo,
// exchangerate, overpass-api) və ya "overpass" (kumi.systems güzgüsü) var
const isApiHost = (host) => host.includes('api.') || host.includes('overpass')

// ── Install ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => !KEEP_CACHES.includes(n)).map((n) => caches.delete(n)))
    ).then(() => {
      // Navigation preload: SW oyanarkən HTML sorğusu PARALEL başlayır —
      // təkrar ziyarətdə SW-nin işə düşmə gecikməsi (mobildə 50–300 ms) aradan qalxır
      if (self.registration.navigationPreload) {
        return self.registration.navigationPreload.enable().catch(() => {})
      }
    }).then(() => {
      // Periodic Sync qeydiyyatı (Android Chrome — arxa plan yoxlama)
      if (self.registration.periodicSync) {
        return self.registration.periodicSync.register('check-prayer-times', {
          minInterval: 60 * 1000 // hər 1 dəqiqə (brauzer özü tənzimləyir, min 12 saat ola bilər)
        }).catch(() => {})
      }
    })
  )
  self.clients.claim()
  startPeriodicCheck()
})

// ── Periodic Background Sync (Android — ekran bağlı olsa belə) ──
self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'check-prayer-times') {
    e.waitUntil(checkAndNotify())
  }
})

// ── Fetch — keş strategiyası ──
//   • /assets/* (hash-li JS, CSS, şrift, SVG) → əvvəl keş (cache-first): bir dəfə
//     yüklənən fayl bir daha şəbəkəyə getmir
//   • HTML (naviqasiya) → əvvəl şəbəkə (network-first, navigation preload ilə);
//     şəbəkə yoxdursa — keşdəki səhifə, o da yoxdursa ana səhifə
//   • digər öz faylları (ikonlar, manifest) → stale-while-revalidate
//   • namaz/Quran API-ləri → əvvəl şəbəkə, oflayn — son cavab
//   • QALAN HƏR ŞEY (Firestore kanalları, audio, Google, xəritə) → SW toxunmur:
//     əvvəl bunlar da keşə yazılırdı — uzun sorğulu Firestore axınları və
//     Range (206) audio cavabları keşi şişirdir, cache.put isə xəta verirdi
const okToCache = (res) => res && res.ok && res.status === 200 && res.type !== 'opaque'

function putInCache(cacheName, request, res) {
  if (!okToCache(res)) return
  const copy = res.clone()
  caches.open(cacheName).then((cache) => cache.put(request, copy)).catch(() => {})
}

async function trimAssetCache() {
  try {
    const cache = await caches.open(ASSET_CACHE)
    const keys = await cache.keys()
    for (let i = 0; i < keys.length - ASSET_CACHE_MAX; i++) await cache.delete(keys[i])
  } catch (_) { /* boş */ }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (okToCache(res)) {
    const copy = res.clone()
    caches.open(ASSET_CACHE).then((c) => c.put(request, copy)).then(trimAssetCache).catch(() => {})
  }
  return res
}

async function networkFirstPage(e) {
  try {
    const preloaded = await e.preloadResponse
    const res = preloaded || await fetch(e.request)
    putInCache(CACHE_NAME, e.request, res)
    return res
  } catch (err) {
    return (await caches.match(e.request)) || (await caches.match('/')) || Response.error()
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request)
    putInCache(CACHE_NAME, request, res)
    return res
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) return cached
    throw err
  }
}

async function staleWhileRevalidate(e) {
  const cached = await caches.match(e.request)
  const network = fetch(e.request).then((res) => { putInCache(CACHE_NAME, e.request, res); return res })
  if (cached) {
    e.waitUntil(network.catch(() => {}))
    return cached
  }
  return network
}

self.addEventListener('fetch', (e) => {
  const { request } = e

  // chrome-extension, data:, ws://, wss:// kimi sxemləri keç
  if (!request.url.startsWith('http')) return
  // POST/PUT/DELETE keş etmə
  if (request.method !== 'GET') return
  // Range sorğuları (audio/video) — keşlənmir
  if (request.headers.has('range')) return

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    if (isApiHost(url.hostname)) e.respondWith(networkFirst(request))
    return
  }

  // Öz API-miz (/api/ → AI və s.) — həmişə canlı
  if (url.pathname.startsWith('/api/')) return
  // Səs faylları (əzan) — brauzer onları hissə-hissə (Range) istəyir; keşdən
  // tam cavab vermək Safari-də oxutmanı pozur. Birbaşa şəbəkə/HTTP keşi.
  if (url.pathname.startsWith('/audio/')) return

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(networkFirstPage(e))
    return
  }

  e.respondWith(staleWhileRevalidate(e))
})

// ── Client-dən mesaj qəbul et ──
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    // Prayer times və settings-i IndexedDB/cache-ə yaz
    saveNotifData(e.data.payload)
  }
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = e.data.payload
    self.registration.showNotification(title, {
      body,
      icon: '/android-chrome-192x192.png?v=2',
      badge: '/badge-96x96.png?v=2',
      tag: tag || 'muslims-cc',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [{ action: 'open', title: 'Aç' }],
    })
  }
})

// ── PUSH (Firebase Cloud Messaging) ──
// SAYTIN YEGANƏ service worker-i budur. Əvvəl push üçün ayrıca
// /firebase-messaging-sw.js vardı və o da "/" əhatəsində qeyd olunurdu —
// brauzer bir əhatədə yalnız BİR SW saxlayır, ona görə hər səhifə açılışında
// /sw.js onu əvəz edirdi, bu faylda isə "push" dinləyicisi yox idi: bildirişlər
// "gah gəlir, gah gəlmir"di, iPhone-da Safari görünməyən push-lara görə
// abunəliyi ləğv edə bilirdi. İndi push-u Firebase SDK-sız özümüz göstəririk
// (FCM web push payload-u adi JSON-dur) və HƏR push-da bildiriş MÜTLƏQ görünür.
function parsePush(e) {
  let p = {}
  try { p = e.data ? e.data.json() : {} } catch {
    try { p = { notification: { body: e.data.text() } } } catch { p = {} }
  }
  const n = p.notification || {}
  const d = p.data || {}
  const url = d.url || (p.fcmOptions && p.fcmOptions.link) || n.click_action || '/'
  return {
    title: n.title || d.title || 'Muslims.cc',
    body: n.body || d.body || '',
    tag: n.tag || d.tag || 'muslims-cc',
    icon: n.icon || '/android-chrome-192x192.png?v=2',
    badge: n.badge || '/badge-96x96.png?v=2',
    url,
    data: d,
  }
}

// ── "Qıldınızmı?" (server/checkin.js) ──
// tag: checkin-<namaz>-<YYYY-MM-DD>. Android Chrome və masaüstündə bildirişdə
// "✅ Qıldım" / "Sonra" düymələri var; iOS-da düymə YOXDUR — toxunuş
// /prayer?checkin=… səhifəsini açır və orada "Qıldınızmı?" kartı görünür.
// "Qıldım" basılanda pəncərə açılmır: SW localStorage-a çata bilmir, ona görə
// qeyd IndexedDB-yə yazılır ('muslims-tracker' → 'pending'); sayt açılanda
// src/utils/prayerTracker.js → syncPendingCheckins() onu izləyiciyə köçürür
// (idempotent) və qeydi silir. Bu məlumat heç yerə göndərilmir.
const TRACKER_DB = 'muslims-tracker'
const TRACKER_STORE = 'pending'
const CHECKIN_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const isCheckinTag = (tag) => /^checkin-/.test(tag || '')

function openTrackerDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(TRACKER_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(TRACKER_STORE)) db.createObjectStore(TRACKER_STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function savePendingCheckin(prayer, date) {
  if (!CHECKIN_PRAYERS.includes(prayer) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false
  const db = await openTrackerDb()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(TRACKER_STORE, 'readwrite')
      // id = gün|namaz — eyni düyməyə iki dəfə basmaq bir qeyd yaradır
      tx.objectStore(TRACKER_STORE).put({ id: `${date}|${prayer}`, date, prayer, status: 'prayed', at: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally { db.close() }
  return true
}

self.addEventListener('push', (e) => {
  const m = parsePush(e)
  const isAzan = m.tag.startsWith('azan-')
  const isCheckin = isCheckinTag(m.tag)
  e.waitUntil((async () => {
    await self.registration.showNotification(m.title, {
      body: m.body,
      icon: m.icon,
      badge: m.badge,
      tag: m.tag,
      // Eyni tag-lı köhnə bildirişi əvəz etsə də yenidən səs/vibrasiya versin
      renotify: true,
      // Əzan bildirişi istifadəçi baxana qədər ekranda qalsın (Android/masaüstü)
      requireInteraction: isAzan,
      silent: false,
      vibrate: isAzan ? [400, 150, 400, 150, 400, 300, 800] : [200, 100, 200],
      timestamp: Date.now(),
      data: { ...m.data, url: m.url },
      // Yalnız "Qıldınızmı?" üçün düymələr (mətnlər push-un data-sından — 5 dil)
      ...(isCheckin ? { actions: [
        { action: 'prayed', title: m.data.actPrayed || '✅ Qıldım' },
        { action: 'later', title: m.data.actLater || 'Sonra' },
      ] } : {}),
    })
    // Sayt (və ya ana ekrandakı tətbiq) açıqdırsa — oraya xəbər ver:
    // səhifə əzanın səsini oxuda bilsin (bildiriş öz səsini çala bilmir)
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const w of wins) w.postMessage({ type: 'PUSH', tag: m.tag, title: m.title, body: m.body, url: m.url })
  })())
})

// Brauzer push abunəliyini özü yeniləyəndə (açar dövriyyəsi) — açıq səhifə
// növbəti açılışda tokeni Firestore-a yenidən yazır (messaging.js → ensureToken)
self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((wins) => wins.forEach((w) => w.postMessage({ type: 'PUSH_RESUBSCRIBE' }))))
})

// ── Notification click ──
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const nd = e.notification.data || {}
  if (isCheckinTag(e.notification.tag) && e.action === 'later') return
  if (isCheckinTag(e.notification.tag) && e.action === 'prayed') {
    // Pəncərə açmadan qeyd et; açıq səhifə varsa dərhal köçürsün
    e.waitUntil((async () => {
      let ok = false
      try { ok = await savePendingCheckin(nd.prayer, nd.date) } catch (_) { ok = false }
      const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const w of wins) w.postMessage({ type: 'CHECKIN', prayer: nd.prayer, date: nd.date })
      if (!ok) return clients.openWindow(nd.url || '/prayer')   // IndexedDB yoxdur — saytda qeyd etsin
      // Sakit təsdiq: səssiz, titrəməsiz, bir neçə saniyədən sonra özü bağlanır
      if (nd.doneTitle) {
        const tag = `checkin-done-${nd.prayer}`
        await self.registration.showNotification(nd.doneTitle, {
          tag, silent: true, renotify: false, requireInteraction: false,
          icon: '/android-chrome-192x192.png?v=2', badge: '/badge-96x96.png?v=2',
          data: { url: nd.url || '/prayer' },
        })
        await new Promise((r) => setTimeout(r, 4000))
        const shown = await self.registration.getNotifications({ tag })
        shown.forEach((n) => n.close())
      }
    })())
    return
  }
  const raw = nd.url || '/'
  let target
  try { target = new URL(raw, self.location.origin) } catch { target = new URL('/', self.location.origin) }
  if (target.origin !== self.location.origin) target = new URL('/', self.location.origin)
  // Əzan bildirişindən açılanda səhifə əzanı oxusun (klik istifadəçi jestidir)
  if ((e.notification.tag || '').startsWith('azan-')) target.searchParams.set('azan', '1')
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          await client.focus()
          if ('navigate' in client) return client.navigate(target.href).catch(() => {})
          return
        }
      }
      return clients.openWindow(target.href)
    })
  )
})

// ── Periodic background check (hər dəqiqə) ──
let checkInterval = null

function startPeriodicCheck() {
  if (checkInterval) clearInterval(checkInterval)
  checkInterval = setInterval(() => {
    checkAndNotify()
  }, 60000) // hər 60 saniyə
}

async function checkAndNotify() {
  try {
    // Cache-dən notification data-nı oxu
    const cache = await caches.open('muslims-notif-data')
    const response = await cache.match('/notif-data')
    if (!response) return
    const data = await response.json()
    if (!data || !data.enabled) return

    const now = new Date()
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Əzan notification
    if (data.prayerTimes && data.azanEnabled) {
      const prayerNames = data.prayerNames || { Fajr: 'Sübh', Dhuhr: 'Zöhr', Asr: 'Əsr', Maghrib: 'Məğrib', Isha: 'İşa' }
      for (const [key, time] of Object.entries(data.prayerTimes)) {
        if (time && time.slice(0, 5) === nowStr) {
          const notifKey = `azan-${todayKey}-${key}`
          const shown = await wasShown(notifKey)
          if (!shown) {
            await markShown(notifKey)
            self.registration.showNotification(`🕌 ${prayerNames[key] || key}`, {
              body: `${time} — Namaz vaxtı gəldi! Allahu Akbar!`,
              icon: '/android-chrome-192x192.png?v=2',
              badge: '/badge-96x96.png?v=2',
              tag: `azan-${key}`,
              vibrate: [300, 100, 300, 100, 300, 200, 500, 100, 300, 100, 300, 100, 300, 200, 500],
              requireInteraction: true,
              silent: false,
              actions: [{ action: 'open', title: 'Aç' }],
            })
          }
        }
      }
    }

    // Səhər əzkarları xatırlatması (06:30)
    if (data.morningReminder && nowStr === '06:30') {
      const notifKey = `morning-${todayKey}`
      const shown = await wasShown(notifKey)
      if (!shown) {
        await markShown(notifKey)
        self.registration.showNotification('🌅 Səhər Əzkarları', {
          body: data.morningText || 'Səhər əzkarlarını oxumağı unutma!',
          icon: '/android-chrome-192x192.png?v=2',
          tag: 'morning-adhkar',
          vibrate: [200, 100, 200],
        })
      }
    }

    // Axşam əzkarları xatırlatması (18:30)
    if (data.eveningReminder && nowStr === '18:30') {
      const notifKey = `evening-${todayKey}`
      const shown = await wasShown(notifKey)
      if (!shown) {
        await markShown(notifKey)
        self.registration.showNotification('🌆 Axşam Əzkarları', {
          body: data.eveningText || 'Axşam əzkarlarını oxumağı unutma!',
          icon: '/android-chrome-192x192.png?v=2',
          tag: 'evening-adhkar',
          vibrate: [200, 100, 200],
        })
      }
    }

    // Gündəlik hədis (09:00)
    if (data.dailyHadith && nowStr === '09:00') {
      const notifKey = `hadith-${todayKey}`
      const shown = await wasShown(notifKey)
      if (!shown) {
        await markShown(notifKey)
        self.registration.showNotification('📚 Gündəlik Hədis', {
          body: data.hadithText || 'Bugünkü hədisi oxumaq üçün aç',
          icon: '/android-chrome-192x192.png?v=2',
          tag: 'daily-hadith',
        })
      }
    }

  } catch (err) {
    // Xəta olsa sessiz keç
  }
}

async function saveNotifData(payload) {
  const cache = await caches.open('muslims-notif-data')
  await cache.put('/notif-data', new Response(JSON.stringify(payload)))
}

// Göstərilib-göstərilməyib yoxla (dublikat qarşısı)
async function wasShown(key) {
  const cache = await caches.open('muslims-notif-shown')
  const r = await cache.match(`/${key}`)
  return !!r
}

async function markShown(key) {
  const cache = await caches.open('muslims-notif-shown')
  await cache.put(`/${key}`, new Response('1'))
}

// SW aktivləşdikdə check-i başlat
startPeriodicCheck()
