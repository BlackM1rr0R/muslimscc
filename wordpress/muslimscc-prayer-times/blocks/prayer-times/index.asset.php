<?php
/**
 * Editor script dependencies (no build step — the script uses the wp.* globals).
 *
 * @package MuslimsCC_Prayer_Times
 */

defined( 'ABSPATH' ) || exit;

return array(
	'dependencies' => array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-server-side-render' ),
	'version'      => '1.0.0',
);
