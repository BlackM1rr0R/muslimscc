# Instagram avtoposteri

Kod: `server/instagram.js` (planlayıcı, Graph API, kart marşrutu, admin API), `server/instagramCard.js` (kartın çəkilməsi —
sharp/libvips, ərəbcə Amiri ilə düzgün birləşir), `server/instagram-data.js` (dualar + Allahın 99 adı; yaradan:
`node scripts/build-instagram-data.mjs`), `server/fonts/` (Amiri Quran + Amiri + MccInter, OFL 1.1; yaradan: `python scripts/build-ig-fonts.py`),
`server/scripts/instagram.js` (CLI), `src/components/admin/InstagramManager.jsx` (admin bölməsi).
Testlər: `tests/unit/server-instagram.test.js`, `tests/unit/server-instagram-growth.test.js`.

**Açarlar yoxdursa tam sönülüdür:** `api.env`-də `IG_ENABLED=1` + `IG_ACCESS_TOKEN` + `IG_USER_ID` olmasa
`/api/ig/*` → 404, planlayıcı işləmir, Instagram-a heç bir sorğu getmir, libvips yüklənmir. Kod hesab qurulmadan da deploy oluna bilər.
Admin panelində "Instagram" bölməsi vəziyyəti göstərir; baş admin kartın önizləməsini dərc etmədən görə bilər.

> Köhnə `scripts/social/` (Python + model caption) 2026-11-25-də silindi — bu modul onu tam əvəz edir (caption-lar yalnız saytın mənbəli mətnindən).

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
- Caption (yalnız feed; story caption qəbul etmir) **ikidillidir** (`IG_CAPTION_LANGS`, susmaya görə `az,en`): açar sözlü
  1-ci sətir (`Günün ayəsi: Əhzab 33:3 | Verse of the Day`), ərəbcə, az tərcümə, `—`, ingiliscə tərcümə, sonra `— mənbə` (az),
  saytdakı səhifənin az linki, ≤ 5 heşteq (aşağıda "Böyümə").
  Hər iki tərcümə eyni elementin saytdakı mətnidir: ayə — alquran.cloud `en.asad` (saytın Quran oxuyucusu ilə eyni nəşr),
  hədis — `daily-hadith-data.js`, dua / ad — `instagram-data.js`. Elementin ingiliscə sayt mətni yoxdursa və ya caption
  2200 simvolu keçirsə, həmin post yalnız az olur — heç vaxt tərcümə edilmir. **Kart** təkdillidir (`IG_LANG`).
  Reytinq, "bəyən / izlə" dili yoxdur.
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
# IG_LANG=az                    # az | en | ru | tr | ar — KARTIN dili
# IG_CAPTION_LANGS=az,en        # caption: 1-ci əsas dil (mənbə, link), 2-ci — əlavə tərcümə; "az" — yalnız az
# IG_SLOTS=08:00,13:00,20:00    # Asia/Baku, ən çox 6; 1-ci ayə, 2-ci hədis, 3-cü dua/ad (sonra təkrarlanır)
# IG_STORIES=1                  # 0 — yalnız feed postu
# IG_API_VERSION=v27.0          # Meta versiyanı köhnəltsə yeniləyin
# IG_REELS=1                    # günün Quran passajının reel-i (aşağıda "Reels"); susmaya görə sönülü
# IG_REEL_TIME=18:00            # reel-in dərc vaxtı (Asia/Baku)
# IG_CAROUSEL=1                 # həftəlik karusel (aşağıda "Böyümə"); susmaya görə sönülü
# IG_CAROUSEL_DAY=5             # 0 bazar … 5 cümə … 6 şənbə
# IG_CAROUSEL_TIME=11:00        # Asia/Baku
# IG_ALT_TEXT=0                 # feed / karusel şəkillərinin alt_text-ini söndürür (susmaya görə açıq)
# IG_LOCATION_ID=<rəqəm>        # məkan teqi (feed, reel, karusel); susmaya görə yoxdur
# IG_INSIGHTS=0                 # statistikanı söndürür (susmaya görə açıq; icazə yoxdursa özü dayanır)
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
  Cədvəllər (`instagram_posts`, `instagram_state`, `instagram_insights`) istifadəçi məlumatı saxlamır; silmək üçün:
  `TAG=$(cat .current_tag) docker compose exec -T api node -e "const d=new (require('node:sqlite').DatabaseSync)(process.env.DB_PATH);d.exec('DELETE FROM instagram_state; DELETE FROM instagram_posts; DELETE FROM instagram_insights')"`

