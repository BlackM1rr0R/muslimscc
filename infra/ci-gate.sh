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
#   reuse <TAG> <web|api> <SRC>
#                            serverdəki image-lərdən "cc.muslims.src" etiketi SRC olanı (mənbəsi
#                            eyni — məs. server/ dəyişməyib) <TAG> kimi işarələ; yükləmə lazım olmur.
#                            Tapılmasa çıxış kodu 3 ("miss") — CI onda adi upload edir.
#   deploy <TAG>             /opt/muslimscc/deploy.sh <TAG>
#   status                   cari versiya + konteynerlərin vəziyyəti
#   ig-reel <TARİX> <REF> <alafasy|none> [en|az|ru|tr]
#                            stdin (MP4, ≤ 15 MB) → api həcmi /data/ig-cards/<TARİX>-reel.mp4 + .json (Instagram reel)
#                            REF: tək ayə (33:3) və ya passaj (67:1-5); dil istəyə bağlıdır (köhnə 3 arqumentli forma da)
# TAG: 7-40 simvollu git hash (yalnız [0-9a-f]) — yol hücumu mümkün deyil. SRC: 40 simvollu git hash.
# ═══════════════════════════════════════════════════════
set -eu
cd /opt/muslimscc

# shellcheck disable=SC2086
set -- ${SSH_ORIGINAL_COMMAND:-}
CMD="${1:-}"; TAG="${2:-}"; NAME="${3:-}"; SRC="${4:-}"; EXTRA="${5:-}"
# 5-ci arqument yalnız ig-reel-də (reel-in dili); qalan əmrlərdə ən çox 4
MAXARGS=4; [ "$CMD" = ig-reel ] && MAXARGS=5
[ $# -le "$MAXARGS" ] || { echo "ci-gate: artıq arqument" >&2; exit 1; }

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
  reuse)
    valid_tag "$TAG" || deny
    case "$NAME" in web|api) ;; *) deny ;; esac
    echo "$SRC" | grep -Eq '^[0-9a-f]{40}$' || deny
    for id in $(docker image ls "muslimscc-$NAME" --format '{{.ID}}' | sort -u); do
      if [ "$(docker image inspect -f '{{index .Config.Labels "cc.muslims.src"}}' "$id" 2>/dev/null)" = "$SRC" ]; then
        docker tag "$id" "muslimscc-$NAME:$TAG"
        mkdir -p "releases/$TAG" && : > "releases/$TAG/$NAME.reused"
        logger -t ci-gate "reuse $TAG $NAME"
        echo "təkrar istifadə: $NAME ($SRC) → $TAG"
        exit 0
      fi
    done
    echo "miss"
    exit 3
    ;;
  deploy)
    valid_tag "$TAG" || deny
    logger -t ci-gate "deploy $TAG"
    exec /opt/muslimscc/deploy.sh "$TAG"
    ;;
  ig-reel)
    # Instagram reel (.github/workflows/ig-reel.yml → server/instagram.js, docs/INSTAGRAM.md → "Reels"):
    #   ig-reel <YYYY-MM-DD> <surə:ayə[-son]> <alafasy|none> [en|az|ru|tr]   stdin → MP4 (≤ 15 MB)
    #   (surə:ayə — köhnə tək ayə reel-i, surə:ayə-son — passaj; dil verilməyibsə JSON-da "lang" yazılmır)
    # İşləyən api konteynerinin /data/ig-cards/ qovluğuna <tarix>-reel.mp4 + <tarix>-reel.json yazılır (atomik mv).
    # Deploy-a toxunmur, image / konfiqurasiya dəyişmir; konteyner tapılmasa — çıxış 1 (CI yenidən cəhd edir).
    DATE="$TAG"; REF="$NAME"; AUDIO="$SRC"; RLANG="$EXTRA"
    echo "$DATE" | grep -Eq '^20[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$' || deny
    echo "$REF" | grep -Eq '^[1-9][0-9]{0,2}:[1-9][0-9]{0,2}(-[1-9][0-9]{0,2})?$' || deny
    case "$AUDIO" in alafasy|none) ;; *) deny ;; esac
    case "$RLANG" in ''|en|az|ru|tr) ;; *) deny ;; esac
    if [ -n "$RLANG" ]; then META="{\"ref\":\"$REF\",\"audio\":\"$AUDIO\",\"lang\":\"$RLANG\"}"
    else META="{\"ref\":\"$REF\",\"audio\":\"$AUDIO\"}"; fi
    TMP=$(mktemp /tmp/ig-reel.XXXXXX)
    trap 'rm -f "$TMP"' EXIT
    head -c 15728641 > "$TMP"
    SIZE=$(wc -c < "$TMP")
    [ "$SIZE" -ge 10240 ] && [ "$SIZE" -le 15728640 ] || { echo "ölçü yararsızdır: $SIZE" >&2; exit 1; }
    [ "$(dd if="$TMP" bs=1 skip=4 count=4 2>/dev/null)" = ftyp ] || { echo "MP4 deyil" >&2; exit 1; }
    CUR=$(cat .current_tag 2>/dev/null || true)
    [ -n "$CUR" ] || { echo "cari versiya yoxdur" >&2; exit 1; }
    C=$(TAG="$CUR" docker compose ps -q --status running api 2>/dev/null | head -n 1)
    [ -n "$C" ] || { echo "api konteyneri işləmir" >&2; exit 1; }
    D=/data/ig-cards
    printf '%s\n' "$META" | docker exec -i "$C" sh -c "mkdir -p $D && cat > $D/.$DATE-reel.json.tmp && mv $D/.$DATE-reel.json.tmp $D/$DATE-reel.json"
    docker exec -i "$C" sh -c "cat > $D/.$DATE-reel.mp4.tmp && mv $D/.$DATE-reel.mp4.tmp $D/$DATE-reel.mp4" < "$TMP"
    logger -t ci-gate "ig-reel $DATE $REF $AUDIO ${RLANG:--} $SIZE"
    echo "reel yazıldı: $DATE ($REF, $AUDIO, ${RLANG:--}, $SIZE bayt)"
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
