// server/eclipse-lib.js yarat: src-dəki tutulma datası + hesabı → tək CJS fayl (server Docker image-i yalnız *.js köçürür).
// İstifadə: node scripts/build-server-eclipse.mjs
import { buildSync } from 'esbuild'
buildSync({
  entryPoints: ['scripts/server-lib/eclipse-entry.mjs'],
  bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: 'server/eclipse-lib.js',
  banner: { js: '// AVTOMATİK YARADILIR — node scripts/build-server-eclipse.mjs (mənbə: src/data/*Eclipses.js, src/utils/solarEclipse.js, eclipseVis.js). Əl ilə redaktə etmə.' },
  logLevel: 'warning',
})
console.log('ok server/eclipse-lib.js')
