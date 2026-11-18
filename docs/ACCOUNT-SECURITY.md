# Hesab təhlükəsizliyi (`server/security.js`)

Yeni cihazdan giriş xəbərdarlığı, "Bu mən deyildim", təhlükəsizlik fəaliyyəti, TOTP iki addımlı yoxlama
(istifadəçi + admin paneli), "Mənim məlumatlarım" ixracı. Hesabların əsası — [USER-ACCOUNTS.md](USER-ACCOUNTS.md).

## Cədvəllər (miqrasiyasız — `CREATE TABLE IF NOT EXISTS`, `user_version` dəyişmir)

| Cədvəl | Nə saxlanır |
|---|---|
| `security_secret` | TOTP sirlərini şifrələyən təsadüfi 32 bayt açar (env `TOTP_KEY` yoxdursa — bir dəfə yaradılır) |
| `user_security_events` | `kind`, `method` (`password`, `google`, `passkey`, `password+2fa`, `+backup`), cihaz etiketi ("Chrome · Android"), ölkə kodu (CF-IPCountry), vaxt. **IP və tam UA yoxdur.** 90 gün, istifadəçi başına ≤200 |
| `user_devices` / `admin_devices` | SHA-256(`scope` + cihaz cookie-si + etiket), etiket, ilk/son görülmə; ≤50 |
| `user_totp` / `admin_totp` | AES-256-GCM ilə şifrəli sirr (`v1.<kid>.<iv>.<ct>.<tag>`, AAD = `muslims.cc/totp/<scope>/<id>`), `enabled`, son istifadə olunan addım |
| `user_backup_codes` / `admin_backup_codes` | ehtiyat kodlarının HMAC-SHA256 heşi (açar TOTP açarından törədilir), `used_at` |
| `user_security_tokens` | "Bu mən deyildim" tokeninin SHA-256-ı, dil, 7 gün, birdəfəlik |
| `user_security_hold` | qorunma rejimi (`since`) |

Hamısı `users(id)` / `admins(id)` `ON DELETE CASCADE`. Modul `server.js`-in əvvəlcədən yükləmə siyahısındadır.

## Yeni cihaz

Cookie `__Host-mcc_dev` (təsadüfi 32 bayt, `HttpOnly; Secure; SameSite=Lax; Path=/`, 2 il). Cookie yoxdursa/yararsızdırsa —
yeni cihaz. Hesabın **ilk** cihazı (qeydiyyat və bu funksiyadan əvvəlki hesabların ilk girişi) səssiz yazılır — yoxsa
deploydan sonra hamıya "yeni cihaz" məktubu gedərdi. Məktub (`newSignIn`, 5 dil): vaxt `personal_prefs.tz` ilə (yoxdursa UTC),
"Brauzer · Sistem", ölkə — **yalnız** Cloudflare `CF-IPCountry` başlığından (xarici geo-IP yoxdur), "Bu mən deyildim" düyməsi.
Dil: girişdə klientin göndərdiyi `lang`, yoxdursa `personal_prefs.lang`, yoxdursa en.

Dəyişiklik məktubu (`securityChange`): şifrə dəyişdi / bərpa olundu, 2FA açıldı / bağlandı, yeni ehtiyat kodları, passkey əlavə /
silindi — hamısında "Bu mən deyildim" keçidi. E-poçt dəyişmə funksiyası hələ yoxdur (olanda eyni `userEvent` çağırılmalıdır).
Admin paneli: yeni cihazdan giriş → adminə `adminSignIn` məktubu. Mailer yoxdursa heç nə çökmür (səssiz).

## "Bu mən deyildim"

`GET /api/security/not-me?t=…` — yalnız təsdiq səhifəsi + hesabdakı passkey-lərin siyahısı (poçt skanerləri heç nəyi dəyişmir).
`POST` (forma) → bütün sessiyalar ləğv, şifrə bərpası məktubu (1 saat), qorunma rejimi. Rejimdə **şifrə və Google ilə giriş
`403 security_hold`**; passkey ilə giriş açıqdır (fişinqə davamlıdır). Rejim açılır: şifrə bərpası ilə və ya rejimdən SONRA
yaradılmış sessiyadan `POST /api/auth/security/hold/release` ("hər şey qaydasındadır"). Passkey-lər silinmir.
Risk: hücumçu passkey əlavə edib, sahib bunu görməyibsə, o passkey ilə girib rejimi aça bilər — passkey əlavəsi özü məktub göndərir.
Token URL sorğusundadır (nginx `access_log`-a düşə bilər); birdəfəlik və 7 günlükdür, yalnız "hesabı qoru" əməliyyatını edə bilər.

