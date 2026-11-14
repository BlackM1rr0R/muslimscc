// server/eclipse-lib.js-in mənbəyi (v6.8): saytın yoxlanmış tutulma hesabı — server ikinci nüsxə yazmasın.
// Yığmaq: node scripts/build-server-eclipse.mjs (esbuild → CJS). tests/unit/eclipse-server.test.js sinxronluğu yoxlayır.
export { SOLAR_ECLIPSES } from '../../src/data/solarEclipses.js'
export { LUNAR_ECLIPSES } from '../../src/data/lunarEclipses.js'
export { localCircumstances } from '../../src/utils/solarEclipse.js'
export { visibility as lunarVisibility, phases as lunarPhases } from '../../src/utils/eclipseVis.js'
