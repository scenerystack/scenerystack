// Copyright 2024, University of Colorado Boulder

/**
 * Experimental build of scenery stack
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 *
 * Run as the following at the root of scenerystack:
 *
 * `sage run js/build.ts`
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
import stringEncoding from '../../chipper/js/common/stringEncoding.js';
import execute from '../../perennial-alias/js/common/execute.js';
import _ from 'lodash';
import { StringFileMap } from '../../chipper/js/common/ChipperStringUtils.js';

( async () => {
  const wipeDir = ( dirname: string ) => {
    if ( fs.existsSync( `./${dirname}` ) ) {
      fs.rmSync( `./${dirname}`, {
        recursive: true
      } );
    }

    fs.mkdirSync( `./${dirname}`, { recursive: true } );
  };

  wipeDir( 'third-party-licenses' );

  const repos = [
    // NOTE: repos also used for cloned checkout
    'alpenglow',
    'assert',
    'axon',
    'bamboo',
    'brand',
    'chipper',
    'dot',
    'joist',
    'kite',
    'mobius',
    'nitroglycerin',
    'perennial-alias',
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
    const dependenciesJSON: Record<string, string | { sha: string | null, branch: string | null }> = {
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

  // babel-strings.js
  {
    const stringRepos = [
      'joist',
      'scenery-phet',
      'sun',
      'vegas'
    ];

    const stringMap: Record<string, Record<string, string>> = {
      en: {}
    };
    const stringMetadata: Record<string, unknown> = {};
    const stringReposInfo: { repo: string, requirejsNamespace: string }[] = [];

    // Scan for all locales, so we can patch things in
    const locales = [ 'en' ];

    for ( const repo of stringRepos ) {

      const requireJSNamespace = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf8' ) ).phet.requirejsNamespace;

      stringReposInfo.push( { repo, requirejsNamespace: requireJSNamespace } );

      // English data
      {
        const englishFile = path.normalize( `../${repo}/${repo}-strings_en.json` );

        const englishStringData = JSON.parse( fs.readFileSync( englishFile, 'utf8' ) );

        const recur = ( obj: any, stringKeyPrefix: string ) => {
          if ( obj.value && typeof obj.value === 'string' ) {
            stringMap.en[ stringKeyPrefix ] = obj.value;
            if ( obj.metadata ) {
              stringMetadata[ stringKeyPrefix ] = obj.metadata;
            }
          }
          for ( const key of Object.keys( obj ) ) {
            if ( typeof obj[ key ] === 'object' ) {
              recur( obj[ key ], `${stringKeyPrefix}${stringKeyPrefix.endsWith( '/' ) ? '' : '.'}${key}` );
            }
          }
        };
        recur( englishStringData, `${requireJSNamespace}/` );
      }

      // Translated data (if it has any ... note sun has no translation directories)
      if ( fs.existsSync( `../babel/${repo}` ) ) {
        const potentialFiles = fs.readdirSync( `../babel/${repo}` ).filter( file => file.startsWith( `${repo}-strings_` ) && file.endsWith( '.json' ) );

        for ( const file of potentialFiles ) {
          const locale = file.slice( `${repo}-strings_`.length, -'.json'.length );
          if ( !locales.includes( locale ) ) {
            locales.push( locale );
          }

          const stringData = JSON.parse( fs.readFileSync( `../babel/${repo}/${file}`, 'utf8' ) );

          stringMap[ locale ] = stringMap[ locale ] || {};
          for ( const key of Object.keys( stringData ) ) {
            const fullKey = `${requireJSNamespace}/${key}`;

            // Only translate things with English values
            if ( typeof stringData[ key ].value === 'string' && stringMap.en[ fullKey ] ) {
              stringMap[ locale ][ fullKey ] = stringData[ key ].value;
            }
          }
        }
      }
    }

    const localeData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

    // Stub in translations as required (for the stringMap compression)
    {

      const localeFallbacks = ( locale: string ): string[] => {
        return [
          ...( locale !== 'en' ? [ locale ] : [] ),
          ...( localeData[ locale ].fallbackLocales || [] ),
          'en'
        ];
      };

      // Handle all of our English keys
      for ( const key of Object.keys( stringMap.en ) ) {
        for ( const locale of locales ) {
          if ( !stringMap[ locale ][ key ] ) {
            for ( const fallback of localeFallbacks( locale ) ) {
              if ( stringMap[ fallback ][ key ] ) {
                stringMap[ locale ][ key ] = stringMap[ fallback ][ key ];
                break;
              }
            }
          }
        }
      }
    }

    // console.log( stringMap );
    // console.log( stringMetadata );

    fs.mkdirSync( './src/babel', { recursive: true } );

    const precursor = 'window.phet = window.phet || {};window.phet.chipper = window.phet.chipper || {};';
    fs.writeFileSync( './src/babel/babel-strings.js', `${precursor}
const strings = ${stringEncoding.encodeStringMapToJS( stringMap as StringFileMap )};
phet.chipper.strings = strings;
export default strings;
if ( phet.chipper.availableLocales ) { 
  Object.keys( strings ).forEach( locale => {
    if ( !phet.chipper.availableLocales.includes( locale ) ) {
      delete strings[ locale ];
    }
  } );
}` );
    fs.writeFileSync( './src/babel/babel-metadata.js', `${precursor}
const metadata = ${JSON.stringify( stringMetadata )};
phet.chipper.stringMetadata = metadata;
export default metadata;` );
    fs.writeFileSync( './src/babel/babel-stringRepos.js', `${precursor}
const stringRepos = ${JSON.stringify( stringReposInfo )};
phet.chipper.stringRepos = stringRepos;
export default stringRepos;` );
    fs.writeFileSync( './src/babel/localeData.js', `${precursor}
const localeData = ${JSON.stringify( localeData )};
phet.chipper.localeData = localeData;
export default localeData;` );

    // const stringsFilename = path.normalize( `../${locale === ChipperConstants.FALLBACK_LOCALE ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json` );
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
    'sherpa/lib/font-awesome-4.5.0', // manual inclusion of fontawesome-4 license
    'sherpa/lib/game-up-camera-1.0.0.js'
  ].filter( str => str.includes( 'sherpa' ) ).map( str => path.basename ( str ) ) ).filter( file => {
    // package.json dependencies
    if ( [
      'paper-js',
      'lodash',
      'jquery',
      'he-',
      'flatqueue',
      'linebreak',
      'base64',
      'FileSaver',
      'seedrandom',
      'TextEncoderLite'
    ].some( search => file.includes( search ) ) ) {
      return false;
    }

    return true;
  } );

  const licensePaths: string[] = [];

  // TODO: how do we ... remove assertions and such? maybe we build a separate dev package?
  repos.forEach( repo => {
    const copyAndModify = ( srcDir: string, destDir: string ) => {
      fs.mkdirSync( destDir, { recursive: true } );

      const entries = fs.readdirSync( srcDir, { withFileTypes: true } );

      for ( const entry of entries ) {
        const srcPath = path.join( srcDir, entry.name );
        const destPath = path.join( destDir, entry.name );

        const name = path.basename( srcPath );

        // We have to handle LICENSE setup somewhat differently here!
        if ( repo === 'sherpa' ) {

          if ( entry.isDirectory() ) {
            // TODO: BAD LICENSE fontawesome-5
            if ( !name.includes( 'sherpa' ) && name !== 'lib' && name !== 'licenses' && name !== 'js' && name !== 'fontawesome-4' && name !== 'fontawesome-5' && name !== 'brands' ) {
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

        if ( srcPath.includes( 'alpenglow/doc/' ) ) {
          continue;
        }
        if ( [
          // includes griddle!!!
          'tappi/js/demo/patterns/PatternsScreen',
          'tappi/js/demo/patterns/view/PatternsScreenView',
          'tappi/js/view/VibrationChart',
          'tappi/js/main',

          // includes icons that don't exist
          'sherpa/js/fontawesome-5/iconList.js',

          // has phetioEngine
          'joist/js/simLauncher.ts',
          'chipper/js/browser/sim-tests/qunitStart.js'
        ].some( path => srcPath.includes( path ) ) ) {
          continue;
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
            const getImportPath = ( fileToImport: string ) => {
              const result = path.relative( path.dirname( destPath ), fileToImport );

              return result.startsWith( '.' ) ? result : `./${result}`;
            };

            if ( repo !== 'sherpa' ) {
              modifiedContent = `import '${getImportPath( 'src/globals.js' )}';\n${modifiedContent}`;
              if ( !destPath.includes( 'QueryStringMachine' ) && !destPath.includes( 'assert/js/assert' ) && modifiedContent.includes( 'QueryStringMachine' ) ) {
                modifiedContent = `import '${getImportPath( 'src/query-string-machine/js/QueryStringMachine.js' )}';\n${modifiedContent}`;
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
                modifiedContent = `import '${getImportPath( 'src/chipper/js/browser/initialize-globals.js' )}';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'phet.chipper.strings' ) ) {
                modifiedContent = `import '${getImportPath( 'src/babel/babel-strings.js' )}';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'phet.chipper.stringMetadata' ) ) {
                modifiedContent = `import '${getImportPath( 'src/babel/babel-metadata.js' )}';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'phet.chipper.stringRepos' ) ) {
                modifiedContent = `import '${getImportPath( 'src/babel/babel-stringRepos.js' )}';\n${modifiedContent}`;
              }
              if ( modifiedContent.includes( 'phet.chipper.localeData' ) ) {
                modifiedContent = `import '${getImportPath( 'src/babel/localeData.js' )}';\n${modifiedContent}`;
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
              if ( modifiedContent.includes( 'Math.seedrandom' ) ) {
                modifiedContent = `import 'seedrandom';\n${modifiedContent}`;

                modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error\s+assert && assert\( Math\.seedrandom/g, 'assert && assert( Math.seedrandom' );
                modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error\s+this\.seedrandom = Math\.seedrandom/g, 'this.seedrandom = Math.seedrandom' );
              }
              if ( modifiedContent.includes( 'window.saveAs( blob, filename )' ) ) {
                modifiedContent = `import saveAs from 'file-saver';\n${modifiedContent}`;

                modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error when typescript knows anything about window\. \. \.\.\s+window\.saveAs\( blob, filename \);/g, 'saveAs( blob, filename );' );

                // // @ts-expect-error when typescript knows anything about window. . ..
                // window.saveAs( blob, filename );

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

                modifiedContent = modifiedContent.replaceAll( 'new window.FlatQueue()', 'new FlatQueue()' );
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
  const patch = ( file: string, before: string, after: string ) => {
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
    './src/sherpa/lib/himalaya-1.1.0.js',
    `module.exports=f()`,
    `window.himalaya=f()`
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

  // Use tsc to generate the files we need.
  console.log( 'running tsc' );
  await execute( '../perennial-alias/node_modules/typescript/bin/tsc', [ '-b' ], '.' );
} )();
