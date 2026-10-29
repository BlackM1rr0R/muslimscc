// ═══ AI CHAT RATE LIMITING ═══
// Client-side abuse prevention.
// Rules:
//   - Max 5 messages per 60 seconds → triggers 30s cooldown
//   - Min 2 seconds between consecutive messages

const STORAGE_KEY = 'muslim_cc_aichat_rate'
const MAX_MESSAGES_PER_MINUTE = 5
const COOLDOWN_SECONDS = 30
const MIN_DELAY_BETWEEN = 2

// Yaddaşdakı vəziyyət yoxlanılır: "null", massiv və ya pozuq dəyər əvvəl AI səhifəsini
// ağ ekrana çevirirdi (null.cooldownUntil). Gələcəyə çox uzanan gözləmə 30 san. ilə kəsilir.
function readState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const now = Date.now()
    const timestamps = Array.isArray(raw.timestamps) ? raw.timestamps.filter(t => Number.isFinite(t) && t <= now) : []
    let cooldownUntil = Number.isFinite(raw.cooldownUntil) ? raw.cooldownUntil : null
    if (cooldownUntil && cooldownUntil > now + COOLDOWN_SECONDS * 1000) cooldownUntil = now + COOLDOWN_SECONDS * 1000
    return { timestamps, cooldownUntil }
  } catch {
    return {}
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

// Check whether user can send a new message right now.
// Returns one of:
//   { allowed: true }
//   { allowed: false, kind: 'cooldown', remaining: seconds }
//   { allowed: false, kind: 'tooFast', remaining: seconds }
export function checkRateLimit() {
  const now = Date.now()
  const state = readState()

  // Active cooldown
  if (state.cooldownUntil && state.cooldownUntil > now) {
    return {
      allowed: false,
      kind: 'cooldown',
      remaining: Math.ceil((state.cooldownUntil - now) / 1000),
    }
  }

  // Recent message timestamps (last 60s)
  const recent = (state.timestamps || []).filter(t => now - t < 60000)

  // Min delay between consecutive messages
  if (recent.length > 0) {
    const last = recent[recent.length - 1]
    const sinceLast = (now - last) / 1000
    if (sinceLast < MIN_DELAY_BETWEEN) {
      return {
        allowed: false,
        kind: 'tooFast',
        remaining: Math.ceil(MIN_DELAY_BETWEEN - sinceLast),
      }
    }
  }

  // Per-minute limit
  if (recent.length >= MAX_MESSAGES_PER_MINUTE) {
    const cooldownUntil = now + COOLDOWN_SECONDS * 1000
    writeState({ ...state, cooldownUntil })
    return {
      allowed: false,
      kind: 'cooldown',
      remaining: COOLDOWN_SECONDS,
    }
  }

  return { allowed: true }
}

// Record a successful message send.
export function recordMessage() {
  const now = Date.now()
  const state = readState()
  const timestamps = (state.timestamps || []).filter(t => now - t < 60000)
  timestamps.push(now)
  writeState({ timestamps, cooldownUntil: null })
}

// Get currently active cooldown (or 0)
export function getActiveCooldown() {
  const state = readState()
  const now = Date.now()
  if (state.cooldownUntil && state.cooldownUntil > now) {
    return Math.ceil((state.cooldownUntil - now) / 1000)
  }
  return 0
}
