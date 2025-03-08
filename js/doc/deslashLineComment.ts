// Copyright 2025, University of Colorado Boulder

/**
 * Removes the slash prefix from a line comment string (including the first space)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

export const deslashLineComment = ( string: string ): string => {
  return string.replace( /^\/\/ ?/, '' );
};