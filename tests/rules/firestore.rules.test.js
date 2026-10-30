// ═══════════════════════════════════════════════════════════════════════
// firestore.rules testləri — Firestore emulyatoru ilə (Java tələb edir)
//
//   npm run test:rules
//
// Skript emulyatoru özü qaldırır (firebase-tools emulators:exec) və bu faylı
// node:test ilə işlədir. "demo-" layihəsi — real Firebase-ə heç nə getmir.
// ═══════════════════════════════════════════════════════════════════════
import { test, before, after, beforeEach } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection,
  serverTimestamp,
} from 'firebase/firestore'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PROJECT_ID = 'demo-muslims-cc'

let env

before(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8'),
      host, port: Number(port),
    },
  })
})

after(async () => { await env?.cleanup() })
beforeEach(async () => { await env.clearFirestore() })

// Kontekstlər
const anon = () => env.unauthenticatedContext().firestore()
const user = () => env.authenticatedContext('u1', { email: 'user@example.com' }).firestore()
const adminDb = () => env.authenticatedContext('a1', { email: 'abdllyevv@gmail.com', admin: true }).firestore()

// Qaydalardan yan keçərək ilkin məlumat yaz
async function seed(p, data) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), p), data)
  })
}

// ── İctimai məzmun ─────────────────────────────────────────────────────
const PUBLIC = ['videos', 'books', 'hadiths', 'duas', 'quotes', 'announcements', 'events', 'places']

