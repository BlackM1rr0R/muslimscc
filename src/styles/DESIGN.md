# Muslims.cc — Dizayn sistemi v2

Bu sənəd qalan səhifələri yeni dizayna keçirən hər kəs (insan və ya agent) üçündür.
Qısa qayda: **yalnız tokenləri və `.ui-*` siniflərini işlət, öz rəngini/kölgəsini/radiusunu yazma.**

| Fayl | Nə var |
|---|---|
| `src/styles/globals.css` | Bütün tokenlər (xam palitra → semantik → köhnə adlar), baza, qabıq (`.qm-shell`), köhnə ümumi siniflər (`.btn-primary`, `.card`, `.page-hero` …) |
| `src/styles/ui.css` | Yeni komponent sinifləri (`.ui-*`). `globals.css`-in əvvəlində `@import` olunur |
| `src/styles/motion.css` | Hərəkət tokenləri, fokus halqası, səhifə keçidi, `data-reveal` (12 variant), giriş/çıxış sinifləri, sayğac, skeleton, mobil dəst (`.m-row`, `.m-chip` …) |
| `src/styles/heroes.css` | Köhnə `.page-hero` temaları — 7 palitra ailəsi (zümrüd, şam, mamır, firuzə, gecə, tunc, torpaq) + hero hərəkəti |
| `src/components/Icon.jsx` | Xətti SVG ikon dəsti (`<Icon name="quran" />`) + `BrandMark` |
| `src/pages/HomePage.jsx` + `HomePage.css` | Sistemin "nümunə səhifəsi" |

---

## 1. Xarakter

Sakit, ləyaqətli, premium — "müasir rəqəmsal kitabxana / ibadət yoldaşı".
Fil sümüyü (kağız) fon, dərin zümrüd əsas rəng, isti qum-qızılı vurğu, çox ağ sahə,
hairline xətlər, yumşaq kölgələr. İslami həndəsə (xatəm — 8 guşəli ulduz) **yalnız incə vurğu**.

**ETMƏ:** neon/parlaq yaşıl, göy qurşağı rəngli kartlar, emoji ikonlar (📖 🕐 🤲 …) yeni kodda,
fırlanan/üzən dekor, qalın qradiyent zolaqlar, `font-weight: 800/900`, mətnə kölgə (tünd hero-dan başqa).

**ET:** bir səhifədə bir vurğu rəngi (zümrüd), qızılı yalnız kiçik detallarda (eyebrow nöqtəsi,
sitat xətti, ".cc"), başlıqlar display şriftində, kartlar ağ səthdə hairline ilə.

## 2. Tokenlər

### Rəng (semantik — HƏMİŞƏ bunları işlət)

| Token | İşıqlı | Qaranlıq | İstifadə |
|---|---|---|---|
| `--surface-0` | `#f7f5ef` | `#0a1016` | səhifə fonu |
| `--surface-1` | `#ffffff` | `#111921` | kart, panel |
| `--surface-2` | `#f1eee5` | `#17212b` | sakit dolğu (sahə, ikinci bölmə) |
| `--surface-3` | `#e8e3d6` | `#1f2b36` | hover / basılı / batıq |
| `--surface-raised` | `#ffffff` | `#17212b` | menyu, dialoq |
| `--surface-inverse` | `#0a3d31` | `#0c1a17` | tünd zümrüd zolaq (CTA, footer, Quran kafeli) — hər iki rejimdə tünd |
| `--text-strong` | `#0f1d19` | `#f3efe6` | başlıqlar |
| `--text-body` | `#1b2a25` | `#e3dfd5` | əsas mətn |
| `--text-secondary` | `#45534d` | `#b3b8b3` | ikinci dərəcəli |
| `--text-tertiary` | `#5c6862` | `#8f9a99` | qeyd, mənbə, placeholder |
| `--text-on-inverse` / `-dim` | `#f3efe6` / 74% | eyni | tünd zolaqda mətn |
| `--line` / `--line-strong` | `#e3ded2` / `#cfc8b8` | `#22303b` / `#31424f` | hairline / sahə haşiyəsi |
| `--brand` | `#0f5a47` | `#5fc8a5` | əsas hərəkət, link, aktiv |
| `--brand-hover`, `--brand-strong` | | | hover; brend fonunda vurğu mətni |
| `--brand-soft`, `--brand-soft-2`, `--brand-line` | 7% / 12% / 22% | 10% / 17% / 28% | yumşaq fon, aktiv sətir, haşiyə |
| `--on-brand` | `#ffffff` | `#06201a` | `--brand` fonunda mətn |
| `--accent` | `#a57a22` | `#d8b46a` | qızılı ikon, xətt, iri rəqəm (≥3:1) |
| `--accent-text` | `#7a5712` | `#d8b46a` | qızılı **mətn** (AA) |
| `--accent-soft`, `--accent-line` | | | qızılı nişan fonu / haşiyəsi |
| `--ok` `--warn` `--bad` `--note` | | | vəziyyət |
| `--ring` | brend 60% | | fokus halqası |
| `--pattern-color` | brend 14% | brend 10% | xatəm naxışının rəngi |

