// İnfra: kəsintisiz deploy (edge + rollout) konfiqlərinin bir-biri ilə uyğunluğu.
//   • edge-in "yalnız Cloudflare" siyahısı web-dəki cloudflare.conf ilə EYNİdir (biri yenilənib, digəri unudulmasın)
//   • web edge-in Docker ünvanından gələn CF-Connecting-IP-yə güvənir (yoxsa hamı bir IP sayılır)
//   • web image-i "edge-ready" etiketlidir (deploy.sh legacy/edge seçimi), web host portu tutmur
//   • api proksi — resolve + max_fails (deploy zamanı köhnə ünvan "ölü" sayılsın), keepalive yoxdur
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')

describe('edge ↔ cloudflare.conf', () => {
  const cf = read('infra/nginx/cloudflare.conf')
  const allow = read('infra/edge/cloudflare-allow.conf')
  const cfRanges = [...cf.matchAll(/^set_real_ip_from (\S+);/gm)].map((m) => m[1]).filter((r) => r !== '172.16.0.0/12')
  const geoRanges = [...cf.matchAll(/^ {4}(\S+) 1;/gm)].map((m) => m[1]).filter((r) => !['127.0.0.1', '::1', '172.16.0.0/12'].includes(r))
  const allowRanges = [...allow.matchAll(/^allow (\S+);/gm)].map((m) => m[1])

  it('edge yalnız Cloudflare + yerli yoxlamaları buraxır, sonda deny all', () => {
    expect(cfRanges.length).toBeGreaterThan(10)
    expect(allowRanges).toEqual(['127.0.0.1', '172.16.0.0/12', ...cfRanges])
    expect(geoRanges).toEqual(cfRanges)
    const lines = allow.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
    expect(lines[lines.length - 1]).toBe('deny all;')
  })

  it('web edge-dən gələn CF-Connecting-IP-yə güvənir', () => {
    expect(cf).toMatch(/^set_real_ip_from 172\.16\.0\.0\/12;$/m)
    expect(cf).toMatch(/^real_ip_header CF-Connecting-IP;$/m)
    // generator da eyni sətri yazır (növbəti gen-cloudflare.sh işi itirməsin)
    expect(read('infra/nginx/gen-cloudflare.sh')).toContain('set_real_ip_from 172.16.0.0/12;')
  })

  it('edge konfiqi cloudflare-allow.conf və upstream.conf-u qoşur', () => {
    const conf = read('infra/edge/nginx.conf')
    expect(conf).toContain('include /etc/nginx/edge/cloudflare-allow.conf;')
    expect(conf).toContain('include /etc/nginx/edge/upstream.conf;')
    const up = read('infra/edge/upstream.conf')
    expect(up).toMatch(/upstream web_https \{[^}]*server web:8443 resolve;/)
    expect(up).toMatch(/upstream web_http \{[^}]*server web:8080 resolve;/)
  })
})

describe('docker-compose / Dockerfile', () => {
  const compose = read('infra/docker-compose.yml')
  const block = (name) => {
    const m = compose.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  \\w[\\w-]*:\\n|^\\S)`, 'm'))
    return m ? m[1] : ''
  }

  it('80/443-ü yalnız edge tutur; edge image-i digest ilə sabitdir', () => {
    expect(block('web')).not.toMatch(/ports:/)
    expect(block('edge')).toMatch(/HTTPS_PORT:-443\}:8443/)
    expect(block('edge')).toMatch(/@sha256:[0-9a-f]{64}/)
    expect(block('edge')).toContain('./edge:/etc/nginx/edge:ro')
  })

  it('api stop_grace_period server.js-in boşaltma vaxtından böyükdür', () => {
    const grace = Number((block('api').match(/stop_grace_period: (\d+)s/) || [])[1])
    const drain = Number((read('server/server.js').match(/DRAIN_MS\) \|\| (\d+)\)/) || [])[1])
    expect(grace * 1000).toBeGreaterThan(drain)
  })

  it('web image-i edge-ready etiketlidir; legacy override portları qaytarır', () => {
    expect(read('infra/web.Dockerfile')).toMatch(/^LABEL cc\.muslims\.edge="1"$/m)
    expect(read('infra/docker-compose.legacy.yml')).toMatch(/HTTPS_PORT:-443\}:8443/)
  })
})

describe('nginx → api', () => {
  const conf = read('infra/nginx/muslims.cc.conf')
  it('bütün /api yerləri api_backend upstream-inə gedir (resolve + max_fails, keepalive yoxdur)', () => {
    expect(conf).not.toContain('$api_upstream')
    expect(conf).toMatch(/upstream api_backend \{\s*zone api_backend \d+k;\s*server api:3001 resolve max_fails=1 fail_timeout=\d+s;\s*\}/)
    expect(conf).not.toMatch(/^\s*keepalive \d+;/m)
    const passes = [...conf.matchAll(/proxy_pass\s+(\S+);/g)].map((m) => m[1])
    expect(passes.length).toBeGreaterThanOrEqual(5)
    for (const p of passes) expect(p).toBe('http://api_backend')
  })
})

describe('server.js', () => {
  it('pushClaims preload siyahısındadır (modul çatışmırsa bazadan əvvəl çöksün)', () => {
    const src = read('server/server.js')
    const preload = src.slice(0, src.indexOf("require('./db')"))
    expect(preload).toContain("'./pushClaims'")
  })
})
