# Instagram avtoposteri

Kod: `server/instagram.js` (planlayıcı, Graph API, kart marşrutu, admin API), `server/instagramCard.js` (kartın çəkilməsi —
sharp/libvips, ərəbcə Amiri ilə düzgün birləşir), `server/instagram-data.js` (dualar + Allahın 99 adı; yaradan:
`node scripts/build-instagram-data.mjs`), `server/fonts/` (Amiri + MccInter, OFL 1.1; yaradan: `python scripts/build-ig-fonts.py`),
`server/scripts/instagram.js` (CLI), `src/components/admin/InstagramManager.jsx` (admin bölməsi).
Testlər: `tests/unit/server-instagram.test.js`.

**Açarlar yoxdursa tam sönülüdür:** `api.env`-də `IG_ENABLED=1` + `IG_ACCESS_TOKEN` + `IG_USER_ID` olmasa
`/api/ig/*` → 404, planlayıcı işləmir, Instagram-a heç bir sorğu getmir, libvips yüklənmir. Kod hesab qurulmadan da deploy oluna bilər.
Admin panelində "Instagram" bölməsi vəziyyəti göstərir; baş admin kartın önizləməsini dərc etmədən görə bilər.

> Köhnə `scripts/social/` (Python + Claude caption, cron) bu moduldan **ayrıdır** və serverdə işləmir. İkisini eyni hesabda
> birlikdə işə salmayın (gündə 6 post olar).

## Nə dərc olunur

Gündə 3 yuva (`IG_SLOTS`, susmaya görə `08:00,13:00,20:00`, **Asia/Baku**). Hər yuvada **bir feed postu (1080×1350, 4:5)** və
**bir story (1080×1920)** — eyni element:

| Yuva | Məzmun | Mənbə (saytın öz məlumatı, dəyişdirilmədən) |
|---|---|---|
| 1-ci | Günün ayəsi | push / Telegram ilə eyni seçim (`daily-ayah.js`), mətn alquran.cloud (Uthmani + az.mammadaliyev / en.asad / ru.kuliev / tr.diyanet) |
| 2-ci | Günün hədisi | `daily-hadith-data.js` (səhih siyahı, saytdakı mətn) |
| 3-cü | Tək gün — Allahın adı, cüt gün — günün duası | `names99.js` (dəlili ilə), `duas.js` (mənbəsi ilə) |

- **"Səhih"** yazısı yalnız mənbə Buxari / Müslim olanda (saytın `gradeOf` 1-ci qaydası; Telegram botu ilə eyni). Sünən
  rəvayətlərində və dualarda yalnız mənbə yazılır — hökm uydurulmur.
- Mətn **qısaldılmır**. Kartda oxunaqlı ölçüdə sığmırsa (məs. Ayətül-Kürsi feed-də), sıradakı element götürülür.
- 20:00 yuvası — gecə rəngi, digərləri — zümrüd. Kartda: xatəm ornamenti, ərəbcə mətn, tərcümə (`IG_LANG`, susmaya görə az),
  mənbə, "muslims.cc".
- Caption (yalnız feed; story caption qəbul etmir): başlıq, ərəbcə, tərcümə, `— mənbə`, saytdakı səhifənin dil prefiksli linki,
  4 heşteq. Reytinq, "bəyən / izlə" dili yoxdur.
- Server yuva vaxtı işləmirdisə (deploy, restart) **90 dəqiqə** ərzində tutur; sonra həmin yuva buraxılır.

## Necə işləyir (Meta-nın rəsmi Content Publishing API-si)

1. Kart `/data/ig-cards/<tarix>-<yuva>-<feed|story>.jpg`-ə yazılır və `https://muslims.cc/api/ig/card/<ad>.jpg` ünvanında
   açılır (Instagram şəkli URL-dən özü çəkir; yalnız JPEG). 7 gündən köhnə kartlar silinir.
2. `POST /{IG_USER_ID}/media` — `image_url` + `caption` (feed) və ya `image_url` + `media_type=STORIES` → konteyner id.
3. `GET /{konteyner}?fields=status_code` — `FINISHED` olana qədər (4 san ara, ≤ 20 dəfə).
4. `POST /{IG_USER_ID}/media_publish` — `creation_id` → media id (cədvəl `instagram_posts`).

- **Bir dəfə:** `instagram_posts (day, slot, format)` UNIQUE — kəsintisiz deploy zamanı yanaşı işləyən iki api prosesindən yalnız
  biri dərc edir.
