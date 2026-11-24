<?php
/**
 * Shared rendering: the same escaped iframe for the shortcode, the block and the classic widget.
 *
 * @package MuslimsCC_Prayer_Times
 */

defined( 'ABSPATH' ) || exit;

/**
 * Allowed values (everything else falls back to the saved defaults).
 */
const MUSLIMSCC_PRAYER_LANGS   = array( 'az', 'en', 'ru', 'ar', 'tr' );
const MUSLIMSCC_PRAYER_THEMES  = array( 'light', 'dark' );
const MUSLIMSCC_PRAYER_LAYOUTS = array( 'compact', 'full' );

/**
 * City list: key (lowercase, as in the shortcode) => id, English label, country, has a city page.
 *
 * @return array<string, array{id: string, label: string, country: string, page: bool}>
 */
function muslimscc_prayer_cities() {
	static $cities = null;
	if ( null === $cities ) {
		$cities = require MUSLIMSCC_PRAYER_DIR . 'includes/cities.php';
	}
	return $cities;
}

/**
 * Plugin defaults merged with the saved settings.
 *
 * @return array{city: string, lang: string, theme: string, layout: string, height: int, credit: bool}
 */
function muslimscc_prayer_get_options() {
	$defaults = array(
		'city'   => 'baku',
		'lang'   => 'en',
		'theme'  => 'light',
		'layout' => 'compact',
		'height' => 0,
		'credit' => false, // Opt-in only (WordPress.org plugin guideline 10).
	);
	$saved = get_option( MUSLIMSCC_PRAYER_OPTION, array() );
	if ( ! is_array( $saved ) ) {
		$saved = array();
	}
	return muslimscc_prayer_sanitize_options( array_merge( $defaults, $saved ), $defaults );
}

/**
 * Validate a full option set against the allowlists.
 *
 * @param array $input    Raw values.
 * @param array $fallback Values to use for anything invalid.
 * @return array
 */
function muslimscc_prayer_sanitize_options( $input, $fallback ) {
	$cities = muslimscc_prayer_cities();
	$city   = isset( $input['city'] ) ? sanitize_key( $input['city'] ) : '';
	$lang   = isset( $input['lang'] ) ? sanitize_key( $input['lang'] ) : '';
	$theme  = isset( $input['theme'] ) ? sanitize_key( $input['theme'] ) : '';
	$layout = isset( $input['layout'] ) ? sanitize_key( $input['layout'] ) : '';
	return array(
		'city'   => isset( $cities[ $city ] ) ? $city : $fallback['city'],
		'lang'   => in_array( $lang, MUSLIMSCC_PRAYER_LANGS, true ) ? $lang : $fallback['lang'],
		'theme'  => in_array( $theme, MUSLIMSCC_PRAYER_THEMES, true ) ? $theme : $fallback['theme'],
		'layout' => in_array( $layout, MUSLIMSCC_PRAYER_LAYOUTS, true ) ? $layout : $fallback['layout'],
		'height' => muslimscc_prayer_sanitize_height( isset( $input['height'] ) ? $input['height'] : 0 ),
		'credit' => ! empty( $input['credit'] ),
	);
}

/**
 * Height in pixels: 0 = automatic, otherwise 200–1200.
 *
 * @param mixed $value Raw value.
 * @return int
 */
function muslimscc_prayer_sanitize_height( $value ) {
	$h = absint( $value );
	if ( 0 === $h ) {
		return 0;
	}
	return max( 200, min( 1200, $h ) );
}

/**
 * Mosque/site name shown in the widget header (plain text, max 80 characters).
 *
 * @param mixed $value Raw value.
 * @return string
 */
function muslimscc_prayer_sanitize_name( $value ) {
	$name = sanitize_text_field( (string) $value );
	return function_exists( 'mb_substr' ) ? mb_substr( $name, 0, 80 ) : substr( $name, 0, 80 );
}

/**
 * Iframe URL on muslims.cc (the mosque display page — the only path that allows framing).
 * Mirrors wpWidgetUrl() in src/utils/wpPlugin.js on the muslims.cc side.
 *
 * @param string $city_id City id from cities.php (e.g. "Baku", "New York").
 * @param string $lang    Allowlisted language.
 * @param string $theme   Allowlisted theme.
 * @param string $layout  "compact" or "full".
 * @param string $name    Optional sanitized name.
 * @return string Raw URL (escape on output).
 */
