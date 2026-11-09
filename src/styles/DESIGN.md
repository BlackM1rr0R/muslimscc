# Muslims.cc — Dizayn sistemi v3

Bu sənəd səhifələri yeni dizayna keçirən hər kəs (insan və ya agent) üçündür.
Qısa qayda: **yalnız tokenləri, `.ui-*` siniflərini və `components/viz` qrafiklərini işlət —
öz rəngini, kölgəsini, radiusunu, şrift ölçüsünü yazma.**

v3-ün məqsədi (sahibin sözləri ilə): rənglər qalır, amma səhifələr "köhnə sayt kimi" görünməsin —
**sakit, səliqəli, kiçik mətn, çox vizual, yeni gələn üçün aydın.**

| Fayl | Nə var |
|---|---|
| `src/styles/globals.css` | Bütün tokenlər (xam palitra → semantik → köhnə adlar), tipoqrafik rollar, viz palitrası, baza, qabıq (`.qm-shell`), köhnə ümumi siniflər (`.btn-primary`, `.card`, `.page-hero` …) |
| `src/styles/ui.css` | Komponent sinifləri (`.ui-*`) — §1–12 əsas, **§13 v3 komponentləri, §14 qrafiklər** |
| `src/styles/motion.css` | Hərəkət tokenləri, fokus halqası, `data-reveal`, `data-count`, skeleton |
| `src/styles/heroes.css` | Köhnə rəngli `.page-hero` temaları (redizayn olunmamış səhifələr üçün) |
| `src/components/Icon.jsx` | Xətti SVG ikon dəsti (`<Icon name="quran" />`) + `BrandMark` |
| `src/components/viz/index.jsx` | **Qrafik dəsti**: `BarChart ColumnChart Donut ProgressRing ProgressBar Sparkline StackedBar Timeline StatTile ChartFigure` + **v2 (§5.1)**: `AreaChart LineChart CalendarHeatmap KpiCard ChartCard BentoGrid RangeTabs Delta FunnelChart SegmentBreakdown CompareBars GoalRing RadialBars ActivityFeed MiniTable InlineBar TrendCell` (stil `viz.css`) |
| `src/pages/HomePage.jsx` + `HomePage.css` | Sistemin "vitrin" səhifəsi — `.ui-tiles`, `.ui-steps`, `StatTile` nümunələri |

---

## 1. Xarakter

Sakit, ləyaqətli, müasir — "rəqəmsal kitabxana / ibadət yoldaşı". Fil sümüyü fon, dərin zümrüd,
qum-qızılı vurğu, çox ağ sahə, hairline xətlər. İslami həndəsə (xatəm) yalnız incə fon naxışıdır.

**ET:** bir bölmədə bir məqsəd; qısa mono başlıq + bir cümlə izah + məzmun; ağ sahə və düzlənmə
(qutu yox); hər bölmədə ən çox ~3 vizual çəki; mətnin yerinə bir baxışda oxunan vizual (rəqəm
kafeli, zolaq, halqa, addımlar, zaman xətti, cədvəl).

**ETMƏ:** kart içində kart, ikiqat haşiyə, ağır kölgə, göy qurşağı rəngli kartlar, emoji ikonlar,
çoxlu nişan (badge), iri hard-code font ölçüsü, `font-weight: 800/900`, mətnə kölgə (tünd hero-dan
başqa), insan/heyvan təsviri, stok foto.

## 2. Tokenlər

### Rəng (dəyişməyib — sahib bəyənir)

| Token | İşıqlı | Qaranlıq | İstifadə |
|---|---|---|---|
| `--surface-0` | `#f7f5ef` | `#0a1016` | səhifə fonu |
| `--surface-1` | `#ffffff` | `#111921` | kart, panel |
| `--surface-2` | `#f1eee5` | `#17212b` | sakit dolğu (sahə, ikinci bölmə, cədvəl başlığı) |
| `--surface-3` | `#e8e3d6` | `#1f2b36` | hover / batıq / qrafik izi |
| `--surface-raised` | ağ | `#17212b` | menyu, dialoq |
| `--surface-inverse` | `#0a3d31` | `#0c1a17` | tünd zümrüd zolaq (Quran kafeli, CTA) |
| `--text-strong` / `-body` / `-secondary` / `-tertiary` | 13.7 · 13.7 · 7.4 · 5.3 :1 | 14.4 · 14.4 · 9.5 · 6.6 :1 | başlıq / mətn / ikinci / qeyd |
| `--line` / `--line-strong` | | | hairline / sahə haşiyəsi |
| `--brand` (+ `-hover -strong -soft -soft-2 -line`), `--on-brand` | `#0f5a47` | `#5fc8a5` | əsas hərəkət, link, aktiv |
| `--accent` / `--accent-text` (+ `-soft -line`) | `#a57a22` / `#7a5712` | `#d8b46a` | qızılı ikon/xətt / qızılı **mətn** |
| `--ok --warn --bad --note` | | | vəziyyət (həmişə ikon + mətnlə) |

`--accent` mətn üçün DEYİL (kiçik mətndə < 4.5) — mətnə `--accent-text`.
Naxışlı fonda (footer, hero) kiçik mətn üçün `--text-tertiary` yox, `--text-secondary` işlət.

### Qrafik palitrası (v3, yeni)

| Token | İşıqlı | Qaranlıq | |
|---|---|---|---|
| `--viz-1` | `#0f7d5e` zümrüd | `#26a07c` | tək seriya, 1-ci kateqoriya |
| `--viz-2` | `#b0862f` qum | `#a8802a` | 2-ci |
| `--viz-3` | `#3f6fc4` göy | `#5a82e0` | 3-cü |
| `--viz-4` | `#a4527f` gavalı | `#b86a9f` | 4-cü |
| `--viz-track` | `--surface-3` | | boş iz (zolaq, halqa) |
| `--viz-grid` | `--line` | | ox / şəbəkə |

Yoxlanılıb (dataviz validator): işıqlıq zolağı, xroma, rəng korluğu ΔE ≥ 9, normal görmə ΔE ≥ 15,
səthə kontrast ≥ 3:1 — hər iki rejimdə. **Sıra sabitdir** (1→4, dövr etmir); 4-dən çox kateqoriya
olarsa "Digər"ə birləşdir və ya cədvəl göstər. Rəng **varlığa** bağlıdır, sıraya yox.

### Tipoqrafiya — bir şrift ailəsi (v3.1)

| Rol (token) | Şrift | Harada |
|---|---|---|
| `--font-sans` | **Inter** (dəyişən, 400–700) | paraqraf, tərcümə, dərs mətni, kart təsviri, sahə dəyəri |
| `--font-heading` | Inter 600/700, sıx tracking | h1–h3, bölmə başlığı, kart başlığı (`.ui-title`, `.ui-display`, `.ui-card__title`) |
| `--font-label` | Inter 500/600 | eyebrow, düymə, çip, sekmə, nişan, cədvəl başlığı, naviqasiya |
| `--font-num` | Inter + `tabular-nums` | iri rəqəm, saat, sayğac, statistika |
| `--font-mono` | sistem mono | yalnız kod nümunəsi (vidcet kodu) |
| `--font-arabic` | Amiri | Quran/hədis ərəbcəsi (`.ui-arabic`) |
| `--font-arabic-ui` | IBM Plex Sans Arabic | `/ar` interfeysi və başlıqları |

