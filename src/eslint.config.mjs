// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import browserEslintConfig from '../../perennial-alias/js/eslint/config/browser.eslint.config.mjs';
import { mutateForNestedConfig } from '../../perennial-alias/js/eslint/config/root.eslint.config.mjs';


export default [
  ...mutateForNestedConfig( browserEslintConfig ),
  {
    rules: {

    }
  },
  {
    ignores: [
      // Ignore specific directories, so our "included" files are linted
      'alpenglow/',
      'assert/',
      'axon/',
      'babel/',
      'bamboo/',
      'brand/',
      'chipper/',
      'dot/',
      'joist/',
      'kite/',
      'mobius/',
      'nitroglycerin/',
      'perennial-alias/',
      'phet-core/',
      'phetcommon/',
      'query-string-machine/',
      'scenery/',
      'scenery-phet/',
      'sun/',
      'tambo/',
      'tandem/',
      'tappi/',
      'twixt/',
      'utterance-queue/',
      'vegas/'
    ]
  }
];