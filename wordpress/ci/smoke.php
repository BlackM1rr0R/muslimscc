<?php
/**
 * CI smoke test for the Muslims.cc Prayer Times plugin — runs inside real WordPress (wp-env) after Plugin Check:
 *
 *   wp-env run cli wp eval-file wp-content/plugins/muslimscc-prayer-times/ci-smoke.php
 *
 * .github/workflows/wp-plugin.yml copies this file into the unzipped plugin copy (never into the release zip).
 * Prints "SMOKE OK" and exits 0, or lists the failures and exits 1. PHP 7.4 compatible.
 *
 * @package MuslimsCC_Prayer_Times
 */

defined( 'ABSPATH' ) || exit;

// $GLOBALS: wp eval-file runs this file inside a function, so plain top-level variables are not global.
$GLOBALS['muslimscc_smoke_failures'] = array();

/**
 * Record one check.
 *
 * @param string $label What is checked.
 * @param bool   $ok    Result.
 */
function muslimscc_smoke_check( $label, $ok ) {
	if ( ! $ok ) {
		$GLOBALS['muslimscc_smoke_failures'][] = $label;
	}
	echo ( $ok ? 'ok   ' : 'FAIL ' ) . $label . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CLI output.
}

/**
 * Substring check (no str_contains on PHP 7.4).
 *
 * @param string $haystack Text.
 * @param string $needle   Expected part.
 * @return bool
 */
function muslimscc_smoke_has( $haystack, $needle ) {
	return false !== strpos( $haystack, $needle );
}

// 1. Shortcode with the defaults (city baku, lang en, light, compact, credit off).
muslimscc_smoke_check( 'shortcode registered', shortcode_exists( 'muslimscc_prayer' ) );
$muslimscc_out = do_shortcode( '[muslimscc_prayer]' );
muslimscc_smoke_check( 'default iframe URL', muslimscc_smoke_has( $muslimscc_out, '<iframe src="https://muslims.cc/en/mosque-tv?city=Baku&#038;lang=en&#038;theme=light&#038;compact=1"' ) );
muslimscc_smoke_check( 'lazy loading', muslimscc_smoke_has( $muslimscc_out, 'loading="lazy"' ) );
muslimscc_smoke_check( 'compact default height 500px', muslimscc_smoke_has( $muslimscc_out, 'height:500px' ) && 500 === MUSLIMSCC_PRAYER_COMPACT_HEIGHT );
$muslimscc_out = do_shortcode( '[muslimscc_prayer height="360"]' );
muslimscc_smoke_check( 'height override wins over the default', muslimscc_smoke_has( $muslimscc_out, 'height:360px' ) && ! muslimscc_smoke_has( $muslimscc_out, 'height:500px' ) );
$muslimscc_out = do_shortcode( '[muslimscc_prayer height="50"]' );
muslimscc_smoke_check( 'too small override clamped to 200', muslimscc_smoke_has( $muslimscc_out, 'height:200px' ) );
muslimscc_smoke_check( 'credit link off by default', ! muslimscc_smoke_has( $muslimscc_out, 'muslimscc-prayer__credit' ) );

// 2. All options + hostile mosque name: escaped, no markup leaks.
$muslimscc_out = muslimscc_prayer_render(
	array(
		'city'   => 'new-york',
		'lang'   => 'az',
		'theme'  => 'dark',
		'layout' => 'full',
		'name'   => '"><script>alert(1)</script><img src=x onerror=alert(2)>',
	)
);
muslimscc_smoke_check( 'az has no language prefix, city id encoded', muslimscc_smoke_has( $muslimscc_out, 'https://muslims.cc/mosque-tv?city=New%20York&#038;lang=az&#038;theme=dark' ) );
muslimscc_smoke_check( 'full layout → kiosk=1', muslimscc_smoke_has( $muslimscc_out, 'kiosk=1' ) );
muslimscc_smoke_check( 'no <script> in output', ! muslimscc_smoke_has( strtolower( $muslimscc_out ), '<script' ) );
muslimscc_smoke_check( 'no <img> in output', ! muslimscc_smoke_has( strtolower( $muslimscc_out ), '<img' ) );
muslimscc_smoke_check( 'exactly one iframe', 1 === substr_count( $muslimscc_out, '<iframe' ) );

