// ═══════════════════════════════════════════════════════
// Saytdaxili keçid — həqiqi <a href> (Breadcrumb/Footer ilə eyni nümunə).
//
// Niyə: bir neçə səhifədə başqa bölməyə keçid <button onClick={setPage}> idi —
// Ctrl/orta klik yeni tabda açmırdı, linki kopyalamaq olmurdu, ekran oxuyucusu
// "düymə" deyirdi, axtarış robotu isə keçidi görmürdü. Adi klik SPA ilə keçir.
// ═══════════════════════════════════════════════════════
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'

/** Adi sol klikdirmi? (Ctrl/⌘/Shift/orta klik — brauzer linki özü açsın) */
export const isPlainClick = (e) => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

/**
 * @param {{ to: string, setPage?: (key: string) => void, onNavigate?: () => void,
 *           className?: string, children: import('react').ReactNode }} props
 */
export default function PageLink({ to, setPage, onNavigate, className, children, ...rest }) {
  const { lang } = useLang()
  const onClick = (e) => {
    if (!setPage || !isPlainClick(e)) return
    e.preventDefault()
    setPage(to)
    onNavigate?.()
  }
  return (
    <a href={pathFor(to, lang)} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  )
}
