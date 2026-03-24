// Muslims.cc — Service Worker + Push Notifications
const CACHE_NAME = 'muslims-cc-v2'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/site.webmanifest',
]

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
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => {
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

// ── Fetch — Cache strategiya ──
self.addEventListener('fetch', (e) => {
  const { request } = e

  if (request.url.includes('api.') || request.url.includes('overpass')) {
    e.respondWith(
      fetch(request)
        .then((res) => { const c = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, c)); return res })
        .catch(() => caches.match(request))
    )
    return
  }

  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => { const c = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, c)); return res })
      })
    )
    return
  }

  e.respondWith(
    fetch(request)
      .then((res) => { const c = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, c)); return res })
      .catch(() => caches.match(request).then((c) => c || caches.match('/')))
  )
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
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      tag: tag || 'muslims-cc',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [{ action: 'open', title: 'Aç' }],
    })
  }
})

// ── Notification click ──
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Əgər artıq açıqdırsa, fokusla
      for (const client of clientList) {
        if (client.url.includes('muslims.cc') && 'focus' in client) {
          return client.focus()
        }
      }
      // Yoxdursa, yeni tab aç
      return clients.openWindow('/')
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
              icon: '/android-chrome-192x192.png',
              badge: '/favicon-32x32.png',
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
          icon: '/android-chrome-192x192.png',
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
          icon: '/android-chrome-192x192.png',
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
          icon: '/android-chrome-192x192.png',
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
