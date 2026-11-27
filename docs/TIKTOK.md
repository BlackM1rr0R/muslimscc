# TikTok yükləyicisi

Kod: `server/tiktok.js` (OAuth qoşulması, token, planlayıcı, yükləmə, admin API), `src/components/admin/TikTokManager.jsx`
(admin bölməsi "TikTok"). Test: `tests/unit/server-tiktok.test.js`.

Günün **reel videosu** — Instagram-a gedən EYNİ MP4 (`/data/ig-cards/<YYYY-MM-DD>-reel.mp4` + `.json`, `.github/workflows/ig-reel.yml`
GitHub Actions-da çəkir, `ci-gate.sh ig-reel` serverə yazır) — gündə bir dəfə @muslimscc TikTok hesabına göndərilir.
Bu modul faylı **yalnız oxuyur** (`instagramReel.js` köməkçiləri ilə), heç nə çəkmir və dəyişmir.

**Açarlar yoxdursa tam sönülüdür:** `api.env`-də `TIKTOK_ENABLED=1` + `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` olmasa
`/api/tiktok/*` → 404, planlayıcı işləmir, TikTok-a heç bir sorğu getmir. Kod hesab qurulmadan deploy oluna bilər.
Açarlar olsa da hesab admin panelindən **qoşulmayana** qədər heç nə göndərilmir.

## Sahibin addımları (bir dəfə)

1. **TikTok hesabı.** Telefonda @muslimscc hesabını yaradın (və ya mövcud hesab). Hesabın özünə toxunulmur — tətbiq yalnız
   video göndərmək icazəsi alır, şifrə heç vaxt lazım deyil.
2. **Developer hesabı.** https://developers.tiktok.com → *Log in* (eyni TikTok hesabı və ya ayrıca developer hesabı) →
   *Manage apps* → **Connect an app / Create app**. Tip: *Web*. Ad: `muslims.cc`, kateqoriya: *Education* / *Lifestyle*,
   təsvir: "Posts the verse-of-the-day video of muslims.cc to our own TikTok account". İkon, Terms URL
   (`https://muslims.cc/en/terms`), Privacy URL (`https://muslims.cc/en/privacy`), Platform: *Web*, Website `https://muslims.cc`.
3. **Məhsullar (Products → Add products):**
   - **Login Kit** → *Redirect URI* (Web): `https://muslims.cc/api/tiktok/callback` (dəqiq bu, sonda `/` YOX, parametr yox).
   - **Content Posting API** → əlavə edin. *Direct Post* ayarını yalnız sonra, birbaşa dərc lazım olanda açın (aşağıda).
4. **Scopes:** `user.info.basic` (susmaya görə), **`video.upload`** (qaralama / inbox rejimi). Birbaşa dərc üçün əlavə olaraq
   **`video.publish`** (Direct Post açılandan sonra).
5. **Sandbox.** Yeni tətbiq əvvəlcə *Sandbox*-dadır: *Sandbox → Target users* bölməsində @muslimscc hesabını əlavə edin
   (yalnız bu hesablar qoşula bilər). Sandbox-da sınaq üçün kifayətdir. Hamı üçün (Production) — *Submit for review*
   (tətbiqin ümumi yoxlaması; video, istifadə təsviri, ekran görüntüləri tələb olunur).
6. **Açarlar serverə.** *App details → Client key* və *Client secret* — **çata və ya repoya YAZMAYIN**. Rəhbər (lead) onları
   serverdə `/opt/muslimscc/api.env`-ə yazır:
   ```
   TIKTOK_ENABLED=1
   TIKTOK_CLIENT_KEY=…
   TIKTOK_CLIENT_SECRET=…
   # istəyə bağlı: TIKTOK_TIME=18:30  TIKTOK_MODE=inbox  TIKTOK_SOURCE=file
   ```
   api.env dəyişikliyi yeni api konteyneri tələb edir (deploy.sh image dəyişməyibsə yenidən yaratmır) — kəsintisiz:
   `docker compose up -d --no-deps --no-recreate --scale api=2 api`, sağlam olanı gözləyin, köhnəni stop + rm.
   **Heç vaxt adi `docker compose up -d` yox** (docs/TEAM.md).
7. **Qoşulma.** Admin paneli → **TikTok** → **TikTok-u qoş** (yalnız baş admin görür) → TikTok səhifəsində @muslimscc ilə
   daxil olun → *Authorize*. Panelə "TikTok hesabı qoşuldu" ilə qayıdırsınız. Bu, bir dəfəlikdir (aşağıda "Token").
8. **Sınaq.** Bu günün videosu hazırdırsa, paneldə **İndi göndər** → bir neçə dəqiqəyə TikTok tətbiqində *Gələnlər (Inbox)*
   bildirişi gəlir → aç → paneldəki **mətni kopyalayıb yapışdırın** → *Post*.
