// Arxa kameranın baxdığı istiqamət (kompas bucağı, şimaldan saat əqrəbi ilə)
// DeviceOrientation alpha/beta/gamma-dan (W3C çərçivəsi: x — şərq, y — şimal, z — yuxarı).
// Kamera cihazın −z oxu boyunca baxır; onu yer çərçivəsinə çeviririk.
// Saf funksiyalar — tests/unit/camera-heading.test.js
const RAD = Math.PI / 180

/** alpha, beta, gamma (dərəcə) → kameranın kompas bucağı (0…360) və ya null (telefon düz uzanıb) */
export function cameraHeading(alpha, beta, gamma) {
  if (![alpha, beta, gamma].every(Number.isFinite)) return null
  const a = alpha * RAD, b = beta * RAD, g = gamma * RAD
  const sA = Math.sin(a), cA = Math.cos(a), sB = Math.sin(b), sG = Math.sin(g), cG = Math.cos(g)
  // R = Rz(a)·Rx(b)·Ry(g) matrisinin 3-cü sütunu, işarəsi dəyişdirilib (−z)
  const east = -(cA * sG + sA * sB * cG)
  const north = -(sA * sG - cA * sB * cG)
  if (Math.hypot(east, north) < 0.25) return null // kamera yerə/göyə baxır — bucaq etibarsızdır
  return ((Math.atan2(east, north) / RAD) + 360) % 360
}

/** İki bucaq arasındakı işarəli fərq (−180…180): hədəf − cari */
export const angleDiff = (target, cur) => ((target - cur + 540) % 360) - 180

/** Bucağın yumşaldılması (dairəvi low-pass) */
export function smoothAngle(prev, next, k = 0.18) {
  if (prev == null) return next
  return (prev + angleDiff(next, prev) * k + 360) % 360
}
