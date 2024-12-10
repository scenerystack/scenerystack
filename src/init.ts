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
  isDebugBuild?: boolean;
  allowLocaleSwitching?: boolean;
};

const init = ( options: InitOptions ) => {
  self.phet.chipper.project = options.name;
  self.phet.chipper.version = options.version;
  self.phet.chipper.brand = options.brand ?? 'adapted-from-phet';
  self.phet.chipper.locale = options.locale ?? 'en';
  self.phet.chipper.isDebugBuild = options.isDebugBuild ?? false;
  self.phet.chipper.allowLocaleSwitching = options.allowLocaleSwitching ?? true;
  self.phet.chipper.packageObject = {
    name: options.name,
    version: options.version
  };

  // @ts-expect-error
  self.PHET_SPLASH_DATA_URI = options.splashDataURI;
};

export { init };
