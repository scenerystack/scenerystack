// Copyright 2025, University of Colorado Boulder

/**
 * Sim launch connection, included in scenerystack/sim
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import asyncLoader from '../phet-core/js/asyncLoader.js';

export const onReadyToLaunch = ( callback: () => void ): void => {
  const unlockLaunch = asyncLoader.createLock( { name: 'launch' } );

  // Add listener before unlocking the launch lock
  asyncLoader.addListener( callback );
  unlockLaunch();

  // Signify that the simLauncher was called, see https://github.com/phetsims/joist/issues/142
  self.phet.joist.launchCalled = true;
};