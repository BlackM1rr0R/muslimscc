<?php
/**
 * Settings → Muslims.cc: site-wide defaults and the opt-in credit link.
 *
 * Uses the Settings API: settings_fields() prints the nonce, options.php verifies it
 * and the "manage_options" capability before saving; the sanitize callback allowlists every value.
 *
 * @package MuslimsCC_Prayer_Times
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the option and its sanitize callback.
 */
function muslimscc_prayer_register_settings() {
	register_setting(
		'muslimscc_prayer',
		MUSLIMSCC_PRAYER_OPTION,
		array(
			'type'              => 'object',
			'sanitize_callback' => 'muslimscc_prayer_sanitize_settings',
			'show_in_rest'      => false,
		)
	);
}
add_action( 'admin_init', 'muslimscc_prayer_register_settings' );

/**
 * Sanitize callback for the settings form.
 *
 * @param mixed $input Submitted values.
 * @return array
 */
function muslimscc_prayer_sanitize_settings( $input ) {
	$input = is_array( $input ) ? wp_unslash( $input ) : array();
	return muslimscc_prayer_sanitize_options(
		$input,
		array(
			'city'   => 'baku',
			'lang'   => 'en',
			'theme'  => 'light',
			'layout' => 'compact',
		)
	);
}

/**
 * Add the page under Settings.
 */
function muslimscc_prayer_admin_menu() {
	add_options_page(
		__( 'Muslims.cc Prayer Times', 'muslimscc-prayer-times' ),
		__( 'Muslims.cc', 'muslimscc-prayer-times' ),
		'manage_options',
		'muslimscc-prayer-times',
		'muslimscc_prayer_settings_page'
	);
}
add_action( 'admin_menu', 'muslimscc_prayer_admin_menu' );

/**
 * Print a <select>.
 *
 * @param string $field   Option key.
 * @param array  $choices value => label.
 * @param string $current Current value.
 * @param string $id      Element id.
 */
function muslimscc_prayer_select( $field, $choices, $current, $id ) {
	echo '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( MUSLIMSCC_PRAYER_OPTION . '[' . $field . ']' ) . '">';
	foreach ( $choices as $value => $label ) {
		echo '<option value="' . esc_attr( $value ) . '"' . selected( $current, $value, false ) . '>' . esc_html( $label ) . '</option>';
	}
	echo '</select>';
}

/**
 * Language choices (names are shown in their own language).
 *
 * @return array
 */
function muslimscc_prayer_lang_choices() {
	return array(
		'az' => 'Azərbaycanca',
		'en' => 'English',
		'ru' => 'Русский',
		'ar' => 'العربية',
		'tr' => 'Türkçe',
	);
}

/**
 * Render the settings page.
 */
function muslimscc_prayer_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$o      = muslimscc_prayer_get_options();
	$cities = array();
	foreach ( muslimscc_prayer_cities() as $key => $city ) {
		$cities[ $key ] = $city['label'] . ' — ' . $city['country'];
	}
	$name = MUSLIMSCC_PRAYER_OPTION;
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
		<p><?php esc_html_e( 'These are the defaults for the block, the classic widget and the shortcode. Each block or shortcode can override them.', 'muslimscc-prayer-times' ); ?></p>
		<form action="options.php" method="post">
			<?php settings_fields( 'muslimscc_prayer' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="muslimscc-city"><?php esc_html_e( 'City', 'muslimscc-prayer-times' ); ?></label></th>
					<td><?php muslimscc_prayer_select( 'city', $cities, $o['city'], 'muslimscc-city' ); ?></td>
				</tr>
				<tr>
					<th scope="row"><label for="muslimscc-lang"><?php esc_html_e( 'Language', 'muslimscc-prayer-times' ); ?></label></th>
					<td><?php muslimscc_prayer_select( 'lang', muslimscc_prayer_lang_choices(), $o['lang'], 'muslimscc-lang' ); ?></td>
				</tr>
				<tr>
					<th scope="row"><label for="muslimscc-theme"><?php esc_html_e( 'Theme', 'muslimscc-prayer-times' ); ?></label></th>
					<td>
						<?php
						muslimscc_prayer_select(
							'theme',
							array(
								'light' => __( 'Light', 'muslimscc-prayer-times' ),
								'dark'  => __( 'Dark', 'muslimscc-prayer-times' ),
							),
							$o['theme'],
							'muslimscc-theme'
						);
						?>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="muslimscc-layout"><?php esc_html_e( 'Layout', 'muslimscc-prayer-times' ); ?></label></th>
					<td>
						<?php
						muslimscc_prayer_select(
							'layout',
							array(
								'compact' => __( 'Compact — prayer times and countdown', 'muslimscc-prayer-times' ),
								'full'    => __( 'Full — mosque display with clock, verses and remembrance', 'muslimscc-prayer-times' ),
							),
							$o['layout'],
							'muslimscc-layout'
						);
						?>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="muslimscc-height"><?php esc_html_e( 'Height (px)', 'muslimscc-prayer-times' ); ?></label></th>
					<td>
						<input type="number" id="muslimscc-height" name="<?php echo esc_attr( $name . '[height]' ); ?>" value="<?php echo esc_attr( $o['height'] ? (string) $o['height'] : '' ); ?>" min="200" max="1200" step="10" class="small-text" aria-describedby="muslimscc-height-desc" />
						<p class="description" id="muslimscc-height-desc"><?php esc_html_e( 'Leave empty for automatic height (500 px for compact, 16:9 for full).', 'muslimscc-prayer-times' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Credit link', 'muslimscc-prayer-times' ); ?></th>
					<td>
						<label for="muslimscc-credit">
							<input type="checkbox" id="muslimscc-credit" name="<?php echo esc_attr( $name . '[credit]' ); ?>" value="1" <?php checked( $o['credit'] ); ?> aria-describedby="muslimscc-credit-desc" />
							<?php esc_html_e( 'Show a "Prayer times by muslims.cc" link under the widget on my site', 'muslimscc-prayer-times' ); ?>
						</label>
						<p class="description" id="muslimscc-credit-desc"><?php esc_html_e( 'Off by default. Turn it on if you would like to thank muslims.cc — the widget works the same either way.', 'muslimscc-prayer-times' ); ?></p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>

		<h2><?php esc_html_e( 'How to add the widget', 'muslimscc-prayer-times' ); ?></h2>
		<ul class="ul-disc">
			<li><?php esc_html_e( 'Block editor: add the "Prayer Times (muslims.cc)" block.', 'muslimscc-prayer-times' ); ?></li>
			<li><?php esc_html_e( 'Classic widgets: Appearance → Widgets → "Prayer Times (muslims.cc)".', 'muslimscc-prayer-times' ); ?></li>
			<li>
				<?php esc_html_e( 'Anywhere else, use the shortcode:', 'muslimscc-prayer-times' ); ?>
				<code>[muslimscc_prayer city="<?php echo esc_html( $o['city'] ); ?>" lang="<?php echo esc_html( $o['lang'] ); ?>" theme="<?php echo esc_html( $o['theme'] ); ?>" layout="<?php echo esc_html( $o['layout'] ); ?>"]</code>
			</li>
		</ul>
		<p><?php esc_html_e( 'Times are calculated astronomically. Please confirm congregation times with your mosque.', 'muslimscc-prayer-times' ); ?></p>
	</div>
	<?php
}
