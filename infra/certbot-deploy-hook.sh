#!/bin/sh
# Let's Encrypt sertifikatı yenilənəndə certbot bunu çağırır
# (serverdə: /etc/letsencrypt/renewal-hooks/deploy/muslimscc.sh).
#
# Niyə lazımdır: web konteyneri root-suz nginx-dir (uid 101), /etc/letsencrypt
# içindəki privkey isə yalnız root üçün oxunandır. Sertifikatı uid 101-in
# oxuya biləcəyi /opt/muslimscc/certs-ə kopyalayır və nginx-i kəsintisiz
# yenidən yükləyir.
set -eu
SRC=/etc/letsencrypt/live/muslims.cc
DST=/opt/muslimscc/certs

install -d -m 750 -o 101 -g 101 "$DST"
install -m 644 -o 101 -g 101 "$SRC/fullchain.pem" "$DST/fullchain.pem"
install -m 600 -o 101 -g 101 "$SRC/privkey.pem"   "$DST/privkey.pem"

# İşləyən hər web konteynerində nginx yeni sertifikatı oxusun (bağlantılar qopmur). TAG — compose
# faylı onsuz açılmır (əvvəl burada yox idi və reload səssizcə alınmırdı). Konteyner adları deploy-da
# dəyişir (muslimscc-web-N) — ona görə ID-lər compose-dan götürülür. Edge (L4) sertifikat tutmur.
cd /opt/muslimscc
TAG="$(cat .current_tag 2>/dev/null || echo none)"; export TAG
for c in $(docker compose ps -q web 2>/dev/null); do docker exec "$c" nginx -s reload || true; done
echo "muslimscc: sertifikat yeniləndi"
