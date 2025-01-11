// Copyright 2024, University of Colorado Boulder

/**
 * Imports everything, and returns the global 'phet' object.
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 *
 * Not including adapted-from-phet/brand/sim/splash for "standalone"
 */

// eslint-disable-next-line phet/bad-typescript-text
// @ts-nocheck

export * from './alpenglow.js';
export * from './assert.js';
export * from './axon.js';
export * from './alpenglow.js';
export * from './chipper.js';
export * from './dot.js';
export * from './joist.js';
export * from './kite.js';
export * from './mobius.js';
export * from './perennial.js';
export * from './phet-core.js';
export * from './phetcommon.js';
export * from './query-string-machine.js';
export * from './scenery.js';
export * from './scenery-phet.js';
export * from './sun.js';
export * from './tandem.js';
export * from './tappi.js';
export * from './twixt.js';
export * from './vegas.js';

const phet = self.phet;
export default phet;