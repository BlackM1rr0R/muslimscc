// ═══════════════════════════════════════════════════════
// MadhabPicker (J1) — məzhəb seçimi: yalnız əsr vaxtının kölgə əmsalı (utils/madhab)
//
//   <MadhabPicker id="pp-madhab" />          — /prayer (şəhər seçicisinin altında), /account
//
// Seçim bütün saytda dərhal tətbiq olunur (namaz səhifəsi, ana səhifə, /mosque-tv, Ramazan
// imsakiyyəsi, illik qrafik, təqvim abunəliyi, push azanı) — prayerLocation hadisəsi ilə.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import { pickUi } from '../../utils/uiText'
import { MADHABS, useMadhab } from '../../utils/madhab'

export const MADHAB_TXT = {
  az: {
    label: 'Məzhəb (əsr vaxtı üçün)', none: 'Seçilməyib',
    names: { hanafi: 'Hənəfi', shafii: 'Şafii', maliki: 'Maliki', hanbali: 'Hənbəli' },
    hint: 'Yalnız əsr vaxtına təsir edir: Hənəfi — kölgə əşyanın 2 misli (Əbu Hənifənin görüşü), digərləri — 1 misli (+ günorta kölgəsi).',
    saved: 'Yadda saxlanıldı — əsr vaxtı yeniləndi.',
  },
  en: {
    label: 'School of law (for the Asr time)', none: 'Not specified',
    names: { hanafi: 'Hanafi', shafii: 'Shafi‘i', maliki: 'Maliki', hanbali: 'Hanbali' },
    hint: 'This only changes the Asr time: Hanafi — a shadow twice the object’s length (the view of Abu Hanifah), the others — once (plus the midday shadow).',
    saved: 'Saved — the Asr time has been updated.',
  },
  ru: {
    label: 'Мазхаб (для времени аср)', none: 'Не выбран',
    names: { hanafi: 'Ханафитский', shafii: 'Шафиитский', maliki: 'Маликитский', hanbali: 'Ханбалитский' },
    hint: 'Влияет только на время аср: ханафиты — тень вдвое длиннее предмета (мнение Абу Ханифы), остальные — равная ему (плюс полуденная тень).',
    saved: 'Сохранено — время аср обновлено.',
  },
  ar: {
    label: 'المذهب (لوقت العصر)', none: 'غير محدد',
    names: { hanafi: 'الحنفي', shafii: 'الشافعي', maliki: 'المالكي', hanbali: 'الحنبلي' },
    hint: 'يؤثر في وقت العصر فقط: الحنفية — ظل الشيء مثلاه (قول أبي حنيفة)، والباقون — مثله (مع فيء الزوال).',
    saved: 'حُفظ — وتحدّث وقت العصر.',
  },
  tr: {
    label: 'Mezhep (ikindi vakti için)', none: 'Seçilmedi',
    names: { hanafi: 'Hanefî', shafii: 'Şâfiî', maliki: 'Mâlikî', hanbali: 'Hanbelî' },
    hint: 'Yalnızca ikindi vaktini etkiler: Hanefî — gölge cismin 2 katı (Ebû Hanîfe’nin görüşü), diğerleri — 1 katı (+ öğle gölgesi).',
    saved: 'Kaydedildi — ikindi vakti güncellendi.',
  },
}

export default function MadhabPicker({ lang = 'az', id = 'madhab-select', className = '' }) {
  const t = pickUi(MADHAB_TXT, lang, 'en')
  const [m, setM] = useMadhab()
  const [msg, setMsg] = useState('')
  return (
    <div className={`ui-field madhab-pick ${className}`} data-testid="madhab-picker">
      <label className="ui-field__label" htmlFor={id}>{t.label}</label>
      <select id={id} className="ui-input" value={m} aria-describedby={`${id}-hint`} data-testid="madhab-select"
        onChange={(e) => { setM(e.target.value); setMsg(t.saved) }}>
        <option value="">{t.none}</option>
        {MADHABS.map((k) => <option key={k} value={k}>{t.names[k]}</option>)}
      </select>
      <span className="ui-field__hint" id={`${id}-hint`}>{t.hint}</span>
      <span className="ui-sr-only" role="status" aria-live="polite">{msg}</span>
    </div>
  )
}
