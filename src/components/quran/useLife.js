// Ömürlük mozaikanın vəziyyəti (utils/quranLife) — yazıcı, başqa tab və ya sinxronizasiya dəyişəndə yenilənir
import { useEffect, useState } from 'react'
import { LIFE_EVENT, LIFE_KEY, readLife } from '../../utils/quranLife'

export default function useLife() {
  const [life, setLife] = useState(readLife)
  useEffect(() => {
    const reload = () => setLife(readLife())
    const onStorage = (e) => { if (!e.key || e.key === LIFE_KEY) reload() }
    window.addEventListener(LIFE_EVENT, reload)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(LIFE_EVENT, reload); window.removeEventListener('storage', onStorage) }
  }, [])
  return life
}
