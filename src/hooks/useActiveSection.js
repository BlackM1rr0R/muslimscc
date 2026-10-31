import { useEffect, useState } from 'react'

/**
 * "İçindəkilər" vurğusu üçün aktiv bölmə: başlanğıcı ekranın yuxarı 30%-dən
 * yuxarıda qalan SON bölmə; səhifənin sonunda — sonuncu bölmə.
 * (Sürüşmə mövqeyinə görə hesablanır — səhifənin başına qayıdanda vurğu
 * düzgün birinci bölməyə qayıdır.)
 *
 * @param {string[]} ids   bölmə elementlərinin id-ləri (sıra ilə)
 * @param {unknown}  reset dəyişəndə (başqa profil, dil) yenidən hesablanır
 * @returns {[string, (id: string) => void]}
 */
export default function useActiveSection(ids, reset) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join('|')
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const line = window.innerHeight * 0.3
      let cur = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) cur = id
      }
      const doc = document.documentElement
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= doc.scrollHeight - 4) cur = ids[ids.length - 1]
      setActive(cur)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reset])
  return [active, setActive]
}
