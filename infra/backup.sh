#!/bin/sh
# ═══════════════════════════════════════════════════════
# Muslims.cc — SQLite bazasının gündəlik ehtiyat nüsxəsi
#
#   /opt/muslimscc/backup.sh
#
# Hostda sqlite3 lazım deyil: surəti konteynerin İÇİNDƏ node çıxarır
# (server/scripts/backup-db.js — VACUUM INTO + integrity_check), host onu
# gzip-ləyib saxlayır:
#   /opt/muslimscc/backups/muslims-YYYYMMDD.db.gz   (600, root)
# Son $KEEP_DAYS gün saxlanılır. Gündə bir dəfə systemd timer işlədir —
# quraşdırma: infra/systemd/ və docs/FIREBASE-EXIT.md → "Ehtiyat nüsxə".
#
# Bərpa (geri yükləmə): docs/FIREBASE-EXIT.md → "Ehtiyat nüsxədən bərpa".
# ═══════════════════════════════════════════════════════
set -eu
cd /opt/muslimscc

DIR=/opt/muslimscc/backups
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP=$(date -u +%Y%m%d)
OUT="$DIR/muslims-$STAMP.db.gz"
TMP="$OUT.part"

log() { echo "[backup $(date -u +%H:%M:%S)] $*"; logger -t muslimscc-backup "$*" 2>/dev/null || true; }

umask 077
mkdir -p "$DIR"
chmod 700 "$DIR"

export TAG="$(cat .current_tag)"
# -T: TTY yoxdur (binar axın pozulmasın)
if ! docker compose exec -T api node scripts/backup-db.js | gzip -9 > "$TMP"; then
  rm -f "$TMP"; log "XƏTA: surət çıxarılmadı"; exit 1
fi
# Boş və ya pozuq arxiv saxlanmasın
# (SQLite faylının başlığı "SQLite format 3\0" — ilk 15 bayt yoxlanılır)
if ! gzip -t "$TMP" || [ "$(gunzip -c "$TMP" | head -c 15)" != "SQLite format 3" ]; then
  rm -f "$TMP"; log "XƏTA: arxiv yararsızdır"; exit 1
fi
mv "$TMP" "$OUT"
log "OK: $OUT ($(du -h "$OUT" | cut -f1))"

# Köhnələri sil (yalnız bizim ad formatımız)
find "$DIR" -maxdepth 1 -type f -name 'muslims-*.db.gz' -mtime +"$KEEP_DAYS" -print -delete | while read -r f; do log "silindi: $f"; done
