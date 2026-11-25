# Server əməliyyatları (məzmun, admin girişi, push, ehtiyat nüsxə)

Sayt tam öz serverimizdə işləyir — xarici backend xidməti yoxdur.

| Hissə | Necə |
|---|---|
| Məzmun | SQLite (`node:sqlite`) — `/data/muslims.db`, `server/db.js` + `server/content.js` |
| Admin girişi | E-poçt + şifrə (scrypt), HttpOnly cookie sessiyası — `server/auth.js` |
| Push | Standart Web Push (VAPID, `web-push` paketi) — `server/push.js` |

## Arxitektura

```
brauzer ──► nginx (web) ──/api/──► api (Node, server.js)
                                     ├─ /api/content, /api/singletons   (ictimai oxuma)
                                     ├─ /api/admin/*                    (sessiya cookie-si)
                                     ├─ /api/push/*                     (Web Push abunəliyi)
                                     ├─ planlayıcılar: azan, günün ayəsi, "Qıldınızmı?"
                                     └─ SQLite: /data/muslims.db (named volume api-data, WAL)
```

**Cədvəllər** (`server/db.js`, miqrasiya versiyası `PRAGMA user_version`):

| Cədvəl | Nədir |
|---|---|
| `docs(collection, id, data JSON, created_at, updated_at)` | Məzmun sənədləri: `videos, books, hadiths, duas, quotes, announcements, events, places`; tək sənədlər `collection='singletons'`, `id=daily/hero/settings` |
| `push_subs(endpoint, keys_p256dh, keys_auth, lang, loc, prefs, user_agent, …)` | Web Push abunəlikləri. `prefs = { azan, checkin, daily:{ ayah, hour } }` |
| `admins(id, email, pass_hash, …)` | Admin hesabları (şifrə yalnız scrypt hash kimi) |
| `sessions(id_hash, admin_id, expires_at, …)` | Sessiyalar — tokenin özü YOX, yalnız SHA-256-sı |
| `notification_history` | Admin panelindən göndərilmiş bildirişlər |
| `sync_blobs(id, blob, size, version, …)` | Cihazlar arası sinxronizasiyanın ŞİFRƏLİ blokları (miqrasiya 3). İstifadəçi məlumatı, IP yoxdur |

Vaxtlar (`createdAt`, `updatedAt`) **millisaniyədir**. Klient kodu bunu artıq qəbul edir (`AnnouncementsPage → toMillis`, `AnnouncementSection → new Date(ms)`).

## API

