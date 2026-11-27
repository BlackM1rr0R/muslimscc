// İnfra: infra/ci-gate.sh — CI SSH açarının "qapısı", "ig-reel" əmri (Instagram reel faylı api həcminə).
//   • Statik (hər platformada): ig-reel arqument regex-ləri (tarix, ref — tək ayə VƏ passaj, dil allowlist-i), 5-ci arqument
//     yalnız ig-reel-də, LF sətir sonları. Regex-lər skriptin özündən oxunur — CI-dakı server/instagramReel.js ilə uyğunluq.
//   • Davranış (yalnız Linux/macOS — CI ubuntu; Windows-da MCC_SHELL_TESTS=1 ilə Git sh): skriptin surəti (cd → test
//     qovluğu), docker / logger saxta (PATH-də) — JSON sidecar-ın məzmunu, köhnə 3 arqumentli forma, rədd halları.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const R = require('../../server/instagramReel.js')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SCRIPT = path.join(ROOT, 'infra/ci-gate.sh')
const src = fs.readFileSync(SCRIPT, 'utf8')
const block = src.slice(src.indexOf('  ig-reel)'), src.indexOf('  status)'))

/** ig-reel blokundakı `echo "$VAR" | grep -Eq '<re>'` → JS RegExp (ERE alt çoxluğu: [], {}, (), ?, |). */
const ereFor = (v) => {
  const m = new RegExp(`echo "\\$${v}" \\| grep -Eq '([^']+)'`).exec(block)
  return m ? new RegExp(m[1]) : null
}

