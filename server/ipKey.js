// ═══════════════════════════════════════════════════════════════════════
// IP açarı — yaddaşdaxili limitlər üçün (dua divarı "Dua etdim", sync kvotası, SSE bağlantı həddi)
//
// • IP HEÇ VAXT saxlanmır: yalnız prosesə məxsus təsadüfi duzla HMAC-SHA256 (restart → yeni duz).
// • IPv6: bir abunəçi adətən bütöv /64 alır (ünvanı fırlatmaq pulsuzdur) — açar /64 prefiksindən
//   hesablanır. IPv4-mapped (::ffff:1.2.3.4) → IPv4.
//
//   ipPrefix('2001:db8:1:2:aaaa::1') → '2001:db8:1:2::/64'
//   const key = createIpKeyer(); key(req) | key('1.2.3.4') → 22 simvollu base64url
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const net = require('node:net')

/** IPv6 → 8 qrup (rəqəm) | null */
function v6Groups(s) {
  let str = s
  // Sonda IPv4 (::ffff:1.2.3.4, 64:ff9b::1.2.3.4) → iki 16 bitlik qrup
  const tail = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(str)
  if (tail) {
    const b = tail[2].split('.').map(Number)
    str = tail[1] + ((b[0] << 8) | b[1]).toString(16) + ':' + ((b[2] << 8) | b[3]).toString(16)
  }
  const halves = str.split('::')
  if (halves.length > 2) return null
  const part = (h) => (h ? h.split(':') : [])
  const head = part(halves[0]), rest = halves.length === 2 ? part(halves[1]) : []
  const fill = halves.length === 2 ? 8 - head.length - rest.length : 0
  if (fill < 0) return null
  const all = [...head, ...Array(fill).fill('0'), ...rest]
  if (all.length !== 8) return null
  const out = all.map((g) => parseInt(g, 16))
  return out.every((n) => Number.isInteger(n) && n >= 0 && n <= 0xffff) ? out : null
}

/** IP → limit açarının mənbəyi: IPv4 olduğu kimi, IPv6 /64 prefiksi */
function ipPrefix(ip) {
  let s = String(ip || '').trim().toLowerCase()
  const zone = s.indexOf('%')
  if (zone >= 0) s = s.slice(0, zone)
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1)
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s)
  if (mapped) s = mapped[1]
  if (net.isIPv4(s)) return s
  if (net.isIPv6(s)) {
    const g = v6Groups(s)
    if (g) return g.slice(0, 4).map((n) => n.toString(16)).join(':') + '::/64'
  }
  return s.slice(0, 64)
}

/** opts: { salt?, length? } → (req | ip) → açar */
function createIpKeyer({ salt = crypto.randomBytes(16), length = 22 } = {}) {
  return (reqOrIp) => {
    const ip = typeof reqOrIp === 'string' ? reqOrIp : (reqOrIp && reqOrIp.ip) || ''
    return crypto.createHmac('sha256', salt).update(ipPrefix(ip)).digest('base64url').slice(0, length)
  }
}

module.exports = { ipPrefix, createIpKeyer }