Xam palitra (`--emerald-*`, `--sand-*`, `--paper-*`, `--night-*`) yalnız token təyin edərkən işlənir.

### Kontrast cədvəli (WCAG 2.1, hesablanıb)

| Cüt | İşıqlı | Qaranlıq |
|---|---|---|
| `--text-body` / `--surface-0` | 13.7 | 14.4 |
| `--text-secondary` / `--surface-0` | 7.4 | 9.5 |
| `--text-tertiary` / `--surface-0` · `-1` · `-2` · `-3` | 5.3 · 5.8 · 5.0 · 4.5 | 6.6 · 6.1 · 5.6 · 5.0 |
| `--brand` / `--surface-1` | 8.2 | 8.7 |
| `--on-brand` / `--brand` (düymə) | 8.2 | 8.4 |
| `--accent-text` / `--surface-0` · `-2` | 6.0 · 5.7 | 9.7 · 8.3 |
| `--text-on-inverse` / `--surface-inverse` | 10.6 | 15.6 |
| `--text-on-inverse-dim` / `--surface-inverse` | 6.6 | 9.6 |
| qum başlıq `#e6cc95` / `--surface-inverse` | 7.8 | 11.4 |

`--accent` (`#a57a22`) mətn üçün DEYİL (kiçik mətndə 4.5-dən aşağı) — mətnə `--accent-text`.

### Tipografiya

| Token | Dəyər | Niyə |
|---|---|---|
| `--font-sans` | Inter 400–700 | ə ğ ı İ ş ç ö ü + kiril brauzerdə yoxlanılıb; neytral, Windows-da aydın |
| `--font-display` | Literata 500/600 | Google Play Books-un kitab şrifti → "rəqəmsal kitabxana"; latin-ext + kiril, **ə/Ə var** (Fraunces/Newsreader-də kiril, Manrope-da Ə, PT Serif-də ə yoxdur — yoxlanılıb) |
| `--font-arabic` | Amiri | Quran/hədis — klassik nəsx |
| `--font-arabic-ui` | IBM Plex Sans Arabic | `/ar`-da interfeys (`html[lang=ar] body`) |

Şkala (axıcı): `--step--2` 12 · `--step--1` 14 · `--step-0` 16 · `--step-1` 17–20 · `--step-2` 21–26 ·
`--step-3` 26–36 (bölmə h2) · `--step-4` 32–52 (səhifə h1) · `--step-5` 42–76 (ana hero).
Sətir: `--lh-tight` 1.12, `--lh-snug` 1.3, `--lh-body` 1.65, `--lh-arabic` 2.
Hərf aralığı: `--tracking-tight` −0.02em (iri başlıq), `--tracking-wide` 0.08em (BÖYÜK HƏRF etiket; **ərəbcədə 0**).
Rəqəmlər (saat, sayğac): `.ui-num` və ya `font-variant-numeric: tabular-nums`.

### Forma, kölgə, boşluq

- Radius: `--radius-xs` 6 · `-sm` 8 · `-md` 12 (düymə, sahə) · `-lg` 16 (kart) · `-xl` 24 (iri panel) · `-2xl` 32 (CTA) · `-pill`.
- Kölgə: `--shadow-1` (sakit kart) → `-2` (hover) → `-3` (üzən kart) → `-4` (menyu/dialoq). Rəngsizdir (yaşıl çalar yoxdur).
- Boşluq: `--space-1…9` (4…96), `--page-gutter` (32/24/20/16), `--container` 1200, `--section-gap` 88→56→44→36, `--card-pad`, `--tap` 44.

### Hərəkət (motion.css + ui.css §11–12 + heroes.css)

Tokenlər: `--dur-1` 150ms (rəng, basılma) · `--dur-2` 240ms (düymə, kart hover) · `--dur-3` 360ms (menyu, dialoq, toast) ·
`--dur-4` 560ms (sürüşəndə görünmə) · `--stagger` 45ms. Əyrilər: `--ease-out` giriş, `--ease-in` çıxış,
`--ease-spring` yalnız kiçik elementlərdə, `--ease-sheet` vərəq.
Qaydalar: yalnız `transform` / `opacity` (+ bir dəfəlik `filter: blur`); dövri dekor yalnız hero təsvirinin/naxışının
çox yavaş "nəfəsi"dir (28–40 s). `prefers-reduced-motion: reduce` — hər şey söndürülür (motion.css §17), məzmun
dərhal görünür, sayğac saymır, skeleton parıltısı dayanır.