## Ərəb mətninin çəkilməsi

- Quran mətni (ayə, Allahın adları — Uthmani yazılışı) **Amiri Quran** ilə, hədis və dua **Amiri** ilə çəkilir (saytın
  özü də Amiri işlədir). Amiri Quran dayanma işarələrini, xəncər əlifi (ٰ), kiçik hərfləri düzgün oturdur. ۡ (U+06E1) mushafdakı
  kimi "xa başı" formasındadır — bu, sükunun Uthmani yazılışıdır, xəta deyil.
- alquran.cloud dayanma işarəsini (ۚ ۖ ۗ …) sözdən boşluqla ayırır. Kartda həmin boşluq göstərilmir (Tanzil / mushafdakı kimi
  işarə sözün üstündədir) — hərflər və işarələr eynidir, caption-da mətn olduğu kimidir. Əks halda sətir işarə ilə başlaya
  bilirdi və HarfBuzz ona ◌ (U+25CC) qoyurdu (99 ayədən 36-sı bəzi enlərdə).
- Hər element çəkilməzdən əvvəl yoxlanır: şriftdə olmayan simvol və ya söz əvvəlində duran hərəkə varsa element **atlanır**
  (loga bir dəfə: `Instagram: <açar> atlandı — …`), sıradakı götürülür. Mətn heç vaxt dəyişdirilmir.
- Bütün hovuzu yoxlamaq (deploy-dan sonra konteynerdə bir dəfə; fontconfig-in hər ailə adına düzgün üz verdiyini də yoxlayır):
  `TAG=$(cat .current_tag) docker compose exec -T api node scripts/instagram.js check-glyphs` (`--render` — hamısını çəkir, yavaş).

## Məhdudiyyətlər

- Kartın ərəbcə hissəsi sharp/pango-nun Amiri ilə formalaşdırmasıdır — yeni deploy-dan sonra bir dəfə önizləmə ilə gözlə
  yoxlayın (testlər yalnız ölçü / JPEG yoxlayır).
- Ayə üçün alquran.cloud əlçatmazdırsa yuva təkrar cəhd edir (≤ 5); bütün cəhdlər uğursuz olsa həmin gün ayə postu olmur.
- Story-də link stikeri API ilə dəstəklənmir (Meta) — story yalnız kartdır.

## Reels (günün Quran passajının videosu)

Gündə bir **Reel** (1080×1920, 9:16, 30 fps, **45–89 s**; 2026-11-27-dən tək ayə yox — ardıcıl ayələrdən **passaj**).
Ayələr növbə ilə göstərilir: ərəbcə mətn kartın dizaynında (zümrüd / qum, xatəm, Amiri Quran, dayanma işarəsi sözə bitişik)
sağdan sola "mürəkkəblə yazılır", tərcümə söz-söz görünür, yuxarıda kiçik "surə:ayə" sayğacı ("23:5"); ayə bitəndə sönür,
növbəti yazılır. Daim görünən: başlıq ("VERSES OF THE QURAN"), istinad ("Al-Muminoon 23:1-9"), "Recitation: Mishary Rashid
Alafasy", muslims.cc. Səs — ayələrin tilavəti, **saytın Quran səsi ilə eyni mənbə və qari** (cdn.islamic.network,
`ar.alafasy` 128 kbps; ehtiyat verses.quran.com — src/utils/quranAudio.js); ayələrin faylları ffmpeg ilə PCM-ə açılıb
**arasız** birləşdirilir, ayə sərhədi = səs sərhədi (sinxron). Müddət = 0.8 s + tilavət + 2.2 s (ən azı 15 s).
Mətn dəyişdirilmir və qısaldılmır.

**Dil:** reel-in tərcüməsi / başlığı / tilavət sətri `IG_REEL_LANG` repo dəyişənindədir (en | az | ru | tr, susmaya görə
**en**); ingiliscə tərcümə saytın və postların ingiliscə nəşridir (`en.asad`, alquran.cloud — daily-ayah.js `EDITIONS`).
Caption isə serverin `IG_CAPTION_LANGS`-ı ilə yazılır (prod: `en`) — ikisi eyni olsun (fərqlidirsə server loga bir dəfə
xəbərdarlıq yazır, dərc dayanmır).