describe('ci-gate.sh — ig-reel statik', () => {
  it('LF sətir sonları, set -eu, 5-ci arqument yalnız ig-reel-də', () => {
    expect(src).not.toContain('\r')
    expect(src).toMatch(/^set -eu$/m)
    expect(src).toMatch(/MAXARGS=4; \[ "\$CMD" = ig-reel \] && MAXARGS=5/)
    expect(src).toMatch(/\[ \$# -le "\$MAXARGS" \] \|\| \{ echo "ci-gate: artıq arqument"/)
  })

  it('ref regex-i: köhnə tək ayə və passaj qəbul olunur; yol / inyeksiya / sıfırla başlayan rədd', () => {
    const re = ereFor('REF')
    expect(re).toBeTruthy()
    for (const ok of ['33:3', '103:1-2', '67:1-5', '36:1-9', '2:285', '114:1-6', '87:14-19']) expect(re.test(ok), ok).toBe(true)
    for (const bad of ['', '33', '33:', ':3', '0:1', '67:01-5', '067:1', '67:1-', '67:1-5-6', '67:1-5;id', '../x', '67:1 5', '1234:1', '67:1-5\nx']) {
      expect(re.test(bad), JSON.stringify(bad)).toBe(false)
    }
    // render-in yaza biləcəyi hər istinad (siyahı + qısaldılmış prefikslər) qapıdan keçir
    for (const p of R.REEL_PASSAGES) {
      const { s, a, to } = require('../../server/daily-ayah.js').parseRef(p)
      for (let t = a; t <= to; t++) expect(re.test(R.refOf({ s, a, to: t }))).toBe(true)
    }
  })

  it('tarix regex-i, səs və dil allowlist-i', () => {
    const re = ereFor('DATE')
    expect(re.test('2026-11-27')).toBe(true)
    for (const bad of ['2026-13-01', '2026-11-32', '26-11-27', '2026-11-27x']) expect(re.test(bad)).toBe(false)
    expect(block).toContain('case "$AUDIO" in alafasy|none) ;; *) deny ;; esac')
    expect(block).toContain(`case "$RLANG" in ''|en|az|ru|tr) ;; *) deny ;; esac`)
    expect([...R.REEL_LANGS].sort()).toEqual(['az', 'en', 'ru', 'tr'])
  })
})

const posix = process.platform !== 'win32' || process.env.MCC_SHELL_TESTS === '1'
const shPath = (p) => (process.platform === 'win32' ? p.replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`).replace(/\\/g, '/') : p)

describe.skipIf(!posix)('ci-gate.sh — ig-reel davranış (saxta docker / logger)', () => {
  let H, GATE
  const stub = (name, body) => fs.writeFileSync(path.join(H, 'bin', name), `#!/bin/sh\n${body}\n`, { mode: 0o755 })
  // ftyp (4-cü baytdan) + 12 KB — qapının ölçü / MP4 yoxlamasından keçir
  const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 16]), Buffer.from('ftypisom', 'latin1'), Buffer.alloc(12 * 1024, 1)])
  beforeAll(() => {
    H = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-gate-'))
    fs.mkdirSync(path.join(H, 'bin'))
    fs.mkdirSync(path.join(H, 'opt'))
    fs.writeFileSync(path.join(H, 'opt', '.current_tag'), 'abc1234\n')
    GATE = path.join(H, 'ci-gate.sh')
    fs.writeFileSync(GATE, src.replace('cd /opt/muslimscc', `cd '${shPath(path.join(H, 'opt'))}'`), { mode: 0o755 })
    stub('docker', `if [ "$1" = compose ]; then echo cid0123; exit 0; fi
if [ "$1" = exec ]; then c=$(printf '%s' "$6" | sed "s#/data/#${shPath(H)}/data/#g"); exec sh -c "$c"; fi
echo "gözlənilməz docker $*" >&2; exit 9`)
    stub('logger', 'exit 0')
  })
  afterAll(() => { fs.rmSync(H, { recursive: true, force: true }) })

  const run = (cmd, input = MP4) => {
    const r = spawnSync('sh', [GATE], {
      input, env: { ...process.env, PATH: `${path.join(H, 'bin')}${path.delimiter}${process.env.PATH}`, SSH_ORIGINAL_COMMAND: cmd }, encoding: 'utf8', timeout: 60000,
    })
    return { code: r.status, out: `${r.stdout}${r.stderr}` }
  }
  const meta = (d) => { try { return fs.readFileSync(path.join(H, 'data/ig-cards', `${d}-reel.json`), 'utf8') } catch { return null } }

  it('passaj + dil → JSON {"ref","audio","lang"} (parseMeta qəbul edir), MP4 yazılır', () => {
    const r = run('ig-reel 2026-11-27 67:1-5 alafasy en')
    expect(r.code, r.out).toBe(0)
    expect(meta('2026-11-27')).toBe('{"ref":"67:1-5","audio":"alafasy","lang":"en"}\n')
    expect(R.parseMeta(meta('2026-11-27'))).toEqual({ ref: '67:1-5', audio: 'alafasy', lang: 'en' })
    expect(fs.readFileSync(path.join(H, 'data/ig-cards/2026-11-27-reel.mp4')).equals(MP4)).toBe(true)
  })

  it('köhnə 3 arqumentli forma (tək ayə, dilsiz) — JSON-da lang yoxdur', () => {
    const r = run('ig-reel 2026-11-26 33:3 none')
    expect(r.code, r.out).toBe(0)
    expect(meta('2026-11-26')).toBe('{"ref":"33:3","audio":"none"}\n')
    expect(R.parseMeta(meta('2026-11-26'))).toEqual({ ref: '33:3', audio: 'none', lang: null })
  })

  it('rədd: yararsız dil / ref / səs, artıq arqument, başqa əmrdə 5-ci arqument, MP4 olmayan fayl', () => {
    for (const cmd of ['ig-reel 2026-11-25 67:1-5 alafasy fr', 'ig-reel 2026-11-25 67:1-5;id alafasy en', 'ig-reel 2026-11-25 ../x alafasy',
      'ig-reel 2026-11-25 67:1-5 music en', 'ig-reel 2026-11-25 67:01-5 alafasy en']) {
      const r = run(cmd)
      expect(r.code, cmd).toBe(1)
      expect(r.out, cmd).toMatch(/icazə yoxdur/)
    }
    expect(run('ig-reel 2026-11-25 67:1-5 alafasy en x').out).toMatch(/artıq arqument/)
    expect(run('status a b c d').out).toMatch(/artıq arqument/)
    expect(run('ig-reel 2026-11-25 67:1-5 alafasy en', Buffer.alloc(20000, 2)).out).toMatch(/MP4 deyil/)
    expect(meta('2026-11-25')).toBeNull()
  })
})

// ── Növlü forma (2026-11-27): ig-reel <tarix> <ayah|hadith|dua|name> <ref|id> <səs> [dil] ──
describe('ci-gate.sh — ig-reel növlü forma (statik)', () => {
  it('6 arqument yalnız ig-reel + növ açar sözü ilə; id regex-i; səs allowlist-i növə görə', () => {
    expect(src).toMatch(/if \[ "\$CMD" = ig-reel \]; then case "\$NAME" in ayah\|hadith\|dua\|name\) MAXARGS=6 ;; esac; fi/)
    const re = ereFor('ITEM')
    expect(re).toBeTruthy()
    for (const ok of ['1', '12', '987', '9999']) expect(re.test(ok), ok).toBe(true)
    for (const bad of ['', '0', '01', '10000', '1a', '-1', '1;id', '../1', '1 2']) expect(re.test(bad), JSON.stringify(bad)).toBe(false)
    expect(block).toContain('case "$AUDIO" in ambient|none) ;; *) deny ;; esac')
    expect(block).toContain('BASE="$DATE-reel-$KIND"')
    // renderin yaza biləcəyi hər id (saytın hədis / dua id-ləri, adların nömrələri) qapıdan keçir
    const H = require('../../server/daily-hadith.js'), D = require('../../server/instagram-data.js')
    for (const id of [...H.LIST.map((x) => x.id), ...D.duas.map((x) => x.id), ...D.names.map((x) => x.n)]) expect(re.test(String(id)), String(id)).toBe(true)
  })
})

