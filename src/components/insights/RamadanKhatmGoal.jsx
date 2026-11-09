// ═══════════════════════════════════════════════════════
// /ramadan → Xətm planı: hədəf halqası (viz v2 GoalRing)
// Yalnız Ramazan günlərində göstərilir: temp = oxunan cüz / Ramazanın neçənci günü,
// "plana görə" = bu günə qədər oxunmalı cüz (gündə bir). Cüz qeydlərində tarix
// saxlanmır ('muslim_cc_ramadan_khatm_v1' { done: [cüz] }) — başqa hesab uydurulmur.
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import { GoalRing, makeFormat } from '../viz'
import { pickUi } from '../../utils/uiText'

const T = {
  az: { label: 'Xətm tempi', unit: 'cüz', center: 'oxunub', plan: 'Plana görə bu günə qədər', ahead: (n) => `${n} cüz qabaqdasınız`, behind: (n) => `${n} cüz geridəsiniz`, onTrack: 'Plandasınız', state: 'Vəziyyət' },
  en: { label: 'Khatm pace', unit: 'juz', center: 'read', plan: 'Planned by today', ahead: (n) => `${n} juz ahead`, behind: (n) => `${n} juz behind`, onTrack: 'On track', state: 'Status' },
  ru: { label: 'Темп хатма', unit: 'дж.', center: 'прочитано', plan: 'По плану к сегодняшнему дню', ahead: (n) => `впереди на ${n} дж.`, behind: (n) => `отставание ${n} дж.`, onTrack: 'По плану', state: 'Состояние' },
  ar: { label: 'وتيرة الختم', unit: 'جزء', center: 'مقروء', plan: 'حسب الخطة حتى اليوم', ahead: (n) => `متقدّم بـ${n} جزء`, behind: (n) => `متأخر بـ${n} جزء`, onTrack: 'على الخطة', state: 'الحالة' },
  tr: { label: 'Hatim temposu', unit: 'cüz', center: 'okundu', plan: 'Plana göre bugüne kadar', ahead: (n) => `${n} cüz öndesiniz`, behind: (n) => `${n} cüz geridesiniz`, onTrack: 'Plandasınız', state: 'Durum' },
}

/** done — oxunan cüz sayı; day — Ramazanın neçənci günü (1–30) */
export default function RamadanKhatmGoal({ done, day, lang }) {
  const t = pickUi(T, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])
  if (!(day >= 1 && day <= 30)) return null
  const pace = Math.round((done / day) * 10) / 10
  const diff = done - day
  return (
    <div className="rp-khatm__goal" data-testid="khatm-goal">
      <GoalRing value={done} goal={30} pace={pace} unit={t.unit} centerLabel={t.center} label={t.label} size={112} thickness={10} lang={lang}
        extraRows={[
          { label: t.plan, value: `${f.num(day)} ${t.unit}` },
          { label: t.state, value: diff > 0 ? t.ahead(f.num(diff)) : diff < 0 ? t.behind(f.num(-diff)) : t.onTrack },
        ]} />
    </div>
  )
}