**Passajlar** (`server/instagramReel.js` → `REEL_PASSAGES`, yalnız istinad; gün üzrə deterministik növbə — `passageRef`,
addım 7, 26 passaj → 26 gündə hər biri bir dəfə): 1:1-7, 2:1-5, 3:26-27, 3:190-194, 13:28-29, 17:23-24, 23:1-11, 25:63-67,
36:1-12, 39:53-54, 55:1-16, 59:22-24, 67:1-5, 78:1-16, 87:1-13, 87:14-19, 91:1-15, 93:1-11, 94:1-8, 97:1-5, 99:1-8, 100:1-11,
101:1-11, 102:1-8, 113:1-5, 114:1-6. Qaydalar:
- tilavət 86 s-dən uzundursa (video ≤ 89 s) — **ən uzun bütöv ayə prefiksi** (`trimPassage`; ayə heç vaxt kəsilmir):
  3:190-194 → 3:190-192, 23:1-11 → 23:1-9, 36:1-12 → 36:1-9, 55:1-16 → 55:1-12;
- hər hansı ayə kartda minimal ölçüdə (ərəbcə 44 px, tərcümə 32 px) sığmırsa və ya qlif yoxlamasından keçmirsə — sıradakı passaj;
- siyahıda **yoxdur**: 2:255, 2:284-286 (bir ayə bir ekrana sığmır — həmişə atlanardı), 112 (13 s), 103 (20 s) — çox qısa.
  13:28-29, 87:14-19, 94, 97, 113, 114 45 s-dən qısadır (24–41 s) — saxlanılıb (məşhurdur); istəsəniz siyahıdan çıxarın.
- Hədd: Meta Content Publishing API REELS üçün 3 s – 15 dəq qəbul edir, amma Instagram 90 s-dən uzun reel-ləri
  izləməyənlərə tövsiyə etmir, `reelInfo` 90 s-dən uzun faylı rədd edir — `PASSAGE_MAX_SEC = 89`.

**Necə işləyir** (video serverdə ÇƏKİLMİR — 1 GB RAM):

1. `.github/workflows/ig-reel.yml` hər gün **02:30 UTC** (06:30 Bakı): `scripts/ig-reel/render.mjs` bu günün (Asia/Baku)
   reel-ini çəkir — sharp/pango ilə kadrlar (kartla eyni kod: `server/instagramCard.js`), ffmpeg ilə H.264 High yuv420p
   bt709, 30 fps, qapalı GOP, AAC 128k 48 kHz stereo, `+faststart`, edit list yoxdur, ≤ 15 MB (Meta Reels tələbləri:
   MP4, moov əvvəldə, H.264/HEVC, AAC ≤ 48 kHz, 23–60 fps, 9:16 tövsiyə olunur, 3 s – 15 dəq). Ölçü: CRF 20 + VBV həddi
   (`maxrate` müddətə görə — fayl 15 MB-ın ~90 %-nə sığır; 83 s nümunə ≈ 9.9 MB). Sabit kadrlar keşlənir — 83 s reel
   ~30 s-də çəkilir. MP4, `reel.json` və 3 kadr (`frame-1-hook`, `frame-2-ink`, `frame-3-cover`) artefakt kimi 7 gün
   saxlanır (Actions → run → Artifacts) — baxmaq üçün.
2. Passaj seçimi yuxarıdakı qaydalarla (`passageRef(date, k)`; k=0 sığmırsa k+1 …, ən çox 8 cəhd).
3. Yükləmə deploy ilə **eyni SSH açarı** ilə (sirlər `DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` — yeni sirr yoxdur).
   Açar serverdə yalnız `ci-gate.sh`-ı işlədir; əmr `ig-reel <tarix> <ref> <alafasy|none> [en|az|ru|tr]` (stdin — MP4)
   tarixi / istinadı (tək ayə `33:3` və ya passaj `67:1-5`, sıfırsız rəqəmlər) / səs rejimini / dili (allowlist), ölçünü
   (10 KB – 15 MB) və MP4 imzasını yoxlayır və faylı işləyən api konteynerinin həcminə yazır: `/data/ig-cards/<tarix>-reel.mp4`
   + `<tarix>-reel.json` (`{"ref":"23:1-9","audio":"alafasy","lang":"en"}`; dilsiz köhnə forma — `lang` yoxdur), atomik `mv`.
   Keçid: serverdəki köhnə `ci-gate.sh` 5-ci arqumenti "artıq arqument" ilə rədd edir — workflow onda dilsiz formaya keçir.
   Server sidecar-ı `parseMeta` ilə yoxlayır: istinad köhnə tək ayə siyahısında (AYAH_REFS) və ya `REEL_PASSAGES`-dəki
   passajın eyni ayədən başlayan bütöv prefiksi olmalıdır.
   Workflow push-da işləmir, ayrı concurrency qrupundadır — deploy-u bloklamır; deploy eyni anda gedirsə 3 dəfə təkrar cəhd edir.
