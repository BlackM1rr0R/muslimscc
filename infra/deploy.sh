#!/bin/sh
# ═══════════════════════════════════════════════════════
# Muslims.cc — serverdə yeni versiyanı KƏSİNTİSİZ işə sal (avtomatik geri qaytarma ilə)
#
#   /opt/muslimscc/deploy.sh <TAG>
#   /opt/muslimscc/deploy.sh --rollback        # əl ilə: əvvəlki versiyaya (eyni kəsintisiz yolla)
#
# CI (GitHub Actions) image-ləri releases/<TAG>/ qovluğuna web.tar.gz / api.tar.gz kimi yükləyir
# (və ya dəyişməyibsə ci-gate "reuse" ilə mövcud image-i <TAG> kimi işarələyir), sonra bunu çağırır.
#
# Necə kəsintisiz (docker-compose.yml → edge):
#   • 80/443-ü daimi "edge" (L4 proksi) tutur; o, deploy-da yenidən yaradılmır.
#   • api, sonra web — "rollout": köhnənin YANINDA yeni konteyner (eyni DNS adı, --scale N+1
#     --no-recreate), yenisini birbaşa yoxla (api: /api/health; web: öz IP-si üzərindən HTTPS
#     tüstü testi), sonra köhnəni səliqəli dayandır (api SIGTERM → boşaltma; nginx SIGQUIT).
#     Proksilər ünvanları 1–2 saniyədə təzələyir, dayanan prosesə bağlantı dərhal rədd olunur və
#     sorğu növbəti ünvana keçir (infra/nginx/muslims.cc.conf, infra/edge/nginx.conf).
#   • Yeni konteyner yoxlamadan keçmirsə — yalnız o silinir, köhnəsi heç dayanmayıb.
#   • Sonda edge üzərindən tam tüstü testi; alınmasa → hər iki xidmət əvvəlki TAG-a (eyni yolla).
#   • image dəyişməyibsə (eyni ID) həmin xidmət ümumiyyətlə yenidən başladılmır.
#   • Push planlayıcıları: iki api yanaşı işləyəndə eyni push bir dəfə gedir (server/pushClaims.js).
#
# Köhnə (edge-siz, "cc.muslims.edge" etiketsiz) web image-ləri: deploy/qayıdış onları
# docker-compose.legacy.yml ilə portları özü tutan web kimi işə salır (qısa kəsinti). Edge-ə ilk
# keçid (miqrasiya) də bir dəfəlik qısa kəsintidir (infra/README.md → "Kəsintisiz deploy").
#
# Mühit (staging üçün): MCC_DIR, IMAGE_PREFIX, HTTPS_PORT, HTTP_PORT, BIND_IP, COMPOSE_PROJECT_NAME
# ═══════════════════════════════════════════════════════
set -eu
cd "${MCC_DIR:-/opt/muslimscc}"

CUR_FILE=.current_tag
PREV_FILE=.previous_tag
KEEP="${KEEP:-3}"
P="${IMAGE_PREFIX:-muslimscc}"
export IMAGE_PREFIX="$P"
HP="${HTTPS_PORT:-443}"

log() { echo "[deploy $(date -u +%H:%M:%S)] $*"; }

# Eyni anda iki deploy (CI + əl ilə) olmasın
exec 9>.deploy.lock
flock -n 9 || { log "başqa deploy gedir"; exit 1; }

