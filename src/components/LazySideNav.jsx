// ═══════════════════════════════════════════════════════
// SideNav — tənbəl chunk (PERFORMANS, 2026-11-24).
//
// SideNav.jsx (+ SideNav.css, HoverPill) əvvəl hər səhifənin əsas paketində idi, amma:
//   • telefonda (<1024px) yan panel render olunmur, çəkmə menyu isə boş vaxtda
//     əvvəlcədən qurulur (Header.jsx) — ilk boyamaya lazım deyil;
//   • geniş ekranda main.jsx ilk render-dən ƏVVƏL bu chunk-ı gözləyir (preloadShell) —
//     yan panel əvvəlki kimi ilk kadrdan görünür.
// App.jsx (rail) və Header.jsx (drawer) eyni yükləyicini paylaşır.
// ═══════════════════════════════════════════════════════
import { lazyPage } from '../utils/lazyPage'

const SideNav = lazyPage(() => import('./SideNav'))

export default SideNav
