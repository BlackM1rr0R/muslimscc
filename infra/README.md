# Muslims.cc — server və deploy

## Quruluş

```
İnternet ──► Cloudflare ──► server :80/:443 ──► [edge] L4 ──► [web] nginx (TLS) ──► /api/ ──► [api] Node
                                     ▲                                                          │
                     yalnız Cloudflare IP-ləri (edge + web)                  Web Push, OpenRouter, aladhan
```

| Konteyner | Image | Nə edir |
|---|---|---|
| `edge` | `nginxinc/nginx-unprivileged` (digest ilə sabit) + `infra/edge/` | 80/443-ün **daimi** sahibi: TCP-ni (TLS açmadan) web-ə ötürür, yalnız Cloudflare IP-lərini buraxır. Deploy-da yenidən yaradılmır. |
| `web` | `infra/web.Dockerfile` | Sayt (Vite build + prerender), TLS, `/api/` proksi. Host portu yoxdur (edge arxasında). |
| `api` | `server/Dockerfile` | `server/server.js`: AI köməkçi, məzmun API-si və admin girişi (SQLite, volume `api-data` → `/data`), admin push, **azan push planlayıcısı** (hər abunəçiyə öz şəhərinin vaxtında). Port açmır. Əməliyyatlar: [docs/SERVER-OPS.md](../docs/SERVER-OPS.md). |

Serverdə hər şey `/opt/muslimscc/`-dədir:

| Fayl | Nədir |
|---|---|
| `docker-compose.yml` | `infra/docker-compose.yml`-in surəti |
| `api.env` | API sirləri (600, root). **Git-də yoxdur.** |
| `certs/` | Let's Encrypt sertifikatının root-suz nginx üçün surəti (hook yeniləyir) |
| `deploy.sh`, `ci-gate.sh`, `docker-compose.legacy.yml` | `infra/`-dan |
| `edge/` | `infra/edge/` (`nginx.conf`, `cloudflare-allow.conf`); `upstream.conf`-u deploy.sh yazır |
| `releases/<TAG>/` | CI-ın yüklədiyi image-lər (son 3 versiya saxlanılır) |
| `.current_tag`, `.previous_tag` | canlı və əvvəlki versiya |
| `backup.sh`, `backups/` | SQLite-ın gündəlik ehtiyat nüsxəsi (systemd timer `muslimscc-backup`, 14 gün) — docs/SERVER-OPS.md |

## Deploy — avtomatik

`main`-ə push → GitHub Actions (`.github/workflows/ci.yml`):

1. yoxlamalar (dil təmizliyi, konfiq sinxronluğu), unit testlər, build
2. e2e (Playwright, kompüter + telefon)
3. Docker image-ləri (nginx konfiqi image-in içində `nginx -t` ilə yoxlanılır)
4. serverə yükləmə (mənbəyi dəyişməyən image — çox vaxt api — yüklənmir: `ci-gate reuse`) →
   `deploy.sh <TAG>`: **kəsintisiz** (aşağıya bax), sağlamlıq yoxlaması + tüstü testi; **alınmasa avtomatik əvvəlki versiyaya qayıdır**
5. Cloudflare üzərindən canlı yoxlama

Testlərdən biri yıxılsa, deploy olmur. Yalnız `docs/**`, `*.md`, `.claude/**` dəyişən push-larda CI işləmir.

### Kəsintisiz deploy (deploy.sh)
- **api**: köhnənin yanında yeni konteyner (`--scale api=2 --no-recreate`, eyni DNS adı `api`) → birbaşa
  `/api/health` → 11 san gözləmə (nginx yeni ünvanı tanısın) → köhnəyə SIGTERM: dinləmə dayanır, 4 san
  "refused" verərək yaşayır (nginx onu ölü sayır, sorğular yeniyə keçir), işdəki sorğular bitir, SSE bağlanır.
  İki proses bir neçə saniyə eyni SQLite-ı (WAL) paylaşır; azan/xatırlatma push-ları `server/pushClaims.js`
  ilə bazada atom "tutulur" — bir dəfə gedir. Həftəlik e-poçt, şəxsi məktublar, qrup xatırlatmaları
  onsuz da bazada claim edir.
- **web**: yanında yeni konteyner → öz IP-si üzərindən HTTPS tüstü testi → edge `upstream.conf` yalnız
  yeni IP-yə (reload, kəsintisiz) → köhnə web SIGQUIT ilə səliqəli dayanır → edge yenə DNS adı `web`-ə.
- image ID eynidirsə xidmət yenidən başladılmır. Yeni konteyner yoxlamadan keçməsə yalnız o silinir.
- Edge-siz (etiketsiz, köhnə) web image-inə qayıdış → `docker-compose.legacy.yml` (web portları özü tutur, qısa kəsinti).
- Konteyner adları dəyişir (`muslimscc-api-2`, `-3`…): həmişə `docker compose exec api …` işlədin.
  **`docker compose up -d` (seçimsiz) işlətməyin** — hamısını birdən yenidən yaradar (kəsinti).

### Edge
- Konfiq dəyişəndə (`infra/edge/*`): `scp` → `docker compose exec edge nginx -t -c /etc/nginx/edge/nginx.conf && docker compose kill -s HUP edge` (kəsintisiz).
- Edge image-ini dəyişmək (digest, `docker-compose.yml`) — portları tutan konteyner yenidən yaradılır: ~1 san kəsinti, planlı et:
  `TAG=$(cat .current_tag) docker compose up -d --no-deps edge`.

### GitHub sirləri (bir dəfəlik)

Settings → Secrets and variables → Actions → New repository secret:

| Ad | Dəyər |
|---|---|
| `DEPLOY_HOST` | serverin IP-si |
| `DEPLOY_SSH_KEY` | `~/.ssh/muslimscc_ci` faylının məzmunu (PRIVATE açar, tam) |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan -t ed25519 <IP>` çıxışı |

CI açarı serverdə belə yazılıb (`/root/.ssh/authorized_keys`):
```
restrict,command="/opt/muslimscc/ci-gate.sh" ssh-ed25519 AAAA... muslimscc-ci
```
Bu açarla yalnız `upload`, `reuse`, `deploy`, `status` mümkündür — shell yoxdur. Açar oğurlansa: həmin sətri sil.

## Əl ilə əməliyyatlar (serverdə, root)

```sh
cd /opt/muslimscc
cat .current_tag                          # canlı versiya
docker compose ps                         # vəziyyət + healthcheck
docker compose logs -f --tail=100 api     # API logları (azan push-ları: "Push fajr ...")
docker compose logs -f --tail=100 web     # nginx logları
./deploy.sh --rollback                    # əvvəlki versiyaya qayıt
TAG=$(cat .current_tag) docker compose restart api   # ~5 san API kəsintisi (sayt işləyir)
```

### Sirri dəyişmək (məs. OpenRouter açarı)
```sh
nano /opt/muslimscc/api.env               # dəyəri tək dırnaq içində saxla: KEY='...'
TAG=$(cat .current_tag) docker compose up -d api
```

### SSL
Sertifikat Let's Encrypt-dəndir, certbot (host-da) özü yeniləyir; yeni sertifikatı
`/etc/letsencrypt/renewal-hooks/deploy/muslimscc.sh` (`infra/certbot-deploy-hook.sh`)
`certs/`-ə köçürüb nginx-i kəsintisiz yenidən yükləyir. Yoxlama: `certbot renew --dry-run`.

### Cloudflare IP-ləri
nginx yalnız Cloudflare-dən gələn bağlantıları qəbul edir (`infra/nginx/cloudflare.conf`).
Cloudflare siyahını dəyişəndə: `sh infra/nginx/gen-cloudflare.sh` (həm `cloudflare.conf`, həm
`infra/edge/cloudflare-allow.conf`), commit, push; edge üçün əlavə: faylı serverə `scp` + HUP (yuxarıda).

## Təhlükəsizlik (2026-10-27 vəziyyəti)

- SSH: yalnız açarla (parol söndürülüb), `MaxAuthTries 3`, X11 bağlı, fail2ban aktiv
- UFW: yalnız 22, 80, 443. **Diqqət:** Docker açdığı portları UFW-dən yan keçir —
  compose-da yalnız `web` port açır, həm də yalnız IPv4-də.
- Konteynerlər: root-suz, `read_only`, `cap_drop: ALL`, `no-new-privileges`, yaddaş limiti
- nginx: HSTS, təhlükəsizlik başlıqları, gizli fayllar (`.env`, `.git`) 404, birbaşa IP ilə gələnlər kəsilir
- CSP: hələlik **Report-Only** (`security-headers.conf`) — heç nə bloklanmır, pozuntular `/api/csp-report`-a gəlir.
  Baxış: `GET /api/admin/csp` (admin) və ya `docker compose logs api | grep "[csp]"`. Bir neçə gün təmizdirsə,
  başlıq adını `Content-Security-Policy` et. Tema skripti dəyişsə hash-i yenilə (`scripts/check-csp.mjs` CI-da tutur).
- Avtomatik təhlükəsizlik yeniləmələri (unattended-upgrades) aktivdir

## Monitorinq

- **Brauzer xətaları**: `src/utils/errorReport.js` (yalnız muslims.cc-də) → `POST /api/client-error` → `server/clientErrors.js`
  (yaddaşda birləşdirilir, IP/cookie/sorğu saxlanmır). Baxış: `GET /api/admin/errors` (admin) və ya
  `docker compose logs api | grep "[client-error]"`.
- **İşləmə vaxtı**: `.github/workflows/uptime.yml` hər 10 dəqiqədə ana səhifəni və `/api/health`-i yoxlayır;
  alınmasa `uptime` etiketli issue açır (GitHub bildirişi gəlir), bərpa olunanda bağlayır.

## Lokal yoxlama

```sh
docker build -t muslimscc-api:dev server/
docker build -f infra/web.Dockerfile -t muslimscc-web:dev .
```
