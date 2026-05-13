// ═══════════════════════════════════════════════════════
// FIREBASE CONFIG — Mobile (web-lə eyni database)
// ═══════════════════════════════════════════════════════
// Web tərəfindəki Firebase ilə eyni layihə istifadə olunur ki,
// admin paneldən əlavə edilən kitab/video/hədis/dua mobile-da
// da real-vaxtda görünsün.
//
// Vacib: Bu açarlar onsuz da publikdir (frontend bundle-də göstərilir),
// təhlükəsizlik Firestore Security Rules ilə təmin olunur.
// ═══════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyArGxjqVESyFM7-ZWjEjPrDgDs7QOaeXOY',
  authDomain: 'muslims-cc.firebaseapp.com',
  projectId: 'muslims-cc',
  storageBucket: 'muslims-cc.firebasestorage.app',
  messagingSenderId: '328887693970',
  appId: '1:328887693970:web:3de99a4208e94787ab2c4b',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const isFirebaseConfigured = () => firebaseConfig.apiKey !== ''
export default app
