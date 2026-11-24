# Admin paneli təhlükəsizliyi

Admin girişi öz serverimizdədir — e-poçt + şifrə, HttpOnly sessiya cookie-si (`server/auth.js`),
və ya saytın öz hesabı ilə (panel rolu + iki addımlı yoxlama, aşağıda).
Server tərəfi (məzmun API-si, push, ehtiyat nüsxə): [SERVER-OPS.md](SERVER-OPS.md).
Panel rolları və saytın istifadəçi hesabları:
[USER-ACCOUNTS.md](USER-ACCOUNTS.md).

## Necə işləyir

| Nə | Necə |
|---|---|
| Şifrə | `crypto.scrypt` hash (duz ilə); şifrənin özü heç yerdə saxlanılmır |
| Sessiya | Cookie `__Host-mcc_admin` (HttpOnly, Secure, SameSite=Strict, 30 gün); DB-də tokenin yalnız SHA-256-sı |
| CSRF | Vəziyyət dəyişən hər sorğuda `X-Requested-With: fetch` mütləqdir; `Origin` varsa icazəli siyahıda olmalıdır |
| Login limiti | Uğursuz cəhdlər: IP üzrə 10, e-poçt üzrə 5 / 15 dəq; naməlum e-poçtda da scrypt işləyir (vaxtdan bilinmir) |
| Müvəqqəti şifrə | `create` / `set-password` ilə qoyulan şifrə müvəqqətidir — panel ilk girişdə yalnız "Şifrəni dəyiş" formasını göstərir |
| İcazə | Bütün `/api/admin/*` və `POST /api/send-notification` — `requireAdmin` (admin sessiya cookie-si və ya panel rolu + 2FA olan sayt sessiyası — aşağıda "Sayt hesabı ilə panel") |

## Sayt hesabı ilə panel (SSO)

Saytın adi hesabı ilə (məs. telefondakı PWA-da) ayrıca admin girişi olmadan panelə keçmək olar
(`server/adminSso.js`). Şərtlər — hamısı serverdə yoxlanır:

| Şərt | Ödənməyəndə |
|---|---|
| Hesabın rolu `editor`, `admin` və ya `superadmin` (panel rolu eynidir: editor→editor, admin→admin, superadmin→superadmin) | 401 (köhnə davranış — giriş forması) |
| Hesabda **iki addımlı yoxlama (TOTP)** açıqdır | 403 `need_2fa` — panel "İdarə panelindən istifadə üçün iki addımlı yoxlamanı açın" ekranını göstərir (hesabın 2FA bölməsinə keçid), heç bir məlumat yüklənmir |
| Sessiya 2FA açılandan **sonra** yaradılıb (kodla və ya passkey ilə giriş) | 403 `need_reauth` — "Çıxış və yenidən giriş" (2FA-dan əvvəl, məs. oğurlanmış şifrə ilə açılmış sessiya panelə çatmasın) |
| Hesab "qorunma rejimi"ndə deyil ("Bu mən deyildim") | 403 `security_hold` |

- CSRF qaydası eynidir (`X-Requested-With` + Origin). Ayrıca admin cookie-si varsa, o üstündür.
- `superadmin` yalnız CLI ilə verilir (`admin-user.js user-role <email> superadmin`) — HTTP ilə heç vaxt.
- Daxildə hər sayt hesabı üçün "kölgə" admin sətri açılır (`site-user-<id>@sso.invalid`, şifrəsi istifadəyə
  yararsızdır — köhnə login formu ilə ona girmək olmur); `admin_sso_links` cədvəli. Hesab silinəndə o da silinir.
- Panelin öz "Hesab və şifrə" bölməsi (şifrə, panel 2FA-sı) sayt hesabına bağlıdır (403 `site_account`) —
  şifrə və 2FA hesab səhifəsindədir. Yan menyuda "Çıxış" əvəzinə "Sayta qayıt".
- Jurnal: hər SSO sessiyası üçün (12 saatda bir) istifadəçinin təhlükəsizlik fəaliyyətində "İdarə paneli açıldı"
  (`admin_panel`); konsolda yalnız istifadəçi id-si və rol.
- Keçid: başlıqdakı hesab menyusu, telefonda çəkmə menyunun alət sətri (qalxan ikonu) və hesab səhifəsi.

**Baş admin üçün qurulum (bir dəfə):**
1. Saytda öz hesabınıza daxil olun → Hesabım → "İki addımlı yoxlama" → kod tətbiqi ilə açın.
2. Çıxın və yenidən daxil olun (kodla) — 2FA-dan əvvəlki sessiya panelə yaramır.
3. Serverdə rolu verin: `TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js user-role <sizin-email> superadmin`
4. Hesab menyusu → "Admin paneli".

## Gizli ünvan (`VITE_ADMIN_PATH`)

Panelin ünvanı build zamanı `VITE_ADMIN_PATH`-dən gəlir (`src/seo/routes.js` → `ADMIN_PATH`). Repoda
həqiqi dəyər **yoxdur**.

| | `VITE_ADMIN_PATH` yoxdur (lokal, testlər, e2e) | `VITE_ADMIN_PATH=/<gizli>` (istehsal) |
|---|---|---|
| Panel | `/admin` | `/<gizli>` (və `/en/<gizli>` …) |
| Köhnə ayrıca admin girişi | `/adminlogin` | `/<gizli>/login` |
| `/admin`, `/adminlogin` (dil prefiksli də) | panel / giriş | adi 404 səhifəsi (nginx 404 + SPA "tapılmadı") |
| `#admin` qısayolu | girişi açır | bağlıdır |

- Format: `^/[a-z0-9-]{8,40}$` (məs. təsadüfi 16+ simvol). Mövcud səhifə ünvanı ilə toqquşsa build dayanır.
- noindex; sitemap, llms.txt, robots.txt-ə düşmür (robots.txt-dəki köhnə `/admin` sətirləri zərərsizdir, qalır).
  Prerender gizli ünvanda yalnız boş SPA qabığı yazır (`scripts/admin-path-env.mjs` dəyəri Node-a ötürür).
- **Bu, gizlilikdir, qoruma deyil:** ünvan JS paketində var (oxuyan tapa bilər). Əsl qoruma — giriş + 2FA.
  Məqsəd: botların/skanerlərin `/admin`-ə gəlməsi və köhnə giriş formunun açıq olmaması.

**Qoşmaq / dəyişmək (rotasiya):**
```sh
gh secret set ADMIN_PATH            # dəyəri gizli soruşur; məs. "/" + 16 təsadüfi [a-z0-9] simvol
# isteğe bağlı — adminin "yeni cihazdan giriş" məktubundakı keçid üçün serverdə api.env-ə: ADMIN_PATH=<eyni dəyər>
```
- CI (`.github/workflows/ci.yml`, `images` job) sirri formatla yoxlayır və web image-in build-inə BuildKit sirri kimi
  verir (`infra/web.Dockerfile`); dəyər loga çap olunmur, image metadata-sına düşmür. e2e build-i qəsdən sirsizdir.
- Yeni dəyər **növbəti deploy-da** qüvvəyə minir və yalnız web image yenidən yığılanda: sirri dəyişəndən sonra
  saytın (server/-dən kənar) hər hansı faylına dəyişiklik push edin (eyni mənbəli image serverdə "reuse" olunur).
- Ləğv etmək: `gh secret delete ADMIN_PATH` + deploy → yenidən `/admin`.
- Ünvan dəyişəndə köhnə əlfəcin 404 verir; PWA-dakı açıq panel səhifəsi yenilənəndə də.

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
- Server: `server/auth.js` (`createRequireAdmin`, `createAuthRouter`), `server/adminSso.js` (sayt hesabı ilə panel), skript `server/scripts/admin-user.js`.
- Klient: `src/components/admin/AdminSiteGate.jsx` (2FA bələdçisi), gizli ünvan `src/seo/routes.js` → `ADMIN_PATH`.
- Testlər: `tests/unit/server-auth.test.js`, `tests/unit/server-admin-sso.test.js`, `tests/unit/admin-path.test.js`; E2E `tests/e2e/admin-auth.spec.js` (API cavabları saxtadır — `tests/e2e/adminAuth.js`).