4. `server/instagram.js` (`IG_REELS=1`): `IG_REEL_TIME`-da (susmaya görə 18:00, +90 dəq tutma) fayl varsa
   `POST /{ig-user-id}/media` — `media_type=REELS`, `video_url=https://muslims.cc/api/ig/card/<tarix>-reel.mp4`,
   `caption` (`IG_CAPTION_LANGS` dillərində, digər postlar kimi; başlıq passajda "Verses of the Quran: Al-Mulk 67:1-5", tək
   ayədə "Verse of the day: …"; + "Recitation: Mishary Rashid Alafasy" — iki dildə "Tilavət / Recitation: …"; ərəbcə +
   tərcümə 2200-ü keçirsə — mətnsiz qısa caption: başlıq, istinad, keçid, tilavət, heşteqlər), `share_to_feed=true`,
   `thumb_offset` (son saniyə — bütün mətn görünür) → status ~5 dəq artan fasilə ilə (5, 5, 10 … 30 s) → `media_publish`.
   Bir dəfə dərc / iki proses / təkrar cəhd — digər yuvalar kimi (`instagram_posts`, format `reel`).
   Fayl yoxdursa (CI işləməyib) — loga bir dəfə `reel faylı yoxdur … reel atlandı`, həmin gün reel olmur.
   Video `/api/ig/card/<tarix>-reel.mp4` ünvanından **Range** (206) dəstəyi ilə verilir (nginx `^~ /api/ig/`); 7 gündən
   köhnə reel faylları kartlarla birlikdə silinir.
5. Admin → Instagram → **Reel** bölməsi: bu günün faylı (istinad, səs, dil, müddət, ölçü), dərc vəziyyəti; superadmin üçün
   "Videoya bax" keçidi.

**Yandırmaq (lead / sahib):**

1. `infra/ci-gate.sh`-ın yeni versiyasını serverə köçürün (infra faylları əl ilə köçürülür — zero-downtime-deploy qaydası):
   `git show HEAD:infra/ci-gate.sh | ssh <server> "cat > /opt/muslimscc/ci-gate.sh.new && chmod 755 /opt/muslimscc/ci-gate.sh.new && mv /opt/muslimscc/ci-gate.sh.new /opt/muslimscc/ci-gate.sh"`.
   (köçürmədən əvvəl `sh -n` ilə yoxlayın; köhnə qapı ilə də reel yüklənir — dilsiz, `lang` sidecar-da olmur.)
   Dil: GitHub → Settings → Secrets and variables → Actions → **Variables** → `IG_REEL_LANG` (en | az | ru | tr;
   yoxdursa `en`) — serverin `IG_CAPTION_LANGS`-ının 1-ci dili ilə eyni olsun.
2. Actions → **Instagram reel** → Run workflow (`upload` açıq) → artefaktdakı MP4-ə baxın; serverdə fayl:
   `TAG=$(cat .current_tag) docker compose exec -T api ls -la /data/ig-cards`.
3. `api.env` → `IG_REELS=1` (istəsəniz `IG_REEL_TIME=18:00`), api-ni yenidən yaradın (yuxarıda "5. api env-i oxusun";
   çılpaq `docker compose up -d` YOX). Panel → Instagram → Reel: "hazırdır" görünməlidir.

**Risklər və ehtiyat variantlar:**

- **Səs:** Instagram tilavəti müəllif hüququ ilə qorunan səs kimi tanıyıb **səssizləşdirə** və ya reel-in yayılmasını
  məhdudlaşdıra bilər (Content ID). Belə olsa: GitHub → Settings → Secrets and variables → Actions → **Variables** →
  `IG_REEL_AUDIO=none` — video səssiz çəkilir (səssiz AAC trek), caption-da "Tilavət" sətri olmur, kadrda qari adı göstərilmir.
  Geri qaytarmaq — dəyişəni silin.