for (const col of PUBLIC) {
  test(`${col}: hamı oxuyur, yalnız admin yazır`, async () => {
    await seed(`${col}/x`, { title: 'a' })
    await assertSucceeds(getDoc(doc(anon(), col, 'x')))
    await assertSucceeds(getDocs(collection(anon(), col)))

    await assertFails(setDoc(doc(anon(), col, 'y'), { title: 'b' }))
    await assertFails(addDoc(collection(user(), col), { title: 'b' }))
    await assertFails(updateDoc(doc(user(), col, 'x'), { title: 'hack' }))
    await assertFails(deleteDoc(doc(anon(), col, 'x')))

    await assertSucceeds(addDoc(collection(adminDb(), col), { title: 'b', createdAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(adminDb(), col, 'x'), { title: 'c' }))
    await assertSucceeds(deleteDoc(doc(adminDb(), col, 'x')))
  })
}

test('admin claim false/yoxdursa — yazmaq olmaz', async () => {
  const fake = env.authenticatedContext('u2', { admin: false }).firestore()
  await assertFails(setDoc(doc(fake, 'videos', 'z'), { title: 'x' }))
  const str = env.authenticatedContext('u3', { admin: 'true' }).firestore()
  await assertFails(setDoc(doc(str, 'videos', 'z'), { title: 'x' }))
})

test('singletons: daily/hero/settings — hamı oxuyur, admin yazır; başqa ID olmaz', async () => {
  for (const id of ['daily', 'hero', 'settings']) {
    await assertSucceeds(getDoc(doc(anon(), 'singletons', id)))
    await assertFails(setDoc(doc(anon(), 'singletons', id), { a: 1 }))
    await assertFails(setDoc(doc(user(), 'singletons', id), { a: 1 }))
    await assertSucceeds(setDoc(doc(adminDb(), 'singletons', id), { a: 1, updatedAt: serverTimestamp() }))
  }
  await assertFails(setDoc(doc(adminDb(), 'singletons', 'other'), { a: 1 }))
})

test('notification_history: yalnız admin', async () => {
  await seed('notification_history/h1', { title: 't' })
  await assertFails(getDoc(doc(anon(), 'notification_history', 'h1')))
  await assertFails(getDocs(collection(user(), 'notification_history')))
  await assertFails(addDoc(collection(anon(), 'notification_history'), { title: 'x' }))
  await assertSucceeds(getDocs(collection(adminDb(), 'notification_history')))
  await assertSucceeds(addDoc(collection(adminDb(), 'notification_history'), { title: 'x' }))
})

test('naməlum kolleksiya — hamıya bağlı (admin də)', async () => {
  await assertFails(getDoc(doc(anon(), 'secrets', 'a')))
  await assertFails(setDoc(doc(anon(), 'secrets', 'a'), { x: 1 }))
  await assertFails(setDoc(doc(adminDb(), 'secrets', 'a'), { x: 1 }))
  await assertFails(getDoc(doc(adminDb(), 'videos', 'x', 'sub', 'y')))
})

// ── fcm_tokens ─────────────────────────────────────────────────────────
const TOKEN = 'fcmTok_ABC-123:xyz'
const LOC = { lat: 40.41, lng: 49.87, tz: 'Asia/Baku', method: 13, city: { az: 'Bakı', en: 'Baku', ru: 'Баку', ar: 'باكو', tr: 'Bakü' } }
const fullDoc = (over = {}) => ({
  token: TOKEN,
  userAgent: 'Mozilla/5.0 (test)',
  lang: 'az',
  loc: LOC,
  azan: true,
  daily: { ayah: false, hour: 8 },
  createdAt: Date.now(),
  updatedAt: serverTimestamp(),
  ...over,
})

test('fcm_tokens: düzgün sənəd yaradılır (messaging.js formatı, merge)', async () => {
  await assertSucceeds(setDoc(doc(anon(), 'fcm_tokens', TOKEN), fullDoc(), { merge: true }))
})

test('fcm_tokens: heç kim oxuya bilməz (admin də — server Admin SDK ilə oxuyur)', async () => {
  await seed(`fcm_tokens/${TOKEN}`, { token: TOKEN })
  await assertFails(getDoc(doc(anon(), 'fcm_tokens', TOKEN)))
  await assertFails(getDocs(collection(anon(), 'fcm_tokens')))
  await assertFails(getDocs(collection(adminDb(), 'fcm_tokens')))
})

test('fcm_tokens: token sənəd ID-si ilə eyni olmalıdır', async () => {
  await assertFails(setDoc(doc(anon(), 'fcm_tokens', TOKEN), fullDoc({ token: 'other' })))
  await assertFails(setDoc(doc(anon(), 'fcm_tokens', TOKEN), { lang: 'az', updatedAt: serverTimestamp() }))
})

test('fcm_tokens: icazəsiz sahə və yanlış tiplər rədd edilir', async () => {
  const ref = doc(anon(), 'fcm_tokens', TOKEN)
  await assertFails(setDoc(ref, fullDoc({ extra: 'x' })))
  await assertFails(setDoc(ref, fullDoc({ userAgent: 'x'.repeat(513) })))
  await assertFails(setDoc(ref, fullDoc({ lang: 'de' })))
  await assertFails(setDoc(ref, fullDoc({ azan: 'yes' })))
  await assertFails(setDoc(ref, fullDoc({ createdAt: 'now' })))
  await assertFails(setDoc(ref, fullDoc({ updatedAt: 123 })))
  await assertFails(setDoc(ref, fullDoc({ loc: 'Baku' })))
  await assertFails(setDoc(ref, fullDoc({ loc: { ...LOC, evil: 1 } })))
  await assertFails(setDoc(ref, fullDoc({ loc: { ...LOC, lat: 200 } })))
  await assertFails(setDoc(ref, fullDoc({ loc: { ...LOC, city: { de: 'Baku' } } })))
  await assertFails(setDoc(ref, fullDoc({ loc: { ...LOC, city: { az: 'x'.repeat(121) } } })))
  await assertFails(setDoc(ref, fullDoc({ daily: { ayah: true, hour: 24 } })))
  await assertFails(setDoc(ref, fullDoc({ daily: { ayah: 1, hour: 8 } })))
  // createdAt-siz yaradılış da olur (isNew=false, amma sənəd silinib)
  const { createdAt, ...noCreated } = fullDoc()
  await assertSucceeds(setDoc(ref, noCreated))
})

test('fcm_tokens: merge yeniləmələri (yer, günün ayəsi, azan) keçir', async () => {
  await seed(`fcm_tokens/${TOKEN}`, { token: TOKEN, lang: 'az', azan: true })
  const ref = doc(anon(), 'fcm_tokens', TOKEN)
  await assertSucceeds(setDoc(ref, { lang: 'ru', loc: LOC, updatedAt: serverTimestamp() }, { merge: true }))
  await assertSucceeds(setDoc(ref, { daily: { ayah: true, hour: 7 }, updatedAt: serverTimestamp() }, { merge: true }))
  await assertSucceeds(setDoc(ref, { azan: false, updatedAt: serverTimestamp() }, { merge: true }))
  await assertFails(setDoc(ref, { token: 'stolen', updatedAt: serverTimestamp() }, { merge: true }))
  await assertFails(setDoc(ref, { lang: 'xx' }, { merge: true }))
  await assertFails(setDoc(ref, { admin: true }, { merge: true }))
})

test('fcm_tokens: köhnə sənəddəki tanış olmayan sahə yeniləməni bloklamır', async () => {
  await seed(`fcm_tokens/${TOKEN}`, { token: TOKEN, legacyField: 'x', createdAt: new Date() })
  await assertSucceeds(setDoc(doc(anon(), 'fcm_tokens', TOKEN), { azan: true, updatedAt: serverTimestamp() }, { merge: true }))
})

test('fcm_tokens: mövcud olmayan tokenə token-siz yazı (yeni sənəd) rədd edilir', async () => {
  await assertFails(setDoc(doc(anon(), 'fcm_tokens', TOKEN), { azan: true, updatedAt: serverTimestamp() }, { merge: true }))
})

test('fcm_tokens: silmək mümkündür ("Söndür")', async () => {
  await seed(`fcm_tokens/${TOKEN}`, { token: TOKEN })
  await assertSucceeds(deleteDoc(doc(anon(), 'fcm_tokens', TOKEN)))
})
