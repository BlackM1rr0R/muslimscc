<?php
/**
 * Uninstall: remove the plugin's options (settings and classic widget instances).
 *
 * @package MuslimsCC_Prayer_Times
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Delete the options of the current site.
 */
function muslimscc_prayer_uninstall_site() {
	delete_option( 'muslimscc_prayer_options' );
	delete_option( 'widget_muslimscc_prayer' );
}

if ( is_multisite() ) {
	foreach ( get_sites( array( 'fields' => 'ids', 'number' => 0 ) ) as $muslimscc_prayer_site_id ) {
		switch_to_blog( $muslimscc_prayer_site_id );
		muslimscc_prayer_uninstall_site();
		restore_current_blog();
	}
} else {
	muslimscc_prayer_uninstall_site();
}