// 3. Invalid values fall back to the defaults.
$muslimscc_out = muslimscc_prayer_render(
	array(
		'city'   => 'nowhere',
		'lang'   => 'xx',
		'theme'  => 'neon',
		'layout' => 'huge',
		'height' => '99999',
	)
);
muslimscc_smoke_check( 'invalid values → defaults', muslimscc_smoke_has( $muslimscc_out, '/en/mosque-tv?city=Baku&#038;lang=en&#038;theme=light&#038;compact=1' ) );
muslimscc_smoke_check( 'height clamped to 1200', muslimscc_smoke_has( $muslimscc_out, 'height:1200px' ) );

// 4. Block.
muslimscc_smoke_check( 'block registered', WP_Block_Type_Registry::get_instance()->is_registered( 'muslimscc/prayer-times' ) );
$muslimscc_out = render_block(
	array(
		'blockName'    => 'muslimscc/prayer-times',
		'attrs'        => array(
			'city'   => 'london',
			'lang'   => 'ar',
			'layout' => 'full',
		),
		'innerBlocks'  => array(),
		'innerHTML'    => '',
		'innerContent' => array(),
	)
);
muslimscc_smoke_check( 'block renders the iframe', muslimscc_smoke_has( $muslimscc_out, 'https://muslims.cc/ar/mosque-tv?city=London&#038;lang=ar' ) && muslimscc_smoke_has( $muslimscc_out, 'kiosk=1' ) );
muslimscc_smoke_check( 'block wrapper class', muslimscc_smoke_has( $muslimscc_out, 'wp-block-muslimscc-prayer-times' ) );

// 5. Classic widget.
muslimscc_smoke_check( 'widget registered', isset( $GLOBALS['wp_widget_factory']->widgets['MuslimsCC_Prayer_Widget'] ) );

// 6. Settings sanitize callback (allowlists).
$muslimscc_saved = muslimscc_prayer_sanitize_settings(
	array(
		'city'   => '<b>x',
		'lang'   => 'ru',
		'theme'  => 'dark',
		'layout' => 'full',
		'height' => '5000',
		'credit' => '1',
	)
);
muslimscc_smoke_check( 'settings: unknown city → baku', 'baku' === $muslimscc_saved['city'] );
muslimscc_smoke_check( 'settings: allowlisted values kept', 'ru' === $muslimscc_saved['lang'] && 'dark' === $muslimscc_saved['theme'] && 'full' === $muslimscc_saved['layout'] );
muslimscc_smoke_check( 'settings: height clamped', 1200 === $muslimscc_saved['height'] );
muslimscc_smoke_check( 'settings: credit opt-in stored', true === $muslimscc_saved['credit'] );

// 7. Credit link appears only when opted in.
update_option( MUSLIMSCC_PRAYER_OPTION, $muslimscc_saved );
$muslimscc_out = do_shortcode( '[muslimscc_prayer city="baku"]' );
muslimscc_smoke_check( 'credit link when enabled', muslimscc_smoke_has( $muslimscc_out, 'muslimscc-prayer__credit' ) && muslimscc_smoke_has( $muslimscc_out, 'https://muslims.cc/ru/prayer/baku' ) );
delete_option( MUSLIMSCC_PRAYER_OPTION );

if ( $GLOBALS['muslimscc_smoke_failures'] ) {
	echo 'SMOKE FAILED: ' . count( $GLOBALS['muslimscc_smoke_failures'] ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CLI output.
	exit( 1 );
}
echo "SMOKE OK\n";
