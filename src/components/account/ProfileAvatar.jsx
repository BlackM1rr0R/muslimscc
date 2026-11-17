// Profil nişanı — yalnız həndəsi fiqurlar və hərf (canlı varlıq təsviri YOXDUR)
const SHAPES = {
  star8: <path d="M12 2l2.9 4.1L20 6l-.1 5.1L24 12l-4.1 2.9L20 20l-5.1-.1L12 24l-2.9-4.1L4 20l.1-5.1L0 12l4.1-2.9L4 4l5.1.1z" transform="scale(.8333) translate(2.4 2.4)" />,
  crescent: <path d="M15 3a9 9 0 1 0 6 15.7A7.5 7.5 0 1 1 15 3z" />,
  hexagon: <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />,
  diamond: <path d="M12 2l9 10-9 10-9-10z" />,
  arch: <path d="M4 22V11a8 8 0 0 1 16 0v11h-4v-9a4 4 0 0 0-8 0v9z" />,
  circle: <circle cx="12" cy="12" r="9" />,
  drop: <path d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z" />,
}

export default function ProfileAvatar({ profile, size = '' }) {
  const p = profile || {}
  const ch = ([...String(p.name || '?').trim()][0] || '?').toLocaleUpperCase()
  const shape = SHAPES[p.avatar]
  return (
    <span className={`prf-ava prf-ava--${p.color || 'emerald'}${size ? ` prf-ava--${size}` : ''}`} aria-hidden="true">
      {shape ? <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">{shape}</svg> : ch}
    </span>
  )
}