| Metod | Yol | İcazə | Qeyd |
|---|---|---|---|
| GET | `/api/health` | hamı | DB-ni də yoxlayır (`503` — DB yoxdur) |
| GET | `/api/content/version` | hamı | `{ version, collections:{ad: ms} }` — ucuz "dəyişibmi?" yoxlaması |
| GET | `/api/content/:collection` | hamı | `[{ id, ...data }]`, `createdAt` azalan (klientin `orderBy('createdAt','desc')` sorğusu kimi). ETag → `304` |
| GET | `/api/content/:collection/:id` | hamı | `{ id, ...data }` / `404` |
| GET | `/api/singletons/:id` | hamı | `daily`, `hero`, `settings` |
| POST | `/api/admin/login` | — | **Yalnız break-glass** (`ADMIN_LEGACY_LOGIN=1`; yoxsa 403 `legacy_login_disabled`, köhnə cookie nəzərə alınmır — panel sayt hesabı ilə, [ADMIN-SECURITY.md](ADMIN-SECURITY.md)). `{ email, password }` → cookie `__Host-mcc_admin` (HttpOnly, Secure, SameSite=Strict, 30 gün). Limit: IP 10, e-poçt 5 / 15 dəq |
| POST | `/api/admin/logout` | cookie | |
| GET | `/api/admin/me` | admin (müvəqqəti şifrə ilə də) | `{ email, via:'session', mustChangePassword, role }` |
| POST | `/api/admin/password` | sessiya (müvəqqəti şifrə ilə də) | `{ currentPassword, newPassword≥12 }` → `{ ok }`; xəta `code`: `wrong`/`weak`/`same`; uğurlu olanda **digər** sessiyalar ləğv olunur, cari qalır |
| POST | `/api/admin/content/:collection` | admin | `addDoc` → `201 { id, ...data }` (`createdAt` serverdən) |
| POST | `/api/admin/content/:collection/batch` | admin | `{ items:[…] }` (≤200) — toplu əlavə (SeedManager, ehtiyatdan bərpa) |
| PUT | `/api/admin/content/:collection/:id` | admin | `setDoc` — tam əvəz, `createdAt` qorunur |
| PATCH | `/api/admin/content/:collection/:id` | admin | `updateDoc` — üst səviyyə birləşmə, `404` yoxdursa |
| DELETE | `/api/admin/content/:collection/:id` | admin | |
| PUT | `/api/admin/singletons/:id` | admin | `setSingleDoc` |
| GET | `/api/admin/subscribers` | admin | `{ count, webpush, webpushNew, webpushLangs }` |
| GET | `/api/admin/notification-history` | admin | son 200 |
| POST | `/api/send-notification` | admin | `{ title≤200, body≤1000, url:'/…', priority }` → Web Push abunəçilərinə; tarixçəyə yazır (`historyId`) |
| GET | `/api/push/vapid-public-key` | hamı | `{ key }` |
| POST | `/api/push/subscribe` | hamı | `{ subscription: PushSubscription.toJSON(), lang, loc, prefs, userAgent }` |
| PATCH | `/api/push/subscription` | endpoint-i bilən | `{ endpoint, lang?, loc?, prefs? }` (prefs üst səviyyədə birləşir) |
| POST | `/api/push/unsubscribe` | endpoint-i bilən | `{ endpoint }` |
| GET | `/api/sync/:id` | id-ni bilən | Cihazlar arası sinxronizasiya (`server/sync.js`): `{ blob, version, updatedAt }` / `404`. `id` — bərpa kodundan brauzerdə HKDF ilə alınan 64 hex |
| PUT | `/api/sync/:id` | id-ni bilən | `{ blob (base64url, ≤900 KB), version }` → `{ version, updatedAt }`; versiya uyğun deyilsə `409` (başqa cihaz yeniləyib). Blok brauzerdə AES-256-GCM ilə şifrələnib — server oxuya bilmir. 400 gün toxunulmayan silinir |
| DELETE | `/api/sync/:id` | id-ni bilən | Serverdəki şifrəli nüsxəni silir |

**Müvəqqəti şifrə:** `admin-user.js create` və `set-password` ilə qoyulan şifrə müvəqqətidir (`admins.must_change=1`, DB miqrasiyası 2). Belə sessiya yalnız `/me`, `/password`, `/logout`-a çata bilər; digər admin API-ləri `403 { code:'must_change' }`. Panel girişdən sonra yalnız "Şifrəni dəyiş" formasını göstərir. Müvəqqəti olmasın deyə: `--permanent`.

**Admin sorğuları (cookie ilə)** — vəziyyət dəyişən hər sorğuda (`POST/PUT/PATCH/DELETE`, `login` daxil) `X-Requested-With: fetch` başlığı **mütləqdir**; `Origin` varsa icazəli siyahıda olmalıdır (CSRF). `GET` üçün lazım deyil.

**Validasiya:** kolleksiya adı yalnız siyahıdan; ID `[A-Za-z0-9_-]{1,128}`; gövdə JSON obyekti, ≤256 KB, dərinlik ≤12, `__proto__`/`constructor` qadağandır; `id/createdAt/updatedAt` klientdən qəbul edilmir. Push endpoint-i yalnız `https` və icazəli xidmətlər: `fcm.googleapis.com`, `updates.push.services.mozilla.com`, `*.push.apple.com`, `*.notify.windows.com` (əlavə: env `PUSH_EXTRA_HOSTS`); `p256dh` 65 bayt (0x04…), `auth` 16 bayt; `loc/prefs` — tip və sahə yoxlaması (`server/push.js`).

**Push payload** (`public/sw.js → parsePush` dəyişmədən oxuyur — test: `tests/unit/server-push.test.js` funksiyanı sw.js-in özündən götürür):

```json
{ "notification": { "title": "…", "body": "…", "tag": "azan-dhuhr", "icon": "/android-chrome-192x192.png?v=2", "badge": "/badge-96x96.png?v=2" },
  "data": { "url": "/prayer", "tag": "azan-dhuhr", "...": "checkin üçün kind/prayer/date/actPrayed/actLater/doneTitle" } }
```