- v3-dəki Ubuntu Sans Mono başlıqlar gözü yorurdu (sahibin rəyi, 2026-11) — mono-ya qayıtma.
- Ərəbcə mətndə hərf aralığı avtomatik 0-dır (`[lang="ar"]` qaydası) — `lang="ar"` qoymağı unutma.

### Tərtibat — "alt-alta" yox

Geniş ekranda (≥1100px) kart, dəlil və siyahı blokları **yan-yana grid**-də olur (`--container` 1280px);
ensiz tək sütun yalnız uzun oxu mətni (~70ch) üçündür. Grid-də `align-items: start` — açılan kart
qonşusunu dartmır. Ardıcıl ayə/hədis/dua blokları `LessonBlocks` tərəfindən `.ls-evgrid`-ə yığılır.
İçindəkilər (TOC) sol sütunda yox, yuxarıda üfüqi sticky çip zolağıdır.

**Şkala** (rem, axıcı; telefonda kiçik pillələr kompensasiya olunur ki, əsas mətn **həmişə 15px** qalsın):

| Token | Ölçü | Rol |
|---|---|---|
| `--step--2` | 12 | etiket, nişan, cədvəl başlığı, qrafik qeydi |
| `--step--1` | 13 | köməkçi mətn, kart təsviri, düymə (sm), çip |
| `--step-0` | **15** | əsas mətn |
| `--step-1` | 16–18 | kart başlığı, `.ui-lead` |
| `--step-2` | 18–22 | h3, `.ui-title--sm`, hero statistikası |
| `--step-3` | 21–28 | bölmə h2 (`.ui-title`), `.ui-stat__num` |
| `--step-4` | 26–38 | səhifə h1 (`.ui-display`) |
| `--step-5` | 30–50 | yalnız ana səhifə hero-su |

Düymə mətni 14px (`0.875rem`). Ərəbcə Quran/hədis mətni body-nin ~1.35–1.6×-i (təxminən 20–26px),
daha iri yox. Sətir uzunluğu ≤ 68ch (`--measure`). Sətir: `--lh-tight` 1.2, `--lh-snug` 1.3,
`--lh-body` 1.7, `--lh-arabic` 2. Hərf aralığı: `--tracking-wide` 0.05em (BÖYÜK HƏRF mono etiket).

### Forma, kölgə, boşluq

- Radius: `--radius-sm` 8 (çip içi) · `-md` 12 (düymə, sahə) · `-lg` 16 (kart) · `-xl` 24 (iri panel) · `-pill`.
- **Kölgə v3:** kartlar kölgəsizdir (yalnız `--line` hairline). `--shadow-1` seqment seçimi, `--shadow-2`
  klikləmə kartının hover-i, `--shadow-3/4` yalnız üzən elementlər (menyu, dialoq, toast).
- Boşluq: `--space-1…9` (4·8·12·16·24·32·48·64·96), `--page-gutter` (32/24/20/16), `--container` 1200,
  `--section-gap` 64→56→44→36, `--section-gap-sm` 40→36→28, `--card-pad` 24→18→16, `--tap` 44.

## 3. Səhifə skeleti (hər səhifə belə başlayır)

```
[kompakt hero]  eyebrow · h1 · bir cümlə lead · (2–3 düymə və ya 2–4 açar rəqəm) · (necə işlədilir)
[bölmə]         eyebrow · h2 · bir cümlə · məzmun
[bölmə] …
[əlaqəli]       .ui-list və ya .ui-tiles — başqa bölmələrə keçid (məzmunu TƏKRARLAMA, link ver)
```

Hero telefonda (360×800) birinci ekranın ~35–45%-indən çox olmasın. Bir səhifədə bir `<h1>`.

### 3.1 Səhifə hero-su — `.ui-page-hero`

```jsx
<header className="ui-page-hero">                         {/* --split: sağda vizual */}
  <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
  <div className="ui-container">
    <nav className="ui-page-hero__crumbs" aria-label="…">…</nav>   {/* istəyə görə */}
    <span className="ui-eyebrow">Zəkat və sədəqə</span>
    <h1 className="ui-display">Zəkat kalkulyatoru</h1>
    <p className="ui-lead">Bir cümlə: bu səhifə nə edir.</p>
    <p className="ui-page-hero__how"><Icon name="info" size={16} /> Necə işlədilir: …</p>
    <ul className="ui-page-hero__stats">
      <li><b>2.5%</b><span>zəkat dərəcəsi</span></li>
      <li><b>85 q</b><span>qızıl nisabı</span></li>
    </ul>
    <div className="ui-page-hero__actions">
      <a className="ui-btn ui-btn--primary" href="#calc">Hesabla</a>
    </div>
  </div>
</header>
```

`--split` variantı: `.ui-container`-in içində `<div className="ui-page-hero__text">…</div>` +
`<div className="ui-page-hero__aside">…</div>` (≥900px yanaşı; telefonda alt-alta). Asidedə kiçik
vizual: `ProgressRing`, `StatTile`, xəritə, kiçik kart — iri şəkil yox.

Köhnə rəngli `.page-hero` hələ işləyir (v3-də kompaktlaşdırılıb: 48/40px → telefonda 28/24px), amma
redizayn edilən səhifə `.ui-page-hero`-ya keçir.

### 3.2 Bölmə başlığı — `.ui-section-head`

```jsx
<section className="ui-section">                 {/* --tight: yarım boşluq; --alt: ikinci səth */}
  <div className="ui-container">
    <div className="ui-section-head" data-reveal>  {/* --center · --row (sağda link) */}
      <span className="ui-eyebrow">Fiqh</span>
      <h2 className="ui-title">Namazın şərtləri</h2>
      <p className="ui-lead">Bir cümlə izah.</p>
    </div>
    …
  </div>
</section>
```

`.ui-section-head .ui-lead` avtomatik 15px-dir. `--row`: başlıq solda, "Hamısı →" (`.ui-link`) sağda.

## 4. Komponentlər (ui.css)

### Düymə, link
`.ui-btn` + `--primary` (zümrüd) · `--secondary` (ağ, haşiyəli) · `--ghost` · `--accent` · `--inverse` / `--inverse-ghost` (tünd zolaqda);
ölçü `--sm` (34) · susma (42) · `--lg` (48) · `--block`. İkon: `<Icon className="ui-btn__icon" />`, ox: `ui-btn__icon ui-btn__icon--end ui-flip-rtl`.
`.ui-icon-btn` (kvadrat, `aria-label` məcburi) · `.ui-link` (+ `.ui-link__arrow ui-flip-rtl`). Bir bölmədə ən çox **bir** primary düymə.

### Kart
`.ui-card` — ağ, hairline, **kölgəsiz** (v3.2: klikləmə kartı `--shadow-1`, bax §4.2). `--interactive` / `<a class="ui-card">` hover-də 2px qalxır, haşiyə zümrüdləşir.
`--sunken` (ikinci səth, haşiyəsiz) · `--plain` (fonsuz qrup — kart içində kart əvəzinə) · `--inverse` · `--flush`.
Hissələr: `__head` (ikon + başlıq) `__title` (mono, step-1) `__text` (13px) `__foot`.
`.ui-icon-tile` (+ `--accent --neutral --sm --lg`) — xətti ikon üçün yumşaq kafel.

