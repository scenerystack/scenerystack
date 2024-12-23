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
};

const init = ( options: InitOptions ) => {
  self.phet = self.phet || {};
  self.phet.chipper = self.phet.chipper || {};
  self.phet.chipper.project = options.name;
  self.phet.chipper.version = options.version;
  self.phet.chipper.brand = options.brand ?? 'adapted-from-phet';
  self.phet.chipper.locale = options.locale ?? 'en';
  self.phet.chipper.isDebugBuild = options.isDebugBuild ?? false;
  self.phet.chipper.allowLocaleSwitching = options.allowLocaleSwitching ?? true;
  self.phet.chipper.availableLocales = options.availableLocales;
  self.phet.chipper.packageObject = {
    name: options.name,
    version: options.version
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