9. **Sonra (istəyə bağlı) — audit.** Videonun avtomatik, hamıya açıq dərci üçün: tətbiqdə *Content Posting API → Direct Post*
   açın, `video.publish` scope-u əlavə edin, tətbiqi **audit**ə göndərin (TikTok-un yoxlaması). Təsdiqdən sonra api.env-ə
   `TIKTOK_MODE=direct` + `TIKTOK_PRIVACY=PUBLIC_TO_EVERYONE`, paneldən **Yenidən qoş** (yeni scope üçün). Auditə qədər
   direct rejim yalnız `SELF_ONLY` (yalnız mən) ilə işləyir — bax "Audit qaydası" və "Risklər".

## Rejimlər

| Env | Susmaya görə | Mənası |
|---|---|---|
| `TIKTOK_MODE` | `inbox` | `inbox` — video sahibin TikTok *Gələnlər* qutusuna qaralama kimi düşür (`video.upload`), sahib tətbiqdə dərc edir. API caption qəbul ETMİR — mətn admin panelində kopyalanmaq üçün göstərilir. `direct` — birbaşa dərc (`video.publish`), caption = `post_info.title`. |
| `TIKTOK_PRIVACY` | `SELF_ONLY` | Yalnız `direct`: `SELF_ONLY` / `MUTUAL_FOLLOW_FRIENDS` / `FOLLOWER_OF_CREATOR` / `PUBLIC_TO_EVERYONE`. Hesabın `creator_info`-da qaytardığı seçimlərdə yoxdursa, o gün göndərilmir (`privacy_unavailable`). |
| `TIKTOK_TIME` | `18:30` | Asia/Baku. Server o vaxt işləmirdisə, 5 saat ərzində tutur. |
| `TIKTOK_SOURCE` | `file` | `file` — FILE_UPLOAD (serverdən PUT, domen təsdiqi lazım deyil). `url` — PULL_FROM_URL: TikTok `https://muslims.cc/api/tiktok/media/<tarix>-reel.mp4`-dən çəkir; developer portalda **URL prefix** `https://muslims.cc/api/tiktok/media/` təsdiqlənməlidir (*Manage apps → URL properties*), yoxsa `url_ownership_unverified`. |
| `TIKTOK_ALLOW` | `comment` | Yalnız `direct`: icazə verilən qarşılıqlı əlaqə (`comment,duet,stitch`). Duet / stitch susmaya görə bağlıdır (Quran tilavəti üzərində montaj yox). Hesab ayarında bağlıdırsa, həmişə bağlı qalır. |
| `TIKTOK_REDIRECT_URI` | `https://muslims.cc/api/tiktok/callback` | Yalnız başqa domen / lokal sınaq üçün; portaldakı ilə **eyni** olmalıdır. |

## TikTok API — dəqiq (developers.tiktok.com, 2026-11-26 vəziyyəti)

### OAuth v2 (Login Kit, Web)
- Razılıq: `GET https://www.tiktok.com/v2/auth/authorize/?client_key=…&scope=user.info.basic,video.upload&response_type=code&redirect_uri=…&state=…`
  (`disable_auto_auth=1` — razılıq səhifəsi həmişə göstərilir). Redirect URI: https, statik, parametrsiz, `#` yox, ≤ 512 simvol, ən çox 10.
- Qayıdış: `redirect_uri?code=…&scopes=…&state=…` və ya `error=…&error_description=…`.
- Token: `POST https://open.tiktokapis.com/v2/oauth/token/` (`application/x-www-form-urlencoded`): `client_key, client_secret, code,
  grant_type=authorization_code, redirect_uri` → `access_token, expires_in, refresh_token, refresh_expires_in, open_id, scope, token_type=Bearer`.
- Yeniləmə: eyni endpoint, `grant_type=refresh_token, refresh_token` → yeni cüt. **Rotasiya:** hər uğurlu yeniləmə YENİ
  `refresh_token` qaytarır, köhnəsi dərhal etibarsız olur — həmişə sonuncunu saxlayın.
- Ləğv: `POST /v2/oauth/revoke/` (`client_key, client_secret, token`).
- **Müddətlər:** sənəd (2026-11-05): access token **2 saat**, refresh token **180 gün** ("ilk verilmədən"). Köhnə nümunələrdə
  `expires_in: 86400` (24 saat) / `refresh_expires_in: 31536000` (365 gün) görünür. Kod sabit rəqəmə güvənmir — cavabdakı
  `expires_in` / `refresh_expires_in`-i saxlayır.

