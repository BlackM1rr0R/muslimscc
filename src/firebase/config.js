// ═══════════════════════════════════════════════════════════
// FIREBASE CONFIG
// ═══════════════════════════════════════════════════════════
//
// SETUP TƏLİMATI:
// 1. https://console.firebase.google.com saytına daxil olun
// 2. "Add project" düyməsini basın
// 3. Layihə adı: "muslim-cc" (və ya istədiyiniz)
// 4. Yaratdıqdan sonra "Add Web App" </> ikonuna klikləyin
// 5. App nickname: "muslim-cc-web"
// 6. Aşağıdakı konfiqurasiya kodunu buraya yapışdırın
// 7. Sol menyudan "Firestore Database" → "Create database"
// 8. "Start in test mode" seçin (sonra production rules əlavə edərsiniz)
// 9. Region: nearest to you (məs. europe-west)
//
// ═══════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// ⚠️ BURADA ÖZ FIREBASE CONFIG-İNİZİ YERLƏŞDIRIN ⚠️
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000:web:abc123",
}

// Firebase ilkin yükləmə
const app = initializeApp(firebaseConfig)

// Firestore database
export const db = getFirestore(app)

// Auth (admin login üçün)
export const auth = getAuth(app)

// Konfiqurasiya təsdiqi
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "your-project-id"
}

export default app
