# Instagram kartlarının şriftləri (server/instagramCard.js)

| Fayl | Ailə | Mənbə | Lisenziya |
|---|---|---|---|
| `AmiriQuran.ttf` | Amiri Quran | Amiri 1.003 rəsmi buraxılışı (https://github.com/aliftype/amiri/releases/tag/1.003), dəyişdirilməyib — Quran mətni (ayə, Allahın adları): Uthmani işarələri (ۡ ۚ ٰ ۭ …) | SIL Open Font License 1.1 (`OFL-Amiri.txt`) |
| `Amiri-Regular.ttf`, `Amiri-Bold.ttf` | Amiri | `assets/fonts/` (dəyişdirilməyib) — © 2010-2022 The Amiri Project Authors, https://github.com/aliftype/amiri | SIL Open Font License 1.1 |
| `MccInter-Regular.ttf`, `MccInter-SemiBold.ttf` | MccInter, MccInterSemi | Saytın Inter alt dəstlərindən (`src/assets/fonts/inter-*-var.woff2`) statik nüsxə — © 2016 The Inter Project Authors, https://github.com/rsms/inter | SIL Open Font License 1.1 |

`OFL-Amiri.txt` — Amiri layihəsinin lisenziya mətni (buraxılışdan). Lisenziya mətni həmçinin hər şriftin `name` cədvəlindədir (ID 13 / 14, https://openfontlicense.org). Inter-in dəyişdirilmiş
nüsxəsi ayrı ad daşıyır (MccInter) — OFL tələbi. Yenidən yaratmaq: `python scripts/build-ig-fonts.py`.
`fonts.conf` — fontconfig yalnız bu qovluğu görsün (konteynerdə sistem şrifti yoxdur).
