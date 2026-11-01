import { useEffect } from 'react'

/**
 * Üfüqi "İçindəkilər" çip zolağında aktiv çipi görünən yerə sürüşdürür
 * (yalnız zolağın özünü — səhifəni yox; scrollIntoView səhifəni də tərpədərdi).
 * Sahabə, Alimlər, Dərslər profil/dərs səhifələri işlədir.
 *
 * @param {React.RefObject<HTMLElement>} listRef  sürüşən siyahı (ol)
 * @param {string} active  aktiv bölmənin id-si (dəyişəndə işləyir)
 */
export default function useChipIntoView(listRef, active) {
  useEffect(() => {
    const list = listRef.current
    if (!list || list.scrollWidth <= list.clientWidth + 1) return
    const link = list.querySelector('[aria-current="true"]')
    if (!link) return
    const lr = list.getBoundingClientRect()
    const cr = link.getBoundingClientRect()
    const delta = (cr.left + cr.width / 2) - (lr.left + lr.width / 2)
    if (Math.abs(delta) < 8) return
    let smooth = true
    try { smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { smooth = false }
    list.scrollBy({ left: delta, behavior: smooth ? 'smooth' : 'auto' })
  }, [listRef, active])
}
