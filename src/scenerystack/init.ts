// Copyright 2024, University of Colorado Boulder

/**
 * Initialization of simulation contexts.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

export type InitOptions = {
  name: string;
  version: string;
  splashDataURI: string;

  brand?: string;
  locale?: string;
  availableLocales?: string[];
  isDebugBuild?: boolean;
  allowLocaleSwitching?: boolean;

  // Sim Features
  supportsDynamicLocale?: boolean;
  supportsInteractiveDescription?: boolean;
  supportsInteractiveHighlights?: boolean;
  supportsVoicing?: boolean;
  supportsTier1Voicing?: boolean;
  supportsPanAndZoom?: boolean;
  supportsSound?: boolean;
  colorProfiles?: string[]; // supported list of color profile names
  supportedRegionsAndCultures?: string; // TODO
};

const init = ( options: InitOptions ): void => {
  self.phet = self.phet || {};
  self.phet.chipper = self.phet.chipper || {};
  self.phet.chipper.project = options.name;
  self.phet.chipper.version = options.version;
  self.phet.chipper.brand = options.brand ?? 'adapted-from-phet';
  self.phet.chipper.locale = options.locale ?? 'en';
  self.phet.chipper.isDebugBuild = options.isDebugBuild ?? false;
  self.phet.chipper.allowLocaleSwitching = options.allowLocaleSwitching ?? true;
  self.phet.chipper.availableLocales = options.availableLocales || [ 'en' ];

  // Replace keys in phet.chipper.strings with a map for the actual locales we will use
  self.phet.chipper.strings = {};
  for ( const locale of self.phet.chipper.availableLocales ) {
    self.phet.chipper.strings[ locale ] = {};
  }

  self.phet.chipper.packageObject = {
    name: options.name,
    version: options.version,
    phet: {
      simulation: true,
      runnable: true,
      supportedBrands: [ options.brand ?? 'adapted-from-phet' ],
      simFeatures: {
        colorProfiles: options.colorProfiles ?? [ 'default' ],
        supportsDynamicLocale: self.phet.chipper.allowLocaleSwitching && options.supportsDynamicLocale !== false,
        supportsInteractiveDescription: options.supportsInteractiveDescription !== false,
        supportsInteractiveHighlights: options.supportsInteractiveDescription && options.supportsInteractiveHighlights !== false,
        supportsVoicing: options.supportsVoicing !== false,
        supportsTier1Voicing: options.supportsTier1Voicing !== false,
        supportsPanAndZoom: options.supportsPanAndZoom !== false,
        supportedRegionsAndCultures: options.supportedRegionsAndCultures || [ 'usa' ],
        supportsSound: options.supportsSound ?? false
      }
    }
  };

  // @ts-expect-error
  self.PHET_SPLASH_DATA_URI = options.splashDataURI;

  // NOTE: Do not collapse these, since we don't want an auto import added
  const chipperTest = phet.chipper;
  if ( chipperTest.queryParameters ) {
    console.log( 'init() ran after other modules, e.g. initialize-globals' );
  }
};

export { init };