### Content Posting API (`https://open.tiktokapis.com`, `Authorization: Bearer <access_token>`, `Content-Type: application/json; charset=UTF-8`)
| Endpoint | Scope | Limit | Qeyd |
|---|---|---|---|
| `POST /v2/post/publish/creator_info/query/` | video.publish | 20/dəq | `privacy_level_options`, `max_video_post_duration_sec`, `comment/duet/stitch_disabled`, `creator_nickname`. Direct Post-dan əvvəl MÜTLƏQ. |
| `POST /v2/post/publish/video/init/` (Direct Post) | video.publish | 6/dəq | `post_info` {`title` ≤ 2200 UTF-16, `privacy_level` (creator_info seçimlərindən), `disable_duet/stitch/comment`, `video_cover_timestamp_ms`, `brand_content_toggle` (məcburi), `brand_organic_toggle`, `is_aigc`} + `source_info`. |
| `POST /v2/post/publish/inbox/video/init/` (Upload) | video.upload | 6/dəq | Yalnız `source_info` — **caption yoxdur**. 24 saatda ən çox 5 gözləyən qaralama (`spam_risk_too_many_pending_share`). |
| `POST /v2/post/publish/status/fetch/` | upload/publish | 30/dəq | `{publish_id}` → `status`: `PROCESSING_UPLOAD` / `PROCESSING_DOWNLOAD` / `SEND_TO_USER_INBOX` / `PUBLISH_COMPLETE` / `FAILED` (+ `fail_reason`). |

`source_info`: `FILE_UPLOAD` → `{video_size, chunk_size, total_chunk_count}`, cavabda `upload_url` (1 saat etibarlı);
`PULL_FROM_URL` → `{video_url}` (təsdiqlənmiş domen / URL prefix, https, yönləndirmə yox, 1 saat ərzində endirilməlidir).

**Hissələr (FILE_UPLOAD):** `PUT <upload_url>` + `Content-Type: video/mp4`, `Content-Length`, `Content-Range: bytes <ilk>-<son>/<cəmi>`,
ardıcıl. `< 5 MB` — bütöv (chunk_size = ölçü). Əks halda hər hissə 5–64 MB, `total_chunk_count = floor(video_size / chunk_size)`,
qalıq sonuncu hissəyə (≤ 128 MB), 1–1000 hissə. Cavab: 206 — davam, 201 — hamısı alındı, 5xx — həmin hissəni təkrarla,
403 — upload_url köhnəlib, 416 — Content-Range irəliləyişə uyğun deyil. Kodda: 10 MiB hissə (reel ~ 2–15 MB → adətən 1 PUT).

**Video tələbləri:** MP4 / H.264 (tövsiyə), 23–60 fps, tərəflər 360–4096 px, ≤ 4 GB; hər kəs 3 dəq, bəziləri 5–10 dəq.

**Audit qaydası:** auditdən keçməmiş tətbiqin Direct Post ilə göndərdiyi hər şey **yalnız `SELF_ONLY`** (məxfi) görünür;
24 saatda ən çox 5 istifadəçi; hesab dərc anında private olmalıdır (`unaudited_client_can_only_post_to_private_accounts`).
Inbox (Upload) rejimində dərci sahib özü tətbiqdə edir — görünməni də özü seçir.

## Necə işləyir

- **Qoşulma:** `GET /api/tiktok/connect` (admin sessiyası + superadmin; `Sec-Fetch-Site: cross-site` rədd edilir; admin kukisi
  SameSite=Strict olduğu üçün başqa saytdan keçid sessiyasız gəlir) → state = `<nonce>.<bitmə>.<admin>.<HMAC-SHA256>`
  (açar `TIKTOK_CLIENT_SECRET`-dən törəmə), 10 dəq, nonce bazada **bir dəfəlik** + `__Host-mcc_tt` (HttpOnly, Secure,
  **SameSite=Lax** — TikTok-dan üst səviyyəli qayıdışda gəlir) kukisi ilə brauzerə bağlı (login CSRF yoxdur).
  `GET /api/tiktok/callback` admin kukisini görmür (Strict) — yoxlama state + kuki + nonce ilədir; sonra kod mübadiləsi və
  panelə `303 <ADMIN_PATH>?tiktok=connected|denied|bad_state|exchange_failed|scope_missing`.
- **Token:** `tiktok_state` cədvəlində AES-256-GCM (açar client secret-dən; secret dəyişsə köhnə qeyd açılmır → yenidən qoşun).
  İstifadədən əvvəl ≤ 10 dəq qalıbsa və gündə bir dəfə yenilənir. İki proses (blue/green) eyni anda yeniləməsin deyə bazada
  kilid (`refresh_lock`, 60 s); `invalid_grant` alanda əvvəlcə bazada daha təzə token olub-olmadığı yoxlanır.
  Token, kod, secret heç vaxt loglanmır və admin API-də qaytarılmır.
