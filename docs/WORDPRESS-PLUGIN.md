# WordPress plagini — "Muslims.cc Prayer Times"

| Nə | Harada |
|---|---|
| Plaginin özü (zip-ə düşən hər şey) | `wordpress/muslimscc-prayer-times/` (readme.txt ilə birlikdə) |
| wordpress.org kataloq şəkilləri (zip-ə **düşmür**, yalnız SVN `assets/`) | `wordpress/assets/` — `icon-128x128.png`, `icon-256x256.png`, `banner-772x250.png`, `banner-1544x500.png`, `screenshot-1..4.png` |
| Zip yığıcısı, `cities.php` / `.pot` generasiyası | `scripts/build-wp-plugin.mjs` (`npm run build`-in son addımı → `dist/downloads/muslimscc-prayer-times.zip`; `--sync`) |
| Şəkilləri yenidən yaratmaq | `node scripts/gen-wp-assets.mjs` (Playwright + sharp; ekran şəkilləri 1–2 prod muslims.cc-dən, 3–4 HTML maketidir) |
| readme yoxlayıcısı | `node scripts/check-wp-readme.mjs` |
| CI | `.github/workflows/wp-plugin.yml` (PHPCS qaydaları `wordpress/phpcs.xml.dist`, smoke testi `wordpress/ci/smoke.php`) |
| Unit testlər | `tests/unit/wp-plugin.test.js`, `tests/unit/wp-assets.test.js` |

## CI yoxlaması (PHP lokal yoxdur — hər şey GitHub runner-lərindədir)

`wordpress/**`, `scripts/build-wp-plugin.mjs`, `scripts/check-wp-readme.mjs` və ya workflow faylı dəyişəndə
(main-ə push və PR) avtomatik işləyir. **ci.yml-dən ayrıdır — deploy onu gözləmir.**

Əl ilə işə salmaq:

- GitHub → **Actions** → **WordPress plugin** → **Run workflow** (branch: `main`), və ya
- `gh workflow run wp-plugin.yml --ref main` → `gh run watch` (və ya `gh run list --workflow=wp-plugin.yml`).

İşlər:

1. **readme.txt + assets** — wordpress.org readme qaydaları (qısa təsvir ≤ 150, Tags ≤ 5, versiya/lisenziya
   plagin başlığı ilə eyni, Screenshots başlıqları = `screenshot-N.png`), ikon/banner ölçüləri, cəmi < 1.5 MB;
   zip-də `assets/` və şəkil faylı olmadığını yoxlayır.
2. **php -l** — PHP 7.4 (readme-dəki `Requires PHP`) və 8.3.
3. **PHPCS (WPCS 3.4.1)** — `WordPress.Security.EscapeOutput`, `NonceVerification`, `ValidatedSanitizedInput`.
   Yalnız ERROR işi yıxır; xəbərdarlıqlar logda görünür.
4. **Plugin Check** — rəsmi `wordpress/plugin-check-action` ən son WordPress-də (wp-env, Docker), **buraxılış zip-inin
   özü** üzərində. ERROR işi yıxır; WARNING-lər faylda annotasiya kimi görünür (nəticələr artefaktda:
   `plugin-check-results`). Sonra eyni WordPress-də **smoke test**: shortcode, blok, klassik vidcet, ayarların
   sanitizasiyası, istinad linkinin susmaya görə sönük olması, zərərli məscid adının qaçırılması.

Gözlənilən xəbərdarlıq: `load_plugin_textdomain()` (wordpress.org-dan quraşdırılanda lazım deyil, amma plagin
muslims.cc-dən zip ilə də yayılır — saxlanılıb).

## Sahibin addımları — wordpress.org-a təqdim

### 1. Hesab

1. https://login.wordpress.org/register — hesab yaradın (layihənin e-poçtu ilə; rəyçilər bura yazacaq).
2. https://profiles.wordpress.org/me/profile/edit/group/3/ (**Account & Security**) → **Two-Factor Authentication**
   — 2FA-nı açın (authenticator tətbiqi + ehtiyat kodları saxlayın). Plagin yükləyənlər üçün məcburidir.
3. Eyni səhifədə **SVN password** yaradın və parol menecerinə yazın (SVN üçün adi parol işləmir).

### 2. Contributors

`wordpress/muslimscc-prayer-times/readme.txt`-də `Contributors: muslimscc` — **yer tutucudur**. Onu öz
wordpress.org istifadəçi adınızla əvəz edin (kiçik hərflə, profil URL-indəki kimi:
`profiles.wordpress.org/<ad>`). Bir neçə ad vergüllə yazılır. Sonra:

```sh
node scripts/check-wp-readme.mjs && npx vitest run tests/unit/wp-assets.test.js tests/unit/wp-plugin.test.js
```

commit + push edin (CI `WordPress plugin` workflow-u yaşıl olmalıdır).

### 3. Zip-i göndərmək

