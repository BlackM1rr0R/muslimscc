# İstifadəçi hesabları və rollar (`server/users.js`)

Saytın **istifadəçi** hesabları — admin panelindən **tam ayrıdır** (ayrı cədvəllər, ayrı cookie, ayrı giriş).
Admin paneli öz girişini saxlayır (`server/auth.js`, [ADMIN-SECURITY.md](ADMIN-SECURITY.md), [SERVER-OPS.md](SERVER-OPS.md)).

| | Admin paneli | İstifadəçi hesabı |
|---|---|---|
| Cədvəl | `admins`, `sessions` (+ `admin_roles`) | `users`, `user_sessions`, `user_passkeys`, `user_oauth`, `user_tokens` |
| Cookie | `__Host-mcc_admin` | `__Host-mcc_user` |
| Giriş | e-poçt + şifrə (yalnız skriptlə yaradılır) | e-poçt + şifrə, passkey, Google |
| Rol | `editor` / `admin` / `superadmin` | `user` / `mosque_rep` / `editor` / `admin` / `superadmin` |

## Arxitektura

- **Fayllar:** `server/users.js` (cədvəllər, sessiya, endpoint-lər, rol qaydaları, Google tokeni yoxlaması),
  `server/mailer.js` (Resend HTTP API, 5 dildə şablon), `server/auth.js`-dən köməkçilər (scrypt, CSRF, limit).
- **Cədvəllər MİQRASİYASIZ** yaradılır (`CREATE TABLE IF NOT EXISTS`, `PRAGMA user_version` dəyişmir) —
  köhnə versiyaya geri qayıtmaq (deploy.sh rollback) pozulmur (2026-11-04 dərsi). Köhnə kod bu cədvəllərə toxunmur.
- **Sessiya:** təsadüfi 32 bayt token → cookie `__Host-mcc_user; HttpOnly; Secure; SameSite=Strict; Path=/`.
  DB-də yalnız SHA-256. 30 gün, **sürüşən** (aktiv istifadədə gündə bir dəfə uzadılır, yeni `Set-Cookie` gəlir).
  Bir istifadəçidə ən çox 50 sessiya (köhnələr silinir).
- **CSRF:** vəziyyət dəyişən hər sorğuda `X-Requested-With` başlığı olmalı və `Origin` (varsa) icazəli siyahıda
  (`ALLOWED_ORIGINS`) olmalıdır — admin girişi ilə eyni qayda.
- **Məxfilik:** IP saxlanmır (limitlər yaddaşdadır, açar — prosesə məxsus duzla HMAC). Tam user-agent saxlanmır,
  yalnız "Chrome · Android" kimi etiket. Məktub keçidlərində token **URL fraqmentindədir** (`#token=…`) —
  nginx loguna və Referer-ə düşmür.
- **Hesabın varlığı açılmır:** `login` səhv şifrədə / naməlum e-poçtda / bloklanmış hesabda eyni `401`;
  naməlum e-poçtda da scrypt işləyir (vaxt eyni). `forgot` həmişə `200`. `register` mövcud e-poçtda
  `202 { checkEmail: true }` qaytarır (cookie yox) və sahibinə "hesabınız artıq var" məktubu göndərir.
- **Limitlər** (hamısı yaddaşda): ümumi `/api/auth/*` — IP üzrə dəqiqədə 60 (server.js); login — IP üzrə 20, e-poçt
  üzrə 5 uğursuz / 15 dəq; register — IP üzrə 10 / saat; forgot — IP üzrə 10 / saat, e-poçt üzrə 3 / saat (artığı
  səssizcə atılır, cavab yenə 200); token (verify/reset) — 20 səhv / 15 dəq; Google — 20 səhv / 15 dəq; passkey —
  60 options + 20 səhv / 15 dəq; şifrə dəyişmə/silmə — istifadəçi üzrə 5 səhv / 15 dəq; verify məktubunu təkrar — 3 / saat.
  Admin endpoint-ləri mövcud `/api/admin` limitinin (dəqiqədə 30) altındadır.
- **Passkey challenge-ləri** yaddaşdadır (5 dəq, birdəfəlik, `challengeId` ilə). API bir konteynerdir — kifayətdir;
  bir neçə replika olsa, paylaşılan yaddaş lazım olacaq.

## Rollar

`user` < `mosque_rep` < `editor` < `admin` < `superadmin`

- **superadmin HTTP ilə heç vaxt verilmir və alınmır** — yalnız serverdə skriptlə.
- `admin` rolunu yalnız **superadmin** verir/alır. `admin` paneli hesabı `editor` / `mosque_rep` / `user` verə bilər.
- **Heç kim öz rolunu dəyişə bilməz** (admin panelinin e-poçtu istifadəçinin e-poçtu ilə eynidirsə — 403 `self`).
- `admin` istifadəçini yalnız superadmin bloklaya bilər; superadmin-i heç kim HTTP ilə bloklaya bilməz.
- Hər dəyişiklik (rol, blok, blokun açılması, skriptlə verilən rol) `role_audit`-ə yazılır.
- Admin panelinin hesabları üçün rol `admin_roles`-dadır; sətri olmayan admin = **`admin`**.
  İstifadəçi idarəsi (`/api/admin/users*`, `/api/admin/role-audit`) — yalnız `admin` və `superadmin`.
  Sessiya cookie-si olmadan bu endpoint-lər **işləmir** (403 `session_required`).
- `requireUser(minRole)` — gələcək xüsusiyyətlər üçün middleware (`usersRouter.requireUser('mosque_rep')`).
  Rol hər sorğuda DB-dən oxunur — dəyişiklik dərhal təsir edir.

### Özünüzü superadmin etmək

```sh
cd /opt/muslimscc
# admin PANELİ hesabınız (admins cədvəli) — superadmin | admin | editor
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js set-role abdllyevv@gmail.com superadmin
# yoxlama — siyahıda rol mötərizədə görünür
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js list
# saytın İSTİFADƏÇİ hesabının rolu (users cədvəli) — lazım olsa
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js user-role someone@example.com mosque_rep --mosque=baku-taza-pir
```