**Sürüşəndə görünmə — `data-reveal`** (JS: `hooks/useReveal.js`, tək müşahidəçi; JS yoxdursa məzmun görünür qalır)

| Dəyər | Nə edir |
|---|---|
| `data-reveal` / `="up"` | aşağıdan 16px qalxır + görünür |
| `="down"` | yuxarıdan enir |
| `="left"` / `="right"` | başlanğıc / son tərəfdən 22px (ərəbcədə güzgülənir) |
| `="zoom"` | .94 → 1 · `="scale"` .97 → 1 (köhnə) |
| `="blur"` | bulanıqdan aydınlaşır + 8px qalxır (iri başlıq, sitat üçün) |
| `="fade"` | yalnız görünür |
| `="stagger"` | **uşaqlar** növbə ilə qalxır (45ms, ən çox 10 addım) |
| `="stagger-zoom"` `-fade` `-left` `-right` `-blur` | uşaqlar növbə ilə, uyğun hərəkətlə |

Əlavə: `data-reveal-delay="120"` (ms, ≤ 400), `style="--reveal-dur: 800ms"`. `.ui-ornament[data-reveal]` — xətlər mərkəzdən
açılır, ulduz fırlanıb oturur. Ref ilə: `const ref = useReveal('stagger')`.

```html
<div class="ui-section-head" data-reveal>…</div>
<div class="ui-grid" data-reveal="stagger">  <a class="ui-card ui-card--interactive">…</a> … </div>
<figure class="ui-quote" data-reveal="blur">…</figure>
<div class="ui-ornament" data-reveal aria-hidden="true"><span class="ui-ornament__star"></span></div>
```

**Rəqəm sayğacı — `data-count`**: `<span class="ui-stat__num" data-count="6236">6 236</span>` — görünəndə 0-dan
hədəfə 1.2 s sayır (ease-out), minlik ayırıcısını saxlayır, sonda HTML-dəki mətn olduğu kimi qalır (SEO).
`data-count-duration="1600"`; ondalıq: `data-count="4.8"`. Element yalnız bir mətn düyünündən ibarət olmalıdır.

**Mikro-qarşılıqlı təsirlər** (avtomatikdir, sinif əlavə etmək lazım deyil):
`.ui-btn` hover-də 1px qalxır, basılanda .97; sonda ox üçün `<Icon className="ui-btn__icon ui-btn__icon--end ui-flip-rtl">` irəli sürüşür ·
`.ui-card` hover-də kölgə bir pillə artır; `.ui-card--interactive`, `a.ui-card`, `button.ui-card` 3px qalxır + `--shadow-3`,
içindəki `.ui-icon-tile` böyüyür/ikonu əyilir, `.ui-link__arrow` irəli gedir · `.ui-chip` seçiləndə "pop", basılanda .96 ·
`.ui-icon-btn` basılanda .92 · `.ui-icon-tile--interactive` kart xaricində öz hover canlanması · fokus halqası 6px-dən 2px-ə "oturur".

**Köməkçi siniflər** (motion.css §15–16):

| Sinif | Nə edir |
|---|---|
| `.ui-enter-fade` · `-rise` · `-drop` · `-pop` · `-dialog` · `-sheet` | giriş animasiyası (backdrop · toast · açılan menyu · kiçik nişan · modal · telefon vərəqi) |
| `… .is-leaving` | çıxış (200ms); sonra DOM-dan çıxar — `exitDelay()` (utils/promptCoordinator.js) hərəkət azaldılıbsa 0 qaytarır |
| `.ui-lift` | hover-də 2px qalxma + kölgə (istənilən blok) |
| `.ui-press` | basılanda .97 (köhnə `.press` eynidir) |
| `.ui-underline` | link altında xətt başlanğıcdan "çəkilir" |
| `.ui-spin` | kiçik yüklənmə fırlanması (düymə içində) |
| `.ui-skeleton` (+ `--text` `--circle` `--card`, `style="--w:60%"`) | yüklənmə parıltısı; köhnə `.skeleton` də işləyir |

