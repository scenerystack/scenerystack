// Copyright 2024, University of Colorado Boulder

/**
 * Declared globals for himalaya
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

declare module 'himalaya' {
  // NOTE: massive oversimplification of the API, but it gets what we need in RichText
  export const parse: ( html: string ) => {
    type: 'element' | 'comment' | 'text';
    innerContent: string;
  }[];
}