### İkon kafelləri — `.ui-tiles` / `.ui-tile` (sürətli keçid, bölmə xəritəsi)
```jsx
<ul className="ui-tiles" style={{ '--ui-tiles-min': '168px' }}>
  <li><a className="ui-tile" href="/quran">
    <span className="ui-icon-tile" aria-hidden="true"><Icon name="quran" /></span>
    <span className="ui-tile__title">Quran</span>
    <span className="ui-tile__text">Tərcümə və tilavət</span>
  </a></li>
</ul>
```
`--row` variantı: ikon solda + `<span class="ui-tile__body">`.

### Çip, sekmə, seqment
- **Filtr** → `.ui-chip` (`aria-pressed`), qrup `role="group" aria-label`. Seçilən: tünd "mürəkkəb" dolğu.
- **Görünüş dəyişmək** (bölmə daxili panellər) → `.ui-tabs` + `.ui-tab` (`role="tablist"/"tab"`, `aria-selected`, sayı `.ui-tab__count`). Dar ekranda üfüqi sürüşür.
- **2–4 bərabər rejim** (gün/həftə, qızıl/gümüş) → `.ui-segmented` (`role="radiogroup"`, düymələrdə `role="radio" aria-checked`).
- Nişan → `.ui-badge` (`--brand --accent --solid`) — bir kartda ən çox biri.

### Forma
`.ui-field` > `.ui-field__label` (mono) + `.ui-input` / `.ui-select` + `.ui-field__hint`. Sahə 16px (iOS zoom yox).

### Cədvəl — `.ui-table`
```jsx
<div className="ui-table-wrap" tabIndex={0} role="region" aria-label="Nisab cədvəli">
  <table className="ui-table">                     {/* --compact · --zebra */}
    <caption>Mənbə: …</caption>                    {/* altda, kiçik */}
    <thead><tr><th scope="col">Mal</th><th scope="col" className="is-num">Nisab</th></tr></thead>
    <tbody>
      <tr><th scope="row">Qızıl</th><td className="is-num">85 q</td></tr>
      <tr className="is-current">…</tr>             {/* vurğulu sətir (bugün, növbəti) */}
    </tbody>
  </table>
</div>
```
Rəqəm sütunu `is-num` (mono, sona düzlənir). Müqayisə (məzhəb fərqi deyil — dəlil ilə!), vaxt cədvəli, ölçülər üçün.

### Addımlar — `.ui-steps` (dəstəmaz, namaz, həcc, hesab qaydası)
```jsx
<ol className="ui-steps">                          {/* --row: ≥768px üfüqi */}
  <li className="ui-step">                         {/* .is-done — tamamlanıb */}
    <span className="ui-step__n" aria-hidden="true">1</span>
    <div className="ui-step__body">
      <h3 className="ui-step__title">Niyyət</h3>
      <p className="ui-step__text">…</p>
    </div>
  </li>
</ol>
```

### Qeyd bloku — `.ui-callout`
`<aside className="ui-callout ui-callout--warn"><Icon name="alert" /><div><strong className="ui-callout__title">…</strong><p>…</p></div></aside>`
Variantlar: susma (brend) · `--note` · `--ok` · `--warn` · `--bad` · `--accent`. Səhifədə az işlət — hər paraqraf qeyd deyil.

### Açar–dəyər — `.ui-kv`
`<dl className="ui-kv"><div><dt>Nisab (qızıl)</dt><dd>85 q</dd></div>…</dl>` — `--grid` kafel kimi yan-yana.

### Statistika — `.ui-stat` / `.ui-stats` / `<StatTile>`
```jsx
<div className="ui-stats">                          {/* --ui-stats-min: 140px */}
  <StatTile icon="quran" label="Surə" value="114" count={114} />
  <StatTile label="Zəkat" value="2.5" unit="%" hint="ilin sonunda" variant="sunken" tone="brand" />
</div>
```
`count` → `data-count` (görünəndə 0-dan sayır, motion.css). Köhnə `<div class="ui-stat">` (çərçivəsiz) hələ işləyir.

### Zaman xətti — `.ui-timeline` / `<Timeline>`
`<Timeline wide items={[{ when: '610', title: 'İlk vəhy', text: '…', highlight: true }]} />` — tarix, siyər, alimin həyatı.

### Keçid siyahısı — `.ui-list`
"Əlaqəli bölmələr", mənbələr: `<ul className="ui-list"><li><a className="ui-list__item" href="…"><Icon name="learn" /><span>Başlıq<small>izah</small></span><Icon name="chevron" className="ui-list__chev ui-flip-rtl" /></a></li></ul>`

### Digər
`.ui-quote` (ərəbcə + tərcümə + mənbə, qızılı başlanğıc xətti) · `.ui-ornament` · `.ui-pattern` (+ `--fade`) ·
`.ui-empty` (boş vəziyyət) · `.ui-split` (≥1100px məzmun + yapışqan yan panel) · `.ui-toast` (üzən dəvət, eyni anda biri) ·
`.ui-meter` (zolaq; React: `<ProgressBar>`) · `.ui-sr-only` · `.ui-flip-rtl` · `.ui-cv` (ekrandan kənar bölmənin render-ini təxirə sal).

### 4.2 v3.2 — "kiçikdən böyüyə modern" (ui.css §15 + incələmələr)

Sahibin istəyi (2026-11): alt-alta uzun siyahı / akkordeon sətri yox — **kart grid-i + oxu pəncərəsi**.
Köhnə siniflərin adları dəyişməyib, yalnız dəyərlər incələnib:

- **Düymə:** `--primary` incə üst işıq + `--shadow-1`, hover-də `--shadow-2`; `--secondary` kölgəli.
  Toggle → `aria-pressed="true"` (`--secondary`/`--ghost` zümrüd-yumşaq olur). Yeni: `--square` (ölçüyə uyğun kvadrat ikon düyməsi).
- **Sahə:** fokusda 4px yumşaq hale; `aria-invalid="true"` + `.ui-field__error`; `textarea.ui-input`; `<select class="ui-select">`
  öz oxu ilə (RTL-də solda); `--sm`. **Axtarış:** `<div class="ui-search"><Icon name="search"/><input class="ui-input" type="search"/><button class="ui-search__clear" aria-label="…"><Icon name="close"/></button></div>`.
- **Çip:** hover fonu, `<span class="ui-chip__count">` say; qrup `.ui-chips` (`--scroll` — telefonda üfüqi sürüşür).
- **Nişan:** `--ok --warn --bad --note` (həmişə mətnlə), `--outline`, `--num` (hədis №), `.ui-badge__dot`.
- **Kart:** `--interactive` sakit halda `--shadow-1` (klikləmə olduğu bilinsin), hover 2px qalxır. Yeni: `--elevated`,
  `--brand-edge` / `--accent-edge`, hissələr `__num` (nömrə nişanı), `__meta` (çip/nişan sırası), `__actions`.
- **Sekmə/seqment:** klaviatura halqası içəridə; seçilmiş sekmənin sayı zümrüd; qaranlıqda seçilmiş seqment `--surface-3`.
- **Boş vəziyyət:** ikon yumşaq dairədə; `--card` (qırıq haşiyəli sahə), `--bad` (xəta); içində `<p>` + `.ui-btn`.
- **Tile:** `--shadow-1`, hover-də qalxır.

Yeni köməkçilər:

| Sinif | Nə üçün |
|---|---|
| `.ui-cardgrid` (`--ui-cardgrid-min`, `--stretch`) | Kart grid-i: `repeat(auto-fill, minmax(min(100%, 300px), 1fr))`, `align-items: start` |
| `.ui-clamp` (`--lines` və ya `--1 --2 --4`) | Kartda 1–4 sətirlik önizləmə (`line-clamp`); çapda tam açılır |
| `.ui-toolbar` (+ `__count`, `--static`) | Sticky alət zolağı: `.ui-search` + `.ui-chips` + say; şüşə fon |
| `.ui-dialog` (+ `__head __title __body __foot`, `--sheet`, `.ui-dialog-backdrop`) | Native `<dialog>` və ya portal pəncərəsi; `--sheet` — telefonda aşağıdan vərəq, ≥768px yan panel. Kart grid-indən oxu pəncərəsi üçün hazır komponent: `components/reader/ReaderDialog` |
| `.ui-bento` (+ `__cell--wide`, `__cell--tall`) | 1 → 2 (≥700px) → 4 (≥1100px) sütunlu bento (ana səhifənin "Bu gün" paneli) |
| `.ui-skeleton-grid` | Kart grid-inin yüklənmə yer tutucusu (`.ui-skeleton--card` ilə) |

Ana səhifə nümunəsi: `components/home/HomeToday.jsx` — günün hədisi (Nəvəvi 40, gün nömrəsinə görə), günün ayəsi,
"qaldığınız yerdən" (yalnız mövcud localStorage açarları oxunur), hicri tarix; kopyala / paylaş (Web Share → bufer).

## 5. Qrafiklər — `src/components/viz`

```jsx
import { ChartFigure, BarChart, ColumnChart, Donut, ProgressRing, ProgressBar,
         Sparkline, StackedBar, Timeline, StatTile } from '../components/viz'

<ChartFigure title="Nisab: qızıl və gümüş" sub="qram" note="Mənbə: …(yoxlanılmış istinad)">
  <BarChart data={[{ label: 'Qızıl', value: 85 }, { label: 'Gümüş', value: 595 }]} format={v => `${v} q`} />
</ChartFigure>
```

| Komponent | Nə üçün | Əsas props |
|---|---|---|
| `ChartFigure` | hər qrafikin çərçivəsi: başlıq, alt başlıq, mənbə | `title sub note plain` |
| `BarChart` | kateqoriya müqayisəsi (üfüqi, uzun adlar) | `data[{label,value,note,tone,muted}] max format labelWidth` |
| `ColumnChart` | ardıcıllıq (≤12: aylar, 5 namaz) | `data[{label,value,current,muted}] height showValues` |
| `Donut` | tərkib, 2–4 pay | `segments[{label,value,tone}] center{value,label} size thickness` |
| `StackedBar` | tərkib bir zolaqda (miras, gün bölgüsü) | `segments format` |
| `ProgressRing` | tək irəliləyiş (xətm, hifz) | `value max label sub size` |
| `ProgressBar` | xətti irəliləyiş | `value max label tone size('sm'/'lg')` |
| `Sparkline` | kiçik trend (son 7/30 gün) | `values label(məcburi) area dot flipRtl` |
| `Timeline` | tarixi ardıcıllıq | `items[{when,title,text,highlight,tone}] wide headingLevel` |
| `StatTile` | tək iri rəqəm (çox vaxt qrafikdən yaxşıdır) | `value unit label hint icon count variant tone` |

Qaydalar:
1. **Əvvəl formanı seç**: bir rəqəm → `StatTile`; müqayisə → `BarChart`; zaman → `ColumnChart`/`Sparkline`/`Timeline`;
   tərkib → `Donut`/`StackedBar`; prosedur → `.ui-steps`; çox ölçülü məlumat → `.ui-table`. Dual-axis qrafik YOX.
2. Rəng: `tone` 1–4 (sabit sıra) və ya `'muted'`; tək seriya — `tone` vermə. Status rəngi (`ok/warn/bad`) yalnız vəziyyət üçün.
3. Dəyərlər həmişə **mətn kimi də** görünür (zolağın yanında, legend-də) — rəng tək daşıyıcı deyil; ekran oxuyucu üçün
   `label`/`aria-label` ver. Mətn seriya rəngində yazılmır.
4. RTL avtomatikdir (HTML qrafiklər məntiqi xassələrlə; `Sparkline` `flipRtl`). Qaranlıq rejim tokenlərlə avtomatikdir.
5. Məlumat **doğru və mənbəli** olmalıdır: `note="Mənbə: …"`. Uydurma rəqəm yox.

## 5.1 Qrafiklər v2 — panel (dashboard) dəsti (2026-11-09)

Eyni yerdən import olunur (`../components/viz`); v1 komponentləri və props-ları dəyişməyib.
Fayllar: `viz/xy.jsx` (AreaChart, LineChart) · `viz/heatmap.jsx` (CalendarHeatmap) · `viz/cards.jsx` (qalanları) ·
`viz/scale.js` (saf hesab, `tests/unit/viz-scale.test.js`) · `viz/format.js` (dilə görə Intl format) · `viz/hooks.js` ·
`viz/tone.js` (`vizColor`) · stil `src/styles/viz.css` (`.vz-*`, viz/index.jsx özü import edir). Vitrin: `/analytics`.

```jsx
import { BentoGrid, ChartCard, KpiCard, RangeTabs, AreaChart, LineChart, CalendarHeatmap, RadialBars,
         FunnelChart, SegmentBreakdown, CompareBars, GoalRing, ActivityFeed, MiniTable, InlineBar, TrendCell,
         Delta, makeFormat, vizScale } from '../components/viz'

const [range, setRange] = useState(30)
<BentoGrid>
  <KpiCard span={3} icon="prayer" label="Namaz" value="102" delta={{ value: 13, vs: 'əvvəlki 30 günə görə' }}
           spark={[3, 5, 4, 5]} sparkLabel="Namaz: trend" href={pathFor('dailytracker', lang)} onClick={go('dailytracker')} />
  <ChartCard span={8} id="deeds" title="Əməllər" sub="gündə qeyd olunan"
             actions={<RangeTabs label="Dövr" value={range} onChange={setRange}
                                 options={[{ value: 7, label: '7 gün' }, { value: 30, label: '30 gün' }]} />}
             footer={{ label: 'Hamısı', href: '/dailytracker', onClick }}>
    <AreaChart mode="stacked" integer label="Əməllər" labels={dayKeys} xFormat={k => f.date(fromDayKey(k))}
               series={[{ key: 'p', label: 'Namaz', values: [..], tone: 1 }, { key: 'q', label: 'Quran', values: [..], tone: 3 }]} />
  </ChartCard>
</BentoGrid>
```

