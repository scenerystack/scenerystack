// Copyright 2024, University of Colorado Boulder

/**
 * "Barrel" file for chipper, so that we can export all of the API of the repo.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import './preload.js';

export { default as chipper } from './chipper/js/chipper.js';

export { default as LocalizedString } from './chipper/js/LocalizedString.js';
export type { LocalizedStringStateDelta, StringsStateStateObject } from './chipper/js/LocalizedString.js';
export { default as LocalizedStringProperty } from './chipper/js/LocalizedStringProperty.js';
export { default as getStringModule } from './chipper/js/getStringModule.js';