// Copyright 2025, University of Colorado Boulder

/**
 * Kick off doc generation
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { generateSceneryStackDocumentation } from './generateSceneryStackDocumentation.js';

generateSceneryStackDocumentation().catch( e => {
  console.error( e );
  process.exit( 1 );
} );