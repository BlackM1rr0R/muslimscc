// ═══════════════════════════════════════════════════════
// Caption generatoru — Claude
//
// TƏHLÜKƏSİZLİK PRİNSİPİ: model müqəddəs mətnə toxunmur.
// Ayə/hədis/dua mətni və istinadı content.mjs-dən doğrulanmış şəkildə
// gəlir və caption-a olduğu kimi yapışdırılır. Modelin yazdığı yalnız
// ətrafdakı qısa təfəkkür və hashtag-lərdir.
//
// Model nə desə də, validate() onu yoxlayır: uydurma istinad, ərəb
// mətni və ya həddindən uzun cavab rədd edilir. İki cəhd uğursuz olsa,
// modelsiz şablon caption istifadə olunur — avtomatik iş heç vaxt
// dayanmır və heç vaxt yoxlanılmamış mətn paylaşmır.
// ═══════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

const MODEL = 'claude-opus-5'

// Instagram caption limiti 2200 simvoldur; təhlükəsiz həddə qalırıq
const MAX_CAPTION = 2000

// Brend — src/config/mosque.js → BRAND.name.az / BRAND.domain / BRAND.hashtag
// ilə eyni saxla (skript serverə ayrıca köçürülür, ona görə import edilmir)
const BRAND_NAME = 'Qaraçuxur Məscidi'
const BRAND_DOMAIN = 'muslims.cc'
const BRAND_HASHTAG = '#qaracuxurmescidi'

// Model yazan təfəkkür məscidin öz postu kimi paylaşılır — oxucu onu
// məscidin rəsmi mövqeyi sanmasın. Mənaca src/config/mosque.js →
// BRAND.aiDisclaimer ilə eynidir (az + en, caption iki dillidir).
const AI_NOTE = [
  'Təfəkkür mətni süni intellektlə hazırlanıb, məscidin rəsmi mövqeyi və ya fətva deyil. Dini hökmlər üçün məscidin imamına müraciət edin.',
  'The reflection was written with AI and is not the mosque’s official position or a fatwa. For religious rulings, please consult the mosque’s imam.',
].join('\n')

const TYPE_LABEL = {
  quran:  { az: 'Quran ayəsi',        en: 'Quran verse' },
  hadith: { az: 'Hədis',              en: 'Hadith' },
  dua:    { az: 'Dua',                en: 'Dua' },
  name:   { az: 'Allahın gözəl adı',  en: 'A beautiful name of Allah' },
}

const CaptionSchema = z.object({
  az: z.string().describe('Azərbaycanca 2-3 cümləlik təfəkkür. Ayə/hədis mətnini TƏKRARLAMA.'),
  en: z.string().describe('The same reflection in English, 2-3 sentences. Do NOT repeat the scripture text.'),
  hashtags: z.array(z.string()).describe('8-12 hashtag, hamısı # ilə başlayır, boşluqsuz.'),
})

// Birinci sətirdə ad yiyəlik halındadır ("Məscidinin") — BRAND_NAME dəyişəndə əl ilə yenilə
const SYSTEM = `Sən Qaraçuxur Məscidinin (Bakı) Instagram hesabı üçün caption yazırsan.

SƏNƏ VERİLƏN MƏTN artıq doğrulanmış mənbədən gəlir və caption-a ayrıca
əlavə olunacaq. Sənin işin yalnız onun ətrafındakı qısa təfəkkürü yazmaqdır.

MÜTLƏQ QAYDALAR:
1. HEÇ VAXT Quran ayəsi, hədis və ya dua sitat gətirmə. Nə ərəbcə, nə tərcüməsi.
2. HEÇ VAXT mənbə istinadı yazma (məsələn "Quran 2:255", "Buxari 8", "Müslim").
   İstinad caption-a avtomatik əlavə olunur.
3. Sənə verilən mətni təkrarlama — o, caption-da onsuz da var.
4. Fiqhi hökm vermə, halal/haram fətvası vermə, mübahisəli mövzulara girmə.
   Yazdığını məscidin rəsmi mövqeyi və ya fətvası kimi təqdim etmə; hökm
   lazım olan yerdə oxucunu məscidin imamına müraciət etməyə yönəlt.
5. Sadə, isti və hörmətli dil. Şüar və reklam tonu olmasın.
6. Emoji istifadə etmə.
7. Məscid haqqında fakt uydurma (ünvan, camaat vaxtı, imam, tədbir, tarix).

NƏ YAZIRSAN: mətnin gündəlik həyatda nə demək olduğuna dair 2-3 cümləlik
səmimi bir düşüncə. Azərbaycanca və ingiliscə — eyni fikir, tərcümə deyil,
hər dildə təbii səslənən variant.

HASHTAG: 8-12 ədəd, qarışıq az/en/ar. Həmişə ${BRAND_HASHTAG} daxil olsun.`

function buildPrompt(item) {
  const label = TYPE_LABEL[item.type] || TYPE_LABEL.quran
  return `Növ: ${label.az} (${label.en})

Ərəb mətni: ${item.ar}
Azərbaycanca: ${item.az}
İngiliscə: ${item.en}
Mənbə: ${item.source || '(yoxdur)'}

Bu mətnin ətrafına caption yaz.`
}

// ── Doğrulama ────────────────────────────────────────

