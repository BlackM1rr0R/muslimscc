# muslims.cc agent komandası — ortaq qaydalar

Every agent in `.claude/agents/` reads this file first. The lead (main Claude session) orchestrates,
reviews, commits and pushes. **Agents never commit, push, deploy or touch the production server
unless the lead explicitly says so in the task.**

## Stack
- React + Vite SPA, prerendered to ~45k static HTML files (`scripts/prerender.mjs`), served by nginx (`infra/nginx/muslims.cc.conf`).
- API: Express on Node 22+, `node:sqlite` (`server/`), Docker images, deployed by GitHub Actions (`.github/workflows`) via `ci-gate.sh`.
- **Push to `main` = production deploy.** CI: checks + unit + build, 6 e2e jobs, nginx -t, Docker images, deploy.

## Pipeline (who does what)
1. **pm** — turns the owner's request into a deduplicated plan (grep existing code first — most ideas already exist), batches, acceptance criteria.
2. **ui-ux-designer** — flows, states, copy, visual consistency; reviews screenshots after build.
3. **backend** / **frontend** — implement. Separate files where possible; parallel agents use their own dist dir and Playwright output dir.
4. **content-reviewer** — any religious text, hadith, dua, ruling, Islamic claim.
5. **qa-tester** — unit + e2e + a11y, flakiness, regression on related specs.
6. **security-reviewer (devsecops)** + **pentester** — code review, config, CI, headers; local attack testing.
7. **seo-perf** — prerender/sitemap/canonical/meta, bundle and mobile performance.
8. **i18n-translator** — new strings into the 44 extra languages.
9. Lead: final gates, commit, push, watch CI, verify prod.

## Hard rules (learned from incidents)
- **DB is additive only:** `CREATE TABLE IF NOT EXISTS` inside the module; no new MIGRATIONS entry, no `user_version` bump (2026-11-04 one-way migration outage).
- **Every new server module goes into the preload list at the top of `server/server.js`** (module-miss outage).
- **nginx:** regex locations containing `{n}` must be quoted; prefer `=` / `^~` prefix locations; `add_header` inside a location drops the parent headers. Lead runs `nginx -t` in the prod web image on the server.
- **`index.html` bytes are multiplied by ~45k pages** — keep the shell small; image size cap applies.
- **Gates before reporting done:** `npx eslint . --max-warnings=0` · `npm run check` · `npx vitest run` · `npm run build` · related e2e. `.env.public` must exist before a local build.
- **e2e:** fixtures mock every `/api/*` (`tests/e2e/fixtures.js`); new endpoints need mocks; reducedMotion on; `page.route` regexes can match chunk names; never leave an empty `role="alert"` rendered; wait for the page to render before checking optional elements (`isVisible()` races).
- **Parallel builds:** `PRERENDER_DIST=dist-<x>` and `--output test-results-<x>`; delete them afterwards (lint fails on stray dist dirs).
- **localStorage:** use the `safeStorage()` pattern (try/catch); profile keys via `PROFILE_KEYS` in `src/utils/profileCore.js`; synced keys need a merger in `src/utils/syncMergers.js`.

## i18n
- 5 base languages (az, en, ru, tr, ar) live inside components. 44 extra languages: `src/i18n/<code>.json` (English → translation).
- `node scripts/extract-ui-strings.mjs --missing <lang>` lists missing strings; `node scripts/merge-i18n-parts.mjs <jobdir>` merges `in/<lang>.json` + `out/<lang>.partN.json`.
- **Count/plural strings must be whole phrases** (`'1 person prayed'` / `` `${n} people prayed` ``), never an English noun in a placeholder.
- The confirmation word `DELETE` stays literal in every language. ~184 Quran/hadith text strings stay untranslated on purpose.
- Arabic UI must work RTL.

## Content and product rules (owner decisions — do not override)
- **No invented religious text.** Only verbatim site data with its source (`localizeSource`). No made-up duas (e.g. there is no "birthday dua").
- Hadith grades: Bukhari/Muslim sahih; Sunan grades verbatim from hadith-api with text match, Albani first; never guess.
- Kids section: no images of living beings.
- **Removed by decision — never re-add:** hifz speech recognition, `/open-data`, green-dome photo. Check `git log` before reviving anything.
- No rankings, leaderboards or follower counts (riya). Public features are opt-in and private by default.
- Data stored unencrypted on the server needs an explicit consent note. Personal sync data is E2E-encrypted.
- Navigation icons are line SVGs in `src/components/Icon.jsx` (24 grid, stroke 1.75) — no emoji fallbacks in menus.

## Security and privacy
- Never put secrets in the repo or in chat. Never print `api.env`, tokens or keys.
- No external geo-IP or tracking services; do not send user data to third parties.
- Roles: user < mosque_rep < editor < admin < superadmin. Superadmin is granted only by CLI (`server/scripts/admin-user.js set-role`), never over HTTP.
- CSRF: state-changing requests need `X-Requested-With: fetch` and an allowed Origin.
- Pentesting only against a local server or the owner's own site with non-destructive requests; never DoS, never brute-force production, never touch real users' data.

## Reporting
Report to the lead: what changed (files), how it was verified (commands + results), what was not verified, risks, and new UI strings. Be factual; flaky ≠ passing.
