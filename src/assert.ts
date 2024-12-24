// Copyright 2024, University of Colorado Boulder

/**
 * Exports for under /assert
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// eslint-disable-next-line phet/bad-typescript-text
// @ts-nocheck

import './assert/js/assert.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assert: ( condition: any, message?: string ) => void = window.assert;
export default assert;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assertSlow: ( condition: any, message?: string ) => void = window.assert;
export const enableAssert = window.assertions.enableAssert;
export const disableAssert = window.assertions.disableAssert;
export const enableAssertSlow = window.assertions.enableAssertSlow;
export const disableAssertSlow = window.assertions.disableAssertSlow;