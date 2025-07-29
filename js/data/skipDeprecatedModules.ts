// Copyright 2025, University of Colorado Boulder

/**
 * List of modules that should be skipped from exports because they are deprecated.
 *
 * NOTE: files still included, because they are used internally.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

export const skipDeprecatedModules = [
  'phet-core/js/EnumerationDeprecated.',
  'phet-core/js/Poolable.',
  'scenery-phet/js/SpectrumSlider.',
  'scenery-phet/js/WavelengthSlider.',
  'tappi/js/VibrationManageriOS.',

  // not ready yet
  'scenery/js/filters/DropShadow.',
  'scenery/js/filters/GaussianBlur.'
];