Sonra paneldə `GET /api/admin/me` cavabında `role: "superadmin"` görünür.

## Endpoint-lər

Bütün cavablar JSON, `Cache-Control: no-store`. Səhv formatı: `{ error: "…", code: "…" }`.
**Klient vəziyyət dəyişən hər sorğuda göndərməlidir:** `X-Requested-With: fetch` (istənilən dəyər),
`Content-Type: application/json`, `credentials: 'same-origin'` (cookie avtomatik gedir; JS onu görmür).

`User` obyekti (`/me` və bir çox cavabda `user`):

```json
{ "id": 12, "email": "a@x.az", "emailVerified": false, "displayName": "Əli", "role": "user", "mosqueId": null,
  "hasPassword": true, "passkeys": [{ "id": "b64url", "name": "Chrome · Android", "createdAt": 0, "lastUsedAt": null }],
  "providers": ["google"] }
```

| Metod, yol | Gövdə | Uğurlu cavab | Səhvlər (code) |
|---|---|---|---|
| `POST /api/auth/register` | `{ email, password, displayName?, lang? }` | `201 { ok, user, verificationSent }` + cookie; mövcud e-poçtda `202 { ok, checkEmail: true }` | 400 `bad_request` / `weak_password`, 429 |
| `POST /api/auth/login` | `{ email, password }` | `200 { ok, user }` + cookie | 401 `invalid_credentials`, 429 `rate_limited` (+ `Retry-After`) |
| `POST /api/auth/logout` | — | `200 { ok }` (cookie silinir) | |
| `GET /api/auth/me` | — | `200 User` | 401 `unauthenticated` |
| `POST /api/auth/verify` | `{ token }` | `200 { ok }` | 400 `invalid_token` |
| `POST /api/auth/verify/resend` | `{ lang? }` (girişli) | `200 { ok }` | 429 |
| `POST /api/auth/forgot` | `{ email, lang? }` | **həmişə** `200 { ok }` | 400 (yararsız e-poçt formatı), 429 (IP) |
| `POST /api/auth/reset` | `{ token, password }` | `200 { ok }` — bütün sessiyalar ləğv, e-poçt təsdiqlənir; sonra login | 400 `invalid_token` / `weak_password` |
| `POST /api/auth/password` | `{ current, next }` (şifrəsiz hesabda `current` lazım deyil) | `200 { ok }` — digər sessiyalar ləğv | 400 `wrong_password` / `same_password` / `weak_password` |
| `PATCH /api/auth/profile` | `{ displayName }` (≤ 60 simvol) | `200 User` | 400 |
| `GET /api/auth/sessions` | — | `200 { sessions: [{ id, label, createdAt, lastSeenAt, current }] }` | |
| `POST /api/auth/sessions/revoke` | `{ all: true }` (cari qalır) və ya `{ id }` | `200 { ok, revoked }` | 404 |
| `POST /api/auth/delete` | `{ password }` və ya şifrəsiz hesabda `{ confirm: "DELETE" }` | `200 { ok }` — hər şey silinir (CASCADE) | 400 `wrong_password` / `confirm_required` |
| `POST /api/auth/passkey/register/options` | — (girişli) | `200 { challengeId, options }` | 400 `too_many_passkeys` (20) |
| `POST /api/auth/passkey/register/verify` | `{ challengeId, response, name? }` | `200 { ok, passkeys }` | 400 `passkey_failed`, 409 `passkey_exists` |
| `POST /api/auth/passkey/login/options` | — | `200 { challengeId, options }` (usernameless) | 429 |
| `POST /api/auth/passkey/login/verify` | `{ challengeId, response }` | `200 { ok, user }` + cookie | 401 `passkey_failed` |
| `POST /api/auth/passkey/remove` | `{ id }` | `200 { ok, passkeys }` | 400 `last_method`, 404 |
| `POST /api/auth/google` | `{ credential }` (GIS ID tokeni) | `200/201 { ok, created, user }` + cookie | 401 `google_invalid`, 409 `link_requires_verification`, 503 `google_disabled` / `google_unavailable` |
| `GET /api/admin/users?q=&page=` | admin sessiyası | `{ users: [{ id, email, emailVerified, displayName, role, mosqueId, disabled, createdAt, lastLoginAt }], page, pageSize: 50, total }` | 403 `forbidden` / `session_required` |
| `POST /api/admin/users/:id/role` | `{ role, mosqueId? }` | `{ ok, user }` | 403 `superadmin_required` / `script_only` / `self` / `forbidden`, 400 `bad_role` |
| `POST /api/admin/users/:id/disable` | `{ disabled: true\|false }` | `{ ok, user }` — bloklananda sessiyalar ləğv | 403 (yuxarıdakı kimi) |
| `GET /api/admin/role-audit?page=` | admin sessiyası | `{ entries: [{ id, actorKind, actorId, actorEmail, targetKind, targetId, targetEmail, action, oldRole, newRole, at }], page, pageSize }` | |
| `GET /api/admin/me` | (mövcud) | əlavə sahə: `role` | |

**Passkey klientdə:** `@simplewebauthn/browser` → `startRegistration({ optionsJSON: options })` /
`startAuthentication({ optionsJSON: options })`, nəticəni `{ challengeId, response }` kimi geri göndərin.
User verification **tələb olunur**, residentKey **required** (usernameless giriş üçün), attestation `none`.

**E-poçt keçidləri:** `${PUBLIC_ORIGIN}/account/verify#token=…`, `${PUBLIC_ORIGIN}/account/reset#token=…`,
mövcud hesab xəbərdarlığı → `${PUBLIC_ORIGIN}/account`. Klient səhifəsi tokeni `location.hash`-dən oxuyub
POST etməli və sonra `history.replaceState` ilə hash-i silməlidir. Məktub dili: `lang` (az/en/ru/tr/ar; başqa dil → en).

