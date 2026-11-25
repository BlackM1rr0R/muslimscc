=== Muslims.cc Prayer Times ===
Contributors: muslimscc
Tags: prayer times, salah, namaz, mosque, islam
Requires at least: 6.3
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Today's prayer times and a live countdown to the next prayer for your mosque or community site — as a block, a classic widget or a shortcode.

== Description ==

Muslims.cc Prayer Times embeds the free prayer times display from [muslims.cc](https://muslims.cc/widget) on your site. It shows Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha for today, highlights the next prayer and counts down to it.

* **Block** — "Prayer Times (muslims.cc)" with city, language, theme and layout in the sidebar.
* **Classic widget** — Appearance → Widgets.
* **Shortcode** — `[muslimscc_prayer city="baku" lang="en" theme="light" layout="compact"]`.
* **Two layouts** — *compact* (prayer times and countdown) or *full* (mosque display with a large clock, adhan and iqamah times, verses and remembrance).
* **5 languages** — Azerbaijani, English, Russian, Arabic (right-to-left) and Turkish. Light and dark themes.
* 98 cities: all cities of Azerbaijan plus Makkah, Madinah, Istanbul, Ankara, Moscow, Kazan, Tbilisi, Tehran, Dubai, Cairo, Tashkent, Almaty, London, Berlin, Paris, New York, Toronto, Jakarta, Kuala Lumpur and more.
* No ads, no cookies, no account needed.

For cities in Azerbaijan, times are calculated with the same method as the Abu Bakr mosque timetable in Baku; other cities use the aladhan.com service (Diyanet method). Times are calculated astronomically — please confirm congregation times with your mosque.

= Shortcode options =

* `city` — city key, e.g. `baku`, `ganja`, `istanbul`, `london`, `new-york` (see Settings → Muslims.cc for the full list).
* `lang` — `az`, `en`, `ru`, `ar` or `tr`.
* `theme` — `light` or `dark`.
* `layout` — `compact` or `full`.
* `name` — optional mosque name shown in the widget header.
* `height` — optional height in pixels (200–1200). By default the compact layout is 500 px high (all prayer rows fit in a narrow sidebar) and the full layout is 16:9. The compact layout grows by itself when its content needs more room, so for it this height is the minimum.

Any option you leave out uses the default from Settings → Muslims.cc.

= Credit link =

The plugin never adds a link to your site on its own. If you would like to thank us, you can turn on the "Prayer times by muslims.cc" link under the widget in Settings → Muslims.cc. It is off by default.

== External services ==

This plugin displays content from an external service, **muslims.cc** (operated by the Muslims.cc team), inside an iframe. That is how the prayer times are shown; nothing is shown without it.

* **What is loaded and when:** whenever a page with the block, widget or shortcode is viewed, the visitor's browser loads `https://muslims.cc/mosque-tv` (or `/en/mosque-tv`, `/ru/mosque-tv` …) with the chosen city, language, theme, layout and optional mosque name in the address.
* **What is sent:** only what any web page request sends — the visitor's IP address, browser user agent and the address of your page as the referrer (origin only, by the `strict-origin-when-cross-origin` policy). The plugin itself sends nothing from your WordPress server.
* **No cookies, no tracking:** the embedded page sets no cookies, shows no ads and sends no analytics when it is embedded in another site. It may keep display preferences in the browser's local storage, which browsers keep separate per embedding site.
* **Height messages:** the embedded compact display tells your page its content height — a plain number sent with `postMessage` — so the iframe can grow to fit. The plugin's small inline listener accepts these messages only from `https://muslims.cc` and only for the iframe that sent them. Nothing is sent from your page to muslims.cc this way.
* **Error reports:** if the embedded page hits a JavaScript error, it sends an anonymous error report to muslims.cc (error message, script file and line, page path — no query string, cookies or personal data).
* For cities outside Azerbaijan, the embedded page fetches the day's times from the [aladhan.com](https://aladhan.com) API in the visitor's browser (coordinates, time zone and date only).

Muslims.cc [Terms of Use](https://muslims.cc/en/terms) and [Privacy Policy](https://muslims.cc/en/privacy).

== Installation ==

1. In your WordPress admin go to Plugins → Add New Plugin and search for "Muslims.cc Prayer Times" — or click "Upload Plugin" and choose the `muslimscc-prayer-times.zip` file from https://muslims.cc/widget.
2. Click "Install Now", then "Activate".
3. Go to Settings → Muslims.cc to choose your default city, language, theme and layout. Then add the "Prayer Times (muslims.cc)" block, the classic widget, or the `[muslimscc_prayer]` shortcode where you want the times to appear.

== Frequently Asked Questions ==

= My city is not in the list. =

The list matches the cities supported on muslims.cc. Please contact us (details on https://muslims.cc/en/about) and we will consider adding it.

= Can I show iqamah (congregation) times? =

Use the *full* layout — it shows adhan and iqamah times and the Friday khutbah time on Fridays. Iqamah offsets use sensible defaults; for your own offsets, open https://muslims.cc/mosque-tv, set them up there and use that link on your mosque screen.

= Does it slow my site down? =

No external scripts or styles are added to your pages. Pages that show the compact layout get one tiny inline script (well under 1 KB) that lets the widget grow to fit its content. The iframe is loaded lazily, only when it scrolls into view.

= The widget is cut off or shows a scrollbar. =

The compact layout adjusts its height automatically: when the times wrap onto two rows (for example in columns 460–520 px wide), the widget grows so that nothing is cut off. The height from Settings → Muslims.cc or the `height` option is used as the minimum. If a caching or optimization plugin delays or removes inline scripts, exclude the small `muslimscc-prayer-height` script — or set a larger `height`.

= Does the plugin add a link to my site? =

Only if you turn it on. The "Prayer times by muslims.cc" credit link is off by default (Settings → Muslims.cc). The muslims.cc name inside the embedded display is part of the service itself.

= Is it free? =

Yes. There is no paid version, no account and no API key.

== Screenshots ==

1. Compact layout (light theme) in a sidebar.
2. Full layout — mosque display with clock, next prayer and verse panel (dark theme).
3. Block settings in the editor: city, language, theme and layout.
4. Settings → Muslims.cc with the opt-in credit link.

== Changelog ==

= 1.0.0 =
* First release: block, classic widget and shortcode; compact and full layouts; 5 languages; light and dark themes; opt-in credit link.
* The compact layout grows to fit its content (no clipping in 460–520 px wide columns); the set height is the minimum.

== Upgrade Notice ==

= 1.0.0 =
First release.
