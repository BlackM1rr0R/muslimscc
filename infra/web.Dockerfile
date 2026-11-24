# Muslims.cc — sayt (Vite build + prerender) → root-suz nginx
# Kontekst: layihənin kökü.  docker build -f infra/web.Dockerfile .

# ── 1) Build ──
FROM node:22-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Açıq build konfiqi (.env.public — sirr deyil).
# Vite istehsal build-ində .env.production.local-ı oxuyur.
RUN cp .env.public .env.production.local

# Əvvəlcədən sıxılmış .gz surətləri (scripts/prerender.mjs → nginx gzip_static)
# JS/CSS/JSON/XML üçün dist ilə birlikdə image-ə düşür; yoxdursa build dayansın.
# HTML üçün .gz YAZILMIR (image 400 MB server həddini aşırdı) — onu nginx
# dinamik gzip sıxır; ona görə .html.gz OLMAMALIDIR.
# Gizli admin paneli ünvanı (docs/ADMIN-SECURITY.md → "Gizli ünvan"): CI GitHub sirri ADMIN_PATH-i
# BuildKit sirri kimi verir (fayl: "VITE_ADMIN_PATH=/..." və ya boş). Image metadata-sına/ARG-a düşmür;
# yalnız bu RUN-da .env.production.local-a əlavə olunur. Yoxdursa — /account/panel.
RUN --mount=type=secret,id=admin_path,required=false \
    if [ -s /run/secrets/admin_path ]; then \
      grep -Eqx 'VITE_ADMIN_PATH=/[a-z0-9-]{8,40}' /run/secrets/admin_path || { echo 'admin_path sirri formatı yanlışdır'; exit 1; }; \
      { echo; cat /run/secrets/admin_path; } >> .env.production.local; \
    fi && \
    npm run build && test -f dist/404.html && test -f dist/index.html && ! test -f dist/index.html.gz && ls dist/assets/*.js.gz > /dev/null

# ── 2) Serve ──
# stable-alpine: hər deploy-da təzə build olunur → nginx təhlükəsizlik
# yamaları avtomatik gəlir.
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY --from=build /src/dist /usr/share/nginx/html
COPY infra/nginx/cloudflare.conf        /etc/nginx/conf.d/cloudflare.conf
COPY infra/nginx/muslims.cc.conf        /etc/nginx/conf.d/default.conf
COPY infra/nginx/security-headers.conf  /etc/nginx/snippets/security-headers.conf

# deploy.sh: bu etiketli image kənar (edge) konteynerinin arxasında işləyə bilir (172.16/12-dən
# gələn CF-Connecting-IP-yə güvənir). Etiketsiz köhnə image-ə qayıdış → docker-compose.legacy.yml
LABEL cc.muslims.edge="1"

EXPOSE 8080 8443
