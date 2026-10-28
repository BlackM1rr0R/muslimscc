# Muslims.cc API (server.js) — Express + firebase-admin
# Root olmadan ("node" istifadəçisi), yalnız istehsal asılılıqları ilə.
# Node 22 LTS: Node 20 2026-04-də dəstəkdən çıxıb.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js prompts.js prayer-utils.js ai-utils.js ./

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
