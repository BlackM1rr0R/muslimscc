// ═══════════════════════════════════════════════════════
// Instagram Graph API — paylaşma
//
// Meta iki addım tələb edir:
//   1) media konteyner yarat (şəklin PUBLIC URL-i ilə)
//   2) konteyneri publish et
//
// Şəkil Instagram-ın serverindən oxunur, ona görə fayl əvvəlcə
// muslims.cc altına yazılmalıdır (bax: run.mjs → PUBLIC_DIR).
// JPEG olmalıdır; PNG və WebP qəbul edilmir.
//
// ENV:
//   IG_USER_ID       — Instagram Business hesabının ID-si (rəqəm)
//   IG_ACCESS_TOKEN  — uzunömürlü access token
//   IG_API_VERSION   — default v21.0
//
// QEYD: Meta API versiyalarını mütəmadi köhnəldir. 400 xətası alsan,
// developers.facebook.com-dakı cari versiyanı IG_API_VERSION-a yaz.
// ═══════════════════════════════════════════════════════

const VERSION = process.env.IG_API_VERSION || 'v21.0'
const BASE = `https://graph.facebook.com/${VERSION}`

export function hasCredentials() {
  return Boolean(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN)
}

async function call(path, params, method = 'POST') {
  const token = process.env.IG_ACCESS_TOKEN
  const url = new URL(`${BASE}${path}`)
  const body = new URLSearchParams({ ...params, access_token: token })

  const res = method === 'GET'
    ? await fetch(`${url}?${body}`)
    : await fetch(url, { method: 'POST', body })

  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }

  if (!res.ok || json.error) {
    const e = json.error || {}
    throw new Error(
      `IG API ${res.status}: ${e.message || text.slice(0, 300)}` +
      (e.code ? ` (code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''})` : ''),
    )
  }
  return json
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/**
 * Konteyner hazır olana qədər gözlə.
 * Instagram şəkli öz serverinə çəkir; bu bir neçə saniyə çəkə bilər.
 */
async function waitReady(creationId, { tries = 12, delayMs = 5000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const r = await call(`/${creationId}`, { fields: 'status_code,status' }, 'GET')
    if (r.status_code === 'FINISHED') return
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') {
      throw new Error(`Konteyner uğursuz: ${r.status_code} — ${r.status || ''}`)
    }
    await sleep(delayMs)
  }
  throw new Error('Konteyner vaxtında hazır olmadı')
}

/**
 * Şəkli paylaş.
 * @param {string} imageUrl — public JPEG URL (məs. https://muslims.cc/posts/x.jpg)
 * @param {string} caption
 * @returns {Promise<{id:string, permalink?:string}>}
 */
export async function publishPhoto(imageUrl, caption) {
  const igUser = process.env.IG_USER_ID
  if (!hasCredentials()) throw new Error('IG_USER_ID / IG_ACCESS_TOKEN təyin edilməyib')

  const container = await call(`/${igUser}/media`, { image_url: imageUrl, caption })
  await waitReady(container.id)

  const published = await call(`/${igUser}/media_publish`, { creation_id: container.id })

  let permalink
  try {
    const info = await call(`/${published.id}`, { fields: 'permalink' }, 'GET')
    permalink = info.permalink
  } catch {
    // permalink kritik deyil — paylaşım onsuz da uğurludur
  }
  return { id: published.id, permalink }
}

/** Token və hesabın sağlamlığını yoxla — qurulandan sonra bir dəfə işlət. */
export async function checkAccount() {
  const igUser = process.env.IG_USER_ID
  const me = await call(`/${igUser}`, { fields: 'id,username,name' }, 'GET')
  const quota = await call(`/${igUser}/content_publishing_limit`, { fields: 'quota_usage,config' }, 'GET')
  return { account: me, quota: quota.data?.[0] }
}