- Meta `video_url`-i Cloudflare üzərindən çəkir: WAF / Bot Fight qaydası `facebookexternalhit`-i bloklasa konteyner `ERROR`
  olur (status "media", ≤ 5 cəhd). 404 cavabları `no-store`-dur (keşlənmir); 200 cavabı 5 dəq keşlənir.
- 24 saatlıq dərc limiti (100 post) reel-i də sayır — gündə 7 (3 post + 3 story + 1 reel), problem deyil.
- Reel passajı 08:00 ayə postundan ayrıca seçilir (`passageRef`); köhnə tək ayə köməkçiləri (`reelRef`, `reelTimeline`,
  `REEL_MAX_SEC`) geriyə uyğunluq üçün `instagramReel.js`-də qalır (server/tiktok.js də bu modulu oxuyur).
- Video kadrları HarfBuzz/pango ilə kartdakı kimi formalaşır; animasiya eyni paraqrafın "yalnız bu söz görünür" (qalanları
  şəffaf) variantlarıdır — sətir bölgüsü və mövqelər tam paraqrafla piksel-piksel eynidir (reel kənarları kartdan
  genişdir: Reels-in düymələri / caption-u altında mətn qalmasın).
- Yerli çəkmək: `node scripts/ig-reel/render.mjs --date 2026-11-29 --lang en --out /tmp/reel.mp4 --meta /tmp/reel.json
  --frames /tmp/frames [--ref 67:1-5] [--audio none] [--ffmpeg <yol>]` (`npm ci --prefix server` + ffmpeg lazımdır).
- Tərcümə şriftində (MccInter) olmayan simvol olan ayə çəkilmir (passaj atlanır); `en.asad`-dakı yumşaq defis (U+00AD)
  görünməz sayılır — pango onu yalnız sətir sonunda "-" kimi çəkir.

## Böyümə (orqanik əhatə, Explore, izləyicilər — yalnız qanuni üsullar)

Follow/unfollow, "engagement pod", alınmış izləyici, spam heşteqləri **yoxdur**. Hamısı `server/instagram.js`-dədir,
testlər: `tests/unit/server-instagram-growth.test.js`. Admin → Instagram → "Kəşf ayarları", "Həftəlik karusel", "Statistika".

| Funksiya | Susmaya görə | Açar |
|---|---|---|
| Açar sözlü 1-ci sətir + növbələşən heşteqlər (≤ 5) | **açıq** | — |
| `alt_text` (feed şəkli, karusel kartları) | **açıq** | `IG_ALT_TEXT=0` söndürür |
| Məkan teqi (`location_id`) | sönülü | `IG_LOCATION_ID=<rəqəm>` |
| Həftəlik karusel | sönülü | `IG_CAROUSEL=1` (+ `IG_CAROUSEL_DAY`, `IG_CAROUSEL_TIME`) |
| Statistika (insights) | **açıq** (icazə yoxdursa özü dayanır) | `IG_INSIGHTS=0` söndürür |
| Reel-in ilk kadrı (hook) | **açıq** | — (CI renderi) |

### Caption və heşteqlər

- Instagram axtarışı caption-u indeksləyir: 1-ci sətir `Başlıq: istinad | 2-ci dilin başlığı`, məs.
  `Günün ayəsi: Əhzab 33:3 | Verse of the Day`, `Allahın gözəl adları: Ər-Rəhman`. 140 simvoldan uzundursa — yalnız başlıq.
- Heşteqlər: hər növ (ayə, hədis, dua, ad, reel, karusel mövzusu) üçün kiçik, mövzuya uyğun hovuz (`HASHTAGS`), az / en / ru / tr / ar.
  Postda: `#muslimscc` + əsas dilin lövbəri + 2-ci dilin lövbəri + əsas dildən 1 növbələşən + 1 ərəbcə = **≤ 5**.
  Seçim günə görə deterministikdir (eyni gün — eyni, gündən günə dəyişir) — eyni caption bloku hər gün təkrarlanmır.
  Səbəb: Instagram (Mosseri, 2024–2025) 3–5 uyğun heşteq tövsiyə edir və 2025-in sonunda postda heşteq sayını 5-ə endirdi;
  heşteqlər daha çox mövzunu təsnif edir, əhatəni özü artırmır. Nəhəng ümumi (`#love`, `#instagood`) və
  "follow4follow / like4like" tipli (spam / məhdudlaşdırılmış ola bilən) teqlər işlədilmir.
  Yeni teq əlavə etməzdən əvvəl Instagram-da axtarın: "Recent posts are hidden…" yazısı varsa teq məhdudlaşdırılıb — işlətməyin.
