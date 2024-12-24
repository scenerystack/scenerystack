// Copyright 2024, University of Colorado Boulder

/**
 * "Barrel" file for sim-required files, so that we can export all of the API of the repo.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { asyncLoader } from './phet-core.js';

export { default as Dialog } from './sun/js/Dialog.js';
export type { DialogOptions } from './sun/js/Dialog.js';
export { default as Screen } from './joist/js/Screen.js';
export type { ScreenOptions } from './joist/js/Screen.js';
export { default as ScreenIcon } from './joist/js/ScreenIcon.js';
export type { ScreenIconOptions } from './joist/js/ScreenIcon.js';
export { default as ScreenView } from './joist/js/ScreenView.js';
export type { ScreenViewOptions } from './joist/js/ScreenView.js';
export { default as Sim } from './joist/js/Sim.js';
export type { SimOptions } from './joist/js/Sim.js';

export const onReadyToLaunch = ( callback: () => void ): void => {
  const unlockLaunch = asyncLoader.createLock( { name: 'launch' } );

  // Add listener before unlocking the launch lock
  asyncLoader.addListener( callback );
  unlockLaunch();

  // Signify that the simLauncher was called, see https://github.com/phetsims/joist/issues/142
  window.phet.joist.launchCalled = true;
};