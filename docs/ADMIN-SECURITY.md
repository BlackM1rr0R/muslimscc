# Admin paneli təhlükəsizliyi

**2026-11-24-dən (sahibin qərarı):** idarə paneli YALNIZ saytın adi hesabı ilə açılır (panel rolu + iki addımlı
yoxlama) və ünvanı **`/account/panel`**-dir (dil prefiksli də: `/en/account/panel` …). `/admin`, `/adminlogin`
(dil prefiksliləri də) və `#admin` qısayolu **silinib** — həmişə adi 404. Ayrıca admin hesabının girişi
(e-poçt + şifrə + panel TOTP-si) susmaya görə **sönülüdür**; yalnız fövqəladə hal üçün "Təcili giriş" (aşağıda).
Server tərəfi (məzmun API-si, push, ehtiyat nüsxə): [SERVER-OPS.md](SERVER-OPS.md).
Panel rolları və saytın istifadəçi hesabları:
[USER-ACCOUNTS.md](USER-ACCOUNTS.md).

## Necə işləyir

| Nə | Necə |
|---|---|
| Giriş | Saytın hesabı (`__Host-mcc_user`, `server/users.js`) + panel rolu + TOTP 2FA — `server/adminSso.js` |
| CSRF | Vəziyyət dəyişən hər sorğuda `X-Requested-With: fetch` mütləqdir; `Origin` varsa icazəli siyahıda olmalıdır |
| İcazə | Bütün `/api/admin/*` və `POST /api/send-notification` — `requireAdmin` (panel rolu + 2FA olan sayt sessiyası; köhnə admin cookie-si yalnız "Təcili giriş" rejimində) |
| Ayrıca admin girişi | `POST /api/admin/login`, `POST /api/admin/2fa` → 403 `legacy_login_disabled`; köhnə `__Host-mcc_admin` sessiyaları heç nəyi açmır (DB-də qalır, amma nəzərə alınmır) |

### Panelin ünvanını açanda

| Vəziyyət | Nə olur |
|---|---|
| Sayt hesabına daxil olmayıb | `/login?next=/account/panel` — girişdən sonra panelə qayıdır |
| Daxil olub, panel rolu yoxdur (`user`, `mosque_rep`) | 404 səhifəsi ("Səhifə tapılmadı") — panelin varlığı göstərilmir |
| Panel rolu var, 2FA bağlıdır / sessiya 2FA-dan əvvəldir / qorunma rejimi | bələdçi ekranı (`AdminSiteGate`) — hesabın "İki addımlı yoxlama" bölməsinə keçid və ya "Çıxış və yenidən giriş" |
| Panel rolu + 2FA + təzə sessiya | panel |
| Server cavab vermir | "Server cavab vermir" + "Yenidən yoxla" |

## Sayt hesabı ilə panel (SSO)

Şərtlər — hamısı serverdə yoxlanır (`server/adminSso.js`):

| Şərt | Ödənməyəndə |
|---|---|
| Hesabın rolu `editor`, `admin` və ya `superadmin` (panel rolu eynidir: editor→editor, admin→admin, superadmin→superadmin) | 401 → klient: daxil olmayıbsa `/login`, daxil olubsa 404 |
| Hesabda **iki addımlı yoxlama (TOTP)** açıqdır | 403 `need_2fa` — panel "İdarə panelindən istifadə üçün iki addımlı yoxlamanı açın" ekranını göstərir (hesabın 2FA bölməsinə keçid), heç bir məlumat yüklənmir |
| Sessiya 2FA açılandan **sonra** yaradılıb (kodla və ya passkey ilə giriş) | 403 `need_reauth` — "Çıxış və yenidən giriş" (2FA-dan əvvəl, məs. oğurlanmış şifrə ilə açılmış sessiya panelə çatmasın) |
| Hesab "qorunma rejimi"ndə deyil ("Bu mən deyildim") | 403 `security_hold` |

- `superadmin` yalnız CLI ilə verilir (`admin-user.js user-role <email> superadmin`) — HTTP ilə heç vaxt.
- Daxildə hər sayt hesabı üçün "kölgə" admin sətri açılır (`site-user-<id>@sso.invalid`, şifrəsi istifadəyə
  yararsızdır — "Təcili giriş" formu ilə də ona girmək olmur); `admin_sso_links` cədvəli. Hesab silinəndə o da silinir.
- Panelin öz "Hesab və şifrə" bölməsi sayt hesabına yönləndirir (şifrə/2FA marşrutları 403 `site_account`) —
  şifrə və 2FA hesab səhifəsindədir. Yan menyuda "Çıxış" əvəzinə "Sayta qayıt".
