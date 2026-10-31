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