const ARABIC_RE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/
// "Quran 2:255", "Buxari 8", "Müslim 123", "Tirmizi 45" kimi istinad izləri
const CITATION_RE = /\b(qur['’]?an|quran|kuran|коран|bux[aə]ri|bukhari|m[üu]slim|tirmizi|tirmidhi|[əe]bu\s*davud|abu\s*dawud|n[əe]sai|ibn\s*mac[əe])\b[\s:,.]*\d/i

/**
 * Model cavabını yoxla. Qaytarır: null (təmiz) və ya səbəb mətni.
 */
export function validate(out, item) {
  if (!out || typeof out.az !== 'string' || typeof out.en !== 'string') {
    return 'cavab formatı yanlışdır'
  }
  if (!Array.isArray(out.hashtags) || out.hashtags.length < 4) {
    return 'hashtag azdır'
  }
  for (const [lang, text] of [['az', out.az], ['en', out.en]]) {
    if (text.trim().length < 40) return `${lang} caption çox qısadır`
    if (text.length > 700) return `${lang} caption çox uzundur`
    // Model müqəddəs mətni ərəbcə təkrarlamamalıdır
    if (ARABIC_RE.test(text)) return `${lang} caption-da ərəb mətni var`
    // Uydurma istinad — ən təhlükəli hal
    if (CITATION_RE.test(text)) return `${lang} caption-da istinad var`
  }
  const bad = out.hashtags.filter(h => !/^#[\p{L}\p{N}_]+$/u.test(h))
  if (bad.length) return `hashtag formatı yanlışdır: ${bad.slice(0, 3).join(' ')}`
  return null
}

// Model çağırışı alınmadıqda istifadə olunan hazır ifadələr.
// Naive toLowerCase() "Allah"ı kiçildir və ingiliscədə qrammatikanı pozur,
// ona görə hər növ üçün mətn əl ilə yazılıb.
const FALLBACK_TEXT = {
  quran: {
    az: 'Bugünkü ayə. Üzərində bir az dayanmağa dəyər.',
    en: 'Today’s verse. Worth pausing on for a moment.',
    tags: ['#quran', '#ayə', '#quranverse'],
  },
  hadith: {
    az: 'Bugünkü hədis. Sadə, amma üzərində düşünməli.',
    en: 'Today’s hadith. Simple, but worth reflecting on.',
    tags: ['#hədis', '#hadith', '#sunnah'],
  },
  dua: {
    az: 'Bugünkü dua. Gün ərzində bir dəfə təkrarlamağa dəyər.',
    en: 'Today’s dua. Worth repeating once during the day.',
    tags: ['#dua', '#dualar', '#supplication'],
  },
  name: {
    az: 'Allahın gözəl adlarından biri. Mənası üzərində dayanmağa dəyər.',
    en: 'One of the beautiful names of Allah. Worth pausing on its meaning.',
    tags: ['#əsmaülhüsna', '#asmaulhusna', '#99namesofallah'],
  },
}

/** Model olmadan işləyən ehtiyat caption — heç vaxt uydurma məzmun vermir. */
export function fallbackCaption(item) {
  const f = FALLBACK_TEXT[item.type] || FALLBACK_TEXT.quran
  return {
    az: f.az,
    en: f.en,
    hashtags: [BRAND_HASHTAG, '#qaraçuxur', '#bakı', '#islam', ...f.tags, '#azerbaycan', '#islamicreminder'],
    fallback: true,
  }
}

/**
 * Caption yarat. Uğursuzluqda şablona düşür — heç vaxt istisna atmır.
 * @returns {Promise<{az,en,hashtags,fallback?:boolean,reason?:string}>}
 */
export async function generateCaption(item, { attempts = 2 } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ...fallbackCaption(item), reason: 'ANTHROPIC_API_KEY yoxdur' }
  }

  const client = new Anthropic()
  let lastReason = ''

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await client.messages.parse({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM,
        // Qısa, sadə tapşırıqdır — aşağı effort həm sürətli, həm ucuzdur
        output_config: { effort: 'low', format: zodOutputFormat(CaptionSchema) },
        messages: [{ role: 'user', content: buildPrompt(item) }],
      })

      if (res.stop_reason === 'refusal') {
        lastReason = 'model imtina etdi'
        continue
      }

      const out = res.parsed_output
      const problem = validate(out, item)
      if (problem) {
        lastReason = problem
        continue
      }
      return out
    } catch (e) {
      lastReason = e?.message || String(e)
    }
  }

  return { ...fallbackCaption(item), reason: lastReason }
}

/** Caption obyektini Instagram üçün tək mətnə yığ. */
export function composeCaption(item, cap) {
  const parts = []
  parts.push(cap.az.trim())
  parts.push('')
  parts.push(item.az.trim())
  if (item.source) parts.push(`— ${item.source}`)
  parts.push('')
  parts.push('· · ·')
  parts.push('')
  parts.push(cap.en.trim())
  parts.push('')
  parts.push(item.en.trim())
  if (item.source) parts.push(`— ${item.source}`)
  parts.push('')
  parts.push(`${BRAND_NAME} · ${BRAND_DOMAIN}`)

  // Təfəkkürü model yazıbsa, bunu açıq de (şablon caption-da model mətni yoxdur)
  const note = cap.fallback ? '' : `\n\n${AI_NOTE}`
  const head = parts.join('\n')

  // Limit aşılsa, əvvəlcə sondakı hashtag-lər bir-bir düşür; yenə sığmasa
  // əsas mətn kəsilir — AI qeydi heç vaxt kəsilmir
  const tags = [...cap.hashtags]
  let text
  do {
    text = head + note + (tags.length ? `\n\n${tags.join(' ')}` : '')
  } while (text.length > MAX_CAPTION && tags.pop())
  if (text.length > MAX_CAPTION) {
    text = head.slice(0, MAX_CAPTION - note.length - 1).trimEnd() + '…' + note
  }
  return text
}
