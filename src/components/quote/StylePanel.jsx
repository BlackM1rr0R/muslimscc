// ═══════════════════════════════════════════════════════
// "Ölçü" və "Üslub" bölmələri — kartın formatı, şrift, ölçü, düzülüş,
// rənglər, çərçivə, künclər, fon şəffaflığı.
// ═══════════════════════════════════════════════════════
import Icon from '../Icon'
import { FORMATS, DEFAULT_STYLE } from '../../utils/quoteCard'

const FORMAT_LABEL = { square: 'formatSquare', portrait: 'formatPortrait', story: 'formatStory', post: 'formatPost' }

export function FormatPicker({ t, value, onChange }) {
  return (
    <div className="qg-formats" role="group" aria-label={t.tabFormat}>
      {FORMATS.map(f => (
        <button
          key={f.id} type="button" className="qg-format" aria-pressed={value === f.id}
          data-format-id={f.id} onClick={() => onChange(f.id)}
        >
          <span className="qg-format__shape" style={{ aspectRatio: `${f.w} / ${f.h}` }} aria-hidden="true" />
          <span className="qg-format__name">{t[FORMAT_LABEL[f.id]]}</span>
          <span className="qg-format__dim ui-num">{f.w}×{f.h}</span>
        </button>
      ))}
    </div>
  )
}

function Seg({ label, value, options, onChange }) {
  return (
    <div className="qg-row">
      <span className="qg-label">{label}</span>
      <div className="m-seg qg-seg" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={v} type="button" className="m-seg-btn" aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>
        ))}
      </div>
    </div>
  )
}

function Range({ id, label, value, min, max, step = 1, unit = '%', onChange }) {
  return (
    <div className="qg-row qg-range-row">
      <label className="qg-label" htmlFor={id}>{label}</label>
      <div className="qg-range-wrap">
        <input id={id} className="qg-range" type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ '--qg-fill': `${((value - min) / (max - min)) * 100}%` }} />
        <output className="qg-range-val ui-num" htmlFor={id}>{value}{unit}</output>
      </div>
    </div>
  )
}

function ColorField({ id, label, value, fallback, onChange, onClear, clearLabel }) {
  return (
    <div className="qg-color">
      <label className="qg-color__swatch" htmlFor={id} style={{ '--qg-swatch': value || fallback }}>
        <input id={id} type="color" value={value || fallback} onChange={e => onChange(e.target.value)} />
      </label>
      <label className="qg-color__label" htmlFor={id}>{label}</label>
      {value && (
        <button type="button" className="ui-icon-btn qg-color__clear" aria-label={`${clearLabel}: ${label}`} title={clearLabel} onClick={onClear}>
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}

export function StylePanel({ t, style, onStyle, hasAr, hasTr, template }) {
  const set = (k) => (v) => onStyle({ ...style, [k]: v })
  return (
    <div className="qg-style">
      {hasAr && hasTr && (
        <Seg label={t.show} value={style.show} onChange={set('show')}
          options={[['both', t.showBoth], ['ar', t.showAr], ['tr', t.showTr]]} />
      )}
      <Seg label={t.font} value={style.font} onChange={set('font')}
        options={[['serif', t.fontSerif], ['sans', t.fontSans]]} />
      <Seg label={t.align} value={style.align} onChange={set('align')}
        options={[['center', t.alignCenter], ['start', t.alignStart]]} />
      {hasAr && <Range id="qg-ar-size" label={t.arSize} value={style.arScale} min={60} max={150} step={5} onChange={set('arScale')} />}
      {hasTr && <Range id="qg-tr-size" label={t.trSize} value={style.trScale} min={60} max={150} step={5} onChange={set('trScale')} />}
      <p className="qg-hint">{t.autoFit}</p>

      <div className="qg-row">
        <span className="qg-label">{t.colors}</span>
        <div className="qg-colors">
          <ColorField id="qg-bg" label={t.bgColor} value={style.bgColor} fallback="#0e5a47" clearLabel={t.clear}
            onChange={set('bgColor')} onClear={() => set('bgColor')('')} />
          <ColorField id="qg-fg" label={t.textColor} value={style.textColor} fallback={/^#[0-9a-f]{6}$/i.test(template.ink) ? template.ink : '#ffffff'} clearLabel={t.clear}
            onChange={set('textColor')} onClear={() => set('textColor')('')} />
        </div>
      </div>

      <Range id="qg-border" label={t.border} value={style.border} min={0} max={30} step={2} unit="px" onChange={set('border')} />
      {style.border > 0 && (
        <div className="qg-colors">
          <ColorField id="qg-bc" label={t.borderColor} value={style.borderColor} fallback={DEFAULT_STYLE.borderColor} clearLabel={t.clear}
            onChange={set('borderColor')} onClear={() => set('borderColor')(DEFAULT_STYLE.borderColor)} />
        </div>
      )}
      <Seg label={t.corners} value={style.corners} onChange={set('corners')}
        options={[['square', t.cornersSquare], ['round', t.cornersRound]]} />
      <Range id="qg-opacity" label={t.opacity} value={style.opacity} min={30} max={100} step={5} onChange={set('opacity')} />

      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm qg-reset" onClick={() => onStyle({ ...DEFAULT_STYLE })}>
        <Icon name="refresh" className="ui-btn__icon" /> {t.reset}
      </button>
    </div>
  )
}
