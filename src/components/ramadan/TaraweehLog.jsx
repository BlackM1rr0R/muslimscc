// ═══════════════════════════════════════════════════════
// TaraweehLog (J4) — Ramazan gecələri üçün sadə təravih qeydi (/ramadan, Hilal yolunun altında)
//
//   <TaraweehLog lang="az" year={1448} today={12} />
//
// • Gecəyə toxunuş — qeyd / sil. Rəkət sayı istəyə bağlıdır (8 · 20 · başqa) — yalnız istifadəçinin
//   öz qeydidir; sayt heç bir say barədə hökm vermir.
// • Yaddaş: utils/taraweeh (muslim_cc_taraweeh_v1) — ehtiyat nüsxə + hesabın şifrəli sinxronu.
// • Ramazan "Wrapped" (components/ramadan/RamadanWrapped) təravih gecələrini buradan götürür.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { pickUi } from '../../utils/uiText'
import { readTaraweeh, setNight, yearStats, normRakat, TARAWEEH_EVENT, TARAWEEH_KEY, RAKAT_MIN, RAKAT_MAX } from '../../utils/taraweeh'
import '../../styles/TaraweehLog.css'

const T = {
  az: {
    ey: 'Təravih', title: 'Təravih gündəliyi', lead: 'Qıldığınız gecəni qeyd edin. Rəkət sayını istəsəniz yazın — bu yalnız sizin qeydinizdir, sayt heç bir say barədə hökm vermir.',
    night: (n) => `Gecə ${n}`, st: { 0: 'qeyd yoxdur', 1: 'qılındı' }, tonight: 'bu gecə', rak: (n) => `${n} rəkət`,
    rakLabel: 'Yeni qeydlər üçün rəkət sayı (istəyə bağlı)', none: 'Göstərmə', other: 'Başqa', otherN: 'Rəkət sayı',
    hint: 'Gecəyə toxunun — qeyd olunur; yenidən toxunun — silinir.', nights: 'Qeyd olunan gecə', rakats: 'Yazılan rəkət cəmi',
    saved: (n) => `Gecə ${n} qeyd olundu.`, removed: (n) => `Gecə ${n} qeydi silindi.`,
  },
  en: {
    ey: 'Taraweeh', title: 'Taraweeh log', lead: 'Mark the nights you prayed. Add the number of rak‘ahs if you like — it is only your own note; the site does not rule on any number.',
    night: (n) => `Night ${n}`, st: { 0: 'not recorded', 1: 'prayed' }, tonight: 'tonight', rak: (n) => `${n} rak‘ahs`,
    rakLabel: 'Rak‘ahs for new entries (optional)', none: 'Don’t record', other: 'Other', otherN: 'Number of rak‘ahs',
    hint: 'Tap a night to mark it; tap again to clear it.', nights: 'Nights recorded', rakats: 'Rak‘ahs noted in total',
    saved: (n) => `Night ${n} recorded.`, removed: (n) => `Night ${n} cleared.`,
  },
  ru: {
    ey: 'Таравих', title: 'Дневник таравиха', lead: 'Отмечайте ночи, когда вы совершили таравих. Число ракаатов можно указать по желанию — это только ваша заметка, сайт не выносит суждений о числе.',
    night: (n) => `Ночь ${n}`, st: { 0: 'не отмечено', 1: 'совершён' }, tonight: 'сегодня ночью', rak: (n) => `ракаатов: ${n}`,
    rakLabel: 'Ракааты для новых отметок (необязательно)', none: 'Не указывать', other: 'Другое', otherN: 'Число ракаатов',
    hint: 'Коснитесь ночи — отметка; повторное касание — снять.', nights: 'Отмечено ночей', rakats: 'Всего указано ракаатов',
    saved: (n) => `Ночь ${n} отмечена.`, removed: (n) => `Отметка ночи ${n} снята.`,
  },
  ar: {
    ey: 'التراويح', title: 'سجل التراويح', lead: 'سجّل الليالي التي صليت فيها. واكتب عدد الركعات إن شئت — هو ملاحظتك وحدك، ولا يحكم الموقع في أي عدد.',
    night: (n) => `الليلة ${n}`, st: { 0: 'لم تُسجَّل', 1: 'صُلّيت' }, tonight: 'الليلة', rak: (n) => `${n} ركعة`,
    rakLabel: 'عدد الركعات للتسجيلات الجديدة (اختياري)', none: 'بلا عدد', other: 'غير ذلك', otherN: 'عدد الركعات',
    hint: 'المس الليلة لتسجيلها، والمسها مرة أخرى لمسحها.', nights: 'ليالٍ مسجّلة', rakats: 'مجموع الركعات المكتوبة',
    saved: (n) => `سُجّلت الليلة ${n}.`, removed: (n) => `مُسح تسجيل الليلة ${n}.`,
  },
  tr: {
    ey: 'Teravih', title: 'Teravih günlüğü', lead: 'Kıldığınız geceleri işaretleyin. İsterseniz rekât sayısını yazın — bu yalnızca sizin notunuzdur; site hiçbir sayı hakkında hüküm vermez.',
    night: (n) => `${n}. gece`, st: { 0: 'işaret yok', 1: 'kılındı' }, tonight: 'bu gece', rak: (n) => `${n} rekât`,
    rakLabel: 'Yeni kayıtlar için rekât sayısı (isteğe bağlı)', none: 'Yazma', other: 'Diğer', otherN: 'Rekât sayısı',
    hint: 'Bir geceye dokunun — işaretlenir; tekrar dokunun — silinir.', nights: 'İşaretlenen gece', rakats: 'Yazılan toplam rekât',
    saved: (n) => `${n}. gece işaretlendi.`, removed: (n) => `${n}. gece işareti silindi.`,
  },
}