- Mətn qaydaları dəyişmir: yalnız saytın mənbəli mətni, qısaltma yoxdur, ≤ 2200 simvol (sığmırsa yalnız əsas dil, sonra ərəbcəsiz,
  yenə sığmırsa sıradakı element).

### alt_text (əlçatanlıq + təsnifat)

Content Publishing API (`POST /{ig-user-id}/media`) şəkil konteynerləri üçün `alt_text` qəbul edir (Meta 2025; reel və story üçün
yoxdur). Mətn kartın dilindədir və elementdən qurulur: `Günün ayəsi: Əhzab 33:3 — ərəb mətni və tərcüməsi`,
`Allahın gözəl adları: Ər-Rəhman — ərəbcə yazılışı, oxunuşu və mənası`. Story-yə göndərilmir.

**Ehtiyat:** Meta parametri rədd etsə (kod 100, alt kodsuz — məs. versiya / hesab növü dəstəkləmir) konteyner həmin parametr
olmadan dərhal yenidən yaradılır, loga **bir dəfə** `Meta "alt_text" parametrini qəbul etmədi` yazılır və proses yenidən
başlayana qədər onsuz davam edir. Dərc bu səbəbdən heç vaxt dayanmır. `location_id` üçün eyni (əvvəl məkan çıxarılır).

### Məkan (IG_LOCATION_ID) — sahibin addımı

`location_id` feed şəkli, reel və karusel (ana konteyner) üçün dəstəklənir; story-də yoxdur. Dəyər — məkanı təmsil edən
**Facebook Page-in ID-si** (rəqəm). Bizim tokenin `pages_read_engagement` / "Page Public Metadata Access" icazəsi yoxdur, ona görə
server ID-ni özü axtarmır və susmaya görə məkan **qoyulmur**. ID-ni tapmaq:

1. Ən sadə: Facebook-da "Baku, Azerbaijan" (və ya konkret məkanın) rəsmi səhifəsini açın → **About → Page transparency** →
   **Page ID**. Və ya Graph API Explorer-də (öz şəxsi tokeninizlə, serverin tokeni ilə YOX):
   `GET /pages/search?q=Baku&fields=id,name,location` (bu sorğu `pages_read_engagement` + Page Public Metadata Access tələb edir).
2. Instagram veb-də məkan səhifəsinin ünvanındakı rəqəm (`instagram.com/explore/locations/<rəqəm>/…`) bəzən eyni ID-dir —
   əmin deyilsinizsə 1-ci üsulu işlədin.
3. `api.env` → `IG_LOCATION_ID=<rəqəm>`, api-ni yenidən yaradın (yuxarıda "5. api env-i oxusun"). Növbəti feed postunda Instagram-da
   məkan görünməlidir; loga `Meta "location_id" parametrini qəbul etmədi` düşübsə ID yanlışdır — dəyəri silin və ya düzəldin.

### Həftəlik karusel (IG_CAROUSEL=1)

- Susmaya görə **cümə 11:00** (Asia/Baku; `IG_CAROUSEL_DAY` 0–6, `IG_CAROUSEL_TIME`), +90 dəq tutma. 7 kart (4:5):
  **üz qabığı** ("Həftənin seçməsi", mövzu, elementlərin istinadları / adların oxunuşu), **5 element** (adi kartlar kimi),
  **bağlanış kartı** ("Hər gün ayə, hədis və dua — @muslimscc, muslims.cc" — "izləyin / bəyənin" çağırışı yoxdur).
- Mövzu həftəyə görə növbələşir: **Allahın gözəl adları** (`names99.js`, ardıcıl 5 ad) → **Buxari və Müslimdən hədislər**
  (`daily-hadith-data.js`, yalnız Buxari / Müslim — "Səhih" qaydası) → **Quran ayələri** (`AYAH_REFS`, alquran.cloud; qısa
  surələrin kontekstsiz 1-ci ayələri atlanır). **Hisnul-Müslim işlədilmir** — tərcümələri AI köməyi ilə hazırlanıb.
  Sığmayan / ərəb yoxlamasından keçməyən element atlanır, sıradakı götürülür; 3-dən az qalsa karusel o həftə olmur (`failed`).
