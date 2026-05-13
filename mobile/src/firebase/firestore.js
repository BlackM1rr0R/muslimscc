// ═══ FIRESTORE WRAPPER — Mobile ═══
import {
  collection, doc, getDocs, getDoc,
  query, orderBy, onSnapshot,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './config'

// Bütün sənədləri əldə et (read-only mobile)
export async function getAll(collectionName, orderField = 'createdAt') {
  if (!isFirebaseConfigured()) return []
  try {
    const q = query(collection(db, collectionName), orderBy(orderField, 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.warn('getAll error:', e.message)
    return []
  }
}

// Real-time listener
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
    console.warn('subscribe error:', err.message)
    callback([])
  })
}

// Singleton sənəd (məs. settings, hero)
export async function getSingleDoc(collectionName, docId) {
  if (!isFirebaseConfigured()) return null
  try {
    const snap = await getDoc(doc(db, collectionName, docId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (e) {
    console.warn('getSingleDoc error:', e.message)
    return null
  }
}

export function subscribeSingleDoc(collectionName, docId, callback) {
  if (!isFirebaseConfigured()) { callback(null); return () => {} }
  return onSnapshot(doc(db, collectionName, docId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
    else callback(null)
  }, () => callback(null))
}

// Collection names (web ilə eyni)
export const COLLECTIONS = {
  VIDEOS: 'videos',
  BOOKS: 'books',
  HADITHS: 'hadiths',
  DUAS: 'duas',
  QUOTES: 'quotes',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  PLACES: 'places',
  SETTINGS: 'settings',
  DAILY_CONTENT: 'singletons/daily',
  HERO: 'singletons/hero',
}