# docker compose HƏR əmrdə TAG istəyir (image adı ondan qurulur) — qlobal export olunur
dc() { docker compose "$@"; }
dcl() { docker compose -f docker-compose.yml -f docker-compose.legacy.yml "$@"; }
running() { dc ps -q "$1" 2>/dev/null || true; }
count() { printf '%s\n' "$1" | grep -c . || true; }
img_id() { docker image inspect -f '{{.Id}}' "$P-$1:$2" 2>/dev/null; }
edge_ready() { [ "$(docker image inspect -f '{{index .Config.Labels "cc.muslims.edge"}}' "$P-web:$1" 2>/dev/null)" = 1 ]; }
cip() { docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' "$1" | awk '{print $1}'; }
# işləyir və heç yenidən başlamayıb (çökən konteyneri restart siyasəti dərhal qaldırır — onu gözləmə)
alive() { [ "$(docker inspect -f '{{.State.Running}}/{{.RestartCount}}' "$1" 2>/dev/null)" = true/0 ]; }

# Tüstü testi: HOST:PORT üzərindən (SNI=muslims.cc) — sayt, 404, yönləndirmə, API, baza
smoke() {
  H="$1"; PT="$2"
  C="curl -sS -o /dev/null -w %{http_code} --max-time 10 -k --resolve muslims.cc:$PT:$H"
  [ "$($C "https://muslims.cc:$PT/")" = 200 ]                 || { log "ana səhifə açılmır ($H)"; return 1; }
  [ "$($C "https://muslims.cc:$PT/en/quran")" = 200 ]         || { log "/en/quran açılmır ($H)"; return 1; }
  [ "$($C "https://muslims.cc:$PT/bu-sehife-yoxdur")" = 404 ] || { log "naməlum ünvan 404 qaytarmır ($H)"; return 1; }
  # 301-in HARA getdiyi: əvvəl Location-a konteynerin daxili portu düşürdü (":8443/about").
  # Xam Location başlığı yoxlanılır (redirect_url nisbi ünvanı sorğunun portu ilə tamamlayardı)
  LOC=$(curl -sS -o /dev/null -D - --max-time 10 -k --resolve "muslims.cc:$PT:$H" "https://muslims.cc:$PT/mosque" | sed -n 's/^[Ll]ocation: *//p' | tr -d '\r')
  case "$LOC" in
    *:8443*|*:8080*|"") log "yönləndirmə səhv ünvana gedir: '$LOC'"; return 1 ;;
  esac
  curl -sS --max-time 10 -k --resolve "muslims.cc:$PT:$H" "https://muslims.cc:$PT/api/health" | grep -q '"ok"' || { log "API cavab vermir ($H)"; return 1; }
  [ "$($C "https://muslims.cc:$PT/api/content/announcements")" = 200 ] || { log "/api/content/announcements 200 deyil ($H)"; return 1; }
  return 0
}

ready_api() {
  i=0
  while [ $i -lt 60 ]; do
    alive "$1" || return 1
    docker exec "$1" wget -qO- http://127.0.0.1:3001/api/health 2>/dev/null | grep -q '"ok"' && return 0
    sleep 1; i=$((i + 1))
  done
  return 1
}
ready_web() {
  i=0
  until docker exec "$1" wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1; do
    alive "$1" || return 1
    i=$((i + 1)); [ $i -lt 30 ] || return 1; sleep 1
  done
  # Bu konteynerin öz IP-si üzərindən (edge-dən yan) — trafikə açılmamışdan əvvəl tam yoxlama
  smoke "$(cip "$1")" 8443
}

# ── Edge upstream-i (infra/edge/upstream.conf) yaz və kəsintisiz reload et ──
#   edge_upstream pin <IP>      yalnız bu web konteyneri (keçid: köhnəyə YENİ bağlantı getmir)
#   edge_upstream dns <IP>      sabit vəziyyət: DNS adı "web" (resolve) + <IP> ehtiyat — reload-dan
#                               sonrakı ilk millisaniyələrdə ad hələ həll olunmayıbsa
edge_upstream() {
  E=$(running edge)
  { echo "# deploy.sh yazıb ($(date -u +%FT%TZ)) — əl ilə redaktə etməyin"
    for pp in https:8443 http:8080; do
      n=${pp%%:*}; port=${pp##*:}
      echo "upstream web_$n {"
      if [ "$1" = pin ]; then
        echo "    server $2:$port;"
      else
        echo "    zone web_$n 64k;"
        echo "    server web:$port resolve;"
        echo "    server $2:$port backup;"
      fi
      echo "}"
    done
  } > edge/upstream.conf.new && mv edge/upstream.conf.new edge/upstream.conf
  [ -n "$E" ] || return 0
  docker exec "$E" nginx -q -t -c /etc/nginx/edge/nginx.conf || { log "✗ edge konfiqi səhvdir"; return 1; }
  docker kill -s HUP "$E" >/dev/null
  sleep 1   # yeni worker başlasın
}

# Köhnə api-ni dayandır: SIGTERM → dinləmə dayanır, proses 4 san "refused" verərək yaşayır
# (server.js LINGER_MS). Bu vaxt nginx-in hər worker-i köhnə ünvanı ən azı bir dəfə sınamalıdır ki,
# onu 10 san "ölü" saysın (max_fails=1) — yoxsa konteyner öləndən sonra ünvan DNS-dən silinənə qədər
# ora gedən sorğu 502/504 alırdı. Trafik az olanda bunu bir neçə yoxlama sorğusu təmin edir.
stop_api() {
  # shellcheck disable=SC2086
  docker kill -s TERM $1 >/dev/null 2>&1 || true
  sleep 0.3
  for _ in 1 2 3 4 5 6; do
    curl -s -o /dev/null --max-time 3 -k --resolve "muslims.cc:$HP:127.0.0.1" "https://muslims.cc:$HP/api/health" || true
  done
  # shellcheck disable=SC2086
  docker stop -t 15 $1 >/dev/null 2>&1; docker rm $1 >/dev/null 2>&1 || true
}

# rollout <api|web> <TAG> [defer] — köhnənin yanında yenisi; yoxlama; köhnəni səliqəli dayandır.
# "defer": köhnəni hələ dayandırma (DEFERRED-ə yaz) — web topologiyası dəyişəndə (edge-ə keçid):
# köhnə web-in DNS keşi 30 san idi və yalnız köhnə api-ni tanıyırdı → əvvəl web keçir, sonra api.
DEFERRED=""
NEWAPI=""
rollout() {
  S="$1"; export TAG="$2"
  WANT=$(img_id "$S" "$TAG") || { log "$P-$S:$TAG image-i yoxdur"; return 1; }
  OLDC=$(running "$S")
  if [ "$(count "$OLDC")" = 1 ] && [ "$(docker inspect -f '{{.Image}}' "$OLDC")" = "$WANT" ]; then
    log "$S: image dəyişməyib — yenidən başladılmır"; return 0
  fi
  N=$(count "$OLDC")
  dc up -d --no-deps --no-recreate --scale "$S=$((N + 1))" "$S" >/dev/null 2>&1 || true
  NEWC=$(running "$S" | grep -vxF "${OLDC:-none}" || true)
  [ "$(count "$NEWC")" = 1 ] || { log "$S: yeni konteyner yaranmadı"; [ -n "$NEWC" ] && docker rm -f $NEWC >/dev/null; return 1; }
  if ! "ready_$S" "$NEWC"; then
    log "✗ $S ($TAG) yoxlamadan keçmədi — yalnız yeni konteyner silinir, köhnə işləyir"
    docker logs --tail 40 "$NEWC" 2>&1 || true
    docker rm -f "$NEWC" >/dev/null 2>&1 || true
    return 1
  fi
  if [ "$S" = api ]; then
    NEWAPI="$NEWC"
    # Yeni api DNS-ə dinləməyə başlamazdan əvvəl düşür: nginx onu "refused" üçün 10 san ölü saya bilər
    # (muslims.cc.conf: fail_timeout=10s). Köhnəni bundan tez dayandırsaq hər ikisi "ölü" olardı.
    sleep "${API_SETTLE:-11}"
    if [ -n "$OLDC" ] && [ "${3:-}" = defer ]; then DEFERRED="$OLDC"
    elif [ -n "$OLDC" ]; then stop_api "$OLDC"; fi
  else
    if [ -n "$OLDC" ]; then
      # edge yeni web-in IP-sinə bağlanır (reload) — köhnəyə yeni bağlantı getmir; sonra köhnə səliqəli
      # dayanır (SIGQUIT: işdəki sorğular bitir; açıq SSE ≤ 10 san), sonra edge yenə DNS adına keçir
      NIP=$(cip "$NEWC")
      edge_upstream pin "$NIP" || return 1
      # shellcheck disable=SC2086
      docker stop -t 10 $OLDC >/dev/null && docker rm $OLDC >/dev/null
      sleep 2   # Docker DNS köhnəni çıxarsın
      edge_upstream dns "$NIP" || return 1
    fi
  fi
  log "✓ $S → $TAG ($(docker inspect -f '{{.Name}}' "$NEWC" | tr -d /))"
}

# web: edge arxasında rollout; edge-siz köhnə image → legacy (portları web özü tutur)
deploy_web() {
  T="$1"; export TAG="$T"
  if edge_ready "$T"; then
    if [ -n "$(running edge)" ]; then rollout web "$T"; return; fi
    # Bir dəfəlik keçid (miqrasiya və ya legacy-dən qayıdış): yeni web portsuz başlayır və yoxlanılır,
    # sonra köhnə web portları buraxır və edge onları tutur — ~1–3 saniyəlik kəsinti
    log "edge-ə keçid (bir dəfəlik qısa kəsinti)"
    OLDC=$(running web)
    dc up -d --no-deps --no-recreate --scale "web=$(($(count "$OLDC") + 1))" web >/dev/null 2>&1 || true
    NEWC=$(running web | grep -vxF "${OLDC:-none}" || true)
    [ "$(count "$NEWC")" = 1 ] && ready_web "$NEWC" || { log "✗ yeni web yoxlamadan keçmədi"; [ -n "$NEWC" ] && docker rm -f $NEWC >/dev/null; return 1; }
    edge_upstream dns "$(cip "$NEWC")"
    # edge konteyneri əvvəlcədən yaradılır (port yalnız "start"-da tutulur) — boşluq minimal olsun
    dc up --no-start --no-deps edge >/dev/null 2>&1 || { log "✗ edge yaradılmadı"; return 1; }
    # shellcheck disable=SC2086
    [ -n "$OLDC" ] && docker stop -t 1 $OLDC >/dev/null && docker rm $OLDC >/dev/null
    dc start edge >/dev/null 2>&1 || { log "✗ edge başlamadı"; return 1; }
    log "✓ edge + web → $T"
  else
    log "web $T edge-siz köhnə image-dir → legacy topologiya (qısa kəsinti)"
    if [ -n "$(running edge)" ]; then dc stop -t 2 edge >/dev/null; dc rm -f edge >/dev/null; fi
    OLDC=$(running web)
    # shellcheck disable=SC2086
    [ -n "$OLDC" ] && docker rm -f $OLDC >/dev/null
    dcl up -d --no-deps web >/dev/null 2>&1 || return 1
    NEWC=$(running web)
    ready_web "$NEWC"
  fi
}

load_images() {
  T="$1"
  for img in web api; do
    if img_id "$img" "$T" >/dev/null; then log "$img:$T artıq var (yüklənmir)"; continue; fi
    [ -f "releases/$T/$img.tar.gz" ] || { log "releases/$T/$img.tar.gz tapılmadı"; return 1; }
    gunzip -c "releases/$T/$img.tar.gz" | docker load -q >/dev/null
    img_id "$img" "$T" >/dev/null || { log "$img:$T yüklənmədi"; return 1; }
  done
}

# web-in topologiyası dəyişəcəkmi (edge ↔ legacy)
topo_change() {
  if edge_ready "$1"; then [ -z "$(running edge)" ]; else [ -n "$(running edge)" ]; fi
}
stop_deferred() {
  [ -n "$DEFERRED" ] && stop_api "$DEFERRED"
  DEFERRED=""
}
# Hər iki xidməti T-yə gətir (geri qaytarma üçün də) və edge üzərindən yoxla
switch_all() {
  D=""; topo_change "$1" && D=defer
  rollout api "$1" $D && deploy_web "$1" && stop_deferred && smoke 127.0.0.1 "$HP"
}

if [ "${1:-}" = "--rollback" ]; then
  PREV=$(cat "$PREV_FILE" 2>/dev/null || true)
  [ -n "$PREV" ] || { log "əvvəlki versiya yoxdur"; exit 1; }
  log "əl ilə geri qaytarma → $PREV"
  switch_all "$PREV" || { log "DİQQƏT: geri qaytarma yoxlamadan keçmədi"; exit 1; }
  cp "$CUR_FILE" "$PREV_FILE.rolled" 2>/dev/null || true
  echo "$PREV" > "$CUR_FILE"
  log "hazırdır: $PREV"
  exit 0
fi

NEW="${1:?istifadə: deploy.sh <TAG> | --rollback}"
OLD=$(cat "$CUR_FILE" 2>/dev/null || true)
export TAG="$NEW"
START=$(date +%s)
log "versiya $NEW (indiki: ${OLD:-yoxdur})"
load_images "$NEW"

D=""; topo_change "$NEW" && D=defer
if ! rollout api "$NEW" $D; then
  log "✗ $NEW: api yoxlamadan keçmədi — heç nə dəyişmədi"
  exit 1
fi
if deploy_web "$NEW" && stop_deferred && smoke 127.0.0.1 "$HP"; then
  [ -n "$OLD" ] && [ "$OLD" != "$NEW" ] && echo "$OLD" > "$PREV_FILE"
  echo "$NEW" > "$CUR_FILE"
  log "✓ $NEW canlıdadır ($(($(date +%s) - START)) san)"
else
  log "✗ $NEW sağlamlıq yoxlamasından keçmədi"
  dc logs --tail=40 api web 2>&1 | tail -80 || true
  # Köhnə api hələ işləyirsə (defer) — yalnız yenisini sil, köhnəyə toxunma
  if [ -n "$DEFERRED" ] && [ -n "$NEWAPI" ]; then docker rm -f "$NEWAPI" >/dev/null 2>&1 || true; DEFERRED=""; fi
  if [ -n "$OLD" ]; then
    log "geri qaytarılır → $OLD"
    switch_all "$OLD" || log "DİQQƏT: geri qaytarma da alınmadı!"
  fi
  exit 1
fi

# ── Təmizlik: yalnız son $KEEP versiya qalsın (image + tar). İşləyən konteynerin image-i
#    etiketsiz qalsa da silinmir (Docker işlənən image-i saxlayır).
KEEP_TAGS=$(ls -1t releases 2>/dev/null | head -n "$KEEP")
for d in $(ls -1t releases 2>/dev/null | tail -n +"$((KEEP + 1))"); do
  rm -rf "releases/$d"
done
for img in "$P-web" "$P-api"; do
  docker image ls "$img" --format '{{.Tag}}' | while read -r t; do
    echo "$KEEP_TAGS" | grep -qx "$t" || docker image rm "$img:$t" >/dev/null 2>&1 || true
  done
done
log "təmizlik bitdi (saxlanılan: $(echo $KEEP_TAGS | tr '\n' ' '))"