**Google:** Google hesabı `user_oauth(google, sub)` ilə bağlanır. Bağlantı yoxdursa və eyni e-poçtla hesab varsa —
yalnız həmin hesabın e-poçtu **təsdiqlidirsə** bağlanır; təsdiqsizdirsə `409 link_requires_verification`
(qabaqcadan ələ keçirmə hücumu: kimsə başqasının e-poçtu ilə hesab açıb gözləyə bilər). İstifadəçi əvvəl
"şifrəni unutdum" ilə (bu, e-poçtu da təsdiqləyir) və ya verify keçidi ilə təsdiqləməli, sonra Google ilə girməlidir.

## Hesaba bağlı, uçdan-uca şifrəli sinxronizasiya (`server/syncKeys.js`, `src/utils/accountSync.js`)

Mövcud hesabsız sinxronizasiyanın (`server/sync.js`, `src/utils/userSync.js`) **üstündədir** — ikinci sistem yoxdur.
Kök sirr — bərpa kodu (brauzerdə yaradılır); blok əvvəlki kimi AES-GCM ilə şifrələnir. Hesab yalnız kodun
brauzerdə şifrələnmiş **qabını** saxlayır (`src/utils/syncWrap.js`):

- `password` — açar PBKDF2-SHA256(şifrə, 16 bayt duz, 600 000 dövr) ilə brauzerdə törədilir (giriş/qeydiyyat/şifrə
  dəyişmə formasında). Yeni cihazda şifrə ilə giriş → kod açılır → cihaz avtomatik qoşulur.
- `prf` — passkey-in WebAuthn PRF çıxışı → HKDF. PRF çıxışı serverə **göndərilmir** (`userAuth.takePrf`).
- Google / PRF-siz passkey — yeni cihazda bir dəfə bərpa kodu soruşulur (hesab səhifəsi + yumşaq bildiriş).
- Şifrə dəyişəndə kod yeni şifrə ilə yenidən qablanır; **şifrə bərpasında** server `password` qabını silir
  (köhnə şifrə ilə açılmır) — sonra bərpa kodu və ya kodu saxlayan cihaz lazımdır (o cihaz növbəti girişdə özü yenidən qablayır).
- Yeni cihazda yerli məlumat da varsa: ziddiyyətsiz açarlar birləşir; fərqli dəyərli açarlar varsa istifadəçi seçir
  (hesabdakı / bu cihazdakı) — heç nə səssizcə itmir (`src/utils/syncMerge.js`).
- Çıxışda (sinxronizasiya hesaba bağlıdırsa): "Bu cihazda məlumat qalsın?" — saxla (susmaya görə) / kodu unut / məlumatı da sil.
- Hesab silinəndə bağlı şifrəli blok da silinir (başqa hesaba da bağlı deyilsə).

**Təhdid modeli (vacib):** DB oğurlansa — qabı açmaq üçün şifrəni PBKDF2 (600k) + scrypt ilə sındırmaq lazımdır.
Amma server giriş zamanı şifrəni açıq görür (adi login) — **aktiv zərərli server** (kod dəyişdirilsə, şifrə loglansa)
`password` qabını aça bilər. PRF və bərpa kodu qabları bundan təsirlənmir. Tam qorunma üçün gələcəkdə login-də
klient tərəfli ayrılmış açar (məs. OPAQUE və ya `authKey`/`wrapKey` bölgüsü) lazımdır.

| Metod, yol | Gövdə | Cavab | Səhvlər |
|---|---|---|---|
| `GET /api/auth/sync-keys` | — | `{ keys: [{ kind, credId, salt, wrapped, createdAt }], syncId }` | 401 |
| `PUT /api/auth/sync-keys` | `{ kind: 'password'\|'prf', credId?, salt, wrapped }` (salt ≤ 200, wrapped 40–512 simvol base64url; gövdə ≤ 4 KB) | `{ ok }` | 400 `bad_request` / `no_password` / `too_many`, 404 (passkey sizin deyil), 429 |
| `DELETE /api/auth/sync-keys/:kind[/:credId]` | — | `{ ok, removed }` | 400, 429 |
| `POST /api/auth/sync-keys/check-password` | `{ password }` | `{ ok }` — qablamazdan əvvəl şifrə yoxlanır (səhv şifrə ilə qab yaranmasın) | 400 `wrong_password`, 429 (5 səhv / 15 dəq) |
| `GET /api/auth/sync-link` | — | `{ syncId, linkedAt }` | 401 |
| `PUT /api/auth/sync-link` | `{ syncId }` (64 hex) | `{ ok }` | 400, 429 |
| `DELETE /api/auth/sync-link` | — | `{ ok }` (blok qalır) | 429 |

Hamısı `requireUser` + CSRF (yuxarıdakı qayda). Yazılar: istifadəçi üzrə 30 / 15 dəq. `wrapped`/`salt` loga yazılmır.
Cədvəllər (`user_sync_keys`, `user_sync_link`) miqrasiyasızdır (`CREATE TABLE IF NOT EXISTS`, `user_version` dəyişmir);
modul `server.js`-in əvvəlcədən yükləmə siyahısındadır. Klientdə bu cihazın vəziyyəti — `localStorage.mcc_acct_sync`
(ehtiyat nüsxəyə düşmür), hesaba bağlılıq — `muslim_cc_sync.acct`.

## Şəxsi xatırlatmalar (`server/personal.js`) — SERVERDƏ OXUNA BİLƏN məlumat

Hesabın qalan məlumatı uçdan-uca şifrəlidir. Bu üç xüsusiyyətdə isə server məktubu **vaxtında özü** göndərməlidir,
ona görə tarix və mətn açıq saxlanır. Hər xüsusiyyətin ilk istifadəsində istifadəçi qeydi oxuyub qutunu işarələyir
("Vaxtında göndərə bilməyimiz üçün tarix və mətn serverimizdə şifrəsiz saxlanır. İstənilən vaxt silə bilərsiniz.")
— server `consent: true` olmadan ilk yazını qəbul etmir (`400 consent_required`), razılıq vaxtı `personal_prefs`-də qalır.