| Komponent | Nə üçün | Props |
|---|---|---|
| `BentoGrid` | 12 sütunlu panel şəbəkəsi (≥1100px; 720–1099 — 2 sütun, KPI 2×2; telefonda KPI 2 sütun, qalan tam en) | `className children` — uşaqlarda `span` (1–12) |
| `ChartCard` | kart qabığı | `title sub icon actions footer({label,href,onClick,note} \| node) span rowSpan id headingLevel('h3') flush className` |
| `KpiCard` | iri rəqəm + dəyişmə + mini trend | `label value unit delta(number \| {value,positiveIsGood,vs}) spark(number[]) sparkLabel icon href onClick hint tone count span lang` |
| `Delta` | ↑ 12% / ↓ 4% nişanı (yaşıl/qırmızı + ekran oxuyucu üçün söz) | `value(faiz; null → heç nə) positiveIsGood(true) vs(mətn \| false) format size('sm'\|'md') lang` |
| `RangeTabs` | idarə olunan seqment (dövr, rejim); radiogroup, ←/→ | `options([{value,label,title}] \| string[]) value onChange label(məcburi) size('sm')` |
| `AreaChart` | zaman sırası, sahə; `mode` `'stacked'` (tərkib) \| `'overlay'` | `series[{key,label,values,tone,compare?}] labels xFormat(label,i) tooltipTitle(label,i) height(240) yFormat valueFormat yTicks(4) integer yMin yMax grid legend legendValue('total'\|'last'\|'avg'\|false) toggle compareLabel curve('monotone'\|'linear') label(məcburi) summary empty emptyText dots animate lang` |
| `LineChart` | AreaChart-ın dolğusuz forması; `series[i].compare` — ştrixli "əvvəlki dövr" | AreaChart ilə eyni |
| `CalendarHeatmap` | GitHub üslubunda gün şəbəkəsi | `data({ 'YYYY-MM-DD': n } \| key => n) end weeks('auto' \| n) maxWeeks(26) minWeeks(8) weekStart(1) thresholds levels(4) format(v,key) label legend showDays showMonths tone lang` |
| `RadialBars` | bir neçə tamamlanma halqası (5 namaz) | `items[{key,label,value,max,tone}] layout('row'\|'concentric') size thickness tone format(v,max) label centerValue centerLabel lang` |
| `GoalRing` | hədəf halqası + İndi / Qalıb / Temp / Bitəcək | `value goal pace(gündə) unit format rows(əvəz) extraRows centerLabel label size(136) thickness tone lang` |
| `FunnelChart` | addımlar, başlanğıcın %-i, keçid nişanı, ştrixli keçən dövr | `steps[{key,label,value}] compare(number[]) compareLabel format label tone height(150) lang` |
| `SegmentBreakdown` | proporsional zolaq + sətirlər (say, pay %, dəyişmə) | `items[{key,label,value,prev,tone,hint}] format label positiveIsGood showBar lang` |
| `CompareBars` | "bu dövr vs keçən" üfüqi zolaqlar (boz kölgə = keçən) | `items[{key,label,value,prev,tone}] max format label currentLabel prevLabel tone lang` |
| `ActivityFeed` | ikon + hadisə + "7 dəq. əvvəl" + çip | `items[{key,icon,title,meta,time(Date \| ms \| 'YYYY-MM-DD'),chip(string \| {label,tone:'accent'\|'muted'}),href,onClick}] max(8) now empty label lang` |
| `MiniTable` | kiçik cədvəl (.ui-table), sürüşən region | `columns[{key,label,align('end'),render(row),hideSm}] rows caption captionHidden(true)` |
| `InlineBar` / `TrendCell` | cədvəl xanası: mini zolaq / trend xətti | `value max tone label showValue format` / `values label(məcburi) tone width height` |

Köməkçilər: `makeFormat(lang)` → `{ num, compact, pct, date(d, opts), rel(then, now, {dayOnly}), rtl, locale }`
(az üçün öz ay/gün adları və "2 961", "12,5%" — brauzerdə az lokalı olmasa da); `useVizFormat(lang?)` (+ `t` — qrafiklərin
öz yazıları 5 dildə); `vizScale.*` — `niceTicks pctDelta bucketSum stackSeries linePath areaPath quantileThresholds levelOf
relUnit dayKeys addDayKey fromDayKey toDayKey etaFromPace`; `useSize useInView useReducedMotion`.

Qaydalar (v1 qaydaları + bunlar):
1. **Rəng**: seriyalar `tone` 1–4 (sabit sıra); 4-dən çox seriya — birləşdir. Dəyişmə rəngi yalnız `Delta`-da (`--ok`/`--bad`).
2. **Əlçatanlıq** avtomatikdir: `role="img"` + xülasə, gizli `<table>` (bütün dəyərlər), qrafikə Tab → ←/→/Home/End/Esc,
   `aria-live` cari nöqtə. `label` prop-unu HƏMİŞƏ ver (aria adı və cədvəl başlığı olur).
3. **RTL**: zaman qrafiklərində və təqvimdə zaman sağdan sola, y oxu sağda; mini trendlər güzgülənir.
4. **Hərəkət**: xətt `stroke-dashoffset` ilə çəkilir, sahə/xana `opacity`, zolaq `transform` — yalnız ekrana girəndə və
   "hərəkəti azalt" söndürülübsə. Sonsuz animasiya yoxdur.
5. **Məlumat**: şəxsi göstəricilər yalnız istifadəçinin öz localStorage qeydlərindən; əvvəlki dövr 0-dırsa `pctDelta` → `null`
   (sonsuz faiz göstərilmir). Boş məlumat → `empty`/`emptyText` (saxta rəqəm yox).
6. Kartın en-i `ChartCard span` / `KpiCard span` ilə; səhifə öz CSS-ində yalnız düzülüşü dəyişir (`#id` ilə).

## 6. Tətbiq qabığı

- **Başlıq** (`Header.jsx/.css`): loqo · 5 əsas link (mono) · axtarış · tema · dil; <1024px — axtarış + ☰.
- **Yan panel** (`SideNav.jsx/.css`, ≥1024px): axtarış sahəsi + 8 qrup (mono böyük hərfli etiket, ikonlu 34px sətirlər,
  cari səhifə yumşaq zümrüd fonda + qızılı göstərici). <1024px eyni qruplar ☰ çəkmə menyusunda (46px sətirlər, alətlər, tema, dil).
- **Footer**: brend + şüar + 5 sütun link (mono etiketlər) + hüquqi sətir.
- **Dok** (FloatingDock, ≥1024px sağ aşağı): AI, əlçatanlıq, bildirişlər.

## 7. Hərəkət (motion.css + wow.css "VAU 2")

`--dur-1` 150 · `--dur-2` 240 · `--dur-3` 360 · `--dur-4` 560ms; yalnız `transform`/`opacity`.
`data-reveal` (`up down left right zoom blur fade stagger stagger-*`), `data-reveal-delay`, `data-count` sayğacı,
`.ui-enter-*` giriş sinifləri, `.ui-skeleton`. `prefers-reduced-motion: reduce` — hamısı söndürülür.
Bölmə başlıqlarına `data-reveal`, kafel/kart şəbəkələrinə `data-reveal="stagger"`, iri rəqəmlərə `data-count`.

### 7.1 "Vau" qatı (wow.css + utils/wow.js — 2026-11-04, sahibin istəyi)

Sahib istiqaməti dəyişdi: *"statik olmasın, müasir, animasiyalı, vau"*. Yuxarıdakı "dövri dekor yoxdur"
qaydası **hero aurorası üçün** ləğv olunub. Qat səhifələrə toxunmadan ortaq siniflərə işləyir:

| Nə | Harada | Qeyd |
|---|---|---|
| Kursor işığı + 3D əyilmə | `.ui-card`, `.ui-tile`, `.ui-stat` | işıq yalnız öz fon şəkli olmayan kartda; əyilmə yalnız kliklənən, ≤560px kartda; yalnız siçan |
| Sürüşəndə növbəli qalxma | `.ui-card`, `.ui-tile`, `.ui-stat`, `.ui-step` | `[data-reveal]` altındakılara toxunmur; söndürmək üçün konteynerə `data-wow-off` |
| Aurora (yavaş hərəkətli işıq ləkələri) | hər `.ui-page-hero` | JS əlavə edir (`.wow-aurora`), z-index −1 |
| Başlıq parıltısı | `.ui-page-hero h1` | mətn → zümrüd → mətn, bir dəfə |
| Düymə işığı | `.ui-btn--primary:hover` | |
| Oxu zolağı | səhifənin yuxarısı | yalnız CSS scroll-timeline |

Yeni səhifədə bunlar **avtomatik** gəlir — yalnız ortaq sinifləri işlət. Hərəkəti azalt (sistem və ya panel) — hamısı söndürülür.

### 7.2 "VAU 2" (dizayn v4 — wow.css + utils/wow.js)

Hərəkət dili: giriş `blur(8px) + translateY(24px) + opacity 0 → aydın`, `--wow-ease` (ease-out-expo,
`cubic-bezier(.16,1,.3,1)`), 600–800ms, növbə 40–70ms (ən çox 10). Telefonda (≤767px / toxunuş) blur yox,
qalxma 16px. Gizli başlanğıc **yalnız `html.wow-ready` altında** (JS qoyur; "hərəkəti azalt"-da qoyulmur) —
prerender HTML-də və JS-siz məzmun həmişə görünür. İlk açılışda (≈0.9 san) ekranda olan elementlər
gizlədilmir (LCP / yanıb-sönmə olmasın); sonrakı naviqasiyalarda animasiya ilə girir.

**Avtomatik (səhifəyə heç nə yazmadan):**

| Nə | Harada |
|---|---|
| Blur + qalxma + növbə girişi | `.ui-card .ui-tile .ui-stat .ui-step .ui-section-head .ui-callout .ui-quote .ui-table-wrap` (iç-içə kartda yalnız valideyn) |
| Haşiyədə kursoru izləyən qızılı-zümrüd parıltı | kliklənən kart/kafel (öz `::after`-i yoxdursa) |
| Hero canlı fonu | `.ui-page-hero`: aurora + fırlanan 8-guşəli ulduz + parallaks (≥768px); ekrandan çıxanda pauza |
| Başlıq sözbəsöz | `.ui-page-hero h1` (tək mətn düyünlüdürsə; sonra orijinal düyün qaytarılır) |
| Ərəbcə yazı "mürəkkəblə" | hero-dakı `[lang="ar"]`, `.ui-arabic` |
| Rəqəm sayğacı | `.ui-page-hero__stats b/strong`, hero-dakı `.ui-num` (avtomatik `data-count`) |
| Düymə işığı + maqnit (yalnız siçan) | `.ui-btn--primary/--accent/--lg`, `[data-magnetic]` |
| Sürüşən indikator | `.ui-tabs` (alt xətt), `.ui-segmented` (hap) |
| Dialoq yay kimi | `dialog[open]`, `.ui-enter-dialog` |
| Link alt xətti çəkilir | `.ui-link` (RTL-də sağdan) |
| Səhifə keçidi | View Transitions API (modul yüklənibsə, ≥768px) + `.page-enter`; yüklənərkən yuxarıda nazik zolaq |
| "Yuxarı qayıt" | oxu irəliləyişi halqası (scroll-timeline) |

Söndürmək: konteynerə `data-wow-off`. Öz giriş sistemi olan bölmələr (`[class*="quiz-"]`, `[class*="kids-"]`,
`.ab-charts`, `.gp-root`, `.analytics-page`, `[data-reveal]`, `[data-anim]`) qlobal girişdən çıxarılıb.

**Səhifə agentləri üçün atributlar:**

```html
<h2 data-anim="blur">…</h2>                       <!-- rise | fade | zoom | blur | slide-start | slide-end | ink -->
<p data-anim="rise" data-anim-delay="120">…</p>   <!-- gecikmə, ms (≤1200) -->
<ul data-anim-stagger data-anim="zoom">…</ul>     <!-- UŞAQLAR növbə ilə (60ms; 10-dan sonrakılar 10-cu ilə) -->
<ul data-anim-stagger="80">…</ul>                 <!-- növbə addımı, ms (≤200); data-anim yoxdursa "rise" -->
<span data-count="6236">6 236</span>              <!-- görünəndə 0-dan sayır; format (ayırıcı, %, +) saxlanır, sonda mətn ƏVVƏLKİ KİMİ -->
<div data-parallax="0.15" aria-hidden="true">…</div>  <!-- translateY = (ekran mərkəzi − element mərkəzi) × əmsal; telefonda yox -->
```

- `ink` — ərəbcə yazı sağdan sola "mürəkkəblə çəkilir" (clip-path); `slide-start/end` — məntiqi istiqamət (RTL güzgülənir).
- `data-anim-stagger` konteynerin özü animasiya olunmur — yalnız birbaşa uşaqları.
- `data-parallax` `translate` xassəsini yazır (elementin öz `transform` animasiyası ilə toqquşmur) — yalnız dekor üçün.
- Hamısı bir dəfə işləyir; "hərəkəti azalt" (sistem və ya `html.a11y-reduce-motion`) — heç nə gizlənmir, sayğac son ədəddə qalır.
- Səhifəyə xas animasiya — öz CSS-ində prefiksli `@keyframes <prefiks>-…`.

### 7.3 Motion — `src/motion` (dizayn v6, 2026-11-09)

Paket **`motion`** (framer-motion-un yeni adı, v14). Import HƏMİŞƏ `motion/react`-dan və **yalnız `m.*`**
(`motion.*` YOX — `LazyMotion strict` xəta verir). Tək kontekst `MotionProvider` App.jsx-dədir: animasiya
xüsusiyyətləri (`domAnimation`) ayrıca chunk-dır, "load"-dan sonra boş vaxtda və ya ilk toxunuşda gəlir — ilk
render/LCP-yə təsiri yoxdur. `layout`/`layoutId`/`drag` lazımdırsa `<LayoutFeatures>` (domMax, tənbəl) —
AnimatedTabs, ExpandableGroup, CardStack, AnimatedList bunu özü edir. **Mövcud qatları (wow.js, data-reveal,
vau3) əvəz etmir** — Motion komponentinin kökü `data-wow-off` (giriş) və lazım olanda `data-motion-own`
(wow-un kart işığı/əyilməsi/maqniti) qoyur: eyni elementi iki sistem animasiya etmir.

**Qaydalar (UI UX Pro Max §7 + saytın öz qaydaları):** yalnız transform/opacity (+ kiçik blur, telefonda yox);
çıxış girişdən ~38% qısa (`exitT`); yay fizikası (`SPRING`); növbə 30–60 ms, ən çox 10 element gözləyir;
kəsilə bilən (yeni vəziyyət köhnəni əvəzləyir); hər görünüşdə 1–2 əsas hərəkət; dövri dekor ekrandan kənarda
və tab gizli olanda dayanır.

**Hərəkəti azalt — iki pillə** (`useReduced(kind)`): `'all'` — sistem ayarı və ya panel (`html.a11y-motion-user`)
→ hər şey statik, `MotionConfig reducedMotion="always"`; `'decor'` — üstəlik `html.a11y-reduce-motion` (zəif cihaz da)
→ axan xətlər, qlobus, marquee, orbit dayanır, UI hərəkəti (menyu, dialoq, giriş) qalır.

