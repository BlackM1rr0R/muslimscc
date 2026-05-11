// ═══════════════════════════════════════════════════════
// FIREBASE MESSAGING SERVICE WORKER
// ═══════════════════════════════════════════════════════
// Background-da push notifications göstərmək üçün.
// Bu fayl public/ qovluğunda olmalıdır ki, /firebase-messaging-sw.js
// URL-i ilə brauzer bu SW-i tapa bilsin.
//
// ⚠️ AŞAĞIDAKI KONFİQURASİYANI .env FAYLINIZDAKI VITE_FIREBASE_*
// DƏYƏRLƏRİ İLƏ ƏVƏZ EDİN. Bu dəyərlər frontend-də onsuz da
// publik göstərilir — təhlükəsizlik Firestore Rules ilə təmin olunur.
// ═══════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyArGxjqVESyFM7-ZWjEjPrDgDs7QOaeXOY",
  authDomain: "muslims-cc.firebaseapp.com",
  projectId: "muslims-cc",
  storageBucket: "muslims-cc.firebasestorage.app",
  messagingSenderId: "328887693970",
  appId: "1:328887693970:web:3de99a4208e94787ab2c4b",
})

const messaging = firebase.messaging()

// Background-da mesaj gəldikdə bildirişi göstər
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'muslims.cc'
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    tag: payload.data?.tag || 'muslim-cc',
    data: payload.data || {},
    requireInteraction: payload.data?.priority === 'high',
  }
  return self.registration.showNotification(title, options)
})

// Bildirişə klik edildikdə müvafiq səhifəyə yönləndir
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolledClients: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(self.location.origin)) {
          w.focus()
          if (url !== '/' && 'navigate' in w) w.navigate(url)
          return
        }
      }
      return clients.openWindow(url)
    })
  )
})
