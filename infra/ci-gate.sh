#!/bin/sh
# ═══════════════════════════════════════════════════════
# CI deploy açarının "qapısı" (serverdə: /opt/muslimscc/ci-gate.sh)
#
# GitHub Actions-ın SSH açarı authorized_keys-də belə yazılıb:
#   restrict,command="/opt/muslimscc/ci-gate.sh" ssh-ed25519 AAAA... muslimscc-ci
#
# "command=" sayəsində bu açarla giriş hansı əmri istəsə də, YALNIZ bu
# skript işləyir; "restrict" terminal, port yönləndirmə və s. bağlayır.
# Yəni GitHub sirri oğurlansa belə, hücumçu serverdə qabıq (shell) ala
# bilməz — yalnız image yükləyib deploy.sh-ı çağıra bilər.
#
# İcazəli əmrlər ($SSH_ORIGINAL_COMMAND):
#   upload <TAG> <web|api>   stdin → releases/<TAG>/<ad>.tar.gz
#   deploy <TAG>             /opt/muslimscc/deploy.sh <TAG>
#   status                   cari versiya + konteynerlərin vəziyyəti
# TAG: 7-40 simvollu git hash (yalnız [0-9a-f]) — yol hücumu mümkün deyil.
# ═══════════════════════════════════════════════════════
set -eu
cd /opt/muslimscc

# shellcheck disable=SC2086
set -- ${SSH_ORIGINAL_COMMAND:-}
CMD="${1:-}"; TAG="${2:-}"; NAME="${3:-}"

valid_tag() { echo "$1" | grep -Eq '^[0-9a-f]{7,40}$'; }
deny() { echo "ci-gate: icazə yoxdur: ${SSH_ORIGINAL_COMMAND:-<boş>}" >&2; logger -t ci-gate "rədd: ${SSH_ORIGINAL_COMMAND:-}"; exit 1; }

case "$CMD" in
  upload)
    valid_tag "$TAG" || deny
    case "$NAME" in web|api) ;; *) deny ;; esac
    mkdir -p "releases/$TAG"
    # 400 MB-dan böyük fayl qəbul edilmir (disk dolmasın)
    head -c 419430400 > "releases/$TAG/$NAME.tar.gz.part"
    gunzip -t "releases/$TAG/$NAME.tar.gz.part" || { rm -f "releases/$TAG/$NAME.tar.gz.part"; echo "pozuq arxiv" >&2; exit 1; }
    mv "releases/$TAG/$NAME.tar.gz.part" "releases/$TAG/$NAME.tar.gz"
    logger -t ci-gate "upload $TAG $NAME"
    echo "yükləndi: $TAG/$NAME"
    ;;
  deploy)
    valid_tag "$TAG" || deny
    logger -t ci-gate "deploy $TAG"
    exec /opt/muslimscc/deploy.sh "$TAG"
    ;;
  status)
    CUR=$(cat .current_tag 2>/dev/null || true)
    echo "cari: ${CUR:-yoxdur}"
    [ -n "$CUR" ] && TAG="$CUR" docker compose ps --format '{{.Service}}: {{.State}} ({{.Health}})'
    exit 0
    ;;
  *)
    deny
    ;;
esac