Başlıqlar: azan — `Urgency: high`, `TTL 1200`; günün ayəsi — `TTL 21600`; "Qıldınızmı?" — `TTL 10800`. Push xidməti `404/410` qaytarsa abunəlik silinir.


## Əməliyyatlar

> Bütün əmrlər serverdə, root, `cd /opt/muslimscc`. Heç bir sirr ekrana çıxmır.

**Infra faylları:** CI yalnız image-ləri göndərir; `docker-compose.yml`, `deploy.sh`, `backup.sh` serverdə əl ilə yenilənir (`scp infra/… root@<IP>:/opt/muslimscc/`).

### VAPID açarları (bir dəfə)

```sh
mkdir -m 700 /root/vapid && chown 1000:1000 /root/vapid
docker run --rm --network none -u node -v /root/vapid:/out --entrypoint node \
  muslimscc-api:$(cat .current_tag) scripts/gen-vapid.js /out/vapid.key
```
Ekrana yalnız **açıq** açar çıxır (sirr deyil). `api.env`-ə əlavə et (nano ilə, dəyərlər tək dırnaqda):

```
VAPID_PUBLIC_KEY='<ekrandakı açıq açar>'
VAPID_PRIVATE_KEY='<vapid.key faylının məzmunu — nano-da: Ctrl+R /root/vapid/vapid.key>'
VAPID_SUBJECT='mailto:<sahibin e-poçtu>'
```
sonra `shred -u /root/vapid/vapid.key && rmdir /root/vapid` və `TAG=$(cat .current_tag) docker compose up -d api`.
Yoxla: `curl -s https://muslims.cc/api/push/vapid-public-key` → `{"key":"B…"}`.
**VAPID açarını sonradan dəyişmə** — bütün Web Push abunəlikləri etibarsız olur.

### Admin hesabı

```sh
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js create <admin e-poçtu>
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js list
```
Digər: `set-password <email>` (bütün sessiyaları ləğv edir), `delete <email>`. Parol menecerindən: `… | docker compose exec -T api node scripts/admin-user.js set-password <email> --password-stdin`. Şifrə heç vaxt arqumentdə verilmir.

### Ehtiyat nüsxə — systemd timer

```sh
systemctl daemon-reload
systemctl enable --now muslimscc-backup.timer
systemctl start muslimscc-backup.service && journalctl -u muslimscc-backup -n 5   # bir dəfə əl ilə sına
ls -l /opt/muslimscc/backups/
```
Hər gün 02:30 UTC: `/opt/muslimscc/backups/muslims-YYYYMMDD.db.gz` (600), son 14 gün. Cron istəyirsənsə: `30 2 * * * /opt/muslimscc/backup.sh`.

**Bərpa yoxlaması (ayda bir):** `/opt/muslimscc/backup.sh --verify [arxiv]` — son (və ya verilən) arxivi `/tmp`-də
müvəqqəti açır, canlı api image-i ilə (şəbəkəsiz, read-only konteyner) `integrity_check`, sxem versiyası və
tətbiqin öz `openDb`-si ilə yoxlayır, sonra surəti silir. Canlı bazaya və konteynerlərə toxunmur.
2026-11-25: 25.11 və 10.11 arxivləri bu yolla yoxlanıb — ikisi də sağlam.

**Diqqət:** yerli nüsxələr serverlə EYNİ diskdədir — disk / server itsə, nüsxələr də itir. Aşağıdakı off-site surəti qurun.

### Serverdən kənar nüsxə (off-site, şifrəli) — sahib açır

`backup.sh` hər gecə yerli arxivi **age** ilə şifrələyib **rclone** ilə bucket-ə yükləyə bilər. Susmaya görə
SÖNÜLÜDÜR (`/opt/muslimscc/offsite.env` yoxdursa heç nə etmir). Serverdə yalnız **açıq** açar olur — server
(və ya oğurlanmış bucket açarı) köhnə nüsxələri aça bilmir; açmaq üçün gizli açar sahibdədir.

1. **Şifrə açarı — sahibin kompüterində** (serverdə YOX): `age-keygen -o muslimscc-backup.key`. Faylı parol
   menecerində + ikinci yerdə (USB / kağız) saxlayın — itərsə nüsxələr açılmır. Çıxışdakı `age1…` açıq açardır.
   İki açar (`age1… age1…`) da vermək olar — biri ehtiyat üçün.