- Jurnal: hər SSO sessiyası üçün (12 saatda bir) istifadəçinin təhlükəsizlik fəaliyyətində "İdarə paneli açıldı"
  (`admin_panel`); konsolda yalnız istifadəçi id-si və rol.
- Keçidlər (yalnız panel rolunda): başlıqdakı hesab menyusu → "İdarə paneli"; telefonda çəkmə menyunun alt
  hissəsində adlı sətir "İdarə paneli" (qalxan ikonu, ikon sətrində deyil); 1024–1439px yan panelin altında;
  hesab səhifəsi.

**Baş admin üçün qurulum (bir dəfə) — BUNSUZ PANEL BAĞLIDIR:**
1. Saytda öz hesabınıza daxil olun → Hesabım → "İki addımlı yoxlama" → kod tətbiqi ilə açın. **Ehtiyat kodlarını** saxlayın.
2. Çıxın və yenidən daxil olun (kodla və ya passkey ilə) — 2FA-dan əvvəlki sessiya panelə yaramır.
3. Rol (əgər hələ verilməyibsə): `TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js user-role <sizin-email> superadmin`
4. Hesab menyusu → "İdarə paneli" (və ya `https://muslims.cc/account/panel`).

## Təcili giriş (break-glass): `ADMIN_LEGACY_LOGIN=1`

Yalnız sayt hesabı ilə panelə girmək mümkün olmayanda (məs. sayt hesabları modulu sınıb, telefon + ehtiyat
kodlar itib və CLI ilə düzəltmək olmur). Adi halda **qoşmayın**.

```sh
cd /opt/muslimscc
echo 'ADMIN_LEGACY_LOGIN=1' >> api.env          # dəyəri yalnız "1" işləyir
TAG=$(cat .current_tag) docker compose up -d api # YALNIZ api yenidən yaradılır (bir neçə saniyəlik API fasiləsi, SERVER-OPS.md kimi);
                                                 # xidmət adı OLMADAN "docker compose up -d" İŞLƏTMƏYİN (hamısını yenidən yaradır)
```
- Onda server ayrıca admin hesablarının girişini (`/api/admin/login` + panel TOTP-si) və köhnə sessiyaları yenidən
  qəbul edir; `GET /api/admin/me`-nin 401 cavabında `legacyLogin:true` olur və **`/account/panel`** ünvanında
  ayrıca giriş forması görünür (ayrıca marşrut yoxdur — `/admin`, `/adminlogin` yenə 404). Başlanğıcda API logu
  xəbərdarlıq yazır.
- Admin hesabı CLI ilə: `admin-user.js create <email>` (müvəqqəti şifrə) / `set-password <email>`.
- İş bitən kimi sətri `api.env`-dən silin və eyni əmrlə api-ni yenidən yaradın (və ya növbəti deploy); köhnə sessiyalar dərhal yenə nəzərə alınmır.
  Ehtiyat üçün `admin-user.js set-password <email>` də edin (bütün köhnə sessiyalar silinir).

Lokal kilid (lockout) ssenariləri və çıxış yolu:
| Problem | Həll (serverdə CLI, break-glass lazım deyil) |
|---|---|
| 2FA tətbiqi itib, ehtiyat kodlar var | Girişdə ehtiyat kodu → Hesabım → 2FA-nı yenidən qurun |
| Hesab "qorunma rejimi"ndədir | Hesab səhifəsindəki addımlar (e-poçt keçidi) |
| Rol itib / səhvən endirilib | `admin-user.js user-role <email> superadmin` |
| Heç biri işləmir | `ADMIN_LEGACY_LOGIN=1` (yuxarıda) |

## Gizli ünvan (`VITE_ADMIN_PATH`, istəyə bağlı)

Susmaya görə panel `/account/panel`-dədir — bu kifayətdir (panel yalnız hesab + 2FA ilə açılır). İstəsəniz build
zamanı `VITE_ADMIN_PATH` paneli başqa, təsadüfi seqmentə köçürür (`src/seo/routes.js` → `ADMIN_PATH`). Repoda
həqiqi dəyər **yoxdur**.

| | `VITE_ADMIN_PATH` yoxdur (susmaya görə, lokal, e2e) | `VITE_ADMIN_PATH=/<gizli>` |
|---|---|---|
| Panel | `/account/panel` (və `/en/account/panel` …) | `/<gizli>` (və `/en/<gizli>` …); `/account/panel` adi hesab səhifəsidir |
| `/admin`, `/adminlogin` (dil prefiksli də), `#admin` | 404 / heç nə | 404 / heç nə |

