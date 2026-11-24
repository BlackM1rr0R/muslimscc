<?php
/**
 * Plugin Name:       Muslims.cc Prayer Times
 * Plugin URI:        https://muslims.cc/widget
 * Description:       Show today's prayer times and a countdown to the next prayer from muslims.cc on your site — as a block, a classic widget or the [muslimscc_prayer] shortcode.
 * Version:           1.0.0
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            Muslims.cc
 * Author URI:        https://muslims.cc
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       muslimscc-prayer-times
 * Domain Path:       /languages
 *
 * @package MuslimsCC_Prayer_Times
 */

defined( 'ABSPATH' ) || exit;

define( 'MUSLIMSCC_PRAYER_VERSION', '1.0.0' );
define( 'MUSLIMSCC_PRAYER_FILE', __FILE__ );
define( 'MUSLIMSCC_PRAYER_DIR', plugin_dir_path( __FILE__ ) );
define( 'MUSLIMSCC_PRAYER_OPTION', 'muslimscc_prayer_options' );
define( 'MUSLIMSCC_PRAYER_BASE', 'https://muslims.cc' );

require_once MUSLIMSCC_PRAYER_DIR . 'includes/render.php';
require_once MUSLIMSCC_PRAYER_DIR . 'includes/settings.php';
require_once MUSLIMSCC_PRAYER_DIR . 'includes/class-muslimscc-prayer-widget.php';

/**
 * Translations (also used when the plugin is installed from the muslims.cc zip, not WordPress.org).
 */
function muslimscc_prayer_load_textdomain() {
	load_plugin_textdomain( 'muslimscc-prayer-times', false, dirname( plugin_basename( MUSLIMSCC_PRAYER_FILE ) ) . '/languages' );
}
add_action( 'init', 'muslimscc_prayer_load_textdomain', 0 );

/**
 * Shortcode: [muslimscc_prayer city="baku" lang="az" theme="light" layout="compact" name="" height=""].
 *
 * @param array|string $atts Shortcode attributes.
 * @return string
 */
function muslimscc_prayer_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'city'   => '',
			'lang'   => '',
			'theme'  => '',
			'layout' => '',
			'name'   => '',
			'height' => '',
		),
		$atts,
		'muslimscc_prayer'
	);
	return muslimscc_prayer_render( $atts );
}
add_shortcode( 'muslimscc_prayer', 'muslimscc_prayer_shortcode' );

/**
 * Gutenberg block (no build step: block.json + plain JS that uses the wp.* globals).
 */
function muslimscc_prayer_register_block() {
	register_block_type( MUSLIMSCC_PRAYER_DIR . 'blocks/prayer-times' );

	$handle = generate_block_asset_handle( 'muslimscc/prayer-times', 'editorScript' );
	$cities = array();
	foreach ( muslimscc_prayer_cities() as $key => $city ) {
		$cities[] = array(
			'value' => $key,
			'label' => $city['label'] . ' — ' . $city['country'],
		);
	}
	wp_add_inline_script(
		$handle,
		'window.muslimsccPrayer = ' . wp_json_encode(
			array(
				'cities'   => $cities,
				'defaults' => muslimscc_prayer_get_options(),
			)
		) . ';',
		'before'
	);
	wp_set_script_translations( $handle, 'muslimscc-prayer-times', MUSLIMSCC_PRAYER_DIR . 'languages' );
}
add_action( 'init', 'muslimscc_prayer_register_block' );

/**
 * Classic widget.
 */
function muslimscc_prayer_register_widget() {
	register_widget( 'MuslimsCC_Prayer_Widget' );
}
add_action( 'widgets_init', 'muslimscc_prayer_register_widget' );

/**
 * "Settings" link on the Plugins screen.
 *
 * @param array $links Existing action links.
 * @return array
 */
function muslimscc_prayer_action_links( $links ) {
	$url = admin_url( 'options-general.php?page=muslimscc-prayer-times' );
	array_unshift( $links, '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'muslimscc-prayer-times' ) . '</a>' );
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'muslimscc_prayer_action_links' );