describe.skipIf(!posix)('ci-gate.sh — ig-reel növlü forma (saxta docker / logger)', { timeout: 60000 }, () => {
  let H, GATE
  const stub = (name, body) => fs.writeFileSync(path.join(H, 'bin', name), `#!/bin/sh\n${body}\n`, { mode: 0o755 })
  const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 16]), Buffer.from('ftypisom', 'latin1'), Buffer.alloc(12 * 1024, 1)])
  beforeAll(() => {
    H = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-gate2-'))
    fs.mkdirSync(path.join(H, 'bin'))
    fs.mkdirSync(path.join(H, 'opt'))
    fs.writeFileSync(path.join(H, 'opt', '.current_tag'), 'abc1234\n')
    GATE = path.join(H, 'ci-gate.sh')
    fs.writeFileSync(GATE, src.replace('cd /opt/muslimscc', `cd '${shPath(path.join(H, 'opt'))}'`), { mode: 0o755 })
    stub('docker', `if [ "$1" = compose ]; then echo cid0123; exit 0; fi
if [ "$1" = exec ]; then c=$(printf '%s' "$6" | sed "s#/data/#${shPath(H)}/data/#g"); exec sh -c "$c"; fi
echo "gözlənilməz docker $*" >&2; exit 9`)
    stub('logger', 'exit 0')
  })
  afterAll(() => { fs.rmSync(H, { recursive: true, force: true }) })
  const run = (cmd, input = MP4) => {
    const r = spawnSync('sh', [GATE], {
      input, env: { ...process.env, PATH: `${path.join(H, 'bin')}${path.delimiter}${process.env.PATH}`, SSH_ORIGINAL_COMMAND: cmd }, encoding: 'utf8', timeout: 60000,
    })
    return { code: r.status, out: `${r.stdout}${r.stderr}` }
  }
  const read = (f) => { try { return fs.readFileSync(path.join(H, 'data/ig-cards', f), 'utf8') } catch { return null } }

  it('hadith / dua / name → <tarix>-reel-<növ>.mp4 + JSON (parseTextMeta qəbul edir)', () => {
    let r = run('ig-reel 2026-11-27 hadith 851 ambient en')
    expect(r.code, r.out).toBe(0)
    expect(read('2026-11-27-reel-hadith.json')).toBe('{"kind":"hadith","item":851,"audio":"ambient","lang":"en"}\n')
    expect(R.parseTextMeta(read('2026-11-27-reel-hadith.json'), 'hadith')).toEqual({ kind: 'hadith', item: 851, audio: 'ambient', lang: 'en' })
    expect(fs.readFileSync(path.join(H, 'data/ig-cards/2026-11-27-reel-hadith.mp4')).equals(MP4)).toBe(true)
    r = run('ig-reel 2026-11-27 name 99 none')
    expect(r.code, r.out).toBe(0)
    expect(read('2026-11-27-reel-name.json')).toBe('{"kind":"name","item":99,"audio":"none"}\n')
    expect(run('ig-reel 2026-11-27 dua 7 ambient en').code).toBe(0)
    expect(read('2026-11-27-reel-dua.json')).toContain('"kind":"dua"')
    // ayə reel-inə toxunmur
    expect(read('2026-11-27-reel.json')).toBeNull()
  })

  it('ayah növü açıq yazılıb — köhnə ad və JSON (eyni)', () => {
    const r = run('ig-reel 2026-11-28 ayah 67:1-5 alafasy en')
    expect(r.code, r.out).toBe(0)
    expect(read('2026-11-28-reel.json')).toBe('{"ref":"67:1-5","audio":"alafasy","lang":"en"}\n')
  })

  it('rədd: yararsız id / səs (növə görə) / dil, artıq arqument, növsüz formada 6-cı arqument', () => {
    for (const cmd of ['ig-reel 2026-11-25 hadith 0 ambient en', 'ig-reel 2026-11-25 hadith 12;id ambient en', 'ig-reel 2026-11-25 hadith 12 alafasy en',
      'ig-reel 2026-11-25 dua 12 music', 'ig-reel 2026-11-25 name 12 ambient fr', 'ig-reel 2026-11-25 ayah 67:1-5 ambient en', 'ig-reel 2026-11-25 ayah 12 alafasy',
      'ig-reel 2026-11-25 hadith ../x ambient', 'ig-reel 2026-11-25 hadith 10000 none']) {
      const r = run(cmd)
      expect(r.code, cmd).toBe(1)
      expect(r.out, cmd).toMatch(/icazə yoxdur/)
    }
    expect(run('ig-reel 2026-11-25 hadith 12 ambient en x').out).toMatch(/artıq arqument/)
    expect(run('ig-reel 2026-11-25 67:1-5 alafasy en x').out).toMatch(/artıq arqument/)
    expect(run('upload abc1234 web x y z').out).toMatch(/artıq arqument/)
    expect(read('2026-11-25-reel-hadith.json')).toBeNull()
  })
})
