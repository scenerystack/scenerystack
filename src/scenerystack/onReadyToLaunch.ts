// Copyright 2025, University of Colorado Boulder

/**
 * Sim launch connection, included in scenerystack/sim
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import asyncLoader from '../phet-core/js/asyncLoader.js';

export const onReadyToLaunch = ( callback: () => void ): void => {
  // Add listener before unlocking the launch lock
  asyncLoader.addListener( () => {
    // Since more resources might be added after the initial load, we need to reset the asyncLoader.
    asyncLoader.reset();

    callback();
  } );

  asyncLoader.stageComplete();

  // Signify that the simLauncher was called, see https://github.com/phetsims/joist/issues/142
  self.phet.joist.launchCalled = true;
};