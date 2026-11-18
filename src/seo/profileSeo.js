// ═══════════════════════════════════════════════════════
// /u/<ləqəb> — açıq profilin <head>-i (K1; pages/PublicProfilePage → seo/Seo.jsx setSelfSeo)
//
// Server qabığı (dist/[<dil>/]u/index.html, nginx → 200) robots noindex DAŞIMIR: Google ilkin
// HTML-də noindex görəndə JS-i render etmir və istifadəçinin icazəsini heç vaxt görməzdi.
// Qərarı burada JS verir:
//   profil var VƏ sahibi "axtarış sistemlərinə icazə ver" seçib (allowIndex) → "index, follow"
//   profil yoxdur / bağlıdır / gizlədilib / icazə yoxdur / hələ yüklənir   → "noindex, nofollow"
// Canonical — dil prefiksindən asılı olmayaraq prefiksiz /u/<ləqəb> (profil mətni istifadəçinin
// öz dilindədir; /en/u/<ləqəb> yalnız interfeysi ingiliscə göstərir). Sitemap-a düşmür.
// tests/unit/profile-seo.test.js
// ═══════════════════════════════════════════════════════
import { SITE, DEFAULT_LANG, pathFor } from './routes.js'
import { titleFor, descFor, fitDesc, fitTitle } from './meta.js'

export const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1'
export const ROBOTS_NOINDEX = 'noindex, nofollow'

const shownVal = (p, f) => (Array.isArray(p?.fields) && p.fields.includes(f) && p.data && p.data[f] != null ? p.data[f] : null)

/** Profil indekslənə bilərmi? (yalnız mövcud profil + sahibinin açıq icazəsi) */
export const profileIndexable = (profile) => Boolean(profile && typeof profile.handle === 'string' && profile.allowIndex === true)

/**
 * state = { status: 'loading' | 'ok' | 'missing', profile } → { robots, title, desc, canonical, jsonLd }
 * canonical / jsonLd yalnız indekslənən profildə (qalanlarında null).
 */
export function profileSeo(state, lang = DEFAULT_LANG) {
  if (!state || state.status !== 'ok' || !state.profile) {
    const nf = state && state.status === 'missing'
    return {
      robots: ROBOTS_NOINDEX,
      title: titleFor(nf ? 'notfound' : 'publicprofile', lang),
      desc: descFor(nf ? 'notfound' : 'publicprofile', lang),
      canonical: null,
      jsonLd: null,
    }
  }
  const p = state.profile
  const name = String(shownVal(p, 'displayName') || `@${p.handle}`)
  const bio = shownVal(p, 'bio')
  const title = fitTitle(`${name} — ${titleFor('publicprofile', lang)}`)
  const desc = bio ? fitDesc(`${name}: ${bio}`) : descFor('publicprofile', lang)
  if (!profileIndexable(p)) return { robots: ROBOTS_NOINDEX, title, desc, canonical: null, jsonLd: null }
  const canonical = SITE + pathFor('publicprofile', DEFAULT_LANG, p.handle)
  return {
    robots: ROBOTS_INDEX,
    title,
    desc,
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: canonical,
      name: title,
      mainEntity: {
        '@type': 'Person',
        name,
        alternateName: `@${p.handle}`,
        ...(bio ? { description: String(bio) } : {}),
      },
    },
  }
}
