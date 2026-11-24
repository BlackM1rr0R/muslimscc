/* global wp, window */
/**
 * Block editor UI for "Prayer Times (muslims.cc)".
 * No build step: plain ES5 + the wp.* globals. Title, attributes etc. come from block.json.
 * The preview is the server render (the same iframe the visitors see), made inert in the editor.
 */
( function ( blocks, element, blockEditor, components, i18n, ServerSideRender ) {
	'use strict';

	var el = element.createElement;
	var __ = i18n.__;
	var data = window.muslimsccPrayer || { cities: [], defaults: {} };
	var DEFAULT = { value: '', label: __( 'Default (from settings)', 'muslimscc-prayer-times' ) };

	var LANGS = [
		DEFAULT,
		{ value: 'az', label: 'Azərbaycanca' },
		{ value: 'en', label: 'English' },
		{ value: 'ru', label: 'Русский' },
		{ value: 'ar', label: 'العربية' },
		{ value: 'tr', label: 'Türkçe' },
	];
	var THEMES = [
		DEFAULT,
		{ value: 'light', label: __( 'Light', 'muslimscc-prayer-times' ) },
		{ value: 'dark', label: __( 'Dark', 'muslimscc-prayer-times' ) },
	];
	var LAYOUTS = [
		DEFAULT,
		{ value: 'compact', label: __( 'Compact', 'muslimscc-prayer-times' ) },
		{ value: 'full', label: __( 'Full', 'muslimscc-prayer-times' ) },
	];

	function select( label, key, options, props ) {
		return el( components.SelectControl, {
			label: label,
			value: props.attributes[ key ],
			options: options,
			onChange: function ( value ) {
				var next = {};
				next[ key ] = value;
				props.setAttributes( next );
			},
			__nextHasNoMarginBottom: true,
			__next40pxDefaultSize: true,
		} );
	}

	blocks.registerBlockType( 'muslimscc/prayer-times', {
		edit: function ( props ) {
			var blockProps = blockEditor.useBlockProps();
			return el(
				element.Fragment,
				null,
				el(
					blockEditor.InspectorControls,
					null,
					el(
						components.PanelBody,
						{ title: __( 'Settings', 'muslimscc-prayer-times' ), initialOpen: true },
						select( __( 'City', 'muslimscc-prayer-times' ), 'city', [ DEFAULT ].concat( data.cities ), props ),
						select( __( 'Language', 'muslimscc-prayer-times' ), 'lang', LANGS, props ),
						select( __( 'Theme', 'muslimscc-prayer-times' ), 'theme', THEMES, props ),
						select( __( 'Layout', 'muslimscc-prayer-times' ), 'layout', LAYOUTS, props ),
						el( components.TextControl, {
							label: __( 'Mosque name (optional)', 'muslimscc-prayer-times' ),
							value: props.attributes.name,
							maxLength: 80,
							onChange: function ( value ) {
								props.setAttributes( { name: value } );
							},
							__nextHasNoMarginBottom: true,
							__next40pxDefaultSize: true,
						} )
					)
				),
				el(
					'div',
					blockProps,
					el(
						components.Disabled,
						null,
						el( ServerSideRender, {
							block: 'muslimscc/prayer-times',
							attributes: props.attributes,
						} )
					)
				)
			);
		},
		// Dynamic block: rendered by render.php.
		save: function () {
			return null;
		},
	} );
}( wp.blocks, wp.element, wp.blockEditor, wp.components, wp.i18n, wp.serverSideRender ) );
