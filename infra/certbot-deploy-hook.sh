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

# Konteyner işləyirsə nginx-ə yeni sertifikatı oxut (bağlantılar qopmur)
cd /opt/muslimscc && docker compose exec -T web nginx -s reload 2>/dev/null || true
echo "muslimscc: sertifikat yeniləndi"
