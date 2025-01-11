// Copyright 2024, University of Colorado Boulder

/**
 * Config for rollup (for standalone bundles)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [ 'esm', 'umd' ].map( format => {
  return [ false, true ].map( minify => {
    return {
      input: 'dist/standalone.js',
      output: {
        file: `dist/scenerystack.${format}${minify ? '.min' : ''}.js`,
        format: format,
        name: 'scenerystack',
        sourcemap: true
      },
      plugins: [
        nodeResolve( {
          browser: true
        } ),
        commonjs(),
        ...( minify ? [
          terser( {
            mangle: {
              toplevel: true, // Mangle top-level variable and function names
              properties: false // Do not mangle property names by default
            }
          } )
        ] : [] )
      ]
    };
  } );
} ).flat();