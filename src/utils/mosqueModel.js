// ═══════════════════════════════════════════════════════
// "Məscidi qur" modeli — MosqueBuilder3D (səhnə) və scripts/build-mosque-ar.mjs (AR faylları)
// Saf three.js (DOM yoxdur). Günbəz və kaşı MAVİ (yaşıl günbəz yox — sahibin qərarı).
// ═══════════════════════════════════════════════════════
import * as THREE from 'three'

export const STEPS = ['base', 'arcade', 'mihrab', 'minbar', 'dome', 'muqarnas', 'minaret']

// Hissələr: hər biri öz qrupunda (yerinə enmək üçün)
export function buildMosque(scene) {
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, ...o })
  // Kaşı — mavi (yaşıl günbəz yox: sahibin qərarı, removed-by-decision)
  const stone = M('#e6dcc6'), wall = M('#f3ecdc'), tile = M('#2e6fa8', { roughness: 0.35, metalness: 0.1 }), gold = M('#c9a227', { metalness: 0.6, roughness: 0.35, emissive: '#5a4205', emissiveIntensity: 0.25 })
  const wood = M('#8a5a2b'), dark = M('#2d3b36')
  const groups = STEPS.map(() => new THREE.Group())
  const add = (i, geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; groups[i].add(m); return m }
  // 0 — bünövrə + həyət
  add(0, new THREE.BoxGeometry(30, 0.6, 30), stone, 0, 0.3, 4)
  for (let i = -3; i <= 3; i++) for (let j = 0; j < 3; j++) add(0, new THREE.BoxGeometry(3.6, 0.04, 3.6), (i + j) % 2 ? stone : M('#d8cdb3'), i * 4, 0.62, 12 + j * 4)
  add(0, new THREE.CylinderGeometry(1.2, 1.4, 0.8, 24), tile, 0, 1, 15)   // fəvvarə (dəstəmaz)
  // 1 — divarlar, sütunlar, tağlar
  add(1, new THREE.BoxGeometry(22, 7, 0.8), wall, 0, 4.1, -8)            // qiblə divarı
  add(1, new THREE.BoxGeometry(0.8, 7, 16), wall, -11, 4.1, 0)
  add(1, new THREE.BoxGeometry(0.8, 7, 16), wall, 11, 4.1, 0)
  for (const x of [-8, -4, 0, 4, 8]) {
    add(1, new THREE.CylinderGeometry(0.42, 0.5, 5.2, 16), wall, x, 3.2, 7.6)
    add(1, new THREE.BoxGeometry(1.2, 0.4, 1.2), stone, x, 0.8, 7.6)
  }
  for (const x of [-6, -2, 2, 6]) {
    const arch = add(1, new THREE.TorusGeometry(2, 0.38, 10, 24, Math.PI), wall, x, 5.8, 7.6)
    arch.rotation.z = 0
  }
  // Dam yoxdur — içəri (mehrab, minbər) yuxarıdan görünsün; günbəz divarların üstündə
  add(1, new THREE.BoxGeometry(12, 0.5, 12), wall, 0, 7.9, -1)            // günbəzin oturacağı
  // 2 — mehrab (qiblə divarının içində)
  add(2, new THREE.BoxGeometry(3.4, 5, 0.3), tile, 0, 3.1, -7.45)
  const niche = add(2, new THREE.CylinderGeometry(1.1, 1.1, 3.4, 24, 1, true, Math.PI / 2, Math.PI), gold, 0, 2.3, -7.2)
  niche.material = niche.material.clone(); niche.material.side = THREE.DoubleSide
  const hood = add(2, new THREE.SphereGeometry(1.1, 24, 12, Math.PI / 2, Math.PI, 0, Math.PI / 2), gold, 0, 4, -7.2)
  hood.material = hood.material.clone(); hood.material.side = THREE.DoubleSide
  // 3 — minbər (mehrabın sağında — içəridən baxana görə)
  for (let k = 0; k < 7; k++) add(3, new THREE.BoxGeometry(1.2, 0.36 * (k + 1), 0.6), wood, 3.4, 0.6 + 0.18 * (k + 1), -1 - k * 0.6)
  add(3, new THREE.BoxGeometry(1.4, 0.3, 1.4), wood, 3.4, 3.6, -5.6)
  add(3, new THREE.ConeGeometry(0.9, 1.4, 4), gold, 3.4, 4.5, -5.6, Math.PI / 4)
  // 4 — günbəz (təbil + yarımkürə)
  add(4, new THREE.CylinderGeometry(5.2, 5.4, 2.2, 32), wall, 0, 9.3, -1)
  add(4, new THREE.SphereGeometry(5.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), tile, 0, 10.4, -1)
  add(4, new THREE.CylinderGeometry(0.08, 0.12, 1.6, 8), gold, 0, 16.3, -1)
  add(4, new THREE.SphereGeometry(0.35, 16, 12), gold, 0, 17.2, -1)
  // 5 — muqərnəs: təbilin altında pilləli hücrələr (3 cərgə)
  for (let row = 0; row < 3; row++) {
    const n = 32 - row * 4, r = 5.6 - row * 0.25
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + row * 0.1
      add(5, new THREE.BoxGeometry(0.75, 0.42, 0.42), row % 2 ? gold : M('#e7c77d', { metalness: 0.4, roughness: 0.4 }), Math.sin(a) * r, 8.25 + row * 0.42, -1 + Math.cos(a) * r, a)
    }
  }
  // 6 — minarə
  add(6, new THREE.BoxGeometry(2.6, 1.2, 2.6), stone, 13.5, 0.9, 9)
  add(6, new THREE.CylinderGeometry(0.85, 1.05, 18, 20), wall, 13.5, 10.4, 9)
  add(6, new THREE.CylinderGeometry(1.5, 1.2, 0.5, 24), tile, 13.5, 15.2, 9)   // şərəfə
  add(6, new THREE.CylinderGeometry(0.7, 0.75, 3, 16), wall, 13.5, 17.6, 9)
  add(6, new THREE.ConeGeometry(0.95, 3, 20), tile, 13.5, 20.6, 9)
  add(6, new THREE.SphereGeometry(0.22, 12, 10), gold, 13.5, 22.3, 9)
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; add(6, new THREE.BoxGeometry(0.12, 0.7, 0.12), dark, 13.5 + Math.sin(a) * 1.4, 15.7, 9 + Math.cos(a) * 1.4) }
  groups.forEach(g => scene.add(g))
  return { groups, gold }
}

