#!/bin/sh
# ═══════════════════════════════════════════════════════
# Muslims.cc — serverdə yeni versiyanı işə sal (avtomatik geri qaytarma ilə)
#
#   /opt/muslimscc/deploy.sh <TAG>
#
# CI (GitHub Actions) image-ləri build edib releases/<TAG>/ qovluğuna
# web.tar.gz və api.tar.gz kimi yükləyir, sonra bu skripti çağırır.
#
# Addımlar:
#   1. image-ləri yüklə (docker load)
#   2. yeni TAG ilə konteynerləri yenilə, healthcheck-lərin keçməsini gözlə
#   3. tüstü testi: sayt, 404, /api/health — konteynerin içindən
#   4. alınmasa → əvvəlki TAG-a qayıt və xəta ilə çıx (CI qırmızı olur)
#   5. uğurludursa → TAG-ı yadda saxla, ən son 3 versiyadan köhnələri sil
#
# Əl ilə geri qaytarma:  /opt/muslimscc/deploy.sh --rollback
# ═══════════════════════════════════════════════════════
set -eu
cd /opt/muslimscc

CUR_FILE=.current_tag
PREV_FILE=.previous_tag
KEEP=3

log() { echo "[deploy $(date -u +%H:%M:%S)] $*"; }

# docker compose HƏR əmrdə (exec, logs, ps da) TAG istəyir — compose faylı
# image adını ondan qurur. Ona görə TAG qlobal export olunur.
compose_up() {
  export TAG="$1"
  docker compose up -d --remove-orphans --wait --wait-timeout 120
}

smoke() {
  # Hostdan, real port üzərindən (curl → docker-proxy → nginx → api): istifadəçinin
  # yolunun eynisi, yalnız Cloudflare-siz. SNI=muslims.cc olsun deyə --resolve.
  P="${HTTPS_PORT:-443}"
  C="curl -sS -o /dev/null -w %{http_code} --max-time 10 -k --resolve muslims.cc:$P:127.0.0.1"
  [ "$($C https://muslims.cc:$P/)" = 200 ]            || { log "ana səhifə açılmır"; return 1; }
  [ "$($C https://muslims.cc:$P/en/quran)" = 200 ]    || { log "/en/quran açılmır"; return 1; }
  [ "$($C https://muslims.cc:$P/bu-sehife-yoxdur)" = 404 ] || { log "naməlum ünvan 404 qaytarmır"; return 1; }
  # 301-in HARA getdiyi də yoxlanılır: əvvəl Location-a konteynerin daxili portu
  # düşürdü ("https://muslims.cc:8443/about") və bütün yönləndirmələr ölü idi —
  # status kodu düzgün (301) olduğu üçün köhnə yoxlama bunu görmürdü.
  LOC=$(curl -sS -o /dev/null -w '%{redirect_url}' --max-time 10 -k --resolve "muslims.cc:$P:127.0.0.1" "https://muslims.cc:$P/mosque")
  case "$LOC" in
    *:8443*|*:8080*|"") log "yönləndirmə səhv ünvana gedir: '$LOC'"; return 1 ;;
  esac
  curl -sS --max-time 10 -k --resolve "muslims.cc:$P:127.0.0.1" "https://muslims.cc:$P/api/health" | grep -q '"ok"'                                                        || { log "API cavab vermir"; return 1; }
  return 0
}

if [ "${1:-}" = "--rollback" ]; then
  PREV=$(cat "$PREV_FILE" 2>/dev/null || true)
  [ -n "$PREV" ] || { log "əvvəlki versiya yoxdur"; exit 1; }
  log "əl ilə geri qaytarma → $PREV"
  compose_up "$PREV"
  cp "$CUR_FILE" "$PREV_FILE.rolled" 2>/dev/null || true
  echo "$PREV" > "$CUR_FILE"
  log "hazırdır: $PREV"
  exit 0
fi

NEW="${1:?istifadə: deploy.sh <TAG> | --rollback}"
OLD=$(cat "$CUR_FILE" 2>/dev/null || true)
DIR="releases/$NEW"

log "versiya $NEW (indiki: ${OLD:-yoxdur})"
for img in web api; do
  [ -f "$DIR/$img.tar.gz" ] || { log "$DIR/$img.tar.gz tapılmadı"; exit 1; }
  gunzip -c "$DIR/$img.tar.gz" | docker load -q
done

export TAG="$NEW"
if compose_up "$NEW" && smoke; then
  [ -n "$OLD" ] && [ "$OLD" != "$NEW" ] && echo "$OLD" > "$PREV_FILE"
  echo "$NEW" > "$CUR_FILE"
  log "✓ $NEW canlıdadır"
else
  log "✗ $NEW sağlamlıq yoxlamasından keçmədi"
  docker compose logs --tail=40 api web || true
  if [ -n "$OLD" ]; then
    log "geri qaytarılır → $OLD"
    compose_up "$OLD" || log "DİQQƏT: geri qaytarma da alınmadı!"
  fi
  exit 1
fi

# ── Təmizlik: yalnız son $KEEP versiya qalsın (image + tar) ──
KEEP_TAGS=$(ls -1t releases 2>/dev/null | head -n "$KEEP")
for d in $(ls -1t releases 2>/dev/null | tail -n +"$((KEEP + 1))"); do
  rm -rf "releases/$d"
done
for img in muslimscc-web muslimscc-api; do
  docker image ls "$img" --format '{{.Tag}}' | while read -r t; do
    echo "$KEEP_TAGS" | grep -qx "$t" || docker image rm -f "$img:$t" >/dev/null 2>&1 || true
  done
done
log "təmizlik bitdi (saxlanılan: $(echo $KEEP_TAGS | tr '\n' ' '))"
