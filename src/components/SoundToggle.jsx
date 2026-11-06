// Səs açarı (çip) — utils/uiSound. Seçim bütün saytda ortaqdır.
import { useEffect, useState } from 'react'
import Icon from './Icon'
import { soundsOn, setSoundsOn, onSoundsChange } from '../utils/uiSound'
import { pickUi } from '../utils/uiText'

const L = { az: 'Səs', en: 'Sound', ru: 'Звук', ar: 'الصوت', tr: 'Ses' }
const HINT = {
  az: 'Muncuq və vərəq səsləri (cihazda yaradılır)', en: 'Bead and page sounds (made on the device)',
  ru: 'Звуки бусин и страниц (создаются на устройстве)', ar: 'أصوات الحبات والصفحات (تُولَّد على الجهاز)',
  tr: 'Boncuk ve sayfa sesleri (cihazda üretilir)',
}

export default function SoundToggle({ lang = 'az', className = '' }) {
  const [on, setOn] = useState(soundsOn)
  useEffect(() => onSoundsChange(setOn), [])
  return (
    <button type="button" className={`ui-chip ${className}`} aria-pressed={on} title={pickUi(HINT, lang, 'en')}
      onClick={() => setSoundsOn(!on)} data-testid="sound-toggle">
      <Icon name="volume" size={16} /> {pickUi(L, lang, 'en')}
    </button>
  )
}
