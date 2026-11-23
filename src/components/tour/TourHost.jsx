// ═══════════════════════════════════════════════════════
// TourHost — "Kəşf et" turunun və "Yeni" nişanlarının qlobal hostu (App.jsx, hər səhifədə)
//
// • Səhifə açılanda: markSeen(page) — həmin yeni səhifənin menyudakı "Yeni" nişanı götürülür
//   (utils/whatsNewSeen, yalnız bu cihaz).
// • "qm-tour-open" hadisəsi (utils/tour → openTour) turu açır — düymələr: PageHelp, SideNav,
//   /whats-new, TourButton. Tur (DiscoverTour) və ilk gəliş təklifi (TourOffer) tənbəl chunk-dır.
// • İlk gəliş: mount-dan sonra, yalnız 1-ci gəlişdə və tur heç təklif olunmayıbsa — TourOffer
//   promptCoordinator slotu ilə (başqa banner/toast ilə üst-üstə düşmür), məzmunu bağlamır.
// • Prerender = ilk render: heç nə göstərilmir.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { markSeen } from '../../utils/whatsNewSeen'
import { TOUR_EVENT, readTourState, writeTourState } from '../../utils/tour'
import { visitCount } from '../../utils/promptCoordinator'

const NONE = { default: () => null }
const DiscoverTour = lazy(() => import('./DiscoverTour').catch(() => NONE))
const TourOffer = lazy(() => import('./TourOffer').catch(() => NONE))

// Bu səhifələrdə təklif göstərilmir (tam ekran rejimlər, giriş/hesab formaları)
const NO_OFFER = new Set(['simple', 'onroad', 'focus', 'login', 'signup', 'account', 'accountverify', 'accountreset', 'notfound', 'whatsnew'])
// Təklif ilk anda çıxmasın — səhifə əvvəlcə oxunsun
const OFFER_DELAY_MS = 3000

export default function TourHost({ page, setPage }) {
  const [open, setOpen] = useState(false)
  const [offer, setOffer] = useState(false)

  // Yeni səhifə açıldı → nişan götürülür
  useEffect(() => { markSeen(page) }, [page])

  useEffect(() => {
    const on = () => { setOffer(false); setOpen(true) }
    window.addEventListener(TOUR_EVENT, on)
    return () => window.removeEventListener(TOUR_EVENT, on)
  }, [])

  // İlk gəliş təklifi — yalnız mount-dan sonra
  useEffect(() => {
    const st = readTourState()
    if (st.offered || st.done || st.dismissed || visitCount() !== 1) return undefined
    const t = window.setTimeout(() => setOffer(true), OFFER_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  const close = useCallback(() => setOpen(false), [])
  const start = useCallback(() => { setOffer(false); setOpen(true) }, [])
  const dismissOffer = useCallback(() => setOffer(false), [])

  return (
    <>
      {offer && !open && !NO_OFFER.has(page) && (
        <Suspense fallback={null}>
          <TourOffer onStart={start} onDismiss={dismissOffer} />
        </Suspense>
      )}
      {open && (
        <Suspense fallback={null}>
          <DiscoverTour onClose={close} setPage={setPage} onFinish={() => writeTourState({ offered: true, done: true })} />
        </Suspense>
      )}
    </>
  )
}
