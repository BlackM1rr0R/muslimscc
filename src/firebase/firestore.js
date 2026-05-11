// ═══ FIRESTORE CRUD WRAPPER ═══
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, setDoc, Timestamp, serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './config'

// ═══ COLLECTION HELPERS ═══

// Bütün sənədləri əldə et
export async function getAll(collectionName, orderField = 'createdAt') {
  if (!isFirebaseConfigured()) return []
  try {
    const q = query(collection(db, collectionName), orderBy(orderField, 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('getAll error:', e)
    return []
  }
}

// Yeni sənəd əlavə et
export async function addDocument(collectionName, data) {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

// Sənədi yenilə
export async function updateDocument(collectionName, id, updates) {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
  await updateDoc(doc(db, collectionName, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
  return { id, ...updates }
}

// Sənədi sil
export async function deleteDocument(collectionName, id) {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
  await deleteDoc(doc(db, collectionName, id))
  return true
}

// Real-time listener (dəyişikliklər anında ekrana gəlir)
export function subscribeToCollection(collectionName, callback, orderField = 'createdAt') {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }

  const q = query(collection(db, collectionName), orderBy(orderField, 'desc'))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(items)
  }, (err) => {
    console.error('subscribe error:', err)
    callback([])
  })
}

// ═══ SINGLE DOC (singleton-tip məlumat üçün, məs. settings, hero, daily) ═══

export async function getSingleDoc(collectionName, docId) {
  if (!isFirebaseConfigured()) return null
  try {
    const ref = doc(db, collectionName, docId)
    const snap = await getDoc(ref)
    if (snap.exists()) return { id: snap.id, ...snap.data() }
    return null
  } catch (e) {
    console.error('getSingleDoc error:', e)
    return null
  }
}

export async function setSingleDoc(collectionName, docId, data) {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return data
}

export function subscribeSingleDoc(collectionName, docId, callback) {
  if (!isFirebaseConfigured()) {
    callback(null)
    return () => {}
  }
  return onSnapshot(doc(db, collectionName, docId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
    else callback(null)
  }, (err) => {
    console.error('subscribe single error:', err)
    callback(null)
  })
}

// ═══ COLLECTION NAMES (Firestore-da bunlar yaradılacaq) ═══
export const COLLECTIONS = {
  VIDEOS: 'videos',
  BOOKS: 'books',
  HADITHS: 'hadiths',
  DUAS: 'duas',
  QUOTES: 'quotes',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  PLACES: 'places',
  // Singleton documents
  SETTINGS: 'settings',
  DAILY_CONTENT: 'singletons/daily',
  HERO: 'singletons/hero',
}
