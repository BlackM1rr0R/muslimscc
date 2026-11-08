#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// AR üçün Kəbə modeli (components/media/Kaaba3D → "Otağında gör")
//   node scripts/build-kaaba-ar.mjs  →  public/models/kaaba.glb (Android Scene Viewer)
//                                       public/models/kaaba.usdz (iPhone AR Quick Look)
// • Sadə həndəsə, toxuma yoxdur (rənglər materialda): qara örtük, qızılı kəmər, qızılı
//   qapı, gümüş çərçivəli Həcərül-Əsvəd, mərmər şazırvan. Miqyas 1:50 (≈ 26 sm hündürlük),
//   ölçülər təxminidir (Kaaba3D ilə eyni: 12 × 10.5 × 13 m).
// • Bir dəfə işə salınır, fayllar repoya düşür (build zamanı yox — DOM/canvas lazım deyil).
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/models')
fs.mkdirSync(OUT, { recursive: true })

// GLTFExporter binary rejimdə FileReader işlədir — Node-da yoxdur
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then(b => { this.result = b; this.onloadend?.() }) }
    readAsDataURL(blob) { blob.arrayBuffer().then(b => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString('base64')}`; this.onloadend?.() }) }
  }
}

const S = 1 / 50                     // metr → model
const W = 12 * S, D = 10.5 * S, H = 13 * S
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o })
const black = mat('#0b0b0c', { roughness: 0.9 })
const gold = mat('#d9b45c', { metalness: 0.85, roughness: 0.3 })
const marble = mat('#ecebe6', { roughness: 0.4 })
const silver = mat('#cfd4da', { metalness: 0.9, roughness: 0.25 })
const stoneM = mat('#1a1414', { roughness: 0.4 })

const kaaba = new THREE.Group()
kaaba.name = 'Kaaba'
const add = (geo, m, x, y, z, name) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.name = name; kaaba.add(o); return o }
add(new THREE.BoxGeometry(W + 0.8 * S, 0.5 * S, D + 0.8 * S), marble, 0, 0.25 * S, 0, 'Shadharwan')
add(new THREE.BoxGeometry(W, H, D), black, 0, H / 2, 0, 'Kiswa')
// qızılı kəmər — dörd tərəfdən bir az qabarıq lövhələr (hündürlüyün ~2/3-ü)
const by = H * 0.75, bh = H * 0.07, e = 0.02 * S
add(new THREE.BoxGeometry(W + e * 2, bh, D + e * 2), gold, 0, by, 0, 'Hizam')
// qapı — yerli +z üzü (şimal-şərq), Həcərül-Əsvəd küncünə yaxın
add(new THREE.BoxGeometry(1.9 * S, 3.1 * S, 0.25 * S), gold, -W / 2 + 3.2 * S, (2.13 + 1.55) * S, D / 2 + 0.1 * S, 'Door')
// Həcərül-Əsvəd — yerli (−x, +z) küncü (şərq), ~1.5 m
const frame = add(new THREE.TorusGeometry(0.42 * S, 0.12 * S, 12, 24), silver, -W / 2 - 0.05 * S, 1.5 * S, D / 2 + 0.05 * S, 'BlackStoneFrame')
frame.rotation.y = -Math.PI / 4
add(new THREE.SphereGeometry(0.32 * S, 16, 12), stoneM, -W / 2 - 0.05 * S, 1.5 * S, D / 2 + 0.05 * S, 'BlackStone')
kaaba.rotation.y = Math.PI * 0.75    // yerli +z → şimal-şərq (Kaaba3D ilə eyni)

const scene = new THREE.Scene()
scene.add(kaaba)
scene.updateMatrixWorld(true)

const glb = await new GLTFExporter().parseAsync(scene, { binary: true })
fs.writeFileSync(path.join(OUT, 'kaaba.glb'), Buffer.from(glb))
const usdz = await new USDZExporter().parseAsync(scene)
fs.writeFileSync(path.join(OUT, 'kaaba.usdz'), Buffer.from(usdz))
for (const f of ['kaaba.glb', 'kaaba.usdz']) console.log('✓', f, (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1), 'KB')