- **Xəta:** şəbəkə / 5xx / limit / şəkli çəkə bilmədi → 2, 5, 15, 30 dəq sonra təkrar (≤ 5 cəhd), sonra `failed`.
  **Token xətası** (kod 190, icazə 10 / 200-299) → planlayıcı dayanır, loga **bir dəfə** yazılır; yeni token + api-nin yenidən
  yaradılması lazımdır.
- Token yalnız `Authorization: Bearer` başlığındadır, heç vaxt loglanmır və çap olunmur.
- Meta limiti: API ilə 24 saatda ən çox **100** dərc (story-lər də sayılır; bizdə gündə 6). Yoxlamaq: `token-info`.

## Sahibin addımları

Seçilən yol — **"Instagram API with Instagram Login"** (host `graph.instagram.com`): Facebook Page **lazım deyil**, token
App Dashboard-dan bir düymə ilə alınır (60 günlük), server onu özü yeniləyir. Öz hesabımız üçün **Standard Access** kifayətdir —
**App Review və Business Verification lazım deyil** (Meta: "If your app only serves your Instagram professional account or an
account you manage, Standard Access is all your app needs").

### 1. Instagram hesabını peşəkar hesaba çevirin

Instagram tətbiqində: Profil → ☰ → **Settings and activity → Account type and tools → Switch to professional account** →
**Business** (və ya Creator). Hesab **açıq (public)** olmalıdır. Facebook Page bağlamaq lazım deyil.

### 2. Meta tətbiqi yaradın

1. https://developers.facebook.com/apps → **Create App** (Meta developer hesabı yoxdursa, əvvəlcə qeydiyyat).
2. Use case: **Other** → Next. App type: **Business** → Next.
3. Ad: məsələn `muslims.cc publisher`, əlaqə e-poçtu → **Create app**.
   (Business portfolio bağlamaq bu mərhələdə məcburi deyil; tətbiqi "Live" etmək lazım olsa tələb olunur — bizə lazım deyil.)
4. Dashboard-da **Instagram** məhsulunu tapın → **Set up**. "API setup with Instagram login" avtomatik əlavə olunur.

### 3. Hesabı əlavə edin və token alın

1. Sol menyu: **Instagram → API setup with Instagram login**.
2. **2. Generate access tokens → Add account** → Instagram hesabınızla daxil olun, icazələri təsdiqləyin.
   İcazələr: `instagram_business_basic`, `instagram_business_content_publish` (digərlərini söndürə bilərsiniz).
   Hesab "Instagram Tester" kimi tələb olunarsa: **App roles → Roles → Add People → Instagram Tester** → hesab adı, sonra
   Instagram-da **Settings → Apps and websites → Tester invites → Accept**.
3. Hesabın yanında **Generate token** → Instagram-a daxil olun → tokeni kopyalayın. Bu **uzunömürlü (60 günlük)** tokendir.
   Tokeni heç yerə (repo, çat, GitHub, e-poçt) yazmayın — yalnız serverdəki `api.env`-ə.
4. **IG_USER_ID** (Instagram peşəkar hesab ID-si, rəqəm): Dashboard-da hesabın adının altında görünür. Görünmürsə, öz
   kompüterinizdə (tokeni heç kimə göstərmədən):

   ```sh
   curl -s -H "Authorization: Bearer <TOKEN>" "https://graph.instagram.com/v27.0/me?fields=user_id,username"
   ```

   Cavabdakı `user_id` — IG_USER_ID.

### 4. api.env-ə yazın

Serverdə (root):

```sh
cd /opt/muslimscc
nano api.env                    # fayl 600, root
```

```
IG_ACCESS_TOKEN=<Generate token-in verdiyi token>
IG_USER_ID=<user_id, yalnız rəqəmlər>
IG_ENABLED=1
# istəyə bağlı:
# IG_LANG=az                    # az | en | ru | tr | ar — kartın və caption-un dili
# IG_SLOTS=08:00,13:00,20:00    # Asia/Baku, ən çox 6; 1-ci ayə, 2-ci hədis, 3-cü dua/ad (sonra təkrarlanır)
# IG_STORIES=1                  # 0 — yalnız feed postu
# IG_API_VERSION=v27.0          # Meta versiyanı köhnəltsə yeniləyin
```

Kartın önizləməsi (panel / CLI `preview`) token olmadan da işləyir; `token-info` və dərc `IG_ENABLED=1` tələb edir.
`IG_ENABLED=1` olandan sonra ilk dərc növbəti yuva vaxtında (və ya "İndi dərc et" ilə) olur.

### 5. api env-i oxusun

`api.env` yalnız api konteyneri **yaradılanda** oxunur. TELEGRAM-BOT.md → "3. api env-i oxusun" ilə eyni: ən təhlükəsizi
növbəti adi deploy-u gözləmək; dərhal lazımdırsa infra/README.md → "Sirri dəyişmək" (yalnız api; **çılpaq
`docker compose up -d` YOX**).

### 6. Yoxlayın

```sh
cd /opt/muslimscc
TAG=$(cat .current_tag) docker compose exec -T api node scripts/instagram.js token-info   # @hesab, ID uyğunluğu, kvota
TAG=$(cat .current_tag) docker compose exec -T api node scripts/instagram.js status       # yuvalar, növbəti, son dərclər
TAG=$(cat .current_tag) docker compose exec -T api node scripts/instagram.js preview 1 --format story > /tmp/card.jpg
```

- Admin paneli → **Instagram**: vəziyyət "Açıqdır", növbəti yuva; "Kartı göstər" — önizləmə (dərc etmir).
- İlk dərci gözləməmək üçün: panel → "İndi dərc et" (təsdiqlə) və ya
  `… node scripts/instagram.js publish-now --slot 0 --yes` (yuva başına gündə bir dəfə).
- Loqda `Instagram: avtorizasiya xətası` görünsə — token səhvdir / vaxtı keçib (addım 3-ü təkrarlayın, 4–5).
- **Cloudflare:** Instagram serverləri şəkli `https://muslims.cc/api/ig/card/…` ünvanından çəkir. WAF / Bot Fight / "Block AI
  bots" qaydası Meta-nın crawler-ini (`facebookexternalhit`) bloklasa konteyner `ERROR` olur (status: "media"). Bu halda
  Cloudflare → Security → Events-də baxın və `/api/ig/card/` yoluna istisna verin.

## Token

- App Dashboard tokeni 60 gün etibarlıdır. Server onu **həftədə bir** `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token`
  ilə yeniləyir (ilk dəfə ən azı 2 gün sonra — Meta: token ən azı 24 saatlıq olmalıdır). Yeni token bazada
  (`instagram_state`) **AES-256-GCM** ilə saxlanır; açar `api.env`-dəki tokendən törədilir — baza ehtiyat nüsxəsi tək başına
  tokeni açmır. `api.env`-də token dəyişəndə köhnə qeyd avtomatik etibarsız olur və yeni env tokeni istifadə olunur.
- Server 60 gündən çox söndürülmüş qalsa (yenilənmə olmasa) token bitər → addım 3–5.
- **Facebook Login variantı** (hesab Facebook Page-ə bağlıdırsa, ya da Meta "Unified Login" tələb etsə):
  `IG_API_HOST=graph.facebook.com`; icazələr `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
  (+ Business Manager ilə rol verilibsə `ads_management` / `ads_read`); token — Page access token (uzunömürlü user tokendən
  alınan Page tokeni bitmir) və ya Business system user tokeni. Bu variantda server tokeni yeniləmir.

## Söndürmək

- Müvəqqəti: `api.env` → `IG_ENABLED=0` (api yenidən yaradılanda). Artıq dərc olunanlar Instagram-da qalır.
- Tam: `IG_*` sətirlərini silin; Meta tətbiqində **Instagram → API setup → Remove account** (token etibarsız olur).
  Cədvəllər (`instagram_posts`, `instagram_state`) istifadəçi məlumatı saxlamır; silmək üçün:
  `TAG=$(cat .current_tag) docker compose exec -T api node -e "const d=new (require('node:sqlite').DatabaseSync)(process.env.DB_PATH);d.exec('DELETE FROM instagram_state; DELETE FROM instagram_posts')"`

## Məhdudiyyətlər

- Kartın ərəbcə hissəsi sharp/pango-nun Amiri ilə formalaşdırmasıdır — yeni deploy-dan sonra bir dəfə önizləmə ilə gözlə
  yoxlayın (testlər yalnız ölçü / JPEG yoxlayır).
- Ayə üçün alquran.cloud əlçatmazdırsa yuva təkrar cəhd edir (≤ 5); bütün cəhdlər uğursuz olsa həmin gün ayə postu olmur.
- Story-də link stikeri API ilə dəstəklənmir (Meta) — story yalnız kartdır.
