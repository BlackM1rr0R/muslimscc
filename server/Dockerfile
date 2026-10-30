# Muslims.cc API (server.js) — Express + SQLite (node:sqlite) + Web Push
# (+ keçid dövründə firebase-admin — docs/FIREBASE-EXIT.md)
# Root olmadan ("node" istifadəçisi), yalnız istehsal asılılıqları ilə.
# Node 22 LTS: Node 20 2026-04-də dəstəkdən çıxıb.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
# node:sqlite: Node 22.13+-da bayraqsız işləyir; köhnə 22.x üçün bayraq da verilir
# (yeni versiyalarda zərərsizdir). NODE_OPTIONS — "docker compose exec api node
# scripts/..." əmrləri də eyni bayraqlarla işləsin. Eksperimental xəbərdarlıq loga düşmür.
ENV NODE_OPTIONS="--experimental-sqlite --disable-warning=ExperimentalWarning"
# Baza: docker-compose-dakı named volume (api-data → /data). Konteynerin kök
# fayl sistemi read-only-dir — yazıla bilən YEGANƏ yer /data (və tmpfs /tmp).
ENV DB_PATH=/data/muslims.db

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js prompts.js prayer-utils.js ai-utils.js daily-ayah.js checkin.js db.js auth.js content.js push.js ./
# Admin/xidmət skriptləri (admin-user.js, migrate-from-firestore.js, backup-db.js, gen-vapid.js, set-admin.js)
COPY scripts ./scripts

# /data sahibi "node" olsun: yeni named volume ilk dəfə bu image ilə qoşulanda
# Docker qovluğun sahibini/icazəsini volume-a köçürür
RUN mkdir -p /data && chown node:node /data && chmod 700 /data

USER node
EXPOSE 3001

# /api/health bazanı da yoxlayır (SELECT 1) — DB açılmırsa konteyner unhealthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