- **Gündəlik:** 30 saniyədə bir; `TIKTOK_TIME`-dan sonra 5 saat ərzində, fayl varsa: caption (alquran.cloud, ingiliscə,
  dəyişdirilmədən: başlıq + ərəbcə + Asad tərcüməsi + `— Surə s:a` + "Read on the site: https://muslims.cc/en/quran?…" +
  "Recitation: Mishary Rashid Alafasy" + ≤ 5 heşteq; instagram.js-in reel caption qaydası) → (direct: creator_info) → init →
  PUT hissələr → status (~4 dəq). Bitməyibsə `processing`, sonra 30 dəqdən bir 3 gün izlənir (inbox: `sent` → sahib dərc
  edəndə `published`).
- **Bir dəfə:** `tiktok_posts.day UNIQUE` — `INSERT OR IGNORE` ilə tutan proses göndərir; yarımçıq sətir 15 dəq sonra yenidən
  götürülür.
- **Xətalar:** 5xx / şəbəkə / `rate_limit_exceeded` → 2 / 5 / 15 / 30 dəq fasilə, ≤ 5 cəhd. `access_token_invalid` → bir dəfə
  məcburi yeniləmə + təkrar. Yenə də, ya `scope_not_authorized`, `invalid_grant`, `auth_removed` → **planlayıcı dayanır**,
  bir dəfə loglanır, panel "yenidən qoşun" göstərir (yeni qoşulma bloku açır). Gündəlik limit (`spam_risk_too_many_posts`,
  `spam_risk_too_many_pending_share`, `reached_active_user_cap`) və konfiqurasiya xətaları (`unaudited_client…`,
  `privacy_level_option_mismatch`, `privacy_unavailable`, `duration_too_long`, `url_ownership_unverified`, `spam_risk*`) →
  o gün `failed`, növbəti gün yenidən.
- **Cədvəllər:** `tiktok_posts` (gün, rejim, element, caption, publish_id, status; 180 gün), `tiktok_state` (token — şifrəli,
  hesabın görünən adı, avtorizasiya xətası, OAuth nonce-ları 3 gün). İstifadəçi məlumatı yoxdur — `users`-ə bağlı deyil,
  hesab ixracına / xülasəyə düşmür. Miqrasiya yoxdur (`CREATE TABLE IF NOT EXISTS`).
- **nginx:** hamısı `/api/` prefiksindədir; callback-in uzantısı yoxdur, `.mp4` statik regex qaydasında deyil — ayrıca location lazım deyil.

## Admin API

| Marşrut | Rol | |
|---|---|---|
| `GET /api/admin/tiktok` | admin+ | vəziyyət, hesab adı, token müddətləri (dəyərsiz), bu günün faylı / göndərişi / caption, son 14 gün |
| `GET /api/tiktok/connect` | superadmin | TikTok razılıq səhifəsinə 302 |
| `POST /api/admin/tiktok/post` `{confirm:true}` | superadmin | bu günün videosunu indi göndər (gündə bir dəfə, eyni sətir), 202 |
| `POST /api/admin/tiktok/disconnect` `{confirm:true}` | superadmin | revoke + token silinir |

## Risklər və məhdudiyyətlər

- **TikTok-un "Intended Use" qaydası** Direct Post üçün deyir: "A utility tool to help upload contents to the account(s) you or
  your team manages" qəbul edilmir və API müştərisi geniş auditoriya üçün olmalıdır. Yəni öz hesabına avtomatik dərc üçün
  **audit rədd oluna bilər**. Inbox rejimi (qaralama, sahib özü dərc edir) bu riskdən asılı deyil — susmaya görə odur.
- **Watermark qaydası:** TikTok-a göndərilən məzmunda brend adı, loqo, link və ya reklam mətni olmamalıdır. Reel kadrında
  "muslims.cc" yazısı varsa, audit zamanı problem ola bilər (render ayrıca agentdədir — lazım olsa TikTok üçün yazısız variant).
- **FILE_UPLOAD vs PULL_FROM_URL:** sənəd "video artıq serverinizdədirsə PULL_FROM_URL işlədin" deyir. Audit üçün `TIKTOK_SOURCE=url`
  + URL prefix təsdiqi daha uyğundur; FILE_UPLOAD domen təsdiqsiz işləyir və sandbox / inbox üçün sadədir.
- Inbox rejimində caption avtomatik qoyulmur (API sahəsi yoxdur) — paneldən kopyalanır.
- Refresh token 180 gündən sonra (sənəd: "ilk verilmədən") bitə bilər — panel 14 gün qalmış "tezliklə yenidən qoşun" yazır.
- `TIKTOK_CLIENT_SECRET` dəyişsə, saxlanmış token açılmır → yenidən qoşulmaq lazımdır.
