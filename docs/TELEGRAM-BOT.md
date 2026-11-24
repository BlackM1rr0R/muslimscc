# Telegram botu

Kod: `server/telegramBot.js` (webhook, əmrlər, xatırlatma planlayıcısı), `server/prayerCities.js`
(saytın şəhər siyahısının surəti), `server/scripts/telegram-setup.js` (webhook qurulması),
`src/components/prayer/TelegramBotCard.jsx` (/prayer-dəki kart). Testlər: `tests/unit/server-telegram-bot.test.js`.

**Token yoxdursa bot tam sönülüdür:** `/api/telegram/*` → 404, planlayıcı işləmir, Telegram-a heç bir sorğu getmir.
`VITE_TELEGRAM_BOT` boşdursa saytda kart görünmür. Yəni kod bot yaradılmamış da deploy oluna bilər.

## Bot nə edir

Əmrlər istifadəçinin Telegram dilində (az / en / ru / tr / ar, qalan dillər → en), düymələrlə (inline keyboard):

| Əmr | Nə edir |
|---|---|
| `/start` | Salam + nə saxlanıldığı barədə qeyd + ölkə → şəhər seçimi |
| `/city` | Şəhəri dəyiş (saytın 98 şəhəri; Azərbaycan — Əbu Bəkr məscidinin cədvəli, digərləri — aladhan metod 13, saytdakı kimi) |
| `/times` | Bugünkü vaxtlar (sübh, günəş, zöhr, əsr, məğrib, işa) |
| `/next` | Növbəti namaza qalan vaxt |
| `/ayah` | Günün ayəsi (push ilə eyni seçim; ərəbcə + tərcümə alquran.cloud-dan, sayta keçid) |
| `/hadith` | Günün hədisi (push siyahısı `server/daily-hadith-data.js`; mənbə; "Səhih" yalnız Buxari/Müslim üçün) |
| `/remind on` / `/remind off` | Hər namaz vaxtında mesaj (şəhərin öz saatı ilə; `pushClaims` — iki proses eyni mesajı iki dəfə göndərmir) |
| `/stop` | Bütün məlumatı silir |

Yalnız şəxsi söhbətlər; qruplara cavab verilmir.

## Məxfilik

Cədvəl `telegram_chats (chat_id, lang, city, remind, created_at)` — sətir yalnız şəhər seçiləndə yaranır.
Ad, istifadəçi adı, telefon, mesaj mətni, IP saxlanmır və loglanmır. `/stop` və ya botun bloklanması (Telegram 403)
sətri dərhal silir. Məxfilik siyasətində "Telegram botu" bölməsi var (`src/pages/PrivacyPage.jsx`, 5 dil).

## Sahibin addımları

### 1. Botu yaradın (BotFather)