**Səhifə keçidi**: `<main class="page-enter">` 10px aşağıdan qalxır (App.jsx); `.ui-page-hero` məzmunu (crumbs → eyebrow →
h1 → lead → düymələr) növbə ilə qalxır, alt qızılı xətt mərkəzdən açılır, naxış 40 s-də "nəfəs alır". Köhnə `.page-hero`
(heroes.css): məzmun növbə ilə qalxır, təsvir 28 s-də 1 → 1.035 miqyasda nəfəs alır.

**Üzən kart / dəvət — `.ui-toast`** (ui.css §11): quraşdırma, bildiriş icazəsi, elan, push — hamısı bir görünüşdə,
altdan `16px + safe-area`, ≥1024px-də əsas sütunun ortasında (dok üçün yer). Hissələr: `__icon` / `__mark`, `__body`,
`__eyebrow`, `__title`, `__text`, `__actions`, `__close`, `__progress` (`--toast-duration`); `--top` variantı; vurğu
`style="--toast-accent: var(--bad)"`. **Eyni anda yalnız BİR dəvət** — yeni üzən element əlavə edirsənsə
`usePromptSlot()` (utils/promptCoordinator.js) işlət; bağlananda seçimi `snoozePrompt(key, days)` ilə yadda saxla.

## 3. Komponentlər (ui.css)

```html
<!-- Bölmə -->
<section class="ui-section">
  <div class="ui-container">
    <div class="ui-section-head ui-section-head--center">
      <span class="ui-eyebrow">Saytda</span>
      <h2 class="ui-title">İslami bilik və ibadət</h2>
      <p class="ui-lead">…</p>
    </div>
    <div class="ui-grid" style="--ui-grid-min: 260px">
      <a class="ui-card ui-card--interactive" href="/quran">
        <div class="ui-card__head">
          <span class="ui-icon-tile"><Icon name="quran" /></span>
          <h3 class="ui-card__title">Quran</h3>
        </div>
        <p class="ui-card__text">114 surə …</p>
      </a>
    </div>
  </div>
</section>

<!-- Düymələr -->
<button class="ui-btn ui-btn--primary"><Icon name="prayer" className="ui-btn__icon" /> Namaz vaxtları</button>
<button class="ui-btn ui-btn--secondary">…</button>   <!-- ağ, haşiyəli -->
<button class="ui-btn ui-btn--ghost">…</button>
<button class="ui-btn ui-btn--accent ui-btn--sm">…</button>
<button class="ui-btn ui-btn--inverse">…</button>      <!-- tünd zolaqda -->
<button class="ui-icon-btn" aria-label="Paylaş"><Icon name="arrow" /></button>
<a class="ui-link" href="…">Hamısı <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" /></a>

<!-- Çip, nişan -->
<div role="group" aria-label="Filtr">
  <button class="ui-chip" aria-pressed="true">Hamısı</button>
  <button class="ui-chip" aria-pressed="false">Səhər</button>
</div>
<span class="ui-badge ui-badge--brand">Növbəti</span>

<!-- Forma -->
<label class="ui-field">
  <span class="ui-field__label">Şəhər</span>
  <input class="ui-input" type="search" />
  <span class="ui-field__hint">…</span>
</label>

<!-- İslami detallar -->
<div class="ui-pattern ui-pattern--fade" aria-hidden="true"></div>   <!-- valideyndə position:relative; isolation:isolate -->
<div class="ui-ornament" aria-hidden="true"><span class="ui-ornament__star"></span></div>
<figure class="ui-quote">
  <blockquote>
    <p class="ui-quote__ar ui-arabic" lang="ar" dir="rtl">…</p>
    <p class="ui-quote__text">…</p>
  </blockquote>
  <figcaption class="ui-quote__src">— Muslim 671</figcaption>
</figure>
<div class="ui-stat"><span class="ui-stat__num">114</span><span class="ui-stat__label">Surə</span></div>
```

Variantlar: `.ui-card--sunken` (ikinci səth), `--inverse` (tünd zümrüd), `--flush` (boşluqsuz);
`.ui-icon-tile--accent | --neutral | --sm | --lg`; `.ui-section--alt | --tight`; `.ui-container--narrow`.

### Daxili səhifə hero-su (növbəti mərhələ üçün hazırdır)

Köhnə rəngli `.page-hero` (heroes.css temaları) hələ işləyir və yeni şriftlə görünür. Səhifəni redizayn edəndə onu
`.ui-page-hero` ilə əvəz et — sakit kağız fon, naxış, başlanğıca düzlənmiş başlıq, bir `<h1>`:

```html
<header class="ui-page-hero">
  <div class="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
  <div class="ui-container">
    <nav class="ui-page-hero__crumbs" aria-label="…">…</nav>
    <span class="ui-eyebrow">Quran</span>
    <h1 class="ui-display">Qurani-Kərim</h1>
    <p class="ui-lead">114 surə · 6236 ayə</p>
    <div class="ui-page-hero__actions">…</div>
  </div>
</header>
```

### İkonlar (Icon.jsx)

`<Icon name="…" size={20} strokeWidth={1.75} className fallback title />`. Adlar: navigation.js-dəki hər marşrut
açarı (`quran`, `hadith`, `prayer`, `duas`, `dhikr`, `names`, `zakat`, `qibla`, … `about`) + ümumi:
`arrow chevron search pin bell sun moon sunrise sunLow sunset shield globe check instagram`.
Susma ilə `aria-hidden`; mənalı ikon üçün `title` ver. Ox ikonlarına `ui-flip-rtl`.
Yeni ikon: 24×24 şəbəkə, yalnız stroke, fill yox.

## 4. Vacib texniki qaydalar

1. **CSS sırası.** Səhifə CSS-i (`import '../styles/X.css'` JSX-də) `globals.css`/`ui.css`-dən ƏVVƏL yüklənir
   (main.jsx-də App importu birincidir). Ona görə `.ui-*` sinfini səhifə sinfi ilə eyni spesifiklikdə
   dəyişə bilməzsən — valideyn ilə gücləndir: `.xp-root .xp-quote { … }` (HomePage.css-də `.hp-root …` nümunələri).
2. **Köhnə tokenlər silinmir.** `--primary --bg --bg-card --bg-card2 --surface --text --text-dim --text-muted
   --border --border-md --gold --shadow* --radius* --font` yeni sistemə alias-dır (globals.css §5). Yeni kodda
   semantik adları işlət; səhifəni redizayn edəndə köhnə adları da əvəz et.
3. **Qaranlıq rejim** yalnız tokenlərlə: `[data-theme="dark"]` `<html>`-də (LangContext + index.html skripti).
   Səhifə CSS-ində `[data-theme="dark"] .x { color: #… }` yazmaq lazım gəlirsə — çox güman ki, səhv token seçilib.
4. **RTL** (`/ar`, `dir="rtl"`): `margin-inline`, `padding-inline`, `inset-inline-*`, `border-inline-start`,
   `text-align: start`. Oxlar `ui-flip-rtl`. Ərəb mətnində `letter-spacing: 0`, `text-transform: none`.
   Latın brend/domeni (`Muslims.cc`) üçün `direction: ltr; unicode-bidi: isolate`.
5. **Əlçatanlıq.** Hər səhifədə bir `<h1>`. Fokus halqası `:focus-visible` (motion.css §2) — `outline: none` yazma.
   Toxunma hədəfi ≥ 44px (`--tap`, `.ui-btn` avtomatik). İkon-düymədə `aria-label`. Kontrast cədvəlinə bax.
6. **e2e testlərinin baxdığı adlar** (dəyişmə): başlıqda "Menyu" düyməsi (`aria-expanded`), yan panel
   `<nav aria-label="Bölmələr">` + qrup düymələri `button[aria-expanded]`, menyu `role="dialog"`,
   Ctrl+K axtarış `role="dialog"`, "Qaranlıq rejim", "Dili dəyiş", telefonda menyu içində dil düymələri (`aria-label` doğma ad).
7. **Performans.** Şəkil/kitabxana yox; naxışlar `mask-image` + data-URI SVG (`--ui-khatam`, `--ui-star`).
   Şriftlər index.html-də, `display=swap`; yeni çəki əlavə etmə.
8. **Mətnlər** 5 dildə saf olmalıdır (az-da türkcə söz yox, tr-də "ə" yox) — `node scripts/check-lang.mjs`.

## 5. Səhifəni köçürmə yoxlama siyahısı

- [ ] `.page-hero` → `.ui-page-hero` (və ya səhifəyə uyğun sakit hero), bir `<h1>`.
- [ ] Emoji ikonlar → `<Icon>`; göy qurşağı `style={{'--clr': …}}` rəngləri → brend/vurğu tokenləri.
- [ ] Kartlar → `.ui-card`, düymələr → `.ui-btn`, filtrlər → `.ui-chip`, sahələr → `.ui-input`.
- [ ] Hex rəng, öz kölgə/radius yoxdur; `[data-theme=dark]` qaydaları minimal.
- [ ] Bölmə başlıqlarına `data-reveal`, kart şəbəkələrinə `data-reveal="stagger"`, iri rəqəmlərə `data-count`.
- [ ] 1440 işıqlı/qaranlıq, 390 telefon, `/ar` ekran şəkli; konsol təmiz; e2e keçir.