## TOTP (RFC 6238)

HMAC-SHA1, 30 s, 6 rəqəm, ±1 addım; eyni və ya köhnə addımın kodu ikinci dəfə qəbul olunmur (son addım DB-də). Sirr 20 bayt,
base32. Qurulum: `POST /api/auth/2fa/setup` (şifrəli hesabda cari şifrə) → `{ secret, uri }`; QR brauzerdə çəkilir
(`src/utils/qrCode.js` — asılılıqsız, tənbəl); `POST /api/auth/2fa/enable { code }` (30 dəq ərzində) → 10 ehtiyat kodu (bir dəfə
göstərilir). Bağlamaq / kodları yeniləmək: cari şifrə **və ya** TOTP/ehtiyat kodu (şifrəsiz hesabda yalnız kod).

**Giriş:** şifrə (və ya Google) düzdürsə və 2FA açıqdırsa sessiya YOX, `{ ok, twoFactor: true, ticket }`. Bilet 32 bayt,
yaddaşda yalnız SHA-256, 5 dəq, 5 cəhd (sonra silinir, hadisə `twofa_failed`). İstifadəçi üzrə 15 dəq-də 10 səhv → 429.
`POST /api/auth/2fa { ticket, code | backupCode }` → sessiya. API bir konteynerdir — biletlər yaddaşda kifayətdir (restart → yenidən giriş).
**Passkey ilə giriş TOTP-ni keçir** — passkey özü iki faktorludur (cihazdakı açar + biometrik/PIN, `userVerification: required`).

**Admin paneli** (`server/auth.js`): eyni mexanizm, `admin_totp`. `POST /api/admin/login` → `{ twoFactor, ticket }` →
`POST /api/admin/2fa`. İdarə: `GET /api/admin/2fa`, `POST /api/admin/2fa/setup { password }`, `/enable { code }`,
`/disable { password | code | backupCode }`. `GET /api/admin/me` → `twoFactor`. Baş admin üçün panel 2FA açılana qədər xəbərdarlıq göstərir.

**Bərpa (yalnız serverdən):**

```sh
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js totp-reset <admin-email>
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js user-totp-reset <user-email>
```

### `TOTP_KEY` (istəyə bağlı, `api.env`)

`openssl rand -base64 32`. Varsa yeni sirlər onunla şifrələnir; bazadakı açar (`security_secret`) açar halqasında qalır —
köhnə sirlər oxunur və uğurlu girişdə yeni açarla yenidən şifrələnir. Yoxdursa bazadakı açar işlənir (DB oğurlansa sirlər
açılır — env açarı bunu bölür). Yanlış uzunluqda dəyər — server başlamır (səssiz zəif şifrələmədən yaxşıdır).

## Mənim məlumatlarım

`GET /api/auth/data-summary` — sayılar (hesab, sessiyalar, passkey, hadisələr, cihazlar, personal, ailə, hifz, sinxron bloku
ölçüsü, "Birlikdə oxu" otaqları). `GET /api/auth/export` (istifadəçi üzrə 5/saat) — tam JSON, **sirlərsiz**: şifrə heşi, TOTP
sirri, kod/token/cihaz heşləri, sinxronizasiya qabları (`salt`/`wrapped`), `syncId`, push ünvanları, Google `sub` yoxdur.
Hər modul öz `exportUser` / `summaryUser` funksiyasını verir (personal, family, hifzTest, syncKeys, readTogether).
Klient faylı: `{ kind: 'muslims.cc/my-data', server, device: collectBackup() }`.

## Endpoint-lər (hamısı `requireUser` + CSRF, "not-me" istisna)

`GET /api/auth/2fa` · `POST /api/auth/2fa/setup|enable|disable|backup-codes` · `POST /api/auth/2fa` (girişsiz, bilet) ·
`GET /api/auth/security/events` · `POST /api/auth/security/hold/release` · `GET /api/auth/data-summary` · `GET /api/auth/export` ·
`GET|POST /api/security/not-me` (girişsiz, IP üzrə 30 səhv token / 15 dəq + `server.js` 30 sorğu/dəq).
`/api/auth/me` əlavə sahələr: `twoFactor: { enabled, backupCodesLeft }`, `securityHold`.