export default function TaraweehLog({ lang = 'az', year = 'x', today = null, nightsInMonth = 30 }) {
  const t = pickUi(T, lang, 'en')
  const [state, setState] = useState(() => (typeof window === 'undefined' ? {} : readTaraweeh()))
  const [mode, setMode] = useState('none')   // 'none' | '8' | '20' | 'other'
  const [other, setOther] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const re = () => setState(readTaraweeh())
    const onStorage = (e) => { if (!e.key || e.key === TARAWEEH_KEY) re() }
    window.addEventListener(TARAWEEH_EVENT, re)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(TARAWEEH_EVENT, re); window.removeEventListener('storage', onStorage) }
  }, [])
  const valid = /^\d{3,4}$/.test(String(year))
  const nights = (valid && state[String(year)]) || {}
  const stats = yearStats(state, year)
  const tonight = Number.isInteger(today) && today >= 1 && today < 30 ? today + 1 : null
  const rakFor = () => (mode === '8' ? 8 : mode === '20' ? 20 : mode === 'other' ? normRakat(other) || 0 : 0)
  const toggle = (n) => {
    if (!valid) return
    const on = nights[n] !== undefined
    setState(setNight(state, year, n, on ? null : rakFor()))
    setMsg(on ? t.removed(n) : t.saved(n))
  }
  return (
    <section className="ui-card trl" aria-labelledby="tw-title" data-testid="taraweeh-log">
      <div className="trl__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="tw-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="trl__lead">{t.lead}</p>
      </div>
      <fieldset className="trl__rak">
        <legend className="ui-field__label">{t.rakLabel}</legend>
        {[['none', t.none], ['8', t.rak(8)], ['20', t.rak(20)], ['other', t.other]].map(([k, label]) => (
          <label key={k} className={`trl__chip${mode === k ? ' is-on' : ''}`}>
            <input type="radio" name="tw-rak" value={k} checked={mode === k} onChange={() => setMode(k)} /> <span>{label}</span>
          </label>
        ))}
        {mode === 'other' && (
          <label className="trl__other">
            <span className="ui-sr-only">{t.otherN}</span>
            <input type="number" className="ui-input" min={RAKAT_MIN} max={RAKAT_MAX} step={1} inputMode="numeric" value={other}
              onChange={(e) => setOther(e.target.value)} aria-label={t.otherN} data-testid="tw-other" />
          </label>
        )}
      </fieldset>
      <p className="trl__hint">{t.hint}</p>
      <ol className="trl__nights">
        {Array.from({ length: nightsInMonth }, (_, k) => {
          const n = k + 1, v = nights[n]
          const on = v !== undefined
          return (
            <li key={n}>
              <button type="button" className={`trl__night${on ? ' is-on' : ''}${tonight === n ? ' is-tonight' : ''}`} aria-pressed={on}
                aria-label={`${t.night(n)}${tonight === n ? ` (${t.tonight})` : ''}: ${t.st[on ? 1 : 0]}${on && v > 0 ? ` · ${t.rak(v)}` : ''}`}
                onClick={() => toggle(n)} disabled={!valid} data-night={n}>
                <span className="trl__n ui-num">{n}</span>
                {on && <span className="trl__v ui-num" aria-hidden="true">{v > 0 ? v : '✓'}</span>}
              </button>
            </li>
          )
        })}
      </ol>
      <ul className="trl__stats">
        <li>{t.nights} <b className="ui-num" data-testid="tw-nights">{stats.nights}</b></li>
        {stats.counted > 0 && <li>{t.rakats} <b className="ui-num">{stats.rakats}</b></li>}
      </ul>
      <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>
    </section>
  )
}
