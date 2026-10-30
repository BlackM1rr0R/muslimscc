#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Admin icazəsi (custom claim `admin: true`) — bir dəfəlik skript
//
//   Konteynerdə:   docker compose exec api node scripts/set-admin.js <email>
//   Geri almaq:    docker compose exec api node scripts/set-admin.js <email> --remove
//   Yoxlamaq:      docker compose exec api node scripts/set-admin.js <email> --show
//
// İstifadəçi əvvəlcə Firebase Console → Authentication-da yaradılmalıdır.
// Kimlik məlumatları server.js ilə eyni env-dən oxunur (FIREBASE_PROJECT_ID,
// FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) — heç bir sirr çap edilmir.
// Claim dəyişəndən sonra admin çıxıb yenidən daxil olmalıdır (və ya ~1 saat
// gözləməli) — köhnə ID tokenində yeni claim olmur. --remove sessiyaları da
// ləğv edir (revokeRefreshTokens), server köhnə tokeni dərhal rədd edir.
// ═══════════════════════════════════════════════════════════════════════
const admin = require('firebase-admin')

const args = process.argv.slice(2)
const email = args.find(a => !a.startsWith('--'))
const remove = args.includes('--remove')
const show = args.includes('--show')

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('İstifadə: node scripts/set-admin.js <email> [--remove | --show]')
  process.exit(2)
}

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL } = process.env
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')   // env-də "\n" iki simvoldur (server.js ilə eyni)
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('XƏTA: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env-də yoxdur')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY,
  }),
})

async function main() {
  let user
  try {
    user = await admin.auth().getUserByEmail(email)
  } catch (e) {
    if (e && e.code === 'auth/user-not-found') {
      console.error(`XƏTA: "${email}" ünvanlı istifadəçi yoxdur. Əvvəlcə Firebase Console → Authentication → Users → "Add user" ilə yaradın.`)
      process.exit(1)
    }
    throw e
  }

  const current = user.customClaims || {}
  if (show) {
    console.log(`${email} (uid ${user.uid}): admin = ${current.admin === true}`)
    return
  }

  // Digər claim-lər (varsa) qorunur — yalnız `admin` dəyişir
  const next = { ...current }
  if (remove) delete next.admin
  else next.admin = true
  await admin.auth().setCustomUserClaims(user.uid, next)

  if (remove) {
    await admin.auth().revokeRefreshTokens(user.uid)
    console.log(`OK: ${email} (uid ${user.uid}) — admin icazəsi GÖTÜRÜLDÜ, sessiyaları ləğv edildi.`)
  } else {
    console.log(`OK: ${email} (uid ${user.uid}) — admin icazəsi VERİLDİ.`)
    console.log('Qeyd: paneldə çıxıb yenidən daxil olun ki, yeni token claim-i daşısın.')
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('XƏTA:', e && e.message ? e.message : e)
  process.exit(1)
})
