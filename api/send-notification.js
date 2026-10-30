// ═══════════════════════════════════════════════════════
// VERCEL SERVERLESS FUNCTION — Send Push Notifications
// ═══════════════════════════════════════════════════════
// Endpoint: POST /api/send-notification
// Header: Authorization: Bearer <Firebase ID token> (admin: true claim)
// Body: { title, body, url, priority }
// Response: { successCount, failureCount }
//
// Setup:
//   1. Firebase Console → Project Settings → Service accounts
//      → "Generate new private key" → JSON faylı yüklə
//   2. JSON-u tək sətirə çevir (online tool ilə) və ya əsas hissələri ayrıca env-ə qoy
//   3. Vercel → Settings → Environment Variables:
//      FIREBASE_PROJECT_ID
//      FIREBASE_CLIENT_EMAIL
//      FIREBASE_PRIVATE_KEY     (multi-line dəstəyi üçün \n istifadə et)
//      ALLOWED_ORIGIN           (məs. https://muslims.cc)
// ═══════════════════════════════════════════════════════

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function initFirebaseAdmin() {
  if (getApps().length > 0) return
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  })
}

export default async function handler(req, res) {
  // CORS
  const origin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { title, body, url = '/', priority = 'normal' } = req.body || {}

    // Admin auth: Firebase ID tokeni + `admin: true` claim (docs/ADMIN-SECURITY.md)
    initFirebaseAdmin()
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')
    if (!m) return res.status(401).json({ error: 'Unauthorized' })
    let decoded
    try { decoded = await getAuth().verifyIdToken(m[1], true) } catch { return res.status(401).json({ error: 'Unauthorized' }) }
    if (decoded.admin !== true) return res.status(403).json({ error: 'Forbidden' })
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body required' })
    }

    const db = getFirestore()
    const messaging = getMessaging()

    // Bütün tokenləri çək
    const snap = await db.collection('fcm_tokens').get()
    const tokens = snap.docs.map(d => d.data().token).filter(Boolean)

    if (tokens.length === 0) {
      return res.status(200).json({ successCount: 0, failureCount: 0, message: 'No subscribers' })
    }

    // Multicast göndər (max 500 token-ə bir dəfədə)
    const chunks = []
    for (let i = 0; i < tokens.length; i += 500) {
      chunks.push(tokens.slice(i, i + 500))
    }

    let successCount = 0
    let failureCount = 0
    const failedTokens = []

    for (const chunk of chunks) {
      const result = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: {
          url,
          priority,
          tag: `muslim-cc-${Date.now()}`,
        },
        webpush: {
          fcmOptions: { link: url },
          notification: {
            icon: '/android-chrome-192x192.png',
            badge: '/badge-96x96.png?v=2',   // ağ monoxrom — Android rəngli şəkli ağ kvadrat göstərir
            requireInteraction: priority === 'high',
          },
        },
      })
      successCount += result.successCount
      failureCount += result.failureCount
      result.responses.forEach((r, i) => {
        if (!r.success) failedTokens.push(chunk[i])
      })
    }

    // Failed/expired tokenləri Firestore-dan sil
    for (const tk of failedTokens) {
      try { await db.collection('fcm_tokens').doc(tk).delete() } catch {}
    }

    return res.status(200).json({ successCount, failureCount })
  } catch (e) {
    console.error('send-notification error:', e)
    return res.status(500).json({ error: e.message || 'Internal error' })
  }
}
