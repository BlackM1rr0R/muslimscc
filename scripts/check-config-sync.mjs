// Veb və mobil brend konfiqi eyni qalmalıdır (mobil surətdir).
// İcazəli fərqlər: mobil faylın başlıq şərhi və IS_DEV sətri.
// İstifadə: node scripts/check-config-sync.mjs  (CI-də işləyir; fərq → exit 1)
import fs from 'node:fs'

const norm = (s) => s
  .replace(/\r\n/g, '\n')
  .split('\n')
  .filter(l => !/^const IS_DEV = /.test(l))
  .join('\n')

const web = norm(fs.readFileSync('src/config/brand.js', 'utf8'))
// Mobil: başlıq (ilk boş sətrə qədər) atılır
const mobRaw = fs.readFileSync('mobile/src/config/brand.js', 'utf8').replace(/\r\n/g, '\n')
const mob = norm(mobRaw.slice(mobRaw.indexOf('\n\n') + 2))

if (web !== mob) {
  const a = web.split('\n'), b = mob.split('\n')
  const i = a.findIndex((l, k) => l !== b[k])
  console.error(`✗ src/config/brand.js və mobile/src/config/brand.js fərqlidir (sətir ~${i + 1}):`)
  console.error('  veb:   ' + a[i])
  console.error('  mobil: ' + b[i])
  process.exit(1)
}
console.log('✓ Brend konfiqi veb və mobildə eynidir')
