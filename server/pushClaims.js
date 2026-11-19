// ═══════════════════════════════════════════════════════
// Push planlayıcılarının "bir dəfə göndər" qeydi — proseslər arası (server.js: azan, xatırlatmalar,
// günün ayəsi/hədisi).
//
// Niyə: deploy kəsintisiz olanda (infra/deploy.sh) köhnə və yeni api prosesi bir neçə saniyə EYNİ
// bazada yanaşı işləyir; adi yenidən başlatmada da yeni proses eyni dəqiqədə təzə (boş) yaddaşla
// başlayır. Yaddaşdakı Set ilə hər iki halda eyni azan iki dəfə gedə bilərdi. claim(k) — açarı
// əvvəlcə bazada ATOM olaraq "tutur" (INSERT OR IGNORE): yalnız tutan proses göndərir.
//
// Məxfilik: açar yer qrupunun açarını ehtiva edir — bazaya yalnız SHA-256 həşi yazılır, 3 gündən
// sonra silinir (purge). Cədvəl əlavədir (CREATE TABLE IF NOT EXISTS) — köhnə versiya ona toxunmur.
// ═══════════════════════════════════════════════════════
const crypto = require('node:crypto')

const TTL_MS = 3 * 864e5

function createPushClaims(db, { now = Date.now, log = console } = {}) {
  const raw = db.raw || db
  raw.exec('CREATE TABLE IF NOT EXISTS push_claims (k TEXT PRIMARY KEY, at INTEGER NOT NULL) WITHOUT ROWID')
  const ins = raw.prepare('INSERT OR IGNORE INTO push_claims (k, at) VALUES (?, ?)')
  const del = raw.prepare('DELETE FROM push_claims WHERE at < ?')
  const hash = (k) => crypto.createHash('sha256').update(String(k)).digest('base64url').slice(0, 32)

  /** Set ilə eyni (has/add/delete/iterasiya — köhnə günlərin təmizlənməsi), üstəlik claim(). */
  class ClaimSet extends Set {
    /** true — bu proses açarı indi tutdu (göndər); false — artıq göndərilib (bu və ya digər proses). */
    claim(k) {
      if (this.has(k)) return false
      this.add(k)
      try {
        return ins.run(hash(k), now()).changes === 1
      } catch (e) {
        // Baza əlçatmazdırsa köhnə davranış (yalnız yaddaş): göndərməmək bildirişi itirmək olardı
        log.error('push claim:', e && e.message)
        return true
      }
    }
  }

  return {
    set: () => new ClaimSet(),
    purge: (t = now()) => del.run(t - TTL_MS).changes,
  }
}

module.exports = { createPushClaims, TTL_MS }
