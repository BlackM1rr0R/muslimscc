# Instagram avtoposter

Gündə 3 dəfə avtomatik post: doğrulanmış İslami məzmun → şəkil → caption → paylaşım.

## Necə işləyir

```
content.mjs   pool.json-dan təkrarsız element seçir (2299 element ≈ 766 gün)
render.py     1080×1350 JPEG çəkir (ərəb + az + en + mənbə)
caption.mjs   Claude ilə caption yazır, sonra onu yoxlayır
publish.mjs   Instagram Graph API ilə paylaşır
run.mjs       hamısını birləşdirir, jurnal yazır
```

## Təhlükəsizlik prinsipi

**Model müqəddəs mətn yaratmır.** Ayə, hədis, dua və adlar `pool.json`-dan
gəlir — saytın öz doğrulanmış data fayllarından qurulub, mənbəsi ilə birlikdə.
Claude yalnız ətrafdakı 2-3 cümləlik təfəkkürü və hashtag-ləri yazır.

Modelin cavabı `validate()`-dən keçir və bu hallarda **rədd edilir**:

- caption-da istinad izi var (`Buxari 8`, `Quran 2:255` kimi) — uydurma istinad riski
- caption-da ərəb mətni var — sitat gətirmə cəhdi
- çox qısa, çox uzun, və ya format pozuq

İki cəhd uğursuz olsa, modelsiz **şablon caption** işlədilir. Yəni sistem heç
vaxt yoxlanılmamış mətn paylaşmır və heç vaxt tamam dayanmır.

Hər post `log/posts.jsonl`-a yazılır — sonradan nəyin paylaşıldığını yoxlaya
bilərsən (`fallback: true` olanlar model işləmədən paylaşılanlardır).

---

## 1. Instagram tərəfi (əl ilə, bir dəfəlik)

Bunlar olmadan paylaşım mümkün deyil:

1. Instagram hesabını **Business** və ya **Creator**-a çevir (şəxsi hesab işləmir)
2. Onu bir **Facebook Səhifəsinə** bağla
3. [developers.facebook.com](https://developers.facebook.com) → yeni **app** yarat
4. App-a **Instagram Graph API** məhsulunu əlavə et
5. İcazələr: `instagram_basic`, `instagram_content_publish`,
   `pages_show_list`, `pages_read_engagement`
6. **Uzunömürlü access token** al və `IG_ACCESS_TOKEN`-ə yaz
7. Instagram Business hesabının rəqəm ID-sini al → `IG_USER_ID`

> Meta API-ni tez-tez dəyişir. `IG_API_VERSION` xəta versə, cari versiyanı
> developers.facebook.com-dan götürüb `.env`-ə yaz.

### Token yeniləmə

Uzunömürlü token **60 gün** qüvvədədir. Bitməzdən əvvəl yenilə:

```bash
curl -s "https://graph.facebook.com/v21.0/oauth/access_token\
?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET\
&fb_exchange_token=CARI_TOKEN"
```

Ayda bir təqvim xatırlatması qur — token bitəndə paylaşım səssizcə dayanır
(`log/posts.jsonl`-da `mode: "error"` görünəcək).

---

## 2. Serverdə qurulma

```bash
# Qovluq
mkdir -p /var/www/muslim-cc-api/social
cd /var/www/muslim-cc-api/social

# Fayllar (yerli kompüterdən FileZilla və ya scp ilə)
#   scripts/social/*        → bu qovluğa
#   assets/fonts/*.ttf      → /var/www/muslim-cc-api/assets/fonts/

# Node asılılıqları
npm install @anthropic-ai/sdk zod

# Python asılılıqları
apt install -y python3-pip fonts-dejavu-core
pip3 install pillow arabic-reshaper python-bidi

# Şəkil qovluğu — Instagram bura public URL ilə müraciət edir
mkdir -p /var/www/muslims/posts
chown -R www-data:www-data /var/www/muslims/posts

# Konfiqurasiya
cp .env.example .env
nano .env          # açarları doldur
chmod 600 .env     # açarlar var — yalnız root oxusun
```

### Yoxlama

```bash
node run.mjs --stats          # hovuz vəziyyəti
node run.mjs --dry            # şəkil + caption hazırla, paylaşma
node run.mjs --check          # IG hesabı və kvota (token lazımdır)
```

`--dry` çıxışındakı şəkli brauzerdə aç və caption-ı oxu. Razı qalsan davam et.

### İlk canlı post

```bash
node run.mjs --type=quran
```

Instagram-da yoxla. Yaxşıdırsa cron qur.

---

## 3. Cron — gündə 3 post

```bash
crontab -e
```

```cron
# Muslims.cc Instagram — 09:00, 14:00, 20:00
0 9,14,20 * * * cd /var/www/muslim-cc-api/social && /usr/bin/node run.mjs >> log/cron.log 2>&1
```

Saata görə növ avtomatik seçilir: səhər Quran, günorta hədis, axşam dua/ad.

Node yolunu yoxla: `which node` — fərqlidirsə cron sətrində dəyiş.

---

## 4. Baxım

```bash
# Son 10 post
tail -n 10 log/posts.jsonl | node -e "require('readline').createInterface({input:process.stdin}).on('line',l=>{const j=JSON.parse(l);console.log(j.at, j.mode, j.key||'', j.permalink||j.error||'')})"

# Şablon caption-a düşən postlar (model işləməyib)
grep '"fallback":true' log/posts.jsonl | wc -l

# Xətalar
grep '"mode":"error"' log/posts.jsonl | tail -5

# Köhnə şəkilləri təmizlə (90 gündən köhnə)
find /var/www/muslims/posts -name '*.jpg' -mtime +90 -delete
```

### Dayandırmaq

```bash
crontab -e     # sətri # ilə şərhə al
```

### Məzmun bazasını yeniləmək

Sayta yeni hədis/dua əlavə edəndə hovuzu yenidən qur (yerli kompüterdə):

```bash
npm run social:pool
```

Sonra yeni `pool.json`-u serverə göndər. `state/used.json`-a toxunma —
orada nəyin paylaşıldığı saxlanılır.

---

## Bilinən məhdudiyyətlər

- **Instagram gündəlik limiti 50 post** — 3 post problem deyil.
- Şəkil **JPEG** olmalıdır və **public URL**-dən oxunmalıdır; ona görə
  `SOCIAL_PUBLIC_DIR` web kökünün altında olmalıdır.
- Caption Instagram-da **2200 simvol** limitlidir; `composeCaption` 2000-də kəsir.
- `render.py` ərəb mətni üçün `arabic-reshaper` + `python-bidi` tələb edir.
  Onlarsız hərflər ayrı-ayrı və tərs sırada çıxır.
