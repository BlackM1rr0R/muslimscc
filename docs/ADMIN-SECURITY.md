# Admin paneli təhlükəsizliyi

Admin girişi öz serverimizdədir — e-poçt + şifrə, HttpOnly sessiya cookie-si (`server/auth.js`).
Firebase Auth / Firestore qaydaları artıq yoxdur (Firebase-dən çıxış tamamdır — tarixçə:
[FIREBASE-EXIT.md](FIREBASE-EXIT.md)). Panel rolları və saytın istifadəçi hesabları:
[USER-ACCOUNTS.md](USER-ACCOUNTS.md).

## Necə işləyir

| Nə | Necə |
|---|---|
| Şifrə | `crypto.scrypt` hash (duz ilə); şifrənin özü heç yerdə saxlanılmır |
| Sessiya | Cookie `__Host-mcc_admin` (HttpOnly, Secure, SameSite=Strict, 30 gün); DB-də tokenin yalnız SHA-256-sı |
| CSRF | Vəziyyət dəyişən hər sorğuda `X-Requested-With: fetch` mütləqdir; `Origin` varsa icazəli siyahıda olmalıdır |
| Login limiti | Uğursuz cəhdlər: IP üzrə 10, e-poçt üzrə 5 / 15 dəq; naməlum e-poçtda da scrypt işləyir (vaxtdan bilinmir) |
| Müvəqqəti şifrə | `create` / `set-password` ilə qoyulan şifrə müvəqqətidir — panel ilk girişdə yalnız "Şifrəni dəyiş" formasını göstərir |
| İcazə | Bütün `/api/admin/*` və `POST /api/send-notification` — `requireAdmin` (yalnız sessiya cookie-si) |

## Admin hesabları (serverdə, root)

```sh
cd /opt/muslimscc
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js create <email>        # müvəqqəti şifrə
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js set-password <email>  # bütün sessiyalar ləğv olunur
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js list
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js delete <email>
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js set-role <email> <superadmin|admin|editor>
```

Şifrə heç vaxt arqumentdə verilmir: terminalda gizli soruşulur (iki dəfə) və ya `--password-stdin`
(parol menecerindən boru ilə). Şifrə ən azı 12 simvol.

## Şifrə və təhlükəsizlik

- **Şifrəni unutdunuz?** E-poçtla bərpa yoxdur — serverdə `admin-user.js set-password <email>` (yeni şifrə müvəqqəti olur).
- **Şifrəni dəyişmək:** paneldə "Hesab və şifrə" bölməsi (`POST /api/admin/password`) — digər sessiyalar ləğv olunur, cari qalır.
- **Hesab oğurlandı / şübhə var:** `admin-user.js set-password <email>` (bütün sessiyalar dərhal ləğv olunur) və ya `delete <email>`.
- Köhnə admin şifrəsi və `ADMIN_TOKEN` açarı artıq heç nəyə yaramır; başqa yerdə işlədilibsə — orada dəyişin.

## Texniki qeydlər (tərtibatçı üçün)

- Klient: `src/api/adminAuth.js`, `src/pages/AdminLoginPage.jsx`, `src/pages/AdminPage.jsx`, `src/components/admin/AccountManager.jsx`.
- Server: `server/auth.js` (`createRequireAdmin`, `createAuthRouter`), skript `server/scripts/admin-user.js`.
- Testlər: `tests/unit/server-auth.test.js`; E2E `tests/e2e/admin-auth.spec.js` (API cavabları saxtadır — `tests/e2e/adminAuth.js`).
