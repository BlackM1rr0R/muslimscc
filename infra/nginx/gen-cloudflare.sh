#!/bin/sh
# Cloudflare IP siyahısından infra/nginx/cloudflare.conf yaradır.
# Cloudflare siyahını nadir dəyişir; ildə bir dəfə və ya CF elan edəndə işlət:
#   sh infra/nginx/gen-cloudflare.sh && git diff infra/nginx/cloudflare.conf
set -eu
OUT="$(dirname "$0")/cloudflare.conf"
V4=$(curl -fsS https://www.cloudflare.com/ips-v4)
V6=$(curl -fsS https://www.cloudflare.com/ips-v6)
{
  echo "# AVTOMATİK YARADILIB — gen-cloudflare.sh ($(date -u +%Y-%m-%d)). Əl ilə redaktə etmə."
  echo "#"
  echo "# 1) Real ziyarətçi IP-si: sorğular yalnız Cloudflare-dən gəlir, nginx"
  echo "#    \$remote_addr-ı CF-Connecting-IP başlığından götürür. Bunsuz API-nin"
  echo "#    rate-limit-i ziyarətçini yox, Cloudflare serverini sayırdı."
  echo "# 2) \$from_cloudflare: bağlantı həqiqətən Cloudflare-dəndirmi (başlığa yox,"
  echo "#    TCP ünvanına — \$realip_remote_addr — baxır, saxtalaşdırıla bilməz)."
  echo "#    Server bloku 0 olanda bağlantını kəsir: origin IP-ni tapan hücumçu"
  echo "#    Cloudflare qorumasından yan keçə bilməsin."
  echo
  for r in $V4 $V6; do echo "set_real_ip_from $r;"; done
  echo "real_ip_header CF-Connecting-IP;"
  echo
  echo "geo \$realip_remote_addr \$from_cloudflare {"
  echo "    default 0;"
  echo "    # Konteynerin öz içindən sağlamlıq yoxlaması (deploy.sh) — kənardan gələ bilməz"
  echo "    127.0.0.1 1;"
  echo "    ::1 1;"
  echo "    # Docker körpüsü: serverin öz yoxlamaları (deploy.sh → curl 127.0.0.1:443)"
  echo "    # docker-proxy ilə gəlir. Xarici bağlantı bu ünvanla gələ bilməz: portlar"
  echo "    # yalnız IPv4-də açılır və orada iptables DNAT real mənbə IP-ni saxlayır."
  echo "    172.16.0.0/12 1;"
  for r in $V4 $V6; do echo "    $r 1;"; done
  echo "}"
} > "$OUT"
echo "yazıldı: $OUT"
