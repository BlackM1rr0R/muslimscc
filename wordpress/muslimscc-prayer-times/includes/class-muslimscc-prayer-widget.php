<?php
/**
 * Classic widget (Appearance → Widgets) — renders the same iframe as the block and the shortcode.
 *
 * @package MuslimsCC_Prayer_Times
 */

defined( 'ABSPATH' ) || exit;

/**
 * Prayer times widget.
 */
class MuslimsCC_Prayer_Widget extends WP_Widget {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			'muslimscc_prayer',
			__( 'Prayer Times (muslims.cc)', 'muslimscc-prayer-times' ),
			array(
				'description'                 => __( 'Today\'s prayer times and a countdown to the next prayer.', 'muslimscc-prayer-times' ),
				'customize_selective_refresh' => true,
			)
		);
	}

	/**
	 * Front end.
	 *
	 * @param array $args     Sidebar arguments (theme markup, trusted).
	 * @param array $instance Saved values.
	 */
	public function widget( $args, $instance ) {
		$title = ! empty( $instance['title'] ) ? $instance['title'] : '';
		/** This filter is documented in wp-includes/widgets/class-wp-widget-pages.php */
		$title = apply_filters( 'widget_title', $title, $instance, $this->id_base );

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- theme markup.
		if ( $title ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- theme markup.
		}
		echo muslimscc_prayer_render( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside.
			array(
				'city'   => isset( $instance['city'] ) ? $instance['city'] : '',
				'lang'   => isset( $instance['lang'] ) ? $instance['lang'] : '',
				'theme'  => isset( $instance['theme'] ) ? $instance['theme'] : '',
				'layout' => isset( $instance['layout'] ) ? $instance['layout'] : '',
				'name'   => isset( $instance['name'] ) ? $instance['name'] : '',
			)
		);
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- theme markup.
	}

	/**
	 * Admin form.
	 *
	 * @param array $instance Saved values.
	 * @return string
	 */
	public function form( $instance ) {
		$v = wp_parse_args(
			(array) $instance,
			array(
				'title'  => '',
				'city'   => '',
				'lang'   => '',
				'theme'  => '',
				'layout' => '',
				'name'   => '',
			)
		);

		$cities = array( '' => __( 'Default (from settings)', 'muslimscc-prayer-times' ) );
		foreach ( muslimscc_prayer_cities() as $key => $city ) {
			$cities[ $key ] = $city['label'] . ' — ' . $city['country'];
		}
		$fields = array(
			'city'   => array( __( 'City', 'muslimscc-prayer-times' ), $cities ),
			'lang'   => array( __( 'Language', 'muslimscc-prayer-times' ), array( '' => __( 'Default (from settings)', 'muslimscc-prayer-times' ) ) + muslimscc_prayer_lang_choices() ),
			'theme'  => array(
				__( 'Theme', 'muslimscc-prayer-times' ),
				array(
					''      => __( 'Default (from settings)', 'muslimscc-prayer-times' ),
					'light' => __( 'Light', 'muslimscc-prayer-times' ),
					'dark'  => __( 'Dark', 'muslimscc-prayer-times' ),
				),
			),
			'layout' => array(
				__( 'Layout', 'muslimscc-prayer-times' ),
				array(
					''        => __( 'Default (from settings)', 'muslimscc-prayer-times' ),
					'compact' => __( 'Compact', 'muslimscc-prayer-times' ),
					'full'    => __( 'Full', 'muslimscc-prayer-times' ),
				),
			),
		);
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title', 'muslimscc-prayer-times' ); ?></label>
			<input class="widefat" type="text" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" value="<?php echo esc_attr( $v['title'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'name' ) ); ?>"><?php esc_html_e( 'Mosque name (optional)', 'muslimscc-prayer-times' ); ?></label>
			<input class="widefat" type="text" maxlength="80" id="<?php echo esc_attr( $this->get_field_id( 'name' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'name' ) ); ?>" value="<?php echo esc_attr( $v['name'] ); ?>" />
		</p>
		<?php foreach ( $fields as $field => $def ) : ?>
			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( $field ) ); ?>"><?php echo esc_html( $def[0] ); ?></label>
				<select class="widefat" id="<?php echo esc_attr( $this->get_field_id( $field ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( $field ) ); ?>">
					<?php foreach ( $def[1] as $value => $label ) : ?>
						<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $v[ $field ], $value ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</p>
		<?php endforeach; ?>
		<?php
		return '';
	}

	/**
	 * Save: allowlist every value (empty = use the settings default).
	 *
	 * @param array $new_instance New values.
	 * @param array $old_instance Old values.
	 * @return array
	 */
	public function update( $new_instance, $old_instance ) {
		$cities = muslimscc_prayer_cities();
		$out    = array(
			'title' => isset( $new_instance['title'] ) ? sanitize_text_field( $new_instance['title'] ) : '',
			'name'  => isset( $new_instance['name'] ) ? muslimscc_prayer_sanitize_name( $new_instance['name'] ) : '',
		);
		$city        = isset( $new_instance['city'] ) ? sanitize_key( $new_instance['city'] ) : '';
		$out['city'] = isset( $cities[ $city ] ) ? $city : '';
		$lists       = array(
			'lang'   => MUSLIMSCC_PRAYER_LANGS,
			'theme'  => MUSLIMSCC_PRAYER_THEMES,
			'layout' => MUSLIMSCC_PRAYER_LAYOUTS,
		);
		foreach ( $lists as $key => $allowed ) {
			$value       = isset( $new_instance[ $key ] ) ? sanitize_key( $new_instance[ $key ] ) : '';
			$out[ $key ] = in_array( $value, $allowed, true ) ? $value : '';
		}
		return $out;
	}
}
