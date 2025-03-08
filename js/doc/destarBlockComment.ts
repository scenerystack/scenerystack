// Copyright 2025, University of Colorado Boulder

/**
 * Removes the stars from a block comment string.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import os from 'os';

export const destarBlockComment = ( string: string ) => {
  return string.split( os.EOL ).filter( line => {
    const isCommentStart = line.match( /^ *\/\*+ *$/g );
    const isCommentEnd = line.match( /^ *\*+\/ *$/g );
    return !isCommentStart && !isCommentEnd;
  } ).map( line => {
    let destarred = line.replace( /^ *\* ?/, '' );

    // If the line is effectively empty (composed of only spaces), set it to the empty string.
    if ( destarred.replace( / /g, '' ).length === 0 ) {
      destarred = '';
    }
    return destarred;
  } ).join( os.EOL );
};