- Format: `^/[a-z0-9-]{8,40}$` (məs. təsadüfi 16+ simvol). Mövcud səhifə ünvanı ilə toqquşsa build dayanır.
- noindex; sitemap, llms.txt, robots.txt-ə düşmür (robots.txt-dəki köhnə `/admin` sətirləri zərərsizdir, qalır).
  Prerender panelin ünvanında yalnız boş SPA qabığı yazır (`scripts/admin-path-env.mjs` dəyəri Node-a ötürür).
- **Bu, gizlilikdir, qoruma deyil:** ünvan JS paketində var. Əsl qoruma — sayt hesabı + 2FA.

**Qoşmaq / dəyişmək / ləğv:**
```sh
gh secret set ADMIN_PATH            # dəyəri gizli soruşur; məs. "/" + 16 təsadüfi [a-z0-9] simvol
# isteğe bağlı — "Təcili giriş"də adminin "yeni cihazdan giriş" məktubundakı keçid üçün serverdə api.env-ə: ADMIN_PATH=<eyni dəyər>
gh secret delete ADMIN_PATH         # + deploy → yenidən /account/panel
```
- CI (`.github/workflows/ci.yml`, `images` job) sirri formatla yoxlayır və web image-in build-inə BuildKit sirri kimi
  verir (`infra/web.Dockerfile`); dəyər loga çap olunmur, image metadata-sına düşmür. e2e build-i qəsdən sirsizdir.
- Yeni dəyər **növbəti deploy-da** qüvvəyə minir və yalnız web image yenidən yığılanda: sirri dəyişəndən sonra
  saytın (server/-dən kənar) hər hansı faylına dəyişiklik push edin (eyni mənbəli image serverdə "reuse" olunur).
- Ünvan dəyişəndə köhnə əlfəcin 404 verir; PWA-dakı açıq panel səhifəsi yenilənəndə də.

## Admin hesabları (serverdə, root) — CLI dəyişmir

```sh
cd /opt/muslimscc
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js user-role <email> <superadmin|admin|editor|…>   # SAYT hesabının rolu (əsas yol)
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js create <email>        # ayrıca admin (yalnız "Təcili giriş" üçün)
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js set-password <email>  # bütün sessiyalar ləğv olunur
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js list
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js delete <email>
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js set-role <email> <superadmin|admin|editor>
```

Şifrə heç vaxt arqumentdə verilmir: terminalda gizli soruşulur (iki dəfə) və ya `--password-stdin`
(parol menecerindən boru ilə). Şifrə ən azı 12 simvol.

## Şifrə və təhlükəsizlik

- Sayt hesabının şifrəsi, 2FA-sı, aktiv sessiyaları — Hesabım səhifəsində ([ACCOUNT-SECURITY.md](ACCOUNT-SECURITY.md)).
- Ayrıca admin hesabı ("Təcili giriş"): şifrəni unutdunuz → `admin-user.js set-password <email>` (müvəqqəti olur);
  oğurlanıb → `set-password` (bütün sessiyalar ləğv) və ya `delete <email>`.
- Köhnə admin şifrəsi və `ADMIN_TOKEN` açarı artıq heç nəyə yaramır; başqa yerdə işlədilibsə — orada dəyişin.

## Texniki qeydlər (tərtibatçı üçün)

- Klient: `src/pages/AdminPage.jsx` (giriş yoxlaması: `/login?next=`, 404 — `onDenied` → `App.jsx`), `src/api/adminAuth.js`,
  `src/components/admin/AdminSiteGate.jsx` (2FA bələdçisi), `src/components/admin/LegacyAdminLogin.jsx` (yalnız break-glass,
  tənbəl yüklənir), `src/components/admin/AccountManager.jsx`; ünvan `src/seo/routes.js` → `ADMIN_PATH`.
- Server: `server/auth.js` (`createRequireAdmin({ legacyLogin })`, `createAuthRouter({ legacyLogin })`), `server/adminSso.js`,
  `server/server.js` (`ADMIN_LEGACY_LOGIN`), skript `server/scripts/admin-user.js`.
- Testlər: `tests/unit/server-admin-sso.test.js` (susmaya görə rədd + break-glass), `tests/unit/server-auth.test.js`
  (break-glass rejimində köhnə giriş), `tests/unit/admin-path.test.js`; E2E `tests/e2e/admin-auth.spec.js`,
  `tests/e2e/admin-sso.spec.js` (API cavabları saxtadır — `tests/e2e/adminAuth.js`).
