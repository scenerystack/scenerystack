// Copyright 2024, University of Colorado Boulder

/**
 * Experimental build of scenery stack
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 *
 * Run as the following at the root of scenerystack:
 *
 * `tsx js/build.js`
 *
 * Use local references for testing.
 *
 * Then for publishing:
 *
 * `npm pack --dry-run` (to see what files will be included)
 * `npm version patch` (or minor/major)
 * `npm publish` (once ready)
 */

/* eslint-disable */

import fs from 'fs';
import path from 'path';
import { default as webpackGlobalLibraries } from '../../chipper/js/common/webpackGlobalLibraries.js';
import execute from '../../perennial-alias/js/common/execute.js';
import _ from 'lodash';

( async () => {
  const wipeDir = ( dirname ) => {
    if ( fs.existsSync( `./${dirname}` ) ) {
      fs.rmSync( `./${dirname}`, {
        recursive: true
      } );
    }

    fs.mkdirSync( `./${dirname}` );
  };

  wipeDir( 'third-party-licenses' );

  const repos = [
    'alpenglow',
    'assert',
    'axon',
    'bamboo',
    'chipper',
    'dot',
    'joist',
    'kite',
    'mobius',
    'nitroglycerin',
    'phet-core',
    'phetcommon',
    'query-string-machine',
    'scenery-phet',
    'scenery',
    'sherpa',
    'sun',
    'tambo',
    'tandem',
    'tappi',
    'twixt',
    'utterance-queue',
    'vegas'
  ];

  repos.forEach( repo => {
    wipeDir( `src/${repo}` );
  } );

  // dependencies.json
  {
    const dependenciesJSON = {
      comment: `# ${new Date().toString()}`
    };

    for ( const repo of repos ) {
      if ( !fs.existsSync( `../${repo}` ) ) {
        throw new Error( `repo not found: ${repo}` );
      }

      let sha = null;
      let branch = null;

      try {
        sha = ( await execute( 'git', [ 'rev-parse', 'HEAD' ], `../${repo}` ) ).trim();
        branch = ( await execute( 'git', [ 'rev-parse', '--abbrev-ref', 'HEAD' ], `../${repo}` ) ).trim();
      }
      catch( e ) {
        // We support repos that are not git repositories, see https://github.com/phetsims/chipper/issues/1011
        console.log( `Did not find git information for ${repo}` );
      }

      dependenciesJSON[ repo ] = { sha: sha, branch: branch };
    }

    fs.writeFileSync( './dependencies.json', JSON.stringify( dependenciesJSON, null, 2 ) );
  }

  const badDirectoryNames = [
    'build',
    'dist',
    'node_modules'
  ];

  const suffixes = [
    '.js',
    '.ts',
    '.mjs'
  ];

  const buildJSON = JSON.parse( fs.readFileSync( '../chipper/build.json', 'utf8' ) );
  const licenseJSON = JSON.parse( fs.readFileSync( '../sherpa/lib/license.json', 'utf8' ) );

  const requiredLibs = _.uniq( [
    ...Object.values( webpackGlobalLibraries ),
    ...buildJSON.common.preload,
    'sherpa/lib/big-6.2.1.js', // hah, dot Utils...
    'sherpa/lib/font-awesome-4.5.0' // manual inclusion of fontawesome-4 license
  ].filter( str => str.includes( 'sherpa' ) ).map( str => path.basename ( str ) ) );

  const licensePaths = [];

  // TODO: how do we ... remove assertions and such? maybe we build a separate dev package?
  repos.forEach( repo => {
    fs.cpSync( `../${repo}`, `./src/${repo}`, {
      filter: ( src, dest ) => {
        const stats = fs.statSync( src );
        const name = path.basename( src );

        // We have to handle LICENSE setup somewhat differently here!
        if ( repo === 'sherpa' ) {
          if ( stats.isDirectory() ) {
            if ( !name.includes( 'sherpa' ) && name !== 'lib' && name !== 'licenses' && name !== 'js' && name !== 'fontawesome-4' && name !== 'brands' ) {
              return false;
            }
          }
          else {
            if ( src.includes( 'lib/' ) ) {
              if ( !requiredLibs.includes( name ) ) {
                return false;
              }

              console.log( `including ${name}` );
            }

            if ( src.includes( 'licenses/' ) ) {
              if ( requiredLibs.includes( name.slice( 0, -( '.txt'.length ) ) ) ) {
                licensePaths.push( src );
                return true;
              }
            }
          }
        }

        if ( stats.isDirectory() ) {
          return !name.includes( '.' ) && !badDirectoryNames.includes( name );
        }
        else {
          for ( const suffix of suffixes ) {
            if ( name.endsWith( suffix ) ) {
              return true;
            }
          }
          return false;
        }
      },
      recursive: true
    } );
  } );

  licensePaths.forEach( src => {
    const dest = `./third-party-licenses/${path.basename( src )}`;
    fs.cpSync( src, dest );
  } );

  // type=module compatibility ... lots of very hacky things for vite build to work, since the detection code in each
  // library seems to go absolutely haywire.
  const patch = ( file, before, after ) => {
    const qsm = fs.readFileSync( file, 'utf-8' );
    fs.writeFileSync( file, qsm.replace( before, after ) );
  };
  patch(
    './src/query-string-machine/js/QueryStringMachine.js',
    `}( this, () => {`,
    `}( window, () => {`
  );
  patch(
    './src/query-string-machine/js/QueryStringMachine.js',
    `module.exports = factory();`,
    `window.QueryStringMachine = factory();`
  );
  patch(
    './src/sherpa/lib/he-1.1.1.js',
    `}(this));`,
    `}(window));`
  );
  patch(
    './src/sherpa/lib/he-1.1.1.js',
    `typeof define == 'function'`,
    `false`
  );
  patch(
    './src/sherpa/lib/he-1.1.1.js',
    `freeExports && !freeExports.nodeType`,
    `false`
  );
  patch(
    './src/sherpa/lib/lodash-4.17.4.js',
    `}.call(this));`,
    `root._ = _;}.call(window));`
  );
  patch(
    './src/sherpa/lib/himalaya-1.1.0.js',
    `module.exports=f()`,
    `window.himalaya=f()`
  );
  patch(
    './src/sherpa/lib/jquery-2.1.0.js',
    `module.exports = `,
    `window.$ = `
  );
  patch(
    './src/sherpa/lib/paper-js-0.12.17.js',
    `}.call(this`,
    `}.call(window`
  );
  patch(
    './src/sherpa/lib/paper-js-0.12.17.js',
    `require('./node/extend.js')(paper);`,
    ``
  );
  patch(
    './src/sherpa/lib/paper-js-0.12.17.js',
    `module.exports = `,
    `window.paper = `
  );
  patch(
    './src/sherpa/lib/paper-js-0.12.17.js',
    `require('./node/self.js')`,
    `window.self`
  );
  patch(
    './src/sherpa/lib/big-6.2.1.js',
    `export var Big = _Big_();`,
    `/**\n * @type Class\n */\nexport var Big = _Big_();`
  );
  patch(
    './src/scenery/js/nodes/RichText.ts',
    `// @ts-expect-error - we should get a string from this`,
    ``
  );

  console.log( 'running tsc' );
  await execute( '../perennial-alias/node_modules/typescript/bin/tsc', [ '-b' ], '.' );
} )();