1. Zip: `node scripts/build-wp-plugin.mjs --out wp-release` → `wp-release/downloads/muslimscc-prayer-times.zip`
   (və ya saytdan: https://muslims.cc/downloads/muslimscc-prayer-times.zip). `wp-release/`-i sonra silin
   (lint səhv qovluğa görə yıxılır).
2. https://wordpress.org/plugins/developers/add/ — daxil olun, qaydalarla razılaşın, zip-i yükləyin.
   Slug başlıqdan yaranır: `muslimscc-prayer-times`. Səhifədə göstərilən slug fərqlidirsə, **təsdiqdən əvvəl**
   cavab məktubunda dəyişdirilməsini xahiş edin (sonra dəyişmək olmur).
3. Avtomatik yoxlama (Plugin Check) xəta göstərsə — düzəldin, versiyanı dəyişmədən yenidən yükləyin.

### 4. Rəyçinin məktubları

- `plugins@wordpress.org`-dan gələn məktuba **həmin məktuba cavab** yazın (yeni məktub və ya yeni təqdimat yox).
- Düzəliş istəsələr: kodu düzəldin, CI yaşıl olsun, yeni zip-i **həmin təqdimat səhifəsində** yükləyin
  (https://wordpress.org/plugins/developers/add/ → "Upload a new version") və məktubda nəyi dəyişdiyinizi qısa yazın.
- Tipik suallar: xarici xidmət (readme-də `== External services ==` bölməsi var — iframe, muslims.cc, aladhan.com,
  Terms/Privacy linkləri), istinad linki (susmaya görə sönükdür — qayda 10), escape/sanitize (WPCS CI-da yoxlanır).
- Cavab 7 gün gəlməsə təqdimat bağlana bilər — e-poçtu izləyin.

### 5. Təsdiqdən sonra — SVN

Təsdiq məktubunda SVN ünvanı olacaq: `https://plugins.svn.wordpress.org/muslimscc-prayer-times/`.
SVN-ə yalnız `trunk/`, `tags/<versiya>/` və `assets/` gedir (git tarixçəsi yox).

```sh
# 0) Zip-i qur və aç (repo kökündə)
node scripts/build-wp-plugin.mjs --out wp-release
mkdir -p wp-release/unzipped && unzip -q wp-release/downloads/muslimscc-prayer-times.zip -d wp-release/unzipped

# 1) SVN checkout (repodan kənarda)
svn checkout https://plugins.svn.wordpress.org/muslimscc-prayer-times ../wp-svn
cd ../wp-svn

# 2) trunk = zip-in məzmunu (silinən faylları da əks etdirmək üçün əvvəlcə təmizləyirik)
rm -rf trunk/* && cp -R ../muslimscc/wp-release/unzipped/muslimscc-prayer-times/. trunk/

# 3) assets = wordpress/assets (ikon, banner, ekran şəkilləri) + düzgün MIME tipi
mkdir -p assets && cp ../muslimscc/wordpress/assets/*.png assets/
svn add --force trunk assets
svn status | awk '/^!/ {print $2}' | xargs -r svn rm      # silinmiş faylları SVN-dən də sil
svn propset svn:mime-type image/png assets/*.png

# 4) Versiya tegi (Stable tag ilə eyni)
svn cp trunk tags/1.0.0

# 5) Göndər (istifadəçi adı + SVN password)
svn ci -m "Release 1.0.0" --username <wordpress.org-istifadəçi-adı>
```

Kataloq səhifəsi 5–15 dəqiqəyə yenilənir: https://wordpress.org/plugins/muslimscc-prayer-times/ .
Windows-da `svn` üçün TortoiseSVN (command line tools seçimi ilə) və ya `winget install Slik.Subversion`;
yuxarıdakı əmrlər Git Bash-da işləyir.

### Yeni versiya (1.0.1 və s.)

1. Versiyanı **hamısında** dəyişin: plagin başlığı `Version:`, `MUSLIMSCC_PRAYER_VERSION`, readme `Stable tag`,
   `block.json` `version`, `index.asset.php`, `src/utils/wpPlugin.js` `WP_PLUGIN_VERSION` (unit test yoxlayır);
   readme-də `== Changelog ==` və `== Upgrade Notice ==`-a yeni bənd.
2. `node scripts/build-wp-plugin.mjs --sync` (şəhərlər/tərcümə sətirləri dəyişibsə), testlər, CI yaşıl.
3. SVN: addım 0, 2 → `svn cp trunk tags/<yeni>` → `svn ci`. Köhnə tegləri silməyin.
4. Yeni WordPress çıxanda (https://api.wordpress.org/core/version-check/1.7/) plagini yoxlayıb yalnız readme-də
   `Tested up to`-nu yeniləmək olar — bunun üçün yeni versiya lazım deyil (trunk və cari teqdə readme.txt-ni dəyişin).

### Şəkilləri yeniləmək

`node scripts/gen-wp-assets.mjs` → `wordpress/assets/` (vaxt Bakı 13:20-yə sabitlənir; prod-dan iframe-lər
yüklənir, Cloudflare "HeadlessChrome"-u blokladığı üçün skript adi Chrome UA göndərir). Şəkil sayını
dəyişsəniz readme-dəki `== Screenshots ==` başlıqlarını da uyğunlaşdırın (yoxlayıcı tutur). Sonra SVN addım 3.