function muslimscc_prayer_url( $city_id, $lang, $theme, $layout, $name = '' ) {
	$parts = array(
		'city=' . rawurlencode( $city_id ),
		'lang=' . $lang,
		'theme=' . $theme,
	);
	if ( '' !== $name ) {
		$parts[] = 'name=' . rawurlencode( $name );
	}
	$parts[] = ( 'full' === $layout ) ? 'kiosk=1' : 'compact=1';
	$prefix  = ( 'az' === $lang ) ? '' : '/' . $lang;
	return MUSLIMSCC_PRAYER_BASE . $prefix . '/mosque-tv?' . implode( '&', $parts );
}

/**
 * Render the widget.
 *
 * @param array $atts city, lang, theme, layout, name, height (any may be empty → settings default).
 * @return string Escaped HTML.
 */
function muslimscc_prayer_render( $atts ) {
	$atts    = is_array( $atts ) ? $atts : array();
	$options = muslimscc_prayer_get_options();
	$cities  = muslimscc_prayer_cities();

	$o = muslimscc_prayer_sanitize_options(
		array(
			'city'   => ! empty( $atts['city'] ) ? $atts['city'] : $options['city'],
			'lang'   => ! empty( $atts['lang'] ) ? $atts['lang'] : $options['lang'],
			'theme'  => ! empty( $atts['theme'] ) ? $atts['theme'] : $options['theme'],
			'layout' => ! empty( $atts['layout'] ) ? $atts['layout'] : $options['layout'],
			'height' => ! empty( $atts['height'] ) ? $atts['height'] : $options['height'],
			'credit' => $options['credit'],
		),
		$options
	);

	$city = $cities[ $o['city'] ];
	$name = isset( $atts['name'] ) ? muslimscc_prayer_sanitize_name( $atts['name'] ) : '';
	$url  = muslimscc_prayer_url( $city['id'], $o['lang'], $o['theme'], $o['layout'], $name );

	if ( 'full' === $o['layout'] ) {
		$style = $o['height']
			? 'display:block;width:100%;height:' . $o['height'] . 'px;border:0;border-radius:12px'
			: 'display:block;width:100%;aspect-ratio:16/9;min-height:420px;height:auto;border:0;border-radius:12px';
	} else {
		$style = 'display:block;width:100%;height:' . ( $o['height'] ? $o['height'] : 300 ) . 'px;border:0;border-radius:12px';
	}

	/* translators: %s: city name, e.g. "Baku". */
	$title = sprintf( __( 'Prayer times — %s', 'muslimscc-prayer-times' ), '' !== $name ? $name : $city['label'] );

	$html  = '<div class="muslimscc-prayer muslimscc-prayer--' . esc_attr( $o['layout'] ) . '">';
	$html .= '<iframe src="' . esc_url( $url ) . '"'
		. ' title="' . esc_attr( $title ) . '"'
		. ' loading="lazy"'
		. ' referrerpolicy="strict-origin-when-cross-origin"'
		. ' sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"'
		. ' style="' . esc_attr( $style ) . '"></iframe>';

	if ( $o['credit'] ) {
		$html .= '<p class="muslimscc-prayer__credit" style="margin:.4em 0 0;font-size:.85em;text-align:end">'
			. '<a href="' . esc_url( muslimscc_prayer_credit_url( $o['city'], $o['lang'], $city ) ) . '">'
			/* translators: Credit link under the widget. "muslims.cc" is the site name. */
			. esc_html__( 'Prayer times by muslims.cc', 'muslimscc-prayer-times' )
			. '</a></p>';
	}

	return $html . '</div>';
}

/**
 * Credit link target: the city's prayer times page when it exists, otherwise the home page.
 *
 * @param string $key  City key.
 * @param string $lang Language.
 * @param array  $city City row.
 * @return string
 */
function muslimscc_prayer_credit_url( $key, $lang, $city ) {
	$prefix = ( 'az' === $lang ) ? '' : '/' . $lang;
	if ( ! empty( $city['page'] ) ) {
		return MUSLIMSCC_PRAYER_BASE . $prefix . '/prayer/' . $key;
	}
	return MUSLIMSCC_PRAYER_BASE . ( $prefix ? $prefix : '/' );
}
