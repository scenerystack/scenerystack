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
  }
];