2. **Bucket** — Cloudflare R2 (hesab artıq var; 10 GB pulsuz, nüsxə gündə ~150 KB): R2 → bucket
   `muslimscc-backups` → *Settings → Object lifecycle rules*: 90 gündən köhnəni sil; istəyə görə *Bucket lock*
   (məs. 30 gün — server ələ keçsə də nüsxələr silinə bilməz). *Manage R2 API tokens* → yalnız bu bucket,
   "Object Read & Write". (Alternativ: Backblaze B2 — `deleteFiles` hüququ OLMAYAN application key + lifecycle.)
3. **Serverdə** (root):
   ```sh
   apt-get install -y age rclone
   install -d -m 700 /root/.config/rclone
   install -m 600 /dev/null /root/.config/rclone/rclone.conf && nano /root/.config/rclone/rclone.conf
   install -m 600 /dev/null /opt/muslimscc/offsite.env && nano /opt/muslimscc/offsite.env
   ```
   `rclone.conf` (açarlar yalnız bu faylda — əmr sətrinə / tarixçəyə düşməsin):
   ```
   [offsite]
   type = s3
   provider = Cloudflare
   access_key_id = <R2 token: Access Key ID>
   secret_access_key = <R2 token: Secret Access Key>
   endpoint = https://<account_id>.r2.cloudflarestorage.com
   region = auto
   no_check_bucket = true
   ```
   `offsite.env` (fayl icra olunmur, yalnız bu açarlar oxunur və yoxlanılır; `export` yazmayın):
   ```
   OFFSITE_ENABLED=1
   OFFSITE_REMOTE='offsite:muslimscc-backups/db'
   OFFSITE_AGE_RECIPIENTS='age1…'
   OFFSITE_PRUNE_DAYS=
   ```
   `OFFSITE_PRUNE_DAYS` boş qalsın (silməni bucket lifecycle edir); rəqəm (≥ 7) yazılsa, skript özü silir.
4. Sına: `systemctl start muslimscc-backup.service && journalctl -u muslimscc-backup -n 20` → `off-site OK: …`.
   Alınmasa yerli nüsxə yenə yazılır, vahid `failed` olur (`systemctl --failed`), səbəb jurnalda.

**Off-site-dan bərpa** (sahibin kompüterində — gizli açar orada):
```sh
rclone copyto offsite:muslimscc-backups/db/muslims-YYYYMMDD-HHMMSS.db.gz.age ./x.age
age -d -i muslimscc-backup.key -o muslims-YYYYMMDD.db.gz x.age
scp muslims-YYYYMMDD.db.gz root@<server>:/opt/muslimscc/backups/    # sonra aşağıdakı "Ehtiyat nüsxədən bərpa"
```

### Volume icazəsi
Volume ilk dəfə **yeni** image ilə yarananda `/data` sahibi `node` olur. Səhvən köhnə image ilə yaranıbsa (log: `verilənlər bazası açılmadı … readonly/EACCES`):
```sh
docker run --rm -v muslimscc_api-data:/data alpine chown 1000:1000 /data
```

### Ehtiyat nüsxədən bərpa
```sh
cd /opt/muslimscc && export TAG=$(cat .current_tag) && umask 077
./backup.sh --verify backups/muslims-YYYYMMDD.db.gz          # əvvəl arxivi yoxla (canlıya toxunmur)
gunzip -c backups/muslims-YYYYMMDD.db.gz > /root/restore.db
docker compose stop api                                       # sayt açıq qalır, API bu müddətdə 502
# api image-i (alpine çəkməyə ehtiyac yoxdur); indiki baza muslims.db.pre-restore kimi saxlanılır
docker run --rm --user 0 --network none -v muslimscc_api-data:/data -v /root/restore.db:/restore.db:ro \
  --entrypoint sh "muslimscc-api:$TAG" -c 'cp -a /data/muslims.db /data/muslims.db.pre-restore; \
  rm -f /data/muslims.db-wal /data/muslims.db-shm && cp /restore.db /data/muslims.db && chown 1000:1000 /data/muslims.db'
docker compose start api && shred -u /root/restore.db
```
Hər şey qaydasındadırsa, sonra `muslims.db.pre-restore`-u silin (volume-da qalır). `docker compose up -d` (seçimsiz) İŞLƏTMƏYİN.