| Cədvəl | Saxlanan sahələr (minimum) |
|---|---|
| `personal_prefs` | `user_id`, `tz` (IANA, brauzerdən), `lang`, `consent_letters/loved/zakat` (vaxt), `loved_email` (0/1) |
| `personal_letters` | mətn (≤4000), `deliver_on` (YYYY-MM-DD), `kind` (date/year/ramadan/birthday/capsule — yalnız etiket), `tz`, `lang`, status, cəhd sayı, vaxtlar. **Ad günü saxlanmır** — klient növbəti tarixi hesablayıb göndərir; "gələn Ramazan" da klientdə (`utils/duaCapsule` → `nextRamadan`) |
| `personal_loved` | ad (≤80, istifadəçinin yazdığı kimi), yaxınlıq (≤40), vəfat tarixi (miladi), təqvim `g`/`h`, `friday`, qeyd (≤500), `next_on` |
| `personal_loved_shares` | paylaşma tokeninin **yalnız SHA-256**-ı (token 32 bayt = 256 bit, bir dəfə göstərilir) |
| `personal_loved_followers` | `owner_id` ↔ `follower_id` (izləyən qeydi görmür, redaktə edə bilmir) |
| `personal_zakat` | hövlün başlanğıcı, növbəti tarix; məbləğ + valyuta **yalnız** istifadəçi ayrıca istəsə |
| `personal_push_links` | push endpoint ↔ hesab (abunəliyin özü `push_subs`-dadır; hesabla əlaqə yalnız burada) |
| `personal_sent` | göndərilmiş təkrarlanan xatırlatmaların açarı (`a:<id>:<tarix>`, `f:<tarix>`, `z:pre|due:<tarix>`) — 400 gündən sonra silinir |
| `personal_secret` | abunəlikdən çıxma tokenlərinin HMAC sirri (env `PERSONAL_SECRET` yoxdursa bir dəfə təsadüfi yaradılır) |

Hamısı `users(id) ON DELETE CASCADE` — hesab silinəndə hər şey silinir. `DELETE /api/personal` — bu modulun bütün
məlumatı (hesab qalır). Cədvəllər miqrasiyasızdır (`CREATE TABLE IF NOT EXISTS`, `user_version` dəyişmir); modul
(`./personal`, `./hijri`) `server.js`-in əvvəlcədən yükləmə siyahısındadır. Limit: `/api/personal` — 60/dəq (IP).

| Endpoint | Qeyd |
|---|---|
| `GET/POST /api/personal/letters`, `PATCH/DELETE /api/personal/letters/:id` | ≤50 gözləyən; PATCH yalnız `pending` |
| `GET/POST /api/personal/loved`, `PATCH/DELETE /api/personal/loved/:id` | ≤50 nəfər |
| `POST/DELETE /api/personal/loved/share` | POST — yeni keçid (köhnə işləmir, izləyənlər qalır) → `{ token }`; DELETE — keçid ləğv + bütün izləyənlər çıxarılır |
| `DELETE /api/personal/loved/followers/:id` | sahib bir izləyəni çıxarır |
| `POST /api/personal/follow/preview`, `POST /api/personal/follow`, `DELETE /api/personal/follow/:ownerId` | token gövdədə (URL-də yox); ≤20 siyahı izləmək, ≤30 izləyən |
| `GET/PUT/DELETE /api/personal/zakat` | hövl = eyni hicri tarix gələn hicri il (Ümmül-Qura, `server/hijri.js`) |
| `GET/PATCH /api/personal/prefs` | `lovedEmail`, `tz`, `lang` |
| `POST /api/personal/push-link` `{ endpoint, on }`, `POST /api/personal/push-link/status` | yalnız `push_subs`-da olan endpoint; ≤10 cihaz |
| `DELETE /api/personal` | hamısını sil |
| `GET/POST /api/personal/unsubscribe?t=…` | **girişsiz**, HMAC imzalı token (`<userId>.<loved|zakat>.<sig>`); GET yalnız təsdiq səhifəsi (poçt skanerləri heç nəyi dəyişmir), POST çıxış; RFC 8058 `List-Unsubscribe-Post` dəstəklənir |

Hamısı (unsubscribe-dan başqa) `requireUser` + CSRF.

**Planlayıcı** (`server.js` → dəqiqədə bir `personalRouter.scheduler.tick()`): istifadəçinin saat qurşağında
həmin günün 09:00-ından sonra (gün bitənə qədər) göndərir. E-poçt əsas kanaldır (yalnız **təsdiqlənmiş** e-poçta —
mətn yad ünvana getməsin); push — hesaba bağlanmış cihazlara (Hesab səhifəsində "bu cihaza da göndər").
İkiqat göndəriş yoxdur: sətir göndərişdən ƏVVƏL atomik tutulur ("sending"); proses göndəriş ortasında ölsə,
həmin xatırlatma yenidən göndərilmir (15 dəq sonra "çatdırılıb" sayılır). Xəta → 5 cəhdə qədər, 5/15/45/135 dəq
fasilə ilə; sonra `failed` (məktub hesab səhifəsində oxunur). Mərhumun ildönümü: miladi (29 fevral → 28 fevral)
və ya hicri (ayın 30-u 29 günlük ayda → 29); sahib və izləyənlərin hər biri öz saat qurşağında. Cümə — həftədə bir
məktubda bütün adlar. Zəkat — 7 gün əvvəl və həmin gün, sonra avtomatik növbəti hicri ilə keçir.
Məktubdakı "Mərhum üçün dua" keçidi saytın mövcud mənbəli duasına aparır (`/learn/janazah#ls-prayer`, Müslim 963) —
yeni dini mətn yazılmayıb.

## Env dəyişənləri (`api.env`)

