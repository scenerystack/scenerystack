// Copyright 2024, University of Colorado Boulder

/**
 * Initialization of simulation contexts.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

export type InitOptions = {
  // REQUIRED VALUES

  // The "internal" name of the simulation (e.g. 'energy-skate-park'), usually used for the npm package name
  name: string;

  // A semver string, e.g. '1.0.0'
  version: string;

  // The URI for the splash screen data, which is a base64 encoded image (usually a PNG)
  splashDataURI: string;

  // OPTIONS

  // The "internal" name of the brand (e.g. 'adapted-from-phet')
  brand?: string;

  // The initial locale. Should be one of the keys of the localeData object (see
  // https://github.com/phetsims/babel/blob/main/localeData.json).
  locale?: string;

  // All of the available locales for the translation (what is supported by the simulation, since it can be set by the
  // ?locale=... query parameter, or switched dynamically if the allowLocaleSwitching below is true).
  availableLocales?: string[];

  // Whether the simulation allows switching locale dynamically (via the Preferences dialog, for example).
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
  supportedRegionsAndCultures?: string;
};

const init = ( options: InitOptions ): void => {
  self.phet = self.phet || {};
  self.phet.chipper = self.phet.chipper || {};
  self.phet.chipper.project = options.name;
  self.phet.chipper.version = options.version;
  self.phet.chipper.brand = options.brand ?? 'adapted-from-phet';
  self.phet.chipper.locale = options.locale ?? 'en';
  self.phet.chipper.isDebugBuild = false; // Hard-coded, see https://github.com/scenerystack/community/issues/149
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