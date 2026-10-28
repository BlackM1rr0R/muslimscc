# Muslims.cc — server və deploy

## Quruluş

```
İnternet ──► Cloudflare ──► server :80/:443 ──► [web] nginx (root-suz) ──► /api/ ──► [api] Node
                                     ▲                                              │
                     yalnız Cloudflare IP-ləri qəbul edilir              Firebase, OpenRouter, aladhan
```

| Konteyner | Image | Nə edir |
|---|---|---|
| `web` | `infra/web.Dockerfile` | Sayt (Vite build + prerender) + `/api/` proksi. Yeganə açıq xidmət. |
| `api` | `server/Dockerfile` | `server/server.js`: AI köməkçi, admin push, **azan push planlayıcısı** (hər abunəçiyə öz şəhərinin vaxtında). Port açmır. |

Serverdə hər şey `/opt/muslimscc/`-dədir:

| Fayl | Nədir |
|---|---|
| `docker-compose.yml` | `infra/docker-compose.yml`-in surəti |
| `api.env` | API sirləri (600, root). **Git-də yoxdur.** |
| `certs/` | Let's Encrypt sertifikatının root-suz nginx üçün surəti (hook yeniləyir) |
| `deploy.sh`, `ci-gate.sh` | `infra/`-dan |
| `releases/<TAG>/` | CI-ın yüklədiyi image-lər (son 3 versiya saxlanılır) |
| `.current_tag`, `.previous_tag` | canlı və əvvəlki versiya |

## Deploy — avtomatik

`main`-ə push → GitHub Actions (`.github/workflows/ci.yml`):

1. yoxlamalar (dil təmizliyi, konfiq sinxronluğu), unit testlər, build
2. e2e (Playwright, kompüter + telefon)
3. Docker image-ləri (nginx konfiqi image-in içində `nginx -t` ilə yoxlanılır)
4. serverə yükləmə → `deploy.sh <TAG>`: sağlamlıq yoxlaması + tüstü testi; **alınmasa avtomatik əvvəlki versiyaya qayıdır**
5. Cloudflare üzərindən canlı yoxlama

Testlərdən biri yıxılsa, deploy olmur.

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
Bu açarla yalnız `upload`, `deploy`, `status` mümkündür — shell yoxdur. Açar oğurlansa: həmin sətri sil.

## Əl ilə əməliyyatlar (serverdə, root)

```sh
cd /opt/muslimscc
cat .current_tag                          # canlı versiya
docker compose ps                         # vəziyyət + healthcheck
docker compose logs -f --tail=100 api     # API logları (azan push-ları: "Push fajr ...")
docker compose logs -f --tail=100 web     # nginx logları
./deploy.sh --rollback                    # əvvəlki versiyaya qayıt
TAG=$(cat .current_tag) docker compose restart api
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
Cloudflare siyahını dəyişəndə: `sh infra/nginx/gen-cloudflare.sh`, commit, push.

## Təhlükəsizlik (2026-10-27 vəziyyəti)

- SSH: yalnız açarla (parol söndürülüb), `MaxAuthTries 3`, X11 bağlı, fail2ban aktiv
- UFW: yalnız 22, 80, 443. **Diqqət:** Docker açdığı portları UFW-dən yan keçir —
  compose-da yalnız `web` port açır, həm də yalnız IPv4-də.
- Konteynerlər: root-suz, `read_only`, `cap_drop: ALL`, `no-new-privileges`, yaddaş limiti
- nginx: HSTS, təhlükəsizlik başlıqları, gizli fayllar (`.env`, `.git`) 404, birbaşa IP ilə gələnlər kəsilir
- Avtomatik təhlükəsizlik yeniləmələri (unattended-upgrades) aktivdir

## Lokal yoxlama

```sh
docker build -t muslimscc-api:dev server/
docker build -f infra/web.Dockerfile -t muslimscc-web:dev .
```