| Dəyişən | Nədir | Yoxdursa |
|---|---|---|
| `RESEND_API_KEY` | Resend API açarı (`re_…`) | Məktub getmir, bir dəfə loga xəbərdarlıq; hesablar `emailVerified=false` qalır, "şifrəni unutdum" işləmir |
| `GOOGLE_CLIENT_ID` | Google Cloud → OAuth client (Web) ID | `/api/auth/google` → `503 google_disabled` |
| `PUBLIC_ORIGIN` | Məktub keçidləri və WebAuthn origin | `https://muslims.cc` |
| `PERSONAL_SECRET` | Abunəlikdən çıxma tokenlərinin HMAC sirri (istəyə bağlı) | Bazada bir dəfə təsadüfi yaradılır (`personal_secret`) |
| `TOTP_KEY` | İki addımlı yoxlama sirlərinin şifrələmə açarı (32 bayt base64, istəyə bağlı) — [ACCOUNT-SECURITY.md](ACCOUNT-SECURITY.md) | Bazada bir dəfə təsadüfi yaradılır (`security_secret`) |
| `RP_ID` | WebAuthn RP ID | `PUBLIC_ORIGIN`-in hostu (`muslims.cc`) — `www.muslims.cc` də qəbul olunur (`ALLOWED_ORIGINS`-dən) |

Google Cloud Console → OAuth client → **Authorized JavaScript origins**: `https://muslims.cc`, `https://www.muslims.cc`
(lokal test üçün `http://localhost:5173`). Redirect URI lazım deyil (GIS popup/One Tap ID tokeni verir).
Klientdə client ID ictimaidir (`VITE_GOOGLE_CLIENT_ID` kimi `.env.public`-ə qoyula bilər).

## Resend DNS (domen: muslims.cc)

Resend → Domains → **Add domain** `muslims.cc` (region: eu-west-1 tövsiyə olunur). Resend dəqiq dəyərləri göstərir —
aşağıdakılar **nümunədir**, Cloudflare DNS-ə Resend-in verdiyi dəyərlərlə əlavə edin (hamısı "DNS only"):

| Tip | Ad | Dəyər | Qeyd |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEB…` (Resend verir) | DKIM |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (prioritet 10) | Bounce/MAIL FROM |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF (alt domen üçün — kök SPF-ə toxunmur) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:…` | Hələ yoxdursa; müşahidədən sonra `quarantine` |

Domen "Verified" olandan sonra API açarını yaradın (yalnız **Sending access**, yalnız `muslims.cc` domeni) və `api.env`-ə
`RESEND_API_KEY=…` yazın, `docker compose up -d api`.

## CSP / nginx (`infra/nginx/security-headers.conf` — əlavə olunub, `scripts/check-csp.mjs` yoxlayır)

Google Identity Services (`https://accounts.google.com/gsi/client`) istifadə olunarsa, CSP-yə əlavə lazımdır:

- `script-src … https://accounts.google.com/gsi/client`
- `frame-src … https://accounts.google.com/gsi/`
- `connect-src … https://accounts.google.com/gsi/`
- `style-src … https://accounts.google.com/gsi/style` (artıq `'unsafe-inline'` var, amma xarici stil faylı üçün lazımdır)

`Cross-Origin-Opener-Policy: same-origin-allow-popups` artıq qoyulub — GIS popup-u üçün uyğundur.
Passkey üçün CSP dəyişikliyi lazım deyil (`navigator.credentials` saytın özündədir); `Permissions-Policy`-də
`publickey-credentials-*` qadağan edilməyib (susmaya görə `self`). `/api/auth/*` artıq `location /api/`-dən keçir.

## D mərhələsi: birlikdə oxu, profillər, ailə dairəsi, "Məni yoxla"

### "Birlikdə Quran oxu" (`server/readTogether.js`, `/read-together`)
- Otağı yalnız **girişli** istifadəçi yaradır; qoşulmaq üçün hesab lazım deyil (yalnız ləqəb). Aparıcı vərəqi çevirir və
  oxunan ayəni işarələyir; "Hər kəs vərəq çevirə bilər" seçimi; "Aparıcını izlə" klientdə hər iştirakçının öz seçimidir.
- **Bazaya heç nə yazılmır** — otaqlar API prosesinin yaddaşındadır (bir konteyner); restart → otaqlar bağlanır.
  24 saat fəaliyyətsizlikdən sonra silinir. Hədlər: istifadəçi başına 3 otaq, otaqda 30 iştirakçı, iştirakçı başına
  3 SSE bağlantısı, cəmi 500 otaq / 3000 bağlantı; IP üzrə qoşulma 30/10 dəq, iştirakçı üzrə əməliyyat 120/dəq.
- Nəqliyyat: SSE (`GET …/events?t=<bilet>`) + POST. Hər mesaj otağın **tam** vəziyyətidir (itən hadisə yoxdur).
  Dəvət tokeni və iştirakçı sirri 128 bit, yaddaşda da yalnız SHA-256. EventSource başlıq göndərmədiyi üçün sirr URL-ə
  qoyulmur: `POST …/ticket` birdəfəlik, 60 saniyəlik bilet verir. nginx: yalnız `^/api/read-together/<id>/events$`
  üçün `proxy_buffering off`, `proxy_read_timeout 3600s`, `access_log off`.
- Keçidlər: `/read-together#j=<dəvət>` (qoşul), `/read-together#r=<otaq>` (bu cihazın iştirak sirri —
  `localStorage.mcc_rt_sessions`, ehtiyat nüsxəyə düşmür; sahib başqa cihazda `reclaim` ilə aparıcılığı bərpa edir).

### Profillər (`src/utils/profileCore.js`, `profiles.js`) — serverdə heç nə yoxdur
- Hesabda ≤6 profil. Profilə aid açarlar AÇIQ siyahıdır (`PROFILE_KEYS`); dil/mövzu/şəhər/tərcihlər ortaqdır.
  Hər profil `mcc_profile:<id>:<açar>` kimi; adi açarlar — aktiv profilin iş nüsxəsi. Keçid: flush → aktiv id → hydrate → yenilə.