**Prerender / ilk açılış:** heç nə JS-siz gizli qalmır. Reveal/Stagger elementi yalnız (a) Motion yüklənibsə,
(b) hərəkət azaldılmayıbsa və (c) ekrandan kənardadırsa və ya ilk boyama pəncərəsi (~0.9 s, `wow.js → inFirstPaint`)
keçibsə gizlədir — boyamadan əvvəl, ani. İlk kadrda ekranda olan məzmun toxunulmur. `TextEffect` ilk kadrda opacity-ni
dəyişmir (yalnız transform + kiçik blur — LCP qorunur). `NumberTicker` əvvəlcə son rəqəmi yazır.

**Səhifə keçidi** (`PageTransition`, App.jsx — `case 'x': return <X` forması dəyişməyib): hər naviqasiyada TƏK mexanizm —
View Transition gedirsə (≥768px, modul yüklü) Motion susur (köhnə `<main>` ani çıxır, VT kadrında görünmür);
telefonda köhnə səhifə toxunan anda CSS ilə yola düşür (`.page-leave`), Motion yalnız yenisini oxu istiqamətindən gətirir;
qalan hallarda Motion: köhnə qısa solur (`popLayout`), yeni yumşaq qalxır. `.page-enter` sinfi qalır (wow.js hero-nu tanıyır),
onun CSS animasiyası `.page-enter--motion` ilə söndürülüb.

**Tətbiq olunub (ortaq):** başlıq naviqasiyası — `LimelightNav` (qızılı zolaq + işıq konusu yayla sürüşür); yan panel —
`HoverPill` (siçan hapı) + cari sətrin göstəricisi yayla; FloatingDock — menyu yay kimi açılır/qısa çıxır + ikonlar
kursora yaxınlığa görə böyüyür (dok); ReaderDialog — yay + fon, bağlanışda son məzmun qalır, `layoutId` ilə kart→dialoq
morph; BadgeToast — giriş/çıxış; BackToTop — yay kimi qalxır. Ana səhifə: hero alt yazısı `TextEffect`, fonda
`BackgroundPaths`, kafellər `SpotlightCard`, statistika `NumberTicker`.

| Komponent | Nə üçün | Əsas props |
|---|---|---|
| `Reveal` | bir blok görünəndə açılır | `as`, `variant` (fadeUp·fadeIn·blurIn·scaleIn·slideStart), `delay`, `duration` (san), `margin` |
| `Stagger` + `StaggerItem` | şəbəkə/siyahı növbə ilə | `as`, `step` (0.05), `delay`, `max` (10), `variant`; item: `as`, `variant` |
| `TextEffect` | başlıq/alt yazı söz-söz və ya hərf-hərf | `as`, `per` (word·char; ərəbcə həmişə word), `preset` (blur·fade), `step`, `delay`; uşaq — sətir |
| `NumberTicker` | rəqəm yayla sayır (Intl, dilə görə) | `value`, `lang`, `from`, `decimals`, `prefix`, `suffix`, `compact`, `delay` |
| `SpotlightCard` | kursoru izləyən işıq + haşiyə parıltısı (yalnız siçan) | `as`, `glow`, `radius`, `tone` (brand·accent) + istənilən atribut |
| `MagneticButton` | uşaq düymə kursora "çəkilir" | `strength` (0.25), `max` (8px) |
| `ShineButton` | `.ui-btn` + keçən işıq + basılanda yay | `as` (button·a), `variant`, `size`, `icon` |
| `AnimatedTabs` | WAI-ARIA sekmələr, `layoutId` hap/xətt | `tabs` [{id,label,count,icon,disabled}], `value`, `onChange`, `label`, `idBase`, `variant` (pill·underline), `size` |
| `LimelightNav` | üfüqi naviqasiya, aktivin üstündə işıq | `items` [{key,label,href,onClick,icon}], `current`, `label`, `linkClassName`, `ariaCurrent` |
| `HoverPill` | siyahıda siçanın arxasında sürüşən hap | `containerRef`, `selector`, `className` (konteyner `position: relative`) |
| `Marquee` | axan zolaq (hover/fokusda dayanır) | `speed` (px/s), `reverse`, `gap`, `label` |
| `CardStack` | sürüşdürülən kart dəstəsi + düymələr/klaviatura | `items`, `renderItem(item,i)`, `getKey`, `lang`, `label`, `index`/`onIndexChange`, `visible` |
| `ExpandableGroup` + `ExpandableCard` + `useMorphId(id)` | kart → ReaderDialog morph | card: `id`, `as`; dialoq: `<ReaderDialog layoutId={useMorphId(openId)}>` |
| `BackgroundPaths` | fonda axan incə xətlər (dekor) | `count`, `tone` (gold·brand·muted); valideyn `position: relative` |
| `DottedGlobe` | nöqtəli qlobus, vurğulanan nöqtə (susma Məkkə) | `size`, `points`, `highlight` {lat,lon}, `speed`, `tilt`, `label` (null → dekor) |
| `OrbitalTimeline` | dairəvi orbit, basanda mərkəzdə məzmun | `items` [{id,title,meta,icon,content}], `value`/`onChange`, `label`, `lang`, `centerFallback` |
| `AnimatedList` + `AnimatedItem` | lent/bildiriş: yay ilə gəlir, layout ilə yerləşir | `as`; item: `as`, `from` (bottom·top) |
| `PresenceSwap` | eyni yerdə məzmun dəyişimi (mode="wait") | `swapKey`, `variant` (fade·blur·slide), `dir`, `as`, `mode` |
| `ScrollProgress` | məqalə/qutu oxu zolağı (qlobal zolaq wow.js-dədir) | `target` (ref), `container` (ref), `fixed` |
| `PageTransition` | yalnız App.jsx | `pageKey`, `back` |

Köməkçilər: `presets.js` — `DUR`, `EASE`, `SPRING`, `enterT`, `exitT`, `exitDur`, `staggerDelay`, `staggerContainer`,
`fadeUp/fadeIn/blurIn/scaleIn/slideStart`, `pageVariants`, `dockScale`, `orbitPositions`, `swipeDecision`;
`format.js` — `formatTicker`, `localeFor`, `spherePoints`, `projectPoint`, `MAKKAH`, `splitText`, `flowPath`;
`reduced.js` — `useReduced`, `isReduced`, `isFinePointer`; `useEntrance`, `useOffscreenPause`, `useMotionReady`.
Stillər: `src/styles/motion-kit.css` (`.mo-*`). Testlər: `tests/unit/motion-*.test.js`.
İmport: komponenti öz faylından (`import Reveal from '../motion/Reveal'`) və ya barrel-dən (`from '../motion'`).

## 8. Vacib texniki qaydalar

1. **CSS sırası.** Səhifə CSS-i `globals.css`/`ui.css`-dən ƏVVƏL yüklənir — `.ui-*` sinfini dəyişmək üçün valideynlə gücləndir:
   `.xp-root .ui-tile { … }`.
