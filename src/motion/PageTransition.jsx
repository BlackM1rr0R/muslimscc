// ═══════════════════════════════════════════════════════
// PageTransition — <main> üçün AnimatePresence keçidi (App.jsx). HƏR naviqasiyada TƏK mexanizm:
//
//   View Transition gedir (html.qm-vt, ≥768px, wow.js) → Motion heç nə etmir ("still"):
//                         köhnə <main> dərhal çıxır və VT-nin yeni kadrında görünmür (CSS).
//   Telefon               → köhnə <main> toxunan anda CSS ilə yola düşür (wow.js leavePage →
//                         .page-leave); Motion yalnız yenisini oxu istiqamətindən gətirir.
//   Qalan hallar          → Motion: köhnə qısa solur (popLayout — axından çıxır, CLS yox),
//                         yeni yumşaq qalxır. Hərəkəti azalt → hamısı ani.
//
// Motion xüsusiyyətləri hələ yüklənməyibsə açar dəyişmir (çıxış animasiyası "ilişməsin");
// səhifə adi kimi dəyişir. Sonrakı naviqasiyalardan etibarən keçid işləyir.
// .page-enter sinfi qalır (wow.js hero-nu onunla tanıyır); onun CSS animasiyası
// .page-enter--motion ilə söndürülüb (motion-kit.css) — iki dəfə animasiya yox.
// ═══════════════════════════════════════════════════════
import { forwardRef, useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { pageVariants } from './presets'
import { useReduced } from './reduced'
import { isMotionReady } from './MotionProvider'
import useMedia from '../hooks/useMedia'

const html = () => (typeof document === 'undefined' ? null : document.documentElement)

const PageTransition = forwardRef(function PageTransition({ pageKey, back = false, className = '', children, ...rest }, ref) {
  const reduced = useReduced()
  const phone = useMedia('(max-width: 767.98px)', false)
  const rtl = html()?.dir === 'rtl'
  // Açar yalnız Motion hazır olanda dəyişir (render zamanı törənən vəziyyət — React-in rəsmi naxışı)
  const [st, setSt] = useState({ page: pageKey, key: pageKey })
  if (st.page !== pageKey) setSt({ page: pageKey, key: isMotionReady() ? pageKey : st.key })

  // Bu naviqasiyada View Transition gedirsə və ya hərəkət azaldılıbsa — Motion susur
  const still = reduced || Boolean(html()?.classList.contains('qm-vt'))
  // Telefonda köhnə səhifə artıq CSS ilə yola düşüb (.page-leave) — onun çıxışı ani olsun
  const leaving = typeof document !== 'undefined' && Boolean(document.querySelector('main.page-leave'))
  const custom = { back, still, leaving }
  const variants = useMemo(() => pageVariants({ phone, rtl }), [phone, rtl])

  return (
    <AnimatePresence initial={false} mode="popLayout" custom={custom}>
      <m.main key={st.key} ref={ref} className={`page-enter page-enter--motion${back ? ' page-enter--back' : ''}${className ? ` ${className}` : ''}`}
        custom={custom} variants={variants} initial="enter" animate="center" exit="exit" {...rest}>
        {children}
      </m.main>
    </AnimatePresence>
  )
})

export default PageTransition