- Sinxronizasiya: `collectBackup` əvvəlcə flush edir və iş nüsxəsini göndərmir; gələn məlumat yazılandan sonra
  aktiv profil yenidən yüklənir. Aktiv id cihaza aiddir (`mcc_profile_active`). Reyestri ilk dəfə sinxronizasiya ilə alan
  cihazın köhnə şəxsi açarları yalnız birinci profildə OLMAYAN açarlara köçür (qalanı hesabdakı qalib gəlir).

### Ailə dairəsi (`server/family.js`) — SERVERDƏ OXUNA BİLƏN (yalnız seçilmiş rəqəmlər)
| Cədvəl | Saxlanan |
|---|---|
| `family_circles` | sahib (`owner_id` UNIQUE) |
| `family_members` | dairə ↔ hesab, rol (`owner`/`member`); hesab ən çox bir dairədə; ≤8 üzv |
| `family_invites` | dəvət tokeninin **yalnız SHA-256**-ı (32 bayt), birdəfəlik, 7 gün; ≤5 açıq |
| `family_shares` | istifadəçinin SEÇDİYİ xülasə rəqəmləri (ağ siyahı: `quranAyahsTotal, quranDaysWeek, storybooksRead, prayerStarsWeek, hifzAyahs, dhikrWeek`), razılıq vaxtı |
| `family_cards` | şablon id + istəyə bağlı rəqəm (sərbəst mətn YOXDUR — uşaq üçün təhlükəsiz); 60 gündən sonra silinir; göndərən üzrə 30/gün |
Hamısı `users(id) ON DELETE CASCADE` (sahib silinəndə dairə bütövlükdə). Rəqəmləri klient hesablayır (`src/utils/familyStats.js`).
Dəvət: `/account#family=<token>`. Endpoint-lər: `GET/POST/DELETE /api/family`, `POST /api/family/invites`,
`DELETE /api/family/invites/:id`, `POST /api/family/join/preview`, `POST /api/family/join`, `DELETE /api/family/members/:id`,
`PUT/DELETE /api/family/share`, `POST /api/family/cards`, `POST /api/family/cards/seen`, `DELETE /api/family/cards/:id`.

### "Məni yoxla" (`server/hifzTest.js`, `/hifz-test`) — NİTQ TANIMA YOXDUR
- `hifz_tests`: sahib, token **SHA-256** (32 bayt), surə + ayə aralığı, göstəriləcək ad, 24 saat ömür; nəticə — yalnız
  işarələr (`{ a, kind: mistake|hesitation, words? }`), sərbəst mətn qəbul olunmur. Nəticə sahib siyahını açanda "götürülür",
  7 gün sonra silinir (heç götürülməsə — 90 gün); cavabsız keçid vaxtı bitəndən 1 gün sonra. ≤10 açıq keçid.
- Yoxlayan girişsizdir: token URL fraqmentindədir (`/hifz-test#t=…`) və gövdədə göndərilir (`POST /api/hifz-tests/open`, `/submit`).
  Sahib: `POST/GET /api/hifz-tests`, `DELETE /api/hifz-tests/:id`. Klient nəticəni hifz SRS-ə bir dəfə idxal edir
  (`src/utils/hifzTestImport.js`: səhv → bu gün, tərəddüd → ən gec sabah).

Limitlər (`server.js`, IP üzrə): `/api/read-together` 300/dəq, `/api/family` 60/dəq, `/api/hifz-tests` 60/dəq. Bütün
cədvəllər miqrasiyasızdır; modullar əvvəlcədən yükləmə siyahısındadır.

## I mərhələsi: birlikdə — çağırışlar, müəllim sinfi, ailə Ramazan lövhəsi, təqvim axını

Hamısı `requireUser` + CSRF (yalnız `GET /api/cal/<token>.ics` girişsizdir). Cədvəllər miqrasiyasızdır
(`CREATE TABLE IF NOT EXISTS`, `user_version` dəyişmir), `users(id) ON DELETE CASCADE`; modullar `server.js`-in
əvvəlcədən yükləmə siyahısında, "Mənim məlumatlarım" ixracında (`exportUser`/`summaryUser`, token heşləri YOX).
Sərbəst mətn yoxdur — yalnız çağırışın öz başlığı (`custom`, ≤60) və müəllimin qeydi (≤200, bütün sinfə).

### Qrup çağırışları (`server/challenges.js`, `/together#c=<id>`)
- Şablonlar: `quran_pages` (gündə 1–20 səhifə), `fajr`, `adhkar`, `mulk`, `khatm` (30 cüz üzvlər arasında), `custom`; 7/30/40 gün.
- Dəvət: 32 bayt token, yalnız SHA-256, çoxdəfəlik (≤50 üzv), sahib yeniləyir → köhnə ölür. `/together#cj=<token>`.
- Lövhə: YALNIZ gün üzrə toplu say; üzvün adı/sayı/reytinqi heç kimə getmir; hər üzv öz işarələrini görür. Cüzlərdə
  yalnız "götürülüb / oxunub / sizin". Yaratmaq və qoşulmaq — `consent: true`.
- Xatırlatma: üzvün yerli saatında, gündə bir dəfə, həmin gün işarələməyibsə; yalnız hesaba bağlı push cihazlarına
  (`personal_push_links`), yoxdursa heç nə. Planlayıcı dəqiqədə bir (`challengesRouter.tick`). Bitəndən 30 gün sonra silinir.
- Cədvəllər: `challenges`, `challenge_members`, `challenge_ticks`, `challenge_juz`. Limit: `/api/challenges` 60/dəq.

### Müəllim sinfi (`server/classes.js`, `/together#k=<id>`)
- ≤60 şagird, müəllim ≤10 sinif, şagird ≤20 sinif. Dəvət — yuxarıdakı kimi (`#kj=<token>`).
- Tapşırıqlar şablondan: `memorize`/`review` (surə + ayə aralığı), `read` (Mushaf səhifələri 1–604) + son tarix.
- Müəllim fərdi vəziyyəti ("etdim" işarələri, hifz xülasəsi `hifzAyahs, quranAyahsTotal, quranDaysWeek` — klient
  hesablayır) YALNIZ razılıq verən şagird üçün görür; razılıq geri alınanda rəqəmlər silinir. Toplu say da yalnız paylaşanlardan.
