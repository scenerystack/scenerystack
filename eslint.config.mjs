// Copyright 2024, University of Colorado Boulder

import nodeEslintConfig from '../perennial-alias/js/eslint/config/node.eslint.config.mjs';

/**
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
export default [
  ...nodeEslintConfig,
  {
    files: [ 'bin/**/*', 'js/**/*' ],
    rules: {
      'phet/copyright': 'off'
    }
  },
  {
    ignores: [
      'dist/',

      // Ignore specific directories, so our "included" files are linted
      'src/alpenglow/',
      'src/assert/',
      'src/axon/',
      'src/babel/',
      'src/bamboo/',
      'src/brand/',
      'src/chipper/',
      'src/dot/',
      'src/joist/',
      'src/kite/',
      'src/mobius/',
      'src/nitroglycerin/',
      'src/perennial-alias/',
      'src/phet-core/',
      'src/phetcommon/',
      'src/query-string-machine/',
      'src/scenery/',
      'src/scenery-phet/',
      'src/sherpa/',
      'src/sun/',
      'src/tambo/',
      'src/tandem/',
      'src/tappi/',
      'src/twixt/',
      'src/utterance-queue/',
      'src/vegas/'
    ]
  }
];