#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// AR üçün "Məscidi qur" modeli (components/MosqueBuilder3D → "Masanın üstündə bax")
//   node scripts/build-mosque-ar.mjs  →  public/models/mosque.glb  (Android Scene Viewer)
//                                        public/models/mosque.usdz (iPhone AR Quick Look)
// • Səhnədəki modelin özü (src/utils/mosqueModel.js — bütün 7 addım tikilmiş), miqyas
//   1:100 (≈ 30 sm en, masada). Mavi günbəz (yaşıl yox). Bir dəfə işə salınır, fayllar repoya düşür.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'
import { buildMosque } from '../src/utils/mosqueModel.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/models')
fs.mkdirSync(OUT, { recursive: true })

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then(b => { this.result = b; this.onloadend?.() }) }
    readAsDataURL(blob) { blob.arrayBuffer().then(b => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString('base64')}`; this.onloadend?.() }) }
  }
}

const holder = new THREE.Group()
holder.name = 'Mosque'
buildMosque(holder)
holder.scale.setScalar(0.01)           // 1 vahid ≈ 1 m → 1:100
holder.position.set(0, 0, -0.04)       // həyət mərkəzə yaxın
// USDZ ikitərəfli materialı dəstəkləmir (mehrab taxçası içəridən görünməzdi): belə mesh-lərə
// içə baxan nüsxə (üzləri çevrilmiş həndəsə) əlavə olunur, material birtərəfli edilir.
const flipped = []
holder.traverse((o) => {
  if (!o.isMesh || o.material?.side !== THREE.DoubleSide) return
  o.material = o.material.clone(); o.material.side = THREE.FrontSide
  const g = o.geometry.clone()
  const idx = g.index
  if (idx) { const a = idx.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t } idx.needsUpdate = true }
  const n = g.attributes.normal
  if (n) { for (let i = 0; i < n.array.length; i++) n.array[i] = -n.array[i]; n.needsUpdate = true }
  const back = new THREE.Mesh(g, o.material)
  back.position.copy(o.position); back.rotation.copy(o.rotation); back.scale.copy(o.scale)
  flipped.push([o.parent, back])
})
for (const [parent, m] of flipped) parent.add(m)

const scene = new THREE.Scene()
scene.add(holder)
scene.updateMatrixWorld(true)

const glb = await new GLTFExporter().parseAsync(scene, { binary: true })
fs.writeFileSync(path.join(OUT, 'mosque.glb'), Buffer.from(glb))
const usdz = await new USDZExporter().parseAsync(scene)
fs.writeFileSync(path.join(OUT, 'mosque.usdz'), Buffer.from(usdz))
for (const f of ['mosque.glb', 'mosque.usdz']) console.log('✓', f, (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1), 'KB')