- "Məni yoxla": müəllim şagird üçün `hifz_tests` keçidi yaradır (sahibi şagirddir — nəticə onun SRS-inə), əlaqə `class_hifz_tests`-də;
  müəllim yalnız vəziyyəti görür. Cədvəllər: `classes`, `class_members`, `class_assignments`, `class_done`, `class_hifz_tests`. Limit 60/dəq.

### Ailə Ramazan lövhəsi (`server/familyRamadan.js`, `/api/family/ramadan`)
- Açıq: 20 Şəban — 7 Şəvval (Ümmül-Qura, `server/hijri.js`); kənarda yazılar `409 not_ramadan`.
- Razılıqla: tutulan oruc sayı, bu Ramazan oxunan səhifə sayı (gizlət → silinir). Ailə xətmi (cüz → ad), iftar növbəsi
  (gün → ad), son on gecənin tək gecələri (gecə üzrə say). Keçən mövsümlər və dairədən çıxanların sətirləri təmizlənir.
- Cədvəllər: `family_ramadan`, `family_ramadan_juz`, `family_ramadan_iftar`, `family_ramadan_qadr` (`/api/family` limiti altında).

### Şəxsi təqvim axını (`server/calFeed.js`)
- `cal_feeds`: tokenin yalnız SHA-256-ı (32 bayt), seçilmiş bölmələr, dil. Token bir dəfə göstərilir; "Yeni keçid" köhnəni öldürür.
- `GET /api/cal/<token>.ics` — bütün-gün hadisələri (VALUE=DATE, VTIMEZONE lazım deyil): ildönümləri (adlarla), Cümə (RRULE),
  zəkat (VALARM −7 gün), məktubun açılış günü (yalnız başlıq), sünnə orucları (`CalSunnahFasts.jsx → fastStatus`-un surəti;
  Şəvval daxil deyil), çağırış günləri. `Cache-Control: private, max-age=1800`, `X-Robots-Tag: noindex`. Limit 300/dəq;
  idarə `/api/cal-feed` 30/dəq. nginx: `location ^~ /api/cal/` — `access_log off` (URL-in özü sirdir).

## K mərhələsi: icma — açıq profil, ailə dua siyahısı, dua divarı, məscid nümayəndəsi, həftəlik hesabat

Hamısı könüllüdür və susmaya görə bağlıdır; ilk yazıda razılıq (`consent: true`, vaxtı saxlanır). Cədvəllər
miqrasiyasızdır (`CREATE TABLE IF NOT EXISTS`, `user_version` dəyişmir), `users(id) ON DELETE CASCADE`; modullar
(`./communityKit`, `./publicProfile`, `./familyDua`, `./duaWall`, `./mosqueRep`, `./weekly`) `server.js`-in əvvəlcədən
yükləmə siyahısında, "Mənim məlumatlarım" ixracında (`exportUser`/`summaryUser`). İctimai mətnlərdən keçidlər silinir
(`communityKit.stripLinks`), dua divarında keçid/telefon → rədd. **Moderasiya — admin PANELİ** (`server/auth.js`
sessiyası, `admin_roles` ≥ editor; saytın `editor` rolu kifayət deyil): panel → "Dua divarına nəzarət"
(`src/components/admin/CommunityModeration.jsx`). Moderator yalnız məzmunu görür — e-poçt / hesab id-si göndərilmir.

| Modul | Cədvəllər | Endpoint-lər | Limit (IP) |
|---|---|---|---|
| `publicProfile.js` (K1, `/u/<ləqəb>`) | `public_profiles`, `public_profile_reports` | `GET/PUT/DELETE /api/profile/public`, `GET /api/profile/handle?h=`, `GET /api/u/:handle` (girişsiz; gizli/naməlum → eyni 404), `POST /api/u/:handle/report`, admin: `GET /api/admin/moderation/profiles`, `POST …/profiles/:handle {dismiss|hide}` | `/api/profile` 60, `/api/u` 120 |
| `familyDua.js` (K2) | `family_duas`, `family_dua_prayers`, `family_dua_reports` | `GET/POST /api/family/duas`, `POST …/:id/pray`, `POST …/:id/answered`, `POST …/:id/report`, `DELETE …/:id` | `/api/family` 60 |
| `duaWall.js` (K3, `/dua-wall`) | `dua_wall`, `dua_wall_prayers`, `dua_wall_reports`, `dua_wall_banned`, `dua_wall_log` | `GET /api/dua-wall` (girişsiz), `GET /api/dua-wall/mine`, `POST /api/dua-wall`, `DELETE …/:id`, `POST …/:id/pray` (girişsiz də, CSRF), `POST …/:id/report`; admin: `GET /api/admin/dua-wall?status=`, `POST /api/admin/dua-wall/:id {approve|reject|delete}`, `GET/POST/DELETE /api/admin/dua-wall/banned` | `/api/dua-wall` 60 |
| `mosqueRep.js` (K4) | `mosque_info` (məscid üzrə; `updated_by` → SET NULL), `mosque_announcements` | `GET/PUT /api/mosque-rep`, `POST/DELETE /api/mosque-rep/announcements[/:id]` (rol `mosque_rep` + bağlı `mosque_id`; id heç vaxt sorğudan götürülmür), `GET /api/mosques/:id/live` (ETag → 304), `GET /api/mosques/verified?ids=`; admin: `GET /api/admin/mosques`, `DELETE …/:id`, `DELETE …/:id/announcements/:aid` | `/api/mosque-rep` 30, `/api/mosques` 120 |
| `weekly.js` (K5) | `weekly_prefs`, `weekly_stats`, `weekly_sent` | `GET /api/weekly`, `PUT /api/weekly/prefs`, `PUT /api/weekly/stats`, `DELETE /api/weekly`, `GET/POST /api/weekly/unsubscribe?t=` (girişsiz, HMAC) | `/api/weekly` 30 |

