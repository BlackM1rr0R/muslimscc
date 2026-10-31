# Dərslər (/learn) — məlumat formatı

Hər dərs ayrıca fayldır: `src/data/lessons/<slug>.js`. İki ixrac:

```js
export const meta = {
  slug: 'nawaqid-al-islam',           // URL: /learn/<slug> (ASCII, kiçik hərf, defis)
  cat: 'aqidah',                      // LESSON_CATS-dan biri (aşağıda)
  order: 30,                          // kateqoriya daxilində sıra (kiçik — əvvəl)
  icon: 'shield',                     // src/components/Icon.jsx-dəki ad
  arTitle: 'نواقض الإسلام',           // dekorativ ərəbcə başlıq
  title:   { az, en, ru, ar, tr },    // ≤ 60 simvol
  summary: { az, en, ru, ar, tr },    // 1–2 cümlə (≤ 160 simvol — SEO description)
  author:  { az, en, ru, ar, tr },    // əsərin müəllifi / əsas mənbə (məs. "Şeyx Muhəmməd ibn Abdülvəhhab")
  minutes: 12,                        // təxmini oxu vaxtı
}

export default {
  sections: [
    {
      id: 'intro',                    // bölmənin lövbəri (#intro), ASCII
      title: { az, en, ru, ar, tr },
      blocks: [ ...blok ],
    },
  ],
  sources: [ { label: 'Kitabın / saytın adı', url: 'https://…' } ],
}
```

## Bloklar

Hər mətn sahəsi 5 dildə obyektdir: `{ az, en, ru, ar, tr }`.

| t          | sahələr | nə üçün |
|------------|---------|---------|
| `p`        | `text` | abzas |
| `list`     | `items: [ {…5 dil} ]`, `ordered?: true` | siyahı |
| `steps`    | `items: [ { title:{…}, text:{…} } ]` | addım-addım qayda (dəstəmaz, namaz və s.) |
| `ayah`     | `ar`, `text:{…}`, `ref: '2:255'` | Quran ayəsi (ref — surə:ayə; bir neçə ayə: '2:255-257') |
| `hadith`   | `ar?`, `text:{…}`, `src:{…}` (məs. "Buxari 1, Müslim 1907"), `grade?:{…}` | hədis — YALNIZ səhih/həsən; mənbə nömrəsi doğru olmalıdır |
| `quote`    | `ar?`, `text:{…}`, `by:{…}`, `ref?:{…}` | alimin sözü |
| `note`     | `text:{…}`, `kind?: 'info' \| 'warn' \| 'tip'` | qeyd / xəbərdarlıq |
| `table`    | `head:[{…}]`, `rows:[[{…}]]` | cədvəl |
| `qa`       | `items:[ { q:{…}, a:{…}, ref?:{…}, url? } ]` | sual-cavab (fətva nömrəsi `ref`-də, link `url`-da) |
| `dua`      | `ar`, `translit?:{…}`, `text:{…}`, `src:{…}` | dua (ərəbcə + oxunuş + məna + mənbə) |

`table` əlavə olaraq `caption?:{…}` qəbul edir (cədvəlin altında kiçik qeyd / mənbə; həm də ekran
oxuyucu üçün regionun adı).

### Vizual bloklar (dizayn v3)

Mətn divarı əvəzinə bir baxışda oxunan vizual. Hamısı `src/components/viz` qrafik dəstini işlədir
(rəng, qaranlıq rejim, RTL avtomatikdir). **Rəqəmlər mənbəli olmalıdır** — `note`-da mənbəni yaz.

| t          | sahələr | nə üçün |
|------------|---------|---------|
| `stats`    | `items:[ { value:'5', unit?:{…}, label:{…}, hint?:{…}, tone?:'brand'\|'accent' } ]`, `title?:{…}`, `note?:{…}` | 2–4 iri rəqəm kafeli (rüknlərin sayı, nisab, müddət) |
| `chart`    | `kind:'bar'\|'column'\|'donut'\|'stacked'`, `title:{…}`, `sub?:{…}`, `note?:{…}` (mənbə), `unit?:{…}`, `data:[ { label:{…}, value:Number, display?:{…}, tone?:1-4, muted?:true, current?:true } ]`, `max?`, `center?:{ value, label }` (donut) | müqayisə (`bar`), ardıcıllıq ≤12 (`column`), tərkib 2–4 pay (`donut`/`stacked`). `display` dəyərin mətnini əvəz edir (məs. "yoxdur") |
| `timeline` | `items:[ { when:'610'\|{…}, title:{…}, text?:{…}, highlight?:true } ]` | tarixi ardıcıllıq (siyər, alimin həyatı) |
| `links`    | `items:[ { page:'learn', param?:'mustalah', hash?:'grades', title:{…}, text?:{…}, icon? } ]` və ya `{ href:'https://…', title:{…} }` | "Ətraflı" keçidləri — başqa dərsə/səhifəyə (SPA ilə), xarici mənbəyə (yeni tabda) |

Nümunələr: `usul-ath-thalatha.js` (`stats` — dinin üç mərtəbəsi), `kaffarah-fidyah.js`
(`chart` — kəffarədə kasıbların sayı). Forma seçimi: bir rəqəm → `stats`; müqayisə → `chart bar`;
prosedur → `steps`; çox ölçülü məlumat → `table`. 4-dən çox rəngli pay olmasın (rənglər sabit
sıradadır: `--viz-1…4`). Qeyd: SEO üçün statik HTML (`scripts/seo-body.mjs`) bu 4 bloku hələ
göstərmir — vacib məlumatı yalnız qrafikdə saxlama, mətndə də yaz.

## Qaydalar
- Sayt Sələf mənhəcindədir (əqidə, mənhəc, fiqh). Mənbə: Quran, səhih Sünnə, Sələf
  alimlərinin (İbn Baz, İbn Useymin, əl-Albani, əl-Fəvzan, Daimi Komitə və s.) sözləri.
- HEÇ NƏ UYDURMA. Hədis nömrəsini bilmirsənsə — yazma və ya yoxla
  (https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari/<n>.json).
  Fətva nömrəsini yoxlamadan yazma (islamqa.info/ar/answers/<n> açılmalıdır).
- Ərəb mətnində hərəkələr olsun (Quran və hədis üçün).
- Dil qaydası: az-da türkcə söz yox, tr-də "ə" yox (scripts/check-lang.mjs yoxlayır).
- Bölmə sayı və həcm: məzmun dolu olsun, amma eyni məlumat başqa dərsdə/səhifədə
  təkrarlanmasın — lazım gələndə başqa dərsə/səhifəyə istinad et (mətnlə).
