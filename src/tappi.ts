// Copyright 2024, University of Colorado Boulder

/**
 * "Barrel" file for tappi, so that we can export all of the API of the repo.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

export { default as tappi } from './tappi/js/tappi.js';
export { default as VibrationTestEvent } from './tappi/js/tracking/VibrationTestEvent.js';
export { default as VibrationTestEventRecorder } from './tappi/js/tracking/VibrationTestEventRecorder.js';
export { default as VibrationTestInputListener } from './tappi/js/tracking/VibrationTestInputListener.js';
export { default as VibrationChart } from './tappi/js/view/VibrationChart.js';
export { default as VibrationIndicator } from './tappi/js/view/VibrationIndicator.js';
export { default as ContinuousPatternVibrationController } from './tappi/js/ContinuousPatternVibrationController.js';
export type { ContinuousPatternVibrationControllerOptions } from './tappi/js/ContinuousPatternVibrationController.js';
export { default as VibrationManageriOS } from './tappi/js/VibrationManageriOS.js';
export { default as VibrationPatterns } from './tappi/js/VibrationPatterns.js';
export { default as vibrationManager, Intensity } from './tappi/js/vibrationManager.js';