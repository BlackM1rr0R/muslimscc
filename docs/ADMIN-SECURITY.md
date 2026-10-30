# Admin paneli və Firestore təhlükəsizliyi

> **Yeni (Firebase-dən çıxış):** admin girişi öz serverimizə keçir — e-poçt + şifrə, `server/scripts/admin-user.js`. Keçid dövründə aşağıdakı Firebase mexanizmi də işləyir. Bax: [FIREBASE-EXIT.md](FIREBASE-EXIT.md).

Bu sənəd admin panelinin yeni giriş sistemini və Firestore qaydalarını necə işə salacağınızı
addım-addım izah edir. **Addımların ardıcıllığı vacibdir** — aşağıya baxın.

## Nə dəyişdi?

| Əvvəl | İndi |
|---|---|
| Admin şifrəsi saytın JS faylında açıq yazılmışdı — istənilən ziyarətçi onu görə bilərdi | Giriş **Firebase Authentication** (e-poçt + şifrə) ilədir |
| "Daxil olub" bayrağı brauzerdə saxlanırdı (saxtalaşdırmaq asan idi) | Admin = daxil olmuş istifadəçi + hesabda **`admin: true`** icazəsi (custom claim) |
| Firestore qaydaları açıq idi — hər kəs məzmunu silə/dəyişə bilərdi | `firestore.rules`: məzmunu hamı oxuyur, **yalnız admin yazır** |
| Push abunəçilərinin məlumatı (şəhər, dil, brauzer) oxuna bilərdi | `fcm_tokens` **heç kimə oxunmur**; brauzer yalnız öz qeydini yazır/silir |
| Push göndərmək üçün ayrıca "göndərmə açarı" (`ADMIN_TOKEN`) yazılırdı | Açar yoxdur — server adminin Firebase sessiyasını yoxlayır |

## Düzgün ardıcıllıq (mütləq bu sıra ilə!)

> **Niyə?** Köhnə kod Firestore-a giriş etmədən yazır. Əgər yeni qaydaları yeni kod canlıya
> çıxmazdan ƏVVƏL yayımlasanız, admin paneli dərhal yaza bilməyəcək. Yeni kod isə köhnə (açıq)
> qaydalarla da işləyir — ona görə əvvəlcə kod, sonra qaydalar.

1. **Firebase Console-da** e-poçt/şifrə girişini aktivləşdirin və admin istifadəçisini yaradın
2. **Yeni kodu canlıya çıxarın** (`main`-ə push → CI → avtomatik deploy)
3. **Serverdə `set-admin.js`** skripti ilə hesaba admin icazəsi verin
4. Panelə daxil olub yoxlayın, sonra **Firestore qaydalarını yayımlayın**

---

### 1. Authentication-u aktivləşdirmək və istifadəçi yaratmaq

1. <https://console.firebase.google.com> → **muslims-cc** layihəsi
2. Sol menyu → **Build → Authentication** → (ilk dəfədirsə) **Get started**
3. **Sign-in method** sekməsi → **Email/Password** → **Enable** (yalnız birinci açar; "Email link" lazım deyil) → **Save**
4. **Users** sekməsi → **Add user**:
   - E-poçt: `abdllyevv@gmail.com` (və ya admin olacaq başqa ünvan)
   - Şifrə: güclü, unikal şifrə (ən azı 12 simvol). Heç kimə göndərməyin, koda yazmayın.
5. **Settings → Authorized domains** siyahısında `muslims.cc` və `www.muslims.cc` olduğuna əmin olun
   (yoxdursa **Add domain**).
6. **Tövsiyə:** Settings → **User actions** → "Enable create (sign-up)" seçimini **söndürün** — onda
   heç kim saytdan özü üçün hesab yarada bilməz (hesabları yalnız Console-dan siz yaradırsınız).
   Qeyd: hesab yaratmaq admin etmir — admin icazəsi yalnız 3-cü addımdakı skriptlə verilir.

> Google Cloud Console-da brauzer API açarına (`VITE_FIREBASE_API_KEY`) "API restrictions"
> qoymusunuzsa, **Identity Toolkit API** və **Token Service API** icazəli siyahıda olmalıdır.

### 2. Yeni kodu canlıya çıxarmaq

Adi qaydada: `main`-ə push → CI testləri → avtomatik deploy. Bu mərhələdə:

- admin paneli artıq e-poçt + şifrə istəyir;
- 3-cü addıma qədər panel **"Bu hesabın admin icazəsi yoxdur"** deyəcək — bu normaldır;
- `api.env`-dəki köhnə `ADMIN_TOKEN` artıq istifadə olunmur — istəsəniz silə bilərsiniz
  (qalması zərərsizdir).

### 3. Admin icazəsi vermək (`set-admin.js`)

Serverdə (SSH, root):

```sh
cd /opt/muslimscc
TAG=$(cat .current_tag) docker compose exec api node scripts/set-admin.js abdllyevv@gmail.com
```

Gözlənilən nəticə: `OK: abdllyevv@gmail.com (uid ...) — admin icazəsi VERİLDİ.`

Digər əmrlər:

```sh
# Yoxlamaq
TAG=$(cat .current_tag) docker compose exec api node scripts/set-admin.js abdllyevv@gmail.com --show
# İcazəni geri almaq (sessiyalar da dərhal ləğv olunur)
TAG=$(cat .current_tag) docker compose exec api node scripts/set-admin.js kimse@example.com --remove
```

Skript serverin özündəki Firebase kimlik məlumatlarından (`api.env`) istifadə edir, heç bir sirri ekrana çıxarmır.

**Sonra:** paneldə "Çıxış" edib yenidən daxil olun — yeni icazə yalnız təzə sessiyada görünür.

### 4. Yoxlamaq və Firestore qaydalarını yayımlamaq

Əvvəlcə yoxlayın (hələ köhnə qaydalarla):

- https://muslims.cc/admin → e-poçt + şifrə ilə daxil olun → panel açılır;
- bir elanı redaktə edib yadda saxlayın → alınır;
- "Anlıq bildirişlər" → abunəçi sayı görünür (rəqəm; "—" deyil).

Sonra qaydaları yayımlayın — iki yoldan biri:

**A) Komanda sətri ilə** (kompüterinizdə, layihə qovluğunda):

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

(`firebase.json` və `.firebaserc` repodadır — layihə `muslims-cc` avtomatik seçilir.)

**B) Console ilə:** Firestore Database → **Rules** sekməsi → repodakı `firestore.rules` faylının
**bütün** məzmununu yapışdırın → **Publish**.

Yayımladıqdan sonra yenidən yoxlayın:

- panel yenə yazır (elan redaktəsi alınır);
- saytı gizli pəncərədə açın → elanlar, videolar, kitablar görünür;
- bildirişləri açıb-söndürmək işləyir (Namaz vaxtları → bildiriş ayarları).

Problem olsa: Console → Firestore → Rules → **History** bölməsindən əvvəlki versiyanı bir kliklə
geri qaytara bilərsiniz.

---

## Qaydaların xülasəsi (`firestore.rules`)

| Kolleksiya | Oxumaq | Yazmaq |
|---|---|---|
| `videos`, `books`, `hadiths`, `duas`, `quotes`, `announcements`, `events`, `places` | hamı | yalnız admin |
| `singletons/daily`, `singletons/hero`, `singletons/settings` | hamı | yalnız admin |
| `notification_history` | yalnız admin | yalnız admin |
| `fcm_tokens/{token}` | **heç kim** (server Admin SDK ilə oxuyur) | yaratmaq/yeniləmək: yalnız öz tokeni (`token` = sənəd ID-si) və yalnız icazəli sahələr (`token`, `userAgent` ≤512, `lang` 5 dildən biri, `loc`, `daily`, `azan`, `createdAt`, `updatedAt`) tip yoxlaması ilə; silmək: tokeni bilən |
| qalan hər şey | heç kim | heç kim |

Admin = `request.auth.token.admin == true` (3-cü addımdakı skript verir).

## Şifrə və təhlükəsizlik

- **Şifrəni unutdunuz?** Giriş səhifəsində e-poçtu yazıb **"Şifrəni unutmusunuz?"** basın — linki e-poçtunuza gəlir.
- **Şifrəni dəyişmək:** eyni link, və ya Console → Authentication → Users → istifadəçi → **Reset password**.
- **Hesab oğurlandı / şübhə var:** dərhal şifrəni dəyişin və `set-admin.js <email> --remove` işlədin
  (bütün sessiyalar ləğv olunur), sonra yenidən `set-admin.js <email>`.
- Köhnə admin şifrəsi uzun müddət saytın JS faylında və git tarixçəsində açıq qalıb — artıq heç nəyə
  yaramır, amma heç bir başqa yerdə (e-poçt, hosting və s.) istifadə etmisinizsə, orada dəyişin.
- Server `ADMIN_TOKEN` açarı da artıq istifadə olunmur; başqa yerdə işlədilibsə — dəyişin.

## Texniki qeydlər (tərtibatçı üçün)

- Klient: `src/firebase/auth.js` (Auth SDK yalnız admin səhifələrində dinamik yüklənir — ictimai
  səhifələrə əlavə yük yoxdur), `src/pages/AdminLoginPage.jsx`, `src/pages/AdminPage.jsx`.
- Server: `requireAdmin` (server/server.js) — `Authorization: Bearer <Firebase ID token>`,
  `admin.auth().verifyIdToken(token, true)` + `admin === true`. Qorunan endpoint-lər:
  `POST /api/send-notification`, `GET /api/admin/subscribers`.
- Qaydaların testləri: `npm run test:rules` (Firestore emulyatoru; **Java 11+** lazımdır,
  `firebase-tools` `npx` ilə yüklənir). CI-də işləmir (orada emulyator/Java quraşdırılmayıb).
- E2E: `tests/e2e/admin-auth.spec.js` (Auth cavabları saxtadır — `tests/e2e/adminAuth.js`).
