// ═══════════════════════════════════════════════════════
// Rabbanā duaları — QƏRAR CƏDVƏLİ (əl ilə, content-review üçün)
//
// Namizədlər scripts/rabbana-lib.mjs → findCandidates(): saytın Quran mətnində
// (seo-data/quran/quran-uthmani.json) "رَبَّنَا" nida formasının (ب üzərində fəthə)
// keçdiyi BÜTÜN ayələr — 64 ayə. Hər namizəd burada qərarlıdır (test yoxlayır):
//   include — möminlərin / peyğəmbərlərin duası, səhifədə göstərilir
//   exclude — kafirlərin, cəhənnəm əhlinin sözü, məzəmmət olunan dua və ya nida deyil
//   review  — mübahisəli; content-reviewer qərar verənə qədər GÖSTƏRİLMİR
//
// Dua hissəsi (span) ayənin ÖZ mətnindən kəsilir, yenidən yazılmır:
//   from — neçənci "رَبَّنَا"dan başlayır (defolt 1)
//   to   — ayədən hərfi-hərfinə götürülmüş son parça (defolt — ayənin sonu)
// who — kimin dediyi YALNIZ mətndə açıq adı çəkiləndə (whoRef — adın çəkildiyi ayə:
//   eyni ayə, əvvəlki ayə və ya həmin adla başlayan fasiləsiz sitatın ilk ayəsi).
// reason — rəyçi üçün izah (ingiliscə, interfeysdə göstərilmir).
// Yaradılan fayl: src/data/rabbanaSpans.gen.js (node scripts/build-rabbana.mjs).
// ═══════════════════════════════════════════════════════

