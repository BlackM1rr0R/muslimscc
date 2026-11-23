// ═══════════════════════════════════════════════════════
// Ailə halqası — dəstin məzmununu saytın MÖVCUD məlumatından yükləyir (yalnız mount-dan sonra,
// pages/FamilyHalaqaPage dinamik import edir). Burada dini mətn YAZILMIR:
//   • ayə   — data/tadabbur.js (ərəb mətni + tərcümə + tərcüməçi; sual Muslims.cc-nindir, təfsir deyil)
//   • hədis — "virtual:nawawi-home/<dil>" (vite.config.js; data/nawawi40.js-in kart sahələri, ~8 KB gzip)
//   • dərs  — data/lessons/<slug>.js bölməsi (data/lessons/load), başlıq — data/lessons/index
// ═══════════════════════════════════════════════════════
import { loadLesson } from '../../data/lessons/load'

// Statik import() — Vite hər dil üçün ayrıca kiçik chunk yaradır (HomeToday ilə eyni modul)
const NAWAWI = {
  az: () => import('virtual:nawawi-home/az'),
  en: () => import('virtual:nawawi-home/en'),
  ru: () => import('virtual:nawawi-home/ru'),
  tr: () => import('virtual:nawawi-home/tr'),
  ar: () => import('virtual:nawawi-home/ar'),
}

const once = new Map()
const cached = (key, fn) => {
  if (!once.has(key)) {
    const p = fn()
    p.catch(() => once.delete(key))
    once.set(key, p)
  }
  return once.get(key)
}

/** → { tadabbur: { TADABBUR, TADABBUR_SOURCES }, nawawi: [...], lessonBySlug } */
export function loadBase(lang) {
  const l = NAWAWI[lang] ? lang : 'en'
  return Promise.all([
    cached('tadabbur', () => import('../../data/tadabbur')),
    cached(`nawawi:${l}`, () => NAWAWI[l]().then((m) => m.default)),
    cached('lessons', () => import('../../data/lessons/index')),
  ]).then(([tad, nawawi, lessons]) => ({ tad, nawawi, lessonBySlug: lessons.lessonBySlug }))
}

/** Dərs bölməsi → { id, title, blocks } | null */
export function loadSection(slug, sec) {
  return cached(`lesson:${slug}`, () => loadLesson(slug) || Promise.reject(new Error('no lesson')))
    .then((d) => (d?.sections || []).find((x) => x.id === sec) || null)
}
