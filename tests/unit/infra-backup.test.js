// İnfra: infra/backup.sh — gündəlik SQLite nüsxəsi + SÖNÜLÜ (sahib açır) şifrəli off-site surət.
//   • Statik (hər platformada): off-site konfiqi icra olunmur (source yoxdur), yalnız age AÇIQ açarı, --verify
//     canlı bazaya toxunmur (şəbəkəsiz, read-only konteyner), LF sətir sonları.
//   • Davranış (yalnız Linux/macOS — CI ubuntu; Windows-da proses açmaq çox yavaşdır): docker / age / rclone /
//     stat / logger saxta (PATH-də) — off-site sönülü / açıq / pozuq konfiq / inyeksiya / yükləmə xətası.
//     Hər halda yerli nüsxə YAZILIR; off-site alınmasa çıxış kodu 2.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SCRIPT = path.join(ROOT, 'infra/backup.sh')
const src = fs.readFileSync(SCRIPT, 'utf8')
const KEY = 'age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p'

describe('backup.sh — statik', () => {
  it('LF sətir sonları, set -eu', () => {
    expect(src).not.toContain('\r')
    expect(src).toMatch(/^set -eu$/m)
  })
  it('off-site konfiqi icra olunmur (source / "." yoxdur), yalnız sed ilə oxunur', () => {
    expect(src).not.toMatch(/^\s*(\.|source)\s+["$]/m)
    expect(src).not.toMatch(/\beval\b/)
    expect(src).toMatch(/conf_get\(\)/)
  })
  it('yalnız age AÇIQ açarı qəbul olunur (bech32, 62 simvol)', () => {
    expect(src).toContain("'^age1[02-9ac-hj-np-z]{58}$'")
    expect(KEY).toHaveLength(62)
  })
  it('--verify canlı bazaya toxunmur: şəbəkəsiz, read-only, cap yox, müvəqqəti qovluq silinir', () => {
    const v = src.slice(src.indexOf('"--verify"'), src.indexOf('mkdir -p "$DIR"'))
    expect(v).toMatch(/--network none/)
    expect(v).toMatch(/--read-only/)
    expect(v).toMatch(/--cap-drop ALL/)
    expect(v).toMatch(/trap 'rm -rf "\$W"' EXIT/)
    expect(v).not.toMatch(/docker compose|muslimscc_api-data|\/data\//)
  })
})

// MCC_SHELL_TESTS=1 — Windows-da da işlət (Git sh; yavaşdır, bir neçə dəqiqə)
const posix = process.platform !== 'win32' || process.env.MCC_SHELL_TESTS === '1'
// Skript yalnız POSIX yolu qəbul edir (/…); Windows-da (MCC_SHELL_TESTS) C:\… → /c/… (Git sh)
const shPath = (p) => (process.platform === 'win32' ? p.replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`).replace(/\\/g, '/') : p)

describe.skipIf(!posix)('backup.sh — davranış (saxta docker / age / rclone)', () => {
  let H
  const stub = (name, body) => fs.writeFileSync(path.join(H, 'bin', name), `#!/bin/sh\n${body}\n`, { mode: 0o755 })
  beforeAll(() => {
    H = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-backup-'))
    fs.mkdirSync(path.join(H, 'bin'))
    fs.mkdirSync(path.join(H, 'remote'))
    // backup-db.js: stdout-a "SQLite format 3\0" + 4080 bayt, stderr-ə "OK: 4096 bayt"
    stub('docker', `if [ "$1" = compose ] && [ "$2" = exec ]; then
  printf 'SQLite format 3\\000'; head -c 4080 /dev/zero; echo "OK: 4096 bayt, sxem v3" >&2; exit 0
fi
echo "gözlənilməz docker $*" >&2; exit 9`)
    stub('age', `out=""; in=""; n=0
while [ $# -gt 0 ]; do case "$1" in -r) shift; n=$((n+1));; -o) shift; out="$1";; *) in="$1";; esac; shift; done
{ printf 'age-encryption.org/v1 recipients=%s\\n' "$n"; cat "$in"; } > "$out"`)
    stub('rclone', `ROOT='${shPath(path.join(H, 'remote'))}'
cmd=""; p1=""; p2=""; minage=""
while [ $# -gt 0 ]; do
  case "$1" in
    --min-age) shift; minage="$1";;
    --config|--retries|--low-level-retries|--contimeout|--timeout|--format|--include) shift;;
    -q|--files-only) ;;
    copyto|lsf|delete) cmd="$1";;
    *) if [ -z "$p1" ]; then p1="$1"; else p2="$1"; fi;;
  esac; shift
done
map() { echo "$ROOT/\${1#*:}"; }
case "$cmd" in
  copyto) [ -n "\${RCLONE_FAIL:-}" ] && exit 5; d=$(map "$p2"); mkdir -p "$(dirname "$d")"; cp "$p1" "$d"
          [ -n "\${RCLONE_TRUNC:-}" ] && printf x > "$d"; exit 0;;
  lsf) f=$(map "$p1"); [ -f "$f" ] && wc -c < "$f" | tr -d ' '; exit 0;;
  delete) echo "delete $p1 min-age=$minage" >> "$ROOT/.deletes"; exit 0;;
esac
exit 7`)
    // Test qovluqları root-a məxsus deyil — icazə yoxlaması saxta stat ilə idarə olunur
    stub('stat', 'echo "${STAT_UID:-0} ${STAT_MODE:-600}"')
    stub('logger', 'exit 0')
  })
  afterAll(() => { fs.rmSync(H, { recursive: true, force: true }) })

  let n = 0
  /** conf — offsite.env məzmunu (null = fayl yoxdur); @RC@ → saxta rclone.conf yolu */
  function run(conf, env = {}) {
    const M = path.join(H, `mcc-${++n}`)
    fs.mkdirSync(M)
    fs.writeFileSync(path.join(M, '.current_tag'), 'testtag\n')
    const rc = path.join(H, 'rclone.conf')
    fs.writeFileSync(rc, '')
    if (conf != null) fs.writeFileSync(path.join(M, 'offsite.env'), conf.replace('@RC@', shPath(rc)))
    const r = spawnSync('sh', [SCRIPT], {
      env: { ...process.env, PATH: `${path.join(H, 'bin')}${path.delimiter}${process.env.PATH}`, MCC_DIR: M, ...env }, encoding: 'utf8', timeout: 60000,
    })
    const local = fs.existsSync(path.join(M, 'backups')) ? fs.readdirSync(path.join(M, 'backups')) : []
    return { code: r.status, out: `${r.stdout}${r.stderr}`, local }
  }
  const remoteFiles = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
  const conf = (o = {}) => Object.entries({
    OFFSITE_ENABLED: '1', OFFSITE_REMOTE: "'r2:muslimscc-backups/db'", OFFSITE_AGE_RECIPIENTS: `'${KEY}'`, OFFSITE_RCLONE_CONFIG: '@RC@', ...o,
  }).map(([k, v]) => `${k}=${v}`).join('\n') + '\n'

  it('offsite.env yoxdur → yalnız yerli nüsxə, çıxış 0', () => {
    const r = run(null)
    expect(r.code).toBe(0)
    expect(r.local.filter((f) => /^muslims-\d{8}\.db\.gz$/.test(f))).toHaveLength(1)
    expect(r.out).toMatch(/off-site: söndürülüb/)
  })

  it('OFFSITE_ENABLED=1 → şifrəli (2 açar) yüklənir, ölçü yoxlanır, .part qalmır', () => {
    const r = run(conf({ OFFSITE_REMOTE: "'r2:enabled-bucket/db'", OFFSITE_AGE_RECIPIENTS: `'${KEY} ${KEY}'` }))
    expect(r.code).toBe(0)
    const up = remoteFiles(path.join(H, 'remote/enabled-bucket/db'))
    expect(up).toHaveLength(1)
    expect(up[0]).toMatch(/^muslims-\d{8}-\d{6}\.db\.gz\.age$/)
    expect(fs.readFileSync(path.join(H, 'remote/enabled-bucket/db', up[0]), 'utf8')).toMatch(/^age-encryption\.org\/v1 recipients=2\n/)
    expect(r.local.some((f) => f.endsWith('.part'))).toBe(false)
    expect(r.out).toMatch(/off-site OK/)
  })

  it('OFFSITE_ENABLED=0 → yükləmə yoxdur', () => {
    const r = run(conf({ OFFSITE_ENABLED: '0', OFFSITE_REMOTE: "'r2:disabled-bucket/db'" }))
    expect(r.code).toBe(0)
    expect(remoteFiles(path.join(H, 'remote/disabled-bucket/db'))).toHaveLength(0)
  })

  it.each([
    ['gizli açar (AGE-SECRET-KEY) rədd', { OFFSITE_AGE_RECIPIENTS: "'AGE-SECRET-KEY-1QQQQ'" }, {}],
    ['remote-da əmr inyeksiyası rədd', { OFFSITE_REMOTE: "'r2:b/db; touch /tmp/mcc-pwned'" }, {}],
    ['açarda əmr inyeksiyası rədd', { OFFSITE_AGE_RECIPIENTS: "'$(touch /tmp/mcc-pwned2)'" }, {}],
    ['offsite.env başqalarına yazıla bilir', {}, { STAT_MODE: '666' }],
    ['offsite.env root-a məxsus deyil', {}, { STAT_UID: '1000' }],
    ['rclone konfiqi yoxdur', { OFFSITE_RCLONE_CONFIG: '/nonexistent/rclone.conf' }, {}],
    ['OFFSITE_PRUNE_DAYS < 7', { OFFSITE_PRUNE_DAYS: '3' }, {}],
    ['yükləmə alınmır', {}, { RCLONE_FAIL: '1' }],
    ['yüklənmiş ölçü uyğun deyil', {}, { RCLONE_TRUNC: '1' }],
  ])('%s → yerli nüsxə qalır, çıxış 2', (_, o, env) => {
    const r = run(conf(o), env)
    expect(r.code).toBe(2)
    expect(r.local.filter((f) => /^muslims-\d{8}\.db\.gz$/.test(f))).toHaveLength(1)
    expect(fs.existsSync('/tmp/mcc-pwned') || fs.existsSync('/tmp/mcc-pwned2')).toBe(false)
  })

  it('OFFSITE_PRUNE_DAYS=90 (dırnaqsız dəyərlər də) → köhnələr rclone delete --min-age 90d ilə', () => {
    const r = run(`OFFSITE_ENABLED=1\nOFFSITE_REMOTE="r2:prune-bucket/db"\nOFFSITE_AGE_RECIPIENTS=${KEY}\nOFFSITE_PRUNE_DAYS=90\nOFFSITE_RCLONE_CONFIG=@RC@\n`)
    expect(r.code).toBe(0)
    expect(fs.readFileSync(path.join(H, 'remote/.deletes'), 'utf8')).toContain('delete r2:prune-bucket/db min-age=90d')
  })
})
