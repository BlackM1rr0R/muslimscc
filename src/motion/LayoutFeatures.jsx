// LayoutFeatures — layout / layoutId / drag lazım olan alt ağac üçün domMax
// (tənbəl chunk, yalnız bu komponent ilk dəfə mount olanda yüklənir).
// İç-içə LazyMotion: xüsusiyyətlər qlobal qeydə alınır, ana provider-i pozmur.
// İstifadə: <LayoutFeatures><AnimatedTabs …/></LayoutFeatures> — AnimatedTabs,
// ExpandableGroup, CardStack, AnimatedList bunu ÖZÜ edir.
import { LazyMotion } from 'motion/react'

let p = null
export const loadMax = () => (p ||= import('./features-max.js').then(m => m.default).catch((e) => { p = null; throw e }))

export default function LayoutFeatures({ children }) {
  return <LazyMotion features={loadMax} strict>{children}</LazyMotion>
}
