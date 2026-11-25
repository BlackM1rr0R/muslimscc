#!/bin/sh
# ═══════════════════════════════════════════════════════
# Muslims.cc — SQLite bazasının gündəlik ehtiyat nüsxəsi
#
#   /opt/muslimscc/backup.sh                    # gündəlik nüsxə (+ varsa off-site surət)
#   /opt/muslimscc/backup.sh --verify [FAYL]    # bərpa yoxlaması (son və ya verilən arxiv)
#
# Hostda sqlite3 lazım deyil: surəti konteynerin İÇİNDƏ node çıxarır
# (server/scripts/backup-db.js — VACUUM INTO + integrity_check), host onu
# gzip-ləyib saxlayır:
#   /opt/muslimscc/backups/muslims-YYYYMMDD.db.gz   (600, root)
# Son $KEEP_DAYS gün saxlanılır. Gündə bir dəfə systemd timer işlədir —
# quraşdırma: infra/systemd/ və docs/SERVER-OPS.md → "Ehtiyat nüsxə".
#
# SERVERDƏN KƏNAR SURƏT (off-site) — SUSMAYA GÖRƏ SÖNÜLÜDÜR. Yerli nüsxə eyni diskdədir: disk /
# server itsə, nüsxə də itər. Sahib /opt/muslimscc/offsite.env (600, root) yaradanda açılır:
#   OFFSITE_ENABLED=1
#   OFFSITE_REMOTE='offsite:muslimscc-backups/db'     # rclone remote:bucket[/yol]
#   OFFSITE_AGE_RECIPIENTS='age1…'                     # YALNIZ açıq açar(lar); gizli açar serverdə YOXDUR
#   OFFSITE_PRUNE_DAYS=                                # boş = silmə (bucket lifecycle qaydası tövsiyə olunur)
#   OFFSITE_RCLONE_CONFIG=/root/.config/rclone/rclone.conf
# Arxiv age ilə şifrələnir (açıq açara) və rclone ilə yüklənir: <remote>/muslims-YYYYMMDD-HHMMSS.db.gz.age;
# yüklənmiş ölçü yoxlanılır. Fayl "source" EDİLMİR — yalnız bu açarlar oxunur və sərt yoxlanılır.
# Off-site alınmasa yerli nüsxə QALIR, skript 2 ilə çıxır (systemd vahidi "failed" görünür).
# Quraşdırma və off-site-dan bərpa: docs/SERVER-OPS.md → "Serverdən kənar nüsxə".
#
# Bərpa (geri yükləmə): docs/SERVER-OPS.md → "Ehtiyat nüsxədən bərpa".
# ═══════════════════════════════════════════════════════
set -eu
cd "${MCC_DIR:-/opt/muslimscc}"

DIR="${BACKUP_DIR:-$PWD/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
OFFSITE_CONF="${OFFSITE_CONF:-$PWD/offsite.env}"
STAMP=$(date -u +%Y%m%d)
OUT="$DIR/muslims-$STAMP.db.gz"
TMP="$OUT.part"

log() { echo "[backup $(date -u +%H:%M:%S)] $*"; logger -t muslimscc-backup "$*" 2>/dev/null || true; }

umask 077

# ── Bərpa yoxlaması: arxivi müvəqqəti qovluğa aç, canlı api image-i ilə (şəbəkəsiz, read-only)
#    integrity_check + sxem versiyası + tətbiqin öz openDb-si (WAL, miqrasiya) — HAMISI SURƏTDƏ.
#    Canlı bazaya və işləyən konteynerlərə toxunmur. Ayda bir dəfə işlətmək tövsiyə olunur.
if [ "${1:-}" = "--verify" ]; then
  F="${2:-$(ls -1t "$DIR"/muslims-*.db.gz 2>/dev/null | head -n 1)}"
  [ -n "$F" ] && [ -f "$F" ] || { log "XƏTA: yoxlanacaq arxiv tapılmadı"; exit 1; }
  IMG="${IMAGE_PREFIX:-muslimscc}-api:$(cat .current_tag)"
  W=$(mktemp -d /tmp/mcc-restore-check.XXXXXX)
  trap 'rm -rf "$W"' EXIT INT TERM
  gzip -t "$F" || { log "XƏTA: $F gzip kimi pozuqdur"; exit 1; }
  gunzip -c "$F" > "$W/muslims.db"
  if docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges:true \
      --user 0 --tmpfs /tmp -v "$W:/r" --entrypoint node "$IMG" - <<'JS'
const { DatabaseSync } = require('node:sqlite')
const { openDb, SCHEMA_VERSION } = require('/app/db.js')
const f = '/r/muslims.db'
try {
  const ro = new DatabaseSync(f, { readOnly: true })
  const ic = ro.prepare('PRAGMA integrity_check').all().map((r) => Object.values(r)[0])
  const ver = ro.prepare('PRAGMA user_version').get().user_version
  const tables = ro.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'").get().n
  const count = (t) => { try { return ro.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get().n } catch { return '-' } }
  const counts = `users ${count('users')}, docs ${count('docs')}, push_subs ${count('push_subs')}`
  ro.close()
  if (ic.length !== 1 || ic[0] !== 'ok') throw new Error('integrity_check: ' + ic.slice(0, 3).join('; '))
  if (ver > SCHEMA_VERSION) throw new Error(`arxivin sxemi v${ver} canlı koddan (v${SCHEMA_VERSION}) yenidir`)
  const db = openDb(f)   // tətbiqin özü bu faylı açır: WAL, foreign_keys, miqrasiyalar — SURƏTİN üzərində
  if (!db.ping()) throw new Error('openDb: SELECT 1 alınmadı')
  db.close()
  console.log(`OK: integrity_check ok, sxem v${ver} (kod v${SCHEMA_VERSION}), ${tables} cədvəl; ${counts}`)
} catch (e) {
  console.error('XƏTA:', e && e.message ? e.message : e)
  process.exit(1)
}
JS
  then log "bərpa yoxlaması uğurlu: $F"; exit 0
  else log "XƏTA: bərpa yoxlaması alınmadı: $F"; exit 1
  fi
fi

mkdir -p "$DIR"
chmod 700 "$DIR"

export TAG="$(cat .current_tag)"
# -T: TTY yoxdur (binar axın pozulmasın). stderr ayrıca fayla: orada
# "OK: <bayt> bayt" sətri var — arxivin TAM olduğunu ölçü ilə yoxlayırıq.
# (2026-10-31: köhnə backup-db.js boruya yarımçıq yazırdı, başlıq yoxlaması
#  bunu tutmurdu — arxiv "malformed" çıxırdı.)
ERR="$OUT.err"
if ! docker compose exec -T api node scripts/backup-db.js 2>"$ERR" | gzip -9 > "$TMP"; then
  rm -f "$TMP" "$ERR"; log "XƏTA: surət çıxarılmadı"; exit 1
fi
EXPECT=$(sed -n 's/^OK: \([0-9][0-9]*\) bayt.*/\1/p' "$ERR" | tail -n 1)
rm -f "$ERR"
if [ -z "$EXPECT" ]; then
  rm -f "$TMP"; log "XƏTA: backup-db.js uğur bildirmədi"; exit 1
fi
# Boş, kəsik və ya pozuq arxiv saxlanmasın: gzip bütövlüyü, SQLite başlığı
# ("SQLite format 3\0" — ilk 15 bayt) və açılmış ölçü = bildirilən ölçü
GOT=$(gunzip -c "$TMP" 2>/dev/null | wc -c | tr -d ' ')
if ! gzip -t "$TMP" || [ "$(gunzip -c "$TMP" | head -c 15)" != "SQLite format 3" ] || [ "$GOT" != "$EXPECT" ]; then
  rm -f "$TMP"; log "XƏTA: arxiv yararsızdır (ölçü $GOT, gözlənilən $EXPECT)"; exit 1
fi
mv "$TMP" "$OUT"
log "OK: $OUT ($(du -h "$OUT" | cut -f1))"

