declare module "text-encoder-lite" {
  export class TextEncoderLite {
    encode( s: string ): Uint8Array;
  }
  export class TextDecoderLite {
    decode( buffer: Uint8Array ): string;
  }
}