// Dərsin mətnini tənbəl yüklə (hər dərs ayrıca chunk). Yalnız Vite-də işləyir.
const LOADERS = import.meta.glob(['./*.js', '!./index.js', '!./cats.js', '!./load.js'])

/** slug → Promise<{ sections, sources }> | null (dərs yoxdursa) */
export function loadLesson(slug) {
  const f = LOADERS[`./${slug}.js`]
  return f ? f().then(m => m.default) : null
}
