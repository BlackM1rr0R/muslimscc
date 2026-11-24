import { lazy as reactLazy } from 'react'
import { withChunkRetry } from './chunkRetry'

/**
 * React.lazy + preload: modul artıq yüklənibsə, komponent Suspense-siz,
 * birbaşa render olunur (React.lazy ilk render-də HƏMİŞƏ bir dəfə suspend edir).
 * .preload() — chunk-ı başlat (Promise<modul>); .loaded — hazırdır.
 * App.jsx (HomePage) və qabıq hissələri (SideNav, FloatingDock, Footer …) istifadə edir.
 */
export function lazyPage(factory) {
  let Loaded = null
  let promise = null
  const load = withChunkRetry(factory)
  const preload = () => {
    if (!promise) {
      promise = load().then((m) => { Loaded = m.default; return m })
      promise.catch(() => { promise = null })
    }
    return promise
  }
  const Lazy = reactLazy(preload)
  function Page(props) {
    return Loaded ? <Loaded {...props} /> : <Lazy {...props} />
  }
  Page.preload = () => preload().then((m) => { Page.loaded = true; return m })
  return Page
}
