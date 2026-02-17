// Copyright 2024, University of Colorado Boulder

/**
 * Declared globals for text-encoder-lite
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

declare module 'text-encoder-lite' {
  export class TextEncoderLite {
    public encode( s: string ): Uint8Array;
  }
  export class TextDecoderLite {
    public decode( buffer: Uint8Array ): string;
  }
}