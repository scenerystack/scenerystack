// Copyright 2024, University of Colorado Boulder

/**
 * Experimental build of scenery stack
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 *
 * Run as the following at the root of scenerystack:
 *
 * `tsx js/build.ts`
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
import webpackGlobalLibraries from '../../chipper/js/common/webpackGlobalLibraries.js';
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
    ...Object.values( webpackGlobalLibraries.default ),
    ...buildJSON.common.preload,
    'sherpa/lib/big-6.2.1.js', // hah, dot Utils...
    'sherpa/lib/font-awesome-4.5.0' // manual inclusion of fontawesome-4 license
  ].filter( str => str.includes( 'sherpa' ) ).map( str => path.basename ( str ) ) );

  const licensePaths = [];

  // TODO: how do we ... remove assertions and such? maybe we build a separate dev package?
  repos.forEach( repo => {
    const copyAndModify = ( srcDir, destDir ) => {
      fs.mkdirSync( destDir, { recursive: true } );

      const entries = fs.readdirSync( srcDir, { withFileTypes: true } );

      for ( const entry of entries ) {
        const srcPath = path.join( srcDir, entry.name );
        const destPath = path.join( destDir, entry.name );

        const name = path.basename( srcPath );

        // We have to handle LICENSE setup somewhat differently here!
        if ( repo === 'sherpa' ) {

          if ( entry.isDirectory() ) {
            if ( !name.includes( 'sherpa' ) && name !== 'lib' && name !== 'licenses' && name !== 'js' && name !== 'fontawesome-4' && name !== 'brands' ) {
              continue;
            }
          }
          else {
            if ( srcPath.includes( 'lib/' ) ) {
              if ( !requiredLibs.includes( name ) ) {
                continue;
              }

              console.log( `including ${name}` );
            }

            if ( srcPath.includes( 'licenses/' ) ) {
              if ( requiredLibs.includes( name.slice( 0, -( '.txt'.length ) ) ) ) {
                licensePaths.push( srcPath );
              }
            }
          }
        }

        if ( entry.isDirectory() ) {
          if ( !name.includes( '.' ) && !badDirectoryNames.includes( name ) ) {
            copyAndModify( srcPath, destPath );
          }
        }
        else if ( suffixes.some( suffix => name.endsWith( suffix ) ) ) {
          // Read, modify, and write the file if it matches the filter
          const content = fs.readFileSync( srcPath, 'utf8' );

          let modifiedContent = content;

          // Modify content (mostly adding correct imports)
          {
            const getImportPath = fileToImport => {
              const result = path.relative( path.dirname( destPath ), fileToImport );

              return result.startsWith( '.' ) ? result : `./${result}`;
            };

            if ( repo !== 'sherpa' ) {
              modifiedContent = `import '${getImportPath( 'src/globals.js' )}';\n${modifiedContent}`;
              if ( !destPath.includes( 'QueryStringMachine' ) && !destPath.includes( 'assert/js/assert' ) && modifiedContent.includes( 'QueryStringMachine' ) ) {
                modifiedContent = `import '${getImportPath( 'src/query-string-machine/js/QueryStringMachine.js' )}';\n${modifiedContent}`;
              }
              if ( !destPath.includes( 'PhetioIDUtils' ) && modifiedContent.includes( 'phetio' ) ) {
                modifiedContent = `import '${getImportPath( 'src/tandem/js/PhetioIDUtils.js' )}';\n${modifiedContent}`;
              }
              if ( !destPath.includes( 'src/assert' ) && modifiedContent.includes( 'assert' ) ) {
                modifiedContent = `import '${getImportPath( 'src/assert/js/assert.js' )}';\n${modifiedContent}`;
              }
              if ( !destPath.includes( 'initialize-globals' ) && [
                'chipper.queryParameters',
                'chipper?.queryParameters',
                'chipper.isProduction',
                'chipper?.isProduction',
                'chipper.isApp',
                'chipper?.isApp',
                'chipper.colorProfiles',
                'chipper?.colorProfiles',
                'chipper.brand',
                'chipper?.brand',
                'chipper.mapString',
                'chipper?.mapString',
                'chipper.remapLocale',
                'chipper?.remapLocale',
                'chipper.getValidRuntimeLocale',
                'chipper?.getValidRuntimeLocale',
                'chipper.checkAndRemapLocale',
                'chipper?.checkAndRemapLocale',
                'chipper.makeEverythingSlow',
                'chipper?.makeEverythingSlow',
                'chipper.makeRandomSlowness',
                'chipper?.makeRandomSlowness',
                'chipper.reportContinuousTestResult',
                'chipper?.reportContinuousTestResult',
                'phet.log',
                'phet?.log',

              ].some( str => modifiedContent.includes( str ) ) ) {
                modifiedContent = `import '${getImportPath( 'src/chipper/js/initialize-globals.js' )}';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( '_.' ) ) {
                modifiedContent = `import _ from 'lodash';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( '$(' ) ) {
                modifiedContent = `import $ from 'jquery';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'paper.' ) ) {
                modifiedContent = `import paper from 'paper';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'he.decode' ) ) {
                modifiedContent = `import he from 'he';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'THREE' ) ) {
                modifiedContent = `import * as THREE from 'three';\n${modifiedContent}`;

                if ( modifiedContent.includes( '.needsUpdate = true;' ) ) {
                  modifiedContent = modifiedContent.replaceAll( 'this.attributes.position.needsUpdate = true;', '// @ts-expect-error\nthis.attributes.position.needsUpdate = true;' );
                  modifiedContent = modifiedContent.replaceAll( 'this.attributes.normal.needsUpdate = true;', '// @ts-expect-error\nthis.attributes.normal.needsUpdate = true;' );
                }
              }
              if ( modifiedContent.includes( 'LineBreaker' ) ) {
                modifiedContent = `import { LineBreaker } from 'linebreak-ts';\n${modifiedContent}`;

                modifiedContent = modifiedContent.replace( 'lineBreaker[ Symbol.iterator ]', '// @ts-expect-error\nlineBreaker[ Symbol.iterator ]' );
                modifiedContent = modifiedContent.replace( 'for ( const brk of lineBreaker ) {', '// @ts-expect-error\nfor ( const brk of lineBreaker ) {' );
              }
              if ( modifiedContent.includes( 'FlatQueue' ) ) {
                modifiedContent = `import FlatQueue from 'flatqueue';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'fromByteArray(' ) ) {
                modifiedContent = `import base64js from 'base64-js';const fromByteArray = base64js.fromByteArray;\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'TextEncoderLite' ) ) {
                modifiedContent = `import TextEncoder from 'text-encoder-lite';const TextEncoderLite = TextEncoder.TextEncoderLite;\n${modifiedContent}`;

                modifiedContent = modifiedContent.replace( '// @ts-expect-error - fromByteArray Exterior lib', '' );
              }
            }
          }

          fs.writeFileSync( destPath, modifiedContent, 'utf8' );
        }
      }
    };
    copyAndModify( `../${repo}`, `./src/${repo}` );
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