- **Açıq profil:** ləqəb `[a-z0-9_]{3,24}`, unikal, ehtiyat sözlər (`RESERVED`); göstərilən sahələr ağ siyahıdır
  (`displayName, kunya, stamps, khatms, ummahKhatms, bio ≤160, favSurah`) — rəqəmləri klient bu cihazdan hesablayır
  (`utils/passport`, `utils/worldKhatm`; künyə — J mərhələsinin `muslim_cc_kunya_v1` açarı varsa). İzləyici/reytinq yoxdur.
  `/u/<ləqəb>` klientdə render olunur (prerender yox): nginx bu ünvana `404.html` qabığını **HTTP 404** ilə verir
  (`/group/<id>` kimi), SPA profili göstərir. Ona görə "axtarış sistemlərinə icazə ver" yalnız robots meta-nı dəyişir —
  **həqiqi indeksləmə üçün nginx-də `/u/` üçün 200 lazımdır** (edilməyib). Moderasiya "gizlət" → profil bağlanır, mətn sahələri silinir.
- **Ailə dua siyahısı:** yalnız dairə üzvləri; "dua etdim" — yalnız say (kim olduğu yox), hər üzv bir dəfə, öz istəyinə yox.
  Müəllif — "qəbul olundu"/sil; sahib — istənilən istəyi silir və bildiriş sayını görür. Dairədən çıxanın istəkləri
  görünmür və saatlıq təmizlikdə silinir. Ömür: qəbul olunan 30 gün, qalanı 90 gün. Gündə 10, açıq ≤20/müəllif, dairədə ≤100.
- **Dua divarı:** 10–300 simvol, ad ≤30 (yalnız hərflər; susmaya görə "Anonim"), dil etiketi. Süzgəc: keçid/domen/e-poçt
  → `links_not_allowed`, telefon → `personal_info`, qadağan söz (admin idarə edir; ilk yaradılışda kiçik siyahı) →
  `not_allowed`, gündə 3 (`daily_limit`). Təsdiq → 30 gün görünür (sonra 7 gün saxlanıb silinir); gözləyən/rədd — 30 gün.
  Şikayət: ilk şikayət yenidən növbəyə; yenidən təsdiqdən sonra 3 şikayət. "Dua etdim": girişli — bazada bir dəfə;
  girişsiz — yaddaşda (IP-nin prosesə məxsus duzla HMAC-ı, 24 saat, saatda 120) — **bazaya IP/heş yazılmır**; restartdan sonra eyni girişsiz ziyarətçi yenidən sayıla bilər.
- **Məscid ekranı:** `/mosque-tv?m=<mosqueId>` — 60 saniyədə bir `GET /api/mosques/:id/live` (`cache: 'no-cache'`, ETag);
  nümayəndənin iqamə qaydası (dəq. və ya `HH:MM`), adı, Cümə vaxtı/mövzusu, elanlar (birinci slayd) yerli ayarın üstünə
  (`utils/iqamah.applyLiveConfig`). Aktiv nümayəndə yoxdursa 404 → yerli rejim. Məscid axtarışında (`/mosques`) belə
  məscidlərdə "Təsdiqlənmiş nümayəndə" kartı. Elanın son günü UTC tarixi ilə yoxlanır.
- **Həftəlik hesabat:** istifadəçinin seçdiyi gün, öz saat qurşağında 09:00-dan sonra; dövr — həmin gündən əvvəlki 7 gün.
  Rəqəmləri klient (`utils/weeklyReport.js`) sayt açılanda (ən çox 3 saatda bir; `App.jsx`, yalnız `mcc_weekly` ipucu
  varsa) hesablayır: namaz X/35, Quran səhifəsi (təxmini — mozaikanın gündəlik anlıq görüntüsündən artım × 604/6236),
  zikr, oruc günləri (sünnə + Ramazan), vird %. **Həmin həftə rəqəm gəlməyibsə məktub GÖNDƏRİLMİR** ("skipped").
  Yalnız təsdiqlənmiş e-poçta; şablon `weekly` (5 dil, qalanı en; boş sətirlər atılır), `List-Unsubscribe-Post`.

## Klient (sayt)

- Səhifələr (noindex, sitemap-a düşmür): `/login`, `/signup`, `/account`, `/account/verify`, `/account/reset`
  (`src/pages/LoginPage.jsx`, `AccountPage.jsx`, `AccountTokenPage.jsx`; ortaq hissələr `src/components/account/`).
- API: `src/api/userSession.js` (yüngül — başlıq düyməsi; `authFetch`, cari istifadəçi) və `src/api/userAuth.js`
  (bütün endpoint-lər, `@simplewebauthn/browser` tənbəl). Google: `src/utils/googleSignIn.js` (`VITE_GOOGLE_CLIENT_ID`).
- Başlıq: localStorage-da `mcc_logged_in` ipucu yoxdursa `/api/auth/me` ÇAĞIRILMIR; varsa — boş vaxtda bir dəfə.
- Admin paneli → "İstifadəçilər" (`src/components/admin/UserManager.jsx`) — yalnız admin / superadmin.
- Admin paneli → "Dua divarına nəzarət" (`src/components/admin/CommunityModeration.jsx`) — bütün panel rolları (editor+).

## Açıq məsələlər

- `register` cavabı (201 + cookie vs 202) prinsipcə e-poçtun varlığını aça bilər — limit (IP üzrə 10/saat) bunu
  bahalı edir; tam gizlətmək üçün "əvvəl e-poçtu təsdiqlə, sonra giriş" axını lazımdır (UX bahasına).
- `editor` admin paneli rolu hələlik yalnız istifadəçi idarəsini bağlayır; mövcud admin API-ləri (məzmun, push və s.)
  rolu yoxlamır — editor-u məhdudlaşdırmaq ayrıca iş tələb edir.
- nginx `access_log` `/api/auth/*` sorğularının IP-lərini mövcud qayda ilə yazır (DB-yə yazılmır).