2. **Ölçü yazma** — `font-size: var(--step-*)`. Px font ölçüsü yalnız ərəbcə mətn və ikon üçün.
3. **Köhnə tokenlər** (`--primary --bg --text-dim --border --gold --shadow …`) alias kimi qalır; yeni kodda semantik adlar.
4. **Qaranlıq rejim** yalnız tokenlərlə. `[data-theme="dark"] .x { color:#… }` lazımdırsa — səhv token seçilib.
5. **RTL**: `margin-inline`, `padding-inline`, `inset-inline-*`, `text-align: start`; oxlar `ui-flip-rtl`;
   ərəbcə elementə `lang="ar" dir="rtl"`. Latın domeni `direction: ltr; unicode-bidi: isolate`.
6. **Əlçatanlıq**: bir `<h1>`; başlıq pillələri ardıcıl; fokus halqası motion.css-dən (`outline: none` yazma);
   toxunma ≥ 44px; ikon-düymədə `aria-label`; sürüşən zolaqda `tabIndex={0} role="region" aria-label`.
7. **e2e testlərinin baxdığı adlar** (dəyişmə): "Menyu" düyməsi (`aria-expanded`), `<nav aria-label="Bölmələr">` + qrup
   `button[aria-expanded]`, menyu `role="dialog"`, Ctrl+K `role="dialog"`, "Qaranlıq rejim", "Dili dəyiş", `.hp-pc` namaz kartı,
   "Şəhəri dəyiş". Səhifəni dəyişməzdən əvvəl `tests/e2e`-də öz səhifənin selektorlarını axtar.
8. **Performans**: kitabxana yox, şəkil yalnız mövcud yer fotoları; ekrandan aşağı bölmələrə `.ui-cv` + `--cv-h`.
9. **Mətnlər 5 dildə** saf: `node scripts/check-lang.mjs --only=<fayllar>`.
10. **Məzmun**: Sələfin anlayışı; mənbəsiz iddia yox; başqa səhifədə olanı təkrarlama — link ver.

## 9. Səhifəni köçürmə yoxlama siyahısı

- [ ] `.page-hero` → `.ui-page-hero` (kompakt): eyebrow · h1 · bir cümlə · (`__how` / `__stats` / `__actions`).
- [ ] Hər bölmə `.ui-section` + `.ui-section-head` (eyebrow · h2 · bir cümlə).
- [ ] Kart içində kart yoxdur; haşiyə + kölgə birlikdə yoxdur; kartlar `.ui-card` / `.ui-tile`.
- [ ] Ən azı bir vizual: `StatTile`, qrafik, `.ui-steps`, `.ui-timeline`, `.ui-table` — mətn divarı yox.
- [ ] Font ölçüləri `--step-*`; başlıq/etiket/rəqəm mono, paraqraf sans.
- [ ] Emoji → `<Icon>`; rəngli `style={{'--clr': …}}` → token.
- [ ] Filtr `.ui-chip`, sekmə `.ui-tabs`, rejim `.ui-segmented`, sahə `.ui-input`.
- [ ] 360 · 768 · 1280, işıqlı + qaranlıq, `/ar` ekran şəkli; konsol təmiz; check-lang, vitest, build, e2e keçir.

### 7.3.1 Performans qaydaları (2026-11-05 ölçüsündən sonra; `check-motion.mjs` buna istinad edir)

- **Sonsuz (`infinite`) animasiya yalnız `transform` / `opacity` ilə.** `background-position`, `box-shadow`,
  `text-shadow`, `filter`, `clip-path`, `stroke-*` GPU-ya ötürülmür — səhifədə belə bircə sonsuz animasiya olsa,
  brauzer HƏR kadr əsas axında stil hesablayıb rəngləyir (istifadəçi heç nə etməsə də). Belə effekt lazımdırsa —
  məhdud təkrar (`2`, `3`) və ya yalnız aktiv vəziyyətdə (səslənən ayə, yazılan AI cavabı).
- Kiçik elementlərdə (rəqəm, ikon) `filter: blur` animasiyası yox — görünmür, amma bahalıdır.
- JS-də hər kadr DOM yazma yox: dəyər dəyişməyibsə yazma, saniyədə ≤20 yeniləmə, eni sabitlə (`useReveal` sayğacı).
- Yoxlama: `node scripts/check-motion.mjs` (CI-da) — sonsuz + GPU-ya ötürülməyən animasiyanı tutur.

## 10. VAU 3 — dizayn v5 (`src/styles/vau3.css`, `utils/vau3.js`, 2026-11-07)

Sahibin istəyi: *"scroll animasiyaları, navbar, footer, CTA, superhero, 3D ikonlar — müasir, animasiyalı, VAU"*.
Qat wow.css-dən sonra yüklənir və ortaq siniflərə işləyir — yeni səhifə bunları **avtomatik** alır.

| Nə | Harada | Qeyd |
|---|---|---|
| **İslami ikon kafeli** (v5.1) | hər `.ui-icon-tile` | 8 guşəli xatəm ulduzu (CSS mask): yumşaq dolğu + qızılı kontur; kliklənən kafeldə kontur 22.5° fırlanır (16 guşəli hörgü). 3D gil görünüşü sahibin rəyi ilə götürüldü. Rəng `--it` |
| **Hero geri çəkilir** | `.hp-hero-content`, `.ui-page-hero > .ui-container` | CSS `view()` exit — sürüşdükcə solur və kiçilir |
| **Pərdə açılışı** | `.hp-tw`, `.vx-cta`, `.vx-ft-band` | ekrana girəndə 0.94 → 1 |
| **Dil zolağı** (yalnız footer) | `<LangMarquee label />` (`components/LangMarquee.jsx`) | 50 dil öz adı ilə; sonsuz (transform), üzərində dayanır; 2-ci sıra `aria-hidden` |
| **CTA paneli** | `.vx-cta` (+ `--aurora` `--split` `--glow`), `data-spotlight` | fırlanan konik işıq, kursor işığı, qızılı haşiyə, `.vx-cta__float` 3D ikonlar (≥900px). Hissələr: `__ar __title __text __btns __trust` |
| **Footer v5** | `Footer.jsx` | CTA zolağı (ana səhifədə gizli — orada öz CTA-sı var) · dil zolağı · iri söz-nişanı (görünəndə dolur) |
| **Navbar kapsulu** | `.nav-desktop` (≥1024px) | şüşə kapsul + kursor işığı; `.header.scrolled`-də qalxır; loqo ulduzu 45° fırlanır |
| **Səhifə köməkçisi** | `components/PageHelp.jsx` (başlıqdakı ⓘ, klaviatura `?`) | avtomatik: bölmənin adı + SEO təsviri + hero-dakı `.ui-page-hero__how` + h2-lərdən içindəkilər + eyni qrupun bölmələri. Ana səhifədə yoxdur |

Qaydalar: scroll-driven hər şey `@supports (animation-timeline: view())` + `prefers-reduced-motion: no-preference` +
`html:not(.a11y-reduce-motion)` içindədir — dəstək yoxdursa/hərəkəti azaltda **statik və tam görünən** olur.
Sonsuz animasiya yalnız transform/opacity (`node scripts/check-motion.mjs`). Yeni mətn yazanda əvvəl mövcud ingiliscə
sətri yenidən işlət (44 lüğətdə artıq tərcüməsi var) — yeni sətir əlavə dillərdə ingiliscə qalar.

Sahibin rəyi (2026-11-07): ana səhifədə dil zolağı, günəşli "bir gün" bölməsi, rəngli namaz səması və 3D ikonlar **istəmir** — hero rəngsiz (fil sümüyü + naxış). Geri qaytarma.
