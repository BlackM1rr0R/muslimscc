// QR kod şəkli (SVG) — kodlayıcı (utils/qrCode) tənbəl yüklənir. 2FA qurulumu: hesab səhifəsi və admin paneli.
import { useEffect, useState } from 'react'

export default function QrImage({ text, alt, className = 'acc-sec-qr' }) {
  const [svg, setSvg] = useState(null)
  useEffect(() => {
    let on = true
    import('../../utils/qrCode').then(({ qrMatrix, qrSvgPath }) => { if (on) setSvg(qrSvgPath(qrMatrix(text, { ecl: 'M' }))) }).catch(() => {})
    return () => { on = false }
  }, [text])
  if (!svg) return <div className={`${className} ${className}--empty`} aria-hidden="true" />
  return (
    <svg className={className} viewBox={`0 0 ${svg.view} ${svg.view}`} role="img" aria-label={alt} shapeRendering="crispEdges" data-testid="totp-qr">
      <rect width={svg.view} height={svg.view} fill="#fff" />
      <path d={svg.d} fill="#000" />
    </svg>
  )
}