export const RABBANA_DECISIONS = [
  { ref: '2:127', status: 'include', who: 'ibrahimIsmail', whoRef: '2:127', reason: 'Ibrahim and Ismail raising the House; named in the ayah' },
  { ref: '2:128', status: 'include', who: 'ibrahimIsmail', whoRef: '2:127', reason: 'continuation of the same supplication' },
  { ref: '2:129', status: 'include', who: 'ibrahimIsmail', whoRef: '2:127', reason: 'continuation of the same supplication (2:127–129)' },
  { ref: '2:200', status: 'exclude', reason: 'dispraised: one who asks only for this world "and has no share in the Hereafter"' },
  { ref: '2:201', status: 'include', reason: 'praised supplication of those who ask for good in both worlds' },
  { ref: '2:250', status: 'include', who: 'talut', whoRef: '2:249', reason: 'Talut and the believers with him (2:249) facing Jalut' },
  { ref: '2:285', status: 'exclude', reason: 'content-review 2026-11-28: رَبَّنَا is mid-phrase («غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ ٱلْمَصِيرُ»); a span from رَبَّنَا would cut the dua word غُفْرَانَكَ, so the ayah is not shown as a card. The 2:285–286 supplication is covered by the 2:286 card.' },
  { ref: '2:286', status: 'include', reason: 'three رَبَّنَا in one continuous supplication; one card from the first رَبَّنَا to the end' },
  { ref: '3:8', status: 'include', reason: 'supplication of those firm in knowledge (3:7)' },
  { ref: '3:9', status: 'include', reason: 'continuation of 3:8 (praise/affirmation inside the supplication)' },
  { ref: '3:16', status: 'include', reason: 'the God-fearing (3:15) who say it' },
  { ref: '3:53', status: 'include', who: 'hawariyyun', whoRef: '3:52', reason: 'the disciples of Isa continue their words from 3:52' },
  { ref: '3:147', status: 'include', reason: 'the steadfast companions of the prophets (3:146)' },
  { ref: '3:191', status: 'include', reason: 'people of understanding (3:190) remembering Allah' },
  { ref: '3:192', status: 'include', reason: 'continuation of 3:191' },
  { ref: '3:193', status: 'include', reason: 'continuation of 3:191; two رَبَّنَا, one card from the first' },
  { ref: '3:194', status: 'include', reason: 'continuation of 3:191 (answered in 3:195)' },
  { ref: '4:75', status: 'include', reason: 'the oppressed believing men, women and children' },
  { ref: '4:77', status: 'exclude', reason: 'dispraised: a group fearing people objects to the ordinance of fighting' },
  { ref: '5:83', status: 'include', reason: 'those who weep on hearing the revelation and believe' },
  { ref: '5:114', status: 'include', who: 'isa', whoRef: '5:114', reason: 'Isa son of Maryam; named in the ayah' },
  { ref: '6:128', status: 'exclude', reason: 'the allies of the jinn among mankind on the Day of Gathering (people of the Fire)' },
  { ref: '7:23', status: 'include', reason: 'Adam and his wife (dual «قَالَا»; named in 7:19, not in the same/preceding ayah → who omitted)' },
  { ref: '7:38', status: 'exclude', reason: 'people of the Fire cursing those who misled them' },
  { ref: '7:47', status: 'include', reason: 'people of al-A‘raf asking not to be with the wrongdoers' },
  { ref: '7:89', status: 'include', who: 'shuayb', whoRef: '7:88', reason: 'Shu‘ayb’s reply (he and the believers are addressed by name in 7:88); span is the final رَبَّنَا' },
  { ref: '7:126', status: 'include', reason: 'Pharaoh’s magicians after they believed (named 7:120 — too far → who omitted)' },
  { ref: '10:85', status: 'include', who: 'musaPeople', whoRef: '10:84', reason: 'the people of Musa answering him (10:84)' },
  { ref: '10:88', status: 'exclude', reason: 'content-review 2026-11-28: Musa’s supplication AGAINST Pharaoh and his chiefs (answered 10:89) — situation-specific imprecation, not a general dua for the jar/list' },
  { ref: '14:37', status: 'include', who: 'ibrahim', whoRef: '14:35', reason: 'Ibrahim’s continuous supplication that starts «وَإِذْ قَالَ إِبْرَٰهِيمُ» in 14:35' },
  { ref: '14:38', status: 'include', who: 'ibrahim', whoRef: '14:35', to: 'وَمَا نُعْلِنُ', reason: 'Ibrahim; span ends at the waqf ۗ — the rest («وَمَا يَخْفَىٰ عَلَى ٱللَّهِ…») may be Allah’s comment (tafsir differs)' },
  { ref: '14:40', status: 'include', who: 'ibrahim', whoRef: '14:35', reason: 'Ibrahim; ayah begins «رَبِّ», span from «رَبَّنَا وَتَقَبَّلْ دُعَآءِ»' },
  { ref: '14:41', status: 'include', who: 'ibrahim', whoRef: '14:35', reason: 'Ibrahim; end of the same supplication' },
  { ref: '14:44', status: 'exclude', reason: 'the wrongdoers when the punishment comes' },
  { ref: '16:86', status: 'exclude', reason: 'the polytheists pointing at their partners on the Day of Judgement' },
  { ref: '18:10', status: 'include', who: 'youths', whoRef: '18:10', reason: 'the youths who took refuge in the cave; named in the ayah' },
  { ref: '20:45', status: 'include', reason: 'Musa and Harun (dual «قَالَا»; not named in the same/preceding ayah → who omitted)' },
  { ref: '20:134', status: 'exclude', reason: 'hypothetical excuse of the disbelievers had they been destroyed' },
  { ref: '23:106', status: 'exclude', reason: 'people of the Fire' },
  { ref: '23:107', status: 'exclude', reason: 'people of the Fire asking to be taken out' },
  { ref: '23:109', status: 'include', reason: 'quoted as the words of «a party of My servants» (believers)' },
  { ref: '25:21', status: 'exclude', reason: 'not a vocative (accusative «نَرَىٰ رَبَّنَا»); words of those who do not hope to meet Allah' },
  { ref: '25:65', status: 'include', reason: 'the servants of the Most Merciful (25:63)' },
  { ref: '25:74', status: 'include', reason: 'the servants of the Most Merciful (25:63)' },
  { ref: '28:47', status: 'exclude', reason: 'hypothetical excuse of those struck by disaster for their deeds' },
  { ref: '28:63', status: 'exclude', reason: 'the leaders of misguidance on the Day of Judgement' },
  { ref: '32:12', status: 'exclude', reason: 'the criminals before their Lord' },
  { ref: '33:67', status: 'exclude', reason: 'people of the Fire blaming their leaders' },
  { ref: '33:68', status: 'exclude', reason: 'people of the Fire asking double punishment for their leaders' },
  { ref: '34:19', status: 'exclude', reason: 'the people of Saba’ who wronged themselves' },
  { ref: '35:34', status: 'exclude', reason: 'not a vocative («إِنَّ رَبَّنَا» — statement of praise by the people of Paradise)' },
  { ref: '35:37', status: 'exclude', reason: 'people of the Fire crying out' },
  { ref: '38:16', status: 'exclude', reason: 'the disbelievers mockingly asking for their share' },
  { ref: '38:61', status: 'exclude', reason: 'people of the Fire' },
  { ref: '40:7', status: 'include', who: 'throne', whoRef: '40:7', reason: 'those who bear the Throne and those around it; named in the ayah' },
  { ref: '40:8', status: 'include', who: 'throne', whoRef: '40:7', reason: 'continuation of 40:7' },
  { ref: '40:11', status: 'exclude', reason: 'people of the Fire' },
  { ref: '41:29', status: 'exclude', reason: 'the disbelievers (named in the ayah)' },
  { ref: '44:12', status: 'exclude', reason: 'the disbelievers during the smoke (44:10–14), who then turn away' },
  { ref: '50:27', status: 'exclude', reason: 'the companion (qarin) disowning his charge on the Day of Judgement' },
  { ref: '59:10', status: 'include', reason: 'those who came after the Muhajirun and Ansar; two رَبَّنَا, one card from the first' },
  { ref: '60:4', status: 'include', who: 'ibrahimWith', whoRef: '60:4', reason: 'Ibrahim and those with him; named in the ayah; span is the final رَبَّنَا' },
  { ref: '60:5', status: 'include', who: 'ibrahimWith', whoRef: '60:4', reason: 'continuation of 60:4' },
  { ref: '66:8', status: 'include', who: 'prophetBelievers', whoRef: '66:8', reason: 'the Prophet and those who believed with him, on the Day; named in the ayah' },
]

// Səhifədə span "from" verilməyibsə — 1-ci رَبَّنَا. 7:89 və 60:4-də yeganə nida ayənin sonundadır (1-ci elə odur).