1. Telegram-da [@BotFather](https://t.me/BotFather) → `/newbot`.
2. Ad (görünən): məsələn `Muslims.cc`.
3. İstifadəçi adı (sonu `bot` olmalıdır): məsələn `MuslimsCcBot`.
4. BotFather **token** verir (`123456789:AA…`). Bunu heç yerə (repo, çat, GitHub) yazmayın — yalnız serverdəki `api.env`-ə.
5. İstəyə bağlı: `/setdescription`, `/setabouttext`, `/setuserpic` (sayt loqosu).
   Əmrlər menyusunu əl ilə yazmağa ehtiyac yoxdur — setup skripti 5 dildə yazır.

### 2. Token və webhook sirrini serverə yazın

Serverdə (root):

```sh
cd /opt/muslimscc
openssl rand -hex 32            # webhook sirri — çıxışı kopyalayın
nano api.env                    # fayl 600, root
```

`api.env`-ə iki sətir əlavə edin:

```
TELEGRAM_BOT_TOKEN=<BotFather-in verdiyi token>
TELEGRAM_WEBHOOK_SECRET=<openssl çıxışı: 24–256 simvol, yalnız A-Z a-z 0-9 _ ->
```

### 3. api env-i oxusun

`api.env` yalnız api konteyneri **yaradılanda** oxunur (`docker compose restart` köhnə env ilə qalır).
`infra/deploy.sh` image dəyişməyibsə api-ni yenidən yaratmır. Ona görə:

- **Ən təhlükəsiz:** token/sirri `api.env`-ə yazın və `server/`-də dəyişiklik olan növbəti adi deploy-u gözləyin
  (yeni api image → blue/green, kəsintisiz) — env avtomatik oxunur.
- **Dərhal lazımdırsa:** infra/README.md → "Sirri dəyişmək" (`TAG=$(cat .current_tag) docker compose up -d api` —
  yalnız api, bir neçə saniyəlik API fasiləsi; sayt işləyir). Bunu lead / sahib edir, **çılpaq `docker compose up -d`
  (bütün xidmətlər) YOX** (docs/TEAM.md).

Sonra loqda bu xəbərdarlıq olmamalıdır: `Telegram bot: … formatı yararsızdır` — görünürsə token/sirr səhv köçürülüb.

### 4. Webhook-u qurun

```sh
cd /opt/muslimscc
TAG=$(cat .current_tag) docker compose exec -T api node scripts/telegram-setup.js me     # bot düzgündürmü
TAG=$(cat .current_tag) docker compose exec -T api node scripts/telegram-setup.js set    # webhook + əmrlər menyusu (5 dil)
TAG=$(cat .current_tag) docker compose exec -T api node scripts/telegram-setup.js info   # vəziyyət, son xəta
```

Skript token və sirri heç vaxt çap etmir. `set` webhook-u `https://muslims.cc/api/telegram/webhook` ünvanına,
`secret_token` ilə qurur — server `X-Telegram-Bot-Api-Secret-Token` başlığını yoxlayır (sirr URL-də deyil: URL nginx / Cloudflare jurnallarına düşür). Botu müvəqqəti susdurmaq üçün: `… telegram-setup.js delete`.

Yoxlama: Telegram-da bota `/start` yazın → ölkə/şəhər düymələri gəlməlidir. `info` çıxışında `son xəta` olmamalıdır.
Cloudflare: `/api/telegram/` yolunu WAF/Bot Fight qaydası bloklamamalıdır (Telegram serverləri brauzer deyil);
`info` 403/5xx göstərsə Cloudflare → Security → Events-də baxın.

### 5. Saytda kartı göstərin

Bot adı açıq məlumatdır (sirr deyil) — GitHub sirri/dəyişəni lazım deyil. Repo kökündəki `.env.public`-də:

```
VITE_TELEGRAM_BOT=MuslimsCcBot
```

(`@` olmadan). Commit + push → CI build-i `.env.public`-i `.env.production.local`-a köçürür (ci.yml → Build,
infra/web.Dockerfile) və /prayer səhifəsində "Telegram botu" kartı (t.me linki) görünür.

## Söndürmək / silmək

- Müvəqqəti: `telegram-setup.js delete` (webhook silinir, bot cavab vermir).
- Tam: əvvəlcə `telegram-setup.js delete`, sonra `api.env`-dən iki sətri silin (api yenidən yaradılanda `/api/telegram/*` → 404).
  Məlumatı da silmək (backup-dan sonra):
  `TAG=$(cat .current_tag) docker compose exec -T api node -e "new (require('node:sqlite').DatabaseSync)(process.env.DB_PATH).exec('DELETE FROM telegram_chats')"`
- Kartı gizlətmək: `.env.public` → `VITE_TELEGRAM_BOT=` (boş).

## Məhdudiyyətlər

- Telegram toplu göndərişdə ~30 mesaj/san qəbul edir — planlayıcı mesajlar arasında 40 ms gözləyir (bir şəhərdə
  1500 abunəçi ≈ 1 dəq). Çox böyüsə növbə/paralel göndəriş lazım olacaq.
- Hənəfi əsri (məzhəb seçimi) botda yoxdur — vaxtlar saytın susmaya görə hesabıdır (Şafii/cumhur əsri).
- Xüsusi yer (koordinat) yoxdur — yalnız saytın şəhər siyahısı.
