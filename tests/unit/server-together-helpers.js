// I mərhələsi server testləri üçün ortaq köməkçi: yaddaşda baza + istifadəçi hesabları + fetch.
// (Fayl adı *.test.js deyil — vitest onu ayrıca test kimi işlətmir.)
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const users = require('../../server/users.js')
const { createMailer } = require('../../server/mailer.js')

export const PASS = 'yaxşı-uzun-şifrə-2026'
export const ORIGIN = 'https://muslims.cc'
export const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
export { require }

/** mount(app, { db, requireUser }) — modulların router-lərini qoşur. → { srv, db, call, get, signup, close } */
export async function startApp(mount) {
  const db = openDb(':memory:')
  const store = users.createUsersStore(db)
  const app = express()
  const ur = users.createUsersRouter({
    db, store, allowedOrigins: [ORIGIN], publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null,
    mailer: createMailer({ apiKey: '', onMessage: () => {} }),
    limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, userAction: 1000 },
  })
  app.use('/api', ur)
  const extra = mount(app, { db, requireUser: ur.requireUser }) || {}
  const srv = await listen(app)
  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const get = (path, cookie) => call(path, { method: 'GET', cookie, headers: {} })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  let n = 0
  const signup = async (displayName = '') => {
    const email = `tg${++n}-${Math.random().toString(36).slice(2, 8)}@example.com`
    const r = await call('/api/auth/register', { body: { email, password: PASS, displayName, lang: 'en' } })
    const j = await r.json()
    return { cookie: cookieOf(r), id: j.user.id, email, displayName }
  }
  const del = (u) => call('/api/auth/delete', { cookie: u.cookie, body: { password: PASS } })
  return { srv, db, call, get, signup, del, close: () => srv.close(), ...extra }
}