# ── Serverdən kənar surət (off-site). DİQQƏT: "if ! offsite" daxilində set -e İŞLƏMİR —
#    hər addım öz "|| return 1"-i ilə yoxlanılır.
conf_get() {   # KEY → dəyər (son sətir; ətrafdakı tək/cüt dırnaq atılır). Fayl icra olunmur.
  sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$OFFSITE_CONF" | tail -n 1 \
    | sed "s/[[:space:]]*\$//; s/^'\\(.*\\)'\$/\\1/; s/^\"\\(.*\\)\"\$/\\1/"
}
# root-a məxsus, qrup/digərləri yaza bilmir (başqası remote-u / açarı dəyişib nüsxəni özünə yönəldə bilməsin)
safe_file() {
  [ -f "$1" ] || return 1
  set -- $(stat -c '%u %a' "$1")
  [ "$1" = 0 ] && [ $((0$2 & 022)) -eq 0 ]
}
offsite() {
  [ -e "$OFFSITE_CONF" ] || { log "off-site: söndürülüb ($OFFSITE_CONF yoxdur)"; return 0; }
  safe_file "$OFFSITE_CONF" || { log "XƏTA off-site: $OFFSITE_CONF root-a məxsus olmalı və başqaları yaza bilməməlidir (chmod 600)"; return 1; }
  [ "$(conf_get OFFSITE_ENABLED)" = 1 ] || { log "off-site: söndürülüb (OFFSITE_ENABLED=1 deyil)"; return 0; }
  R=$(conf_get OFFSITE_REMOTE)
  KEYS=$(conf_get OFFSITE_AGE_RECIPIENTS)
  PRUNE=$(conf_get OFFSITE_PRUNE_DAYS)
  RC=$(conf_get OFFSITE_RCLONE_CONFIG); RC="${RC:-/root/.config/rclone/rclone.conf}"
  printf '%s\n' "$R" | grep -Eq '^[A-Za-z0-9_-]+:[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$' \
    || { log "XƏTA off-site: OFFSITE_REMOTE 'remote:bucket[/yol]' formatında deyil"; return 1; }
  printf '%s\n' "$RC" | grep -Eq '^/[A-Za-z0-9._/-]+$' && safe_file "$RC" \
    || { log "XƏTA off-site: rclone konfiqi ($RC) yoxdur və ya icazəsi geniş (chmod 600, root)"; return 1; }
  [ -z "$PRUNE" ] || { printf '%s\n' "$PRUNE" | grep -Eq '^[0-9]{1,4}$' && [ "$PRUNE" -ge 7 ]; } \
    || { log "XƏTA off-site: OFFSITE_PRUNE_DAYS boş və ya ≥ 7 olmalıdır"; return 1; }
  N=0
  for k in $KEYS; do
    printf '%s\n' "$k" | grep -Eq '^age1[02-9ac-hj-np-z]{58}$' || { log "XƏTA off-site: OFFSITE_AGE_RECIPIENTS-də yararsız açıq açar"; return 1; }
    N=$((N + 1))
  done
  [ "$N" -ge 1 ] || { log "XƏTA off-site: OFFSITE_AGE_RECIPIENTS boşdur"; return 1; }
  command -v age >/dev/null 2>&1 && command -v rclone >/dev/null 2>&1 \
    || { log "XƏTA off-site: age və ya rclone quraşdırılmayıb (apt-get install -y age rclone)"; return 1; }

  # Vaxt damğalı ad: eyni gündə ikinci işləmə köhnəni ƏVƏZ ETMİR (bucket lock / versiyalama ilə uyğun)
  NAME="muslims-$STAMP-$(date -u +%H%M%S).db.gz.age"
  ENC="$DIR/.offsite-$NAME.part"
  set --
  for k in $KEYS; do set -- "$@" -r "$k"; done
  age "$@" -o "$ENC" "$OUT" || { rm -f "$ENC"; log "XƏTA off-site: şifrələmə alınmadı"; return 1; }
  RCL="rclone --config $RC -q --retries 3 --low-level-retries 5 --contimeout 30s --timeout 5m"
  $RCL copyto "$ENC" "$R/$NAME" || { rm -f "$ENC"; log "XƏTA off-site: yükləmə alınmadı ($R)"; return 1; }
  WANT=$(wc -c < "$ENC" | tr -d ' ')
  HAVE=$($RCL lsf --files-only --format s "$R/$NAME" 2>/dev/null | head -n 1 | tr -d ' \r')
  rm -f "$ENC"
  [ "$HAVE" = "$WANT" ] || { log "XƏTA off-site: yüklənmiş ölçü uyğun deyil ($HAVE / $WANT)"; return 1; }
  log "off-site OK: $R/$NAME ($WANT bayt, $N açar)"
  if [ -n "$PRUNE" ]; then
    $RCL delete "$R" --min-age "${PRUNE}d" --include 'muslims-*.db.gz.age' \
      || { log "XƏTA off-site: köhnələrin silinməsi alınmadı (nüsxə yükləndi)"; return 1; }
  fi
  return 0
}
OFFSITE_RC=0
set -f   # $KEYS sözlərə bölünür — "*" kimi simvollar fayl adına açılmasın
if ! offsite; then OFFSITE_RC=2; fi
set +f

# Köhnələri sil (yalnız bizim ad formatımız)
find "$DIR" -maxdepth 1 -type f -name 'muslims-*.db.gz' -mtime +"$KEEP_DAYS" -print -delete | while read -r f; do log "silindi: $f"; done
find "$DIR" -maxdepth 1 -type f -name '.offsite-*.part' -mmin +60 -delete 2>/dev/null || true
exit "$OFFSITE_RC"
