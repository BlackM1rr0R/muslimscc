<?php
/**
 * Server-side render of the block (same iframe as the shortcode and the widget).
 *
 * @package MuslimsCC_Prayer_Times
 *
 * @var array $attributes Block attributes.
 */

defined( 'ABSPATH' ) || exit;

?>
<div <?php echo get_block_wrapper_attributes(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped by core. ?>>
	<?php echo muslimscc_prayer_render( $attributes ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside. ?>
</div>
