// Copyright 2025, University of Colorado Boulder

/**
 * Cleans up a comment string, removing any comment prefixes and suffixes
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { deslashLineComment } from './deslashLineComment.js';
import { destarBlockComment } from './destarBlockComment.js';

export const cleanupComment = ( string: string ) => {
  if ( string.startsWith( '/*' ) ) {
    return destarBlockComment( string );
  }
  else if ( string.startsWith( '//' ) ) {
    return deslashLineComment( string );
  }
  else {
    return string;
  }
};