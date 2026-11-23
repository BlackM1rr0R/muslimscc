// ═══════════════════════════════════════════════════════
// DestinationField — səyahətin təyinatını seçən axtarışlı sahə (/traveller-kit)
//
//   <DestinationField t={t} lang={lang} onPick={(place) => …} />
//   place = { lat, lng, tz, label, country }
//
// • Əvvəl saytın şəhər siyahısı (utils/prayerLocation → searchCities, 5 dildə, diakritikasız),
//   "Dünyada axtar" — Open-Meteo geocoding (CityPicker / RoadTripPrayer ilə eyni, CSP-də artıq icazəlidir).
// • Seçim saytın namaz şəhərini DƏYİŞMİR.
// • WAI-ARIA combobox: input role="combobox", siyahı role="listbox", sətirlər role="option",
//   aktiv sətir aria-activedescendant; ↑ ↓ Enter Esc. Nəticə sayı role="status" ilə elan olunur.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { searchCities, searchWorldPlaces, COUNTRY_NAMES } from '../../utils/prayerLocation'

const cityLabel = (c, lang) => (c.label && (c.label[lang] || c.label.en)) || c.id
const countryLabel = (cc, lang) => (COUNTRY_NAMES[cc] && (COUNTRY_NAMES[cc][lang] || COUNTRY_NAMES[cc].en)) || cc || ''
export const fromCity = (c, lang) => ({ lat: c.lat, lng: c.lng, tz: c.tz, label: cityLabel(c, lang), country: c.country || '' })
const fromWorld = (p) => ({ lat: p.lat, lng: p.lng, tz: p.tz, label: [p.name, p.region, p.countryName].filter(Boolean).join(', '), country: p.country || '' })

export default function DestinationField({ t, lang, onPick }) {
  const uid = useId().replace(/:/g, '')
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [world, setWorld] = useState({ status: 'idle', list: [] })
  const ctrl = useRef(null)
  useEffect(() => () => ctrl.current?.abort(), [])

  const local = useMemo(() => (value.trim()
    ? searchCities(value).slice(0, 6).map((c) => ({ key: `c-${c.id}`, p: fromCity(c, lang), sub: countryLabel(c.country, lang) }))
    : []), [value, lang])
  const list = world.status === 'done' ? world.list : local
  const show = open && list.length > 0
  const act = Math.min(active, Math.max(0, list.length - 1))

  const searchWorld = async () => {
    ctrl.current?.abort()
    const c = typeof AbortController !== 'undefined' ? new AbortController() : null
    ctrl.current = c
    setWorld({ status: 'loading', list: [] })
    try {
      const res = await searchWorldPlaces(value, lang, c?.signal)
      setWorld({ status: 'done', list: res.slice(0, 8).map((p) => ({ key: `w-${p.gid}`, p: fromWorld(p), sub: p.countryName || p.country })) })
      setActive(0)
      setOpen(true)
    } catch (e) {
      if (e?.name !== 'AbortError') setWorld({ status: 'error', list: [] })
    }
  }
  const pick = (p) => {
    onPick(p)
    setValue(p.label)
    setOpen(false)
    setWorld({ status: 'idle', list: [] })
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown' && list.length) { e.preventDefault(); setOpen(true); setActive((i) => (i + 1) % list.length) }
    else if (e.key === 'ArrowUp' && list.length) { e.preventDefault(); setOpen(true); setActive((i) => (i - 1 + list.length) % list.length) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (show) pick(list[act].p)
      else if (value.trim().length >= 2) searchWorld()
    } else if (e.key === 'Escape') setOpen(false)
  }

  const statusTxt = world.status === 'loading' ? t.searching
    : world.status === 'error' ? t.worldErr
      : world.status === 'done' ? (world.list.length ? t.found(world.list.length) : t.worldNone)
        : (show ? t.found(list.length) : (value.trim().length >= 2 && !local.length ? t.notListed : ''))
  const optId = (i) => `${uid}-o${i}`

  return (
    <div className="tk-dest">
      <label htmlFor={`${uid}-in`} className="ui-field__label">{t.dest}</label>
      <div className="tk-dest__row">
        <input id={`${uid}-in`} data-testid="tk-dest" className="ui-input" type="text" autoComplete="off" placeholder={t.destHint}
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(0); if (world.status !== 'idle') setWorld({ status: 'idle', list: [] }) }}
          onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKey}
          role="combobox" aria-autocomplete="list" aria-expanded={show} aria-controls={`${uid}-list`}
          aria-activedescendant={show ? optId(act) : undefined} aria-describedby={`${uid}-st`} />
        <button type="button" className="ui-btn ui-btn--secondary tk-dest__world" onClick={searchWorld}
          disabled={value.trim().length < 2 || world.status === 'loading'} data-testid="tk-world">
          <Icon name="globe" size={16} /> {t.world}
        </button>
      </div>
      <p id={`${uid}-st`} className="tk-dest__st" role="status" aria-live="polite">{statusTxt}</p>
      <ul id={`${uid}-list`} className="tk-dest__list" role="listbox" aria-label={t.dest} hidden={!show}>
        {show && list.map((x, i) => (
          <li key={x.key} id={optId(i)} role="option" aria-selected={i === act} className={i === act ? 'is-active' : ''}
            onMouseDown={(e) => e.preventDefault()} onClick={() => pick(x.p)} data-testid="tk-option">
            <Icon name="pin" size={14} /> <span>{x.p.label}</span> {x.sub ? <small>{x.sub}</small> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
