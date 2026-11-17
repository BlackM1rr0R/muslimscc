// ═══════════════════════════════════════════════════════
// Hekayə kitabının bir səhnəsi — <svg> çərçivəsi + kitaba aid səhnə modulu.
// Props: book (id), k (addım açarı), cam (−1…1 parallaks), pal, className.
// preserveAspectRatio="slice": üz qabığında (portret) və telefonda (4:3)
// mərkəz qorunur, kənarlar kəsilir.
// ═══════════════════════════════════════════════════════
import { useId } from 'react'
import { AdamScene, NuhScene, IbrahimScene } from './scenesA'
import { KaabaScene, MusaScene, YusufScene } from './scenesB'
import { YunusScene, SulaymanScene, IsaScene } from './scenesC'
import { SceneCtx } from './kit'

export const SCENES = {
  adam: AdamScene,
  nuh: NuhScene,
  ibrahim: IbrahimScene,
  'ibrahim-and-ismail': KaabaScene,
  musa: MusaScene,
  yusuf: YusufScene,
  yunus: YunusScene,
  sulayman: SulaymanScene,
  isa: IsaScene,
}

export default function StoryScene({ book, k, cam = 0, pal, className = '', label }) {
  const raw = useId()
  const uid = 'sb' + raw.replace(/[^a-zA-Z0-9]/g, '')
  const Scene = SCENES[book]
  return (
    <svg className={`sb-svg ${className}`} viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} focusable="false">
      <defs>
        <linearGradient id={`${uid}-hsh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </linearGradient>
        <pattern id={`${uid}-grain`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r=".7" fill="#fff" opacity=".5" />
          <circle cx="5" cy="4.5" r=".6" fill="#000" opacity=".35" />
        </pattern>
      </defs>
      <SceneCtx.Provider value={uid}>
        {Scene ? <Scene uid={uid} k={k} cam={cam} pal={pal} /> : <rect width="800" height="500" fill={pal?.a || '#2f7a5c'} />}
      </SceneCtx.Provider>
      <rect x="-200" y="-20" width="1200" height="560" fill={`url(#${uid}-grain)`} opacity=".14" pointerEvents="none" />
    </svg>
  )
}