- Caption: `Həftənin seçməsi — <mövzu> | <ingiliscə mövzu>`, nömrəli siyahı (istinadlar; adlarda oxunuş · ərəbcə — məna),
  bölmənin linki, ≤ 5 heşteq.
- Axın (Meta Content Publishing): hər kart üçün uşaq konteyner `image_url` + `is_carousel_item=true` (+ `alt_text`) → hamısı
  `FINISHED` → ana konteyner `media_type=CAROUSEL`, `children=<id,…>`, `caption` (+ `location_id`) → `FINISHED` → `media_publish`.
  Kartlar `/api/ig/card/<tarix>-carousel-<0-9>.jpg` (7 gün saxlanır). Bir dəfə dərc / təkrar cəhd — digər yuvalar kimi
  (`instagram_posts`, format `carousel`). 24 saatlıq limitdə karusel 1 post sayılır.
- Yandırmazdan əvvəl baxın: `TAG=$(cat .current_tag) docker compose exec -T api node scripts/instagram.js carousel-preview --date <cümə> --dir /tmp/car`
  (kartlar + caption + alt_text-lər; dərc etmir).

### Reel-in ilk kadrı

Instagram güclü ilk kadrı (və üz qabığını) üstün tutur. `scripts/ig-reel/render.mjs`: başlıq ("VERSES OF THE QURAN"),
sayğac ("23:1"), istinad ("Al-Muminoon 23:1-9"), tilavət sətri və muslims.cc **t=0-dan tam görünür**, 1-ci ayənin ərəbcə
mətni zəif iz kimi (16 %) durur və mürəkkəb onun üstündən yazır — ilk kadr boş deyil. Üz qabığı (`thumb_offset`) — son
saniyə: son ayə (ərəbcə + tərcümə) tam görünür.

### Statistika (insights) — sahibin addımı

Gündə bir dəfə (05:00-dan sonra, saatlıq işdə) son 30 günün feed / reel / karusel postları üçün
`GET /{media-id}/insights?metric=reach,saved,shares,likes,comments,views` (dəstəklənməsə `views`-siz) → cədvəl `instagram_insights`
(yalnız öz postlarımızın ümumi rəqəmləri; istifadəçi məlumatı yoxdur; 180 gündən sonra silinir). Admin → Instagram →
"Statistika": növ və vaxt üzrə orta əhatə / saxlanma / paylaşılma, ən yüksək əhatəli növ və vaxt.

Token icazəsi yoxdursa (Graph kod 10 / 200–299) vəziyyət **"no_permission"** olur, panel izahı göstərir — **dərc dayanmır**
(planlayıcı bloklanmır). İcazəni əlavə etmək (Unified login, sistem istifadəçisi — bizim variant):

1. developers.facebook.com → tətbiq **muslimscc-poster** → **Use cases** → Instagram (API with Facebook login) → **Customize /
   Permissions** → `instagram_manage_insights` → **Add**. (Instagram Login variantında: `instagram_business_manage_insights`.)
2. business.facebook.com → **Settings → Users → System users** → sistem istifadəçisi → **Generate new token** → tətbiq →
   icazələr: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_read_engagement`
   (+ əvvəlki tokendəki digərləri) → token (bitmir).
3. Serverdə `api.env` → `IG_ACCESS_TOKEN=<yeni token>`, api-ni yenidən yaradın (yuxarıda "5. api env-i oxusun"; çılpaq
   `docker compose up -d` YOX). Token heç yerə (çat, repo) yazılmır.
4. Ertəsi gün panel → Statistika: "Yeniləndi" vaxtı və cədvəl görünməlidir; `scripts/instagram.js status` da göstərir.

### Saytdan Instagram-a

`src/config/brand.js` → `BRAND.instagram = 'muslimscc'`, `BRAND.instagramUrl = 'https://www.instagram.com/muslimscc/'`
(əvvəl səhv `muslims_cc` idi): footer-in "Əlaqə" sütunu, Organization JSON-LD `sameAs`, hüquqi sənədlərin əlaqə siyahısı,
`llms.txt` → "## Contact", mobil "Haqqımızda", Telegram botunun `/start` mesajı (5 dil).
