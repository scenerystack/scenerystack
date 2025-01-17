// Copyright 2024, University of Colorado Boulder

/**
 * Experimental build of scenery stack
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 *
 * Run as the following at the root of scenerystack:
 *
 * `npm run build`
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
import os from 'os';
import path from 'path';
import webpackGlobalLibraries from '../../chipper/js/common/webpackGlobalLibraries.js';
import execute from '../../perennial-alias/js/common/execute.js';
import _ from 'lodash';
import pascalCase from '../../chipper/js/common/pascalCase.js';

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

const writeDependencies = async () => {
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
};

const copyAndPatch = async ( options?: {
  // TODO: because of performance and size
  removeAssertions?: boolean;

  // TODO: for innate tree-shakeability (e.g. rollup/vite)
  removeNamespacing?: boolean;

  // TODO: can we get rid of imports for things after assertions/etc. are removed?
} ) => {

  const removeAssertions = options?.removeAssertions ?? true;
  const removeNamespacing = options?.removeNamespacing ?? true;

  console.log( `copying and patching${removeAssertions ? ' no-assert' : ''}${removeNamespacing ? ' no-namespace' : ''}` );

  const wipeDir = ( dirname: string ) => {
    if ( fs.existsSync( `./${dirname}` ) ) {
      fs.rmSync( `./${dirname}`, {
        recursive: true
      } );
    }

    fs.mkdirSync( `./${dirname}`, { recursive: true } );
  };

  wipeDir( 'third-party-licenses' );

  repos.forEach( repo => {
    wipeDir( `src/${repo}` );
  } );

  const localeData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

  // TODO: expose these on the global namespace? export them?
  const stringKeyToIdentifier = ( repo: string, stringKey: string ): string => {
    return `string_${repo}_${stringKey}_StringProperty`.replaceAll( /[^a-zA-Z0-9_]/g, '_' );
  };

  const stringKeyToRelativePath = ( repo: string, stringKey: string ): string => {
    return `${repo}/js/strings/${stringKey.replaceAll( '.', '/' )}.ts`;
  };

  // babel-strings.js
  {
    const stringRepos = [
      'joist',
      'scenery-phet',
      'sun',
      'vegas'
    ];

    const stringReposInfo: { repo: string, requirejsNamespace: string }[] = [];
    for ( const repo of stringRepos ) {
      const requireJSNamespace = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf8' ) ).phet.requirejsNamespace;

      stringReposInfo.push( { repo, requirejsNamespace: requireJSNamespace } );
    }

    fs.mkdirSync( './src/babel', { recursive: true } );

    const emptyStringMap: Record<string, {}> = {};
    for ( const locale of Object.keys( localeData ) ) {
      emptyStringMap[ locale ] = {};
    }

    const precursor = 'self.phet = self.phet || {};self.phet.chipper = self.phet.chipper || {};';
    fs.writeFileSync( './src/babel/babel-strings.js', `${precursor}
const strings = ${JSON.stringify( emptyStringMap )};
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
const metadata = ${JSON.stringify( {} )};
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
  const usedStrings: Record<string, string[]> = {};
  const stringModulePaths: string[] = [];

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
            if ( srcPath.includes( `lib${path.sep}` ) ) {
              if ( !requiredLibs.includes( name ) ) {
                continue;
              }
            }

            if ( srcPath.includes( `licenses${path.sep}` ) ) {
              if ( requiredLibs.includes( name.slice( 0, -( '.txt'.length ) ) ) ) {
                licensePaths.push( srcPath );
              }
            }
          }
        }

        if ( srcPath.includes( `alpenglow${path.sep}doc` ) ) {
          continue;
        }
        if ( [
          'eslint.config.mjs',
          'alpenglow/tests',
          'brand/phet',
          'brand/phet-io',
          'chipper/data',
          'chipper/js/grunt',
          'chipper/js/phet-io',
          'chipper/js/scripts',
          'chipper/js/test',
          'chipper/templates',
          'chipper/tsconfig',
          'dot/assets',
          'dot/doc',
          'dot/examples',
          'dot/tests',
          'joist/assets',
          'joist/doc',
          'kite/doc',
          'kite/examples',
          'kite/tests',
          'perennial-alias/aider',
          'perennial-alias/bin',
          'perennial-alias/data',
          'perennial-alias/doc',
          'perennial-alias/logs',
          'perennial-alias/tsconfig',
          'perennial-alias/views',
          'perennial-alias/js/build-server',
          'perennial-alias/js/eslint',
          'perennial-alias/js/grunt',
          'phet-core/tests',
          'scenery/assets',
          'scenery/doc',
          'scenery/examples',
          'scenery/tests',
          'scenery-phet/assets',
          'scenery-phet/util',
          'sun/doc',
          'tambo/assets',
          'tambo/css',
          'tambo/doc',
          'tambo/html',
          'tambo/resources',
          'tappi/doc',
          'vegas/assets',

          // includes griddle!!!
          'tappi/js/demo/patterns/PatternsScreen',
          'tappi/js/demo/patterns/view/PatternsScreenView',
          'tappi/js/view/VibrationChart',
          'tappi/js/main',

          // includes icons that don't exist
          'sherpa/js/fontawesome-5/iconList.js',

          // has phetioEngine
          'joist/js/simLauncher.ts',
          'chipper/js/browser/sim-tests/qunitStart.js',

          // Is the main for the demo
          'bamboo/js/bamboo-main.',
          'joist/js/joist-main.',
          'mobius/js/mobius-main.',
          'nitroglycerin/js/nitroglycerin-main.',
          'scenery/js/scenery-main.',
          'scenery-phet/js/scenery-phet-main.',
          'sun/js/sun-main.',
          'tambo/js/tambo-main.',
          'tappi/js/tappi-main.',
          'twixt/js/twixt-main.',
          'vegas/js/vegas-main.',

          // parts of demo
          'bamboo/js/demo',
          'joist/js/demo',
          'mobius/js/demo',
          'nitroglycerin/js/demo',
          'scenery-phet/js/demo',
          'sun/js/demo',
          'tappi/js/demo',
          'tambo/js/demo',
          'twixt/js/demo',
          'vegas/js/demo',

          // Tests
          'axon/js/axon-tests.',
          'dot/js/dot-tests.',
          'joist/js/joist-tests.',
          'kite/js/kite-tests.',
          'phet-core/js/phet-core-tests.',
          'phetcommon/js/phetcommon-tests.',
          'scenery-phet/js/scenery-phet-tests.',
          'scenery/js/scenery-tests.',
          'sun/js/sun-tests.',
          'tandem/js/tandem-tests.',
          'twixt/js/twixt-tests.',

          // Unneeded mains
          'alpenglow/js/main.',
          'axon/js/main.',
          'dot/js/dot-main.',
          'dot/js/main.',
          'joist/js/main.',
          'kite/js/kite-main.',
          'kite/js/main.',
          'mobius/js/main.',
          'nitroglycerin/js/main.',
          'phet-core/js/main.',
          'phetcommon/js/main.',
          'scenery-phet/js/main.',
          'scenery/js/main.',
          'sun/js/main.',
          'tambo/js/main.',
          'tandem/js/main.',
          'twixt/js/main.',
          'utterance-queue/js/main.',
          'vegas/js/main.',


          // references lodash from perennial-alias node_modules, don't want it!
          'sherpa/js/lodash.ts'
        ].some( aPath => srcPath.includes( aPath.replaceAll( '/', path.sep ) ) ) ) {
          continue;
        }

        if ( entry.isDirectory() ) {
          if ( !name.includes( '.' ) && !badDirectoryNames.includes( name ) ) {
            copyAndModify( srcPath, destPath );
          }
        }
        else if ( suffixes.some( suffix => name.endsWith( suffix ) ) ) {
          // console.log( `including ${srcPath}` );

          // Read, modify, and write the file if it matches the filter
          const content = fs.readFileSync( srcPath, 'utf8' );

          if ( srcPath.endsWith( 'Strings.ts' ) && content.includes( 'Strings = getStringModule(' ) ) {
            stringModulePaths.push( destPath );
          }

          let modifiedContent = content;

            const getImportPath = ( fileToImport: string ) => {
            const result = path.relative( path.dirname( destPath ), fileToImport ).replaceAll( path.sep, '/' );

            return result.startsWith( '.' ) ? result : `./${result}`;
          };

          const insertImport = ( importLine: string ): void => {
            const currentImportIndex = modifiedContent.indexOf( '\nimport ' ) + 1;

            modifiedContent = `${modifiedContent.slice( 0, currentImportIndex )}${importLine}\n${modifiedContent.slice( currentImportIndex )}`;
          };

          // Modify content (mostly adding correct imports)
          {
            if ( repo !== 'sherpa' ) {
              if ( !destPath.includes( 'QueryStringMachine' ) && !destPath.includes( 'assert/js/assert' ) && modifiedContent.includes( 'QueryStringMachine' ) ) {
                insertImport( `import '${getImportPath( 'src/query-string-machine/js/QueryStringMachine.js' )}';` );
              }
              if ( !destPath.includes( 'src/assert' ) && modifiedContent.includes( 'assert' ) ) {
                insertImport( `import '${getImportPath( 'src/assert/js/assert.js' )}';` );
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
                'phet?.log'

              ].some( str => modifiedContent.includes( str ) ) ) {
                insertImport( `import '${getImportPath( 'src/chipper/js/browser/initialize-globals.js' )}';` );
              }
              if ( modifiedContent.includes( 'phet.chipper.strings' ) ) {
                insertImport( `import '${getImportPath( 'src/babel/babel-strings.js' )}';` );
              }
              if ( modifiedContent.includes( 'phet.chipper.stringMetadata' ) ) {
                insertImport( `import '${getImportPath( 'src/babel/babel-metadata.js' )}';` );
              }
              if ( modifiedContent.includes( 'phet.chipper.stringRepos' ) ) {
                insertImport( `import '${getImportPath( 'src/babel/babel-stringRepos.js' )}';` );
              }
              if ( modifiedContent.includes( 'phet.chipper.localeData' ) ) {
                insertImport( `import '${getImportPath( 'src/babel/localeData.js' )}';` );
              }

              // Add lodash import if it is not imported
              if ( modifiedContent.includes( '_.' ) && !modifiedContent.includes( 'import _ ' ) ) {
                insertImport( `import _ from 'lodash';` );
              }

              // Replace lodash sherpa import
              const lodashImportRegex = /import _ from '[^'\n]*sherpa\/js\/lodash\.js';/g;
              if ( modifiedContent.match( lodashImportRegex ) ) {
                modifiedContent = modifiedContent.replace( lodashImportRegex, `import _ from 'lodash';` );
              }

              // Replace fluent sherpa imports
              // e.g.
              // input: '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/bundle.js';
              // output: 'fluent-bundle'
              const fluentImportRegex = /import (.+) from '[^'\n]*sherpa\/lib\/fluent-(\w+)-\/[^'\n]*';/g;
              while ( modifiedContent.match( fluentImportRegex ) ) {
                modifiedContent = modifiedContent.replace( fluentImportRegex, `import $1 from 'fluent-$2';` );
              }

              if ( modifiedContent.includes( '$(' ) ) {
                insertImport( `import $ from 'jquery';` );
              }
              if ( modifiedContent.includes( 'paper.' ) ) {
                insertImport( `import paper from 'paper';` );
              }
              if ( modifiedContent.includes( 'he.decode' ) ) {
                insertImport( `import he from 'he';` );
              }
              if ( modifiedContent.includes( 'Math.seedrandom' ) ) {
                insertImport( `import 'seedrandom';` );

                modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error\s+assert && assert\( Math\.seedrandom/g, 'assert && assert( Math.seedrandom' );
                modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error\s+this\.seedrandom = Math\.seedrandom/g, 'this.seedrandom = Math.seedrandom' );
              }
              if ( modifiedContent.includes( 'window.saveAs( blob, filename )' ) ) {
                insertImport( `import saveAs from 'file-saver';` );

                modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error when typescript knows anything about window\. \. \.\.\s+window\.saveAs\( blob, filename \);/g, 'saveAs( blob, filename );' );

                // // @ts-expect-error when typescript knows anything about window. . ..
                // window.saveAs( blob, filename );

              }
              if ( modifiedContent.match( /THREE[^:]/g ) ) {
                insertImport( `import * as THREE from 'three';` );

                if ( modifiedContent.includes( '.needsUpdate = true;' ) ) {
                  modifiedContent = modifiedContent.replaceAll( 'this.attributes.position.needsUpdate = true;', '// @ts-expect-error\nthis.attributes.position.needsUpdate = true;' );
                  modifiedContent = modifiedContent.replaceAll( 'this.attributes.normal.needsUpdate = true;', '// @ts-expect-error\nthis.attributes.normal.needsUpdate = true;' );
                }
              }
              if ( modifiedContent.includes( 'LineBreaker' ) ) {
                insertImport( `import { LineBreaker } from 'linebreak-ts';` );

                modifiedContent = modifiedContent.replace( 'lineBreaker[ Symbol.iterator ]', '// @ts-expect-error\nlineBreaker[ Symbol.iterator ]' );
                modifiedContent = modifiedContent.replace( 'for ( const brk of lineBreaker ) {', '// @ts-expect-error\nfor ( const brk of lineBreaker ) {' );
              }
              if ( modifiedContent.includes( 'FlatQueue' ) ) {
                insertImport( `import FlatQueue from 'flatqueue';` );

                modifiedContent = modifiedContent.replaceAll( 'new window.FlatQueue()', 'new FlatQueue()' );
              }
              if ( modifiedContent.includes( 'fromByteArray(' ) ) {
                insertImport( `import base64js from 'base64-js';const fromByteArray = base64js.fromByteArray;` );
              }
              if ( modifiedContent.includes( 'TextEncoderLite' ) ) {
                insertImport( `import TextEncoder from 'text-encoder-lite';` );

                modifiedContent = modifiedContent.replace( '// @ts-expect-error - fromByteArray Exterior lib', '' );
                modifiedContent = modifiedContent.replace( 'new TextEncoderLite', 'new TextEncoder.TextEncoderLite' );
              }

              // NOTE: keep last, so it will be up top
              insertImport( `import '${getImportPath( 'src/globals.js' )}';` );
            }

            // Use `self` instead of `window` for WebWorker compatibility
            // See https://github.com/scenerystack/scenerystack/issues/3
            {
              modifiedContent = modifiedContent.replace( /([ \(,!])window(\??[\., ])/g, '$1self$2' );

              // Handle Namespace so it works correctly (it was failing in web workers)
              modifiedContent = modifiedContent.replaceAll( '!globalThis.hasOwnProperty( \'window\' )', '!globalThis.self' );
            }
          }

          // String handling
          {
            // See getStringMap for documentation
            for ( const stringRepo of repos ) {
              const prefix = `${pascalCase( stringRepo )}Strings`; // e.g. JoistStrings
              if ( modifiedContent.includes( `import ${prefix} from` ) ) {
                const matches = Array.from( modifiedContent.matchAll( new RegExp( `${prefix}(\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[\\s*['"][^'"]+['"]\\s*\\])+[^\\.\\[]`, 'g' ) ) );

                const imports: string[] = [];

                for ( const match of matches.reverse() ) {
                  // Strip off the last character - it's a character that shouldn't be in a string access
                  const matchedString = match[ 0 ].slice( 0, match[ 0 ].length - 1 );

                  // Ignore imports
                  if ( matchedString === `${prefix}.js` ) {
                    continue;
                  }

                  const matchedIndex = match.index;
                  const stringAccess = matchedString
                      .replace( /StringProperty'\s?].*/, '\' ]' )
                      .replace( /StringProperty.*/, '' )
                      .replace( /\[ '/g, '[\'' )
                      .replace( /' \]/g, '\']' );

                  const depth = 2; // TODO: this is not a great way to do this, coppied from getStringMap
                  const stringKeyParts = stringAccess.match( /\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\s*['"][^'"]+['"]\s*\]/g )!.map( token => {
                    return token.startsWith( '.' ) ? token.slice( 1 ) : token.slice( depth, token.length - depth );
                  } );
                  const partialStringKey = stringKeyParts.join( '.' );

                  usedStrings[ stringRepo ] = usedStrings[ stringRepo ] || [];
                  if ( !usedStrings[ stringRepo ].includes( partialStringKey ) ) {
                    usedStrings[ stringRepo ].push( partialStringKey );
                  }

                  const stringModulePath = stringKeyToRelativePath( stringRepo, partialStringKey );
                  const identifier = stringKeyToIdentifier( stringRepo, partialStringKey );

                  const importString = `import { ${identifier} } from '${getImportPath( `src/${stringModulePath.replace( /\.ts$/, '.js' )}` )}';`;

                  if ( !imports.includes( importString ) ) {
                    imports.push( importString );
                  }

                  modifiedContent = modifiedContent.slice( 0, matchedIndex ) + identifier + modifiedContent.slice( matchedIndex + matchedString.length );
                }

                for ( const importString of imports ) {
                  insertImport( importString );
                }

                // We should now have removed all usages (except for the 2 in the import)
                // Count how many times prefix shows up
                const prefixUsages = Array.from( modifiedContent.matchAll( new RegExp( prefix, 'g' ) ) ).length;
                if ( prefixUsages !== 2 ) {
                  throw new Error( 'Failed to remove all string usages' );
                }

                // Remove the now-unused import
                modifiedContent = modifiedContent.replace( new RegExp( `${os.EOL}import ${prefix} from '[^']+';`, 'g' ), '' );
              }
            }
          }

          fs.writeFileSync( destPath, modifiedContent, 'utf8' );
        }
      }
    };
    copyAndModify( `../${repo}`, `./src/${repo}` );
  } );

  // Create string modules
  for ( const stringRepo of Object.keys( usedStrings ).sort() ) {
    const stringKeys = usedStrings[ stringRepo ].sort();

    // load string files into memory
    const stringFiles: Record<string, any> = {
      en: JSON.parse( fs.readFileSync( `../${stringRepo}/${stringRepo}-strings_en.json`, 'utf8' ) )
    };
    const locales = Object.keys( localeData );
    for ( const locale of locales ) {
      const babelPath = `../babel/${stringRepo}/${stringRepo}-strings_${locale}.json`;
      if ( fs.existsSync( babelPath ) ) {
        stringFiles[ locale ] = JSON.parse( fs.readFileSync( babelPath, 'utf8' ) );
      }
    }

    const requireJSNamespace = JSON.parse( fs.readFileSync( `../${stringRepo}/package.json`, 'utf8' ) ).phet.requirejsNamespace;

    const repoLocales = Object.keys( stringFiles );

    for ( const stringKey of stringKeys ) {
      const stringModulePath = `./src/${stringKeyToRelativePath( stringRepo, stringKey )}`;
      fs.mkdirSync( path.dirname( stringModulePath ), { recursive: true } );

      const stringMap: Record<string, string> = {};
      for ( const locale of repoLocales ) {
        const entry = _.at( stringFiles[ locale ], stringKey )[ 0 ];

        if ( locale === 'en' && !entry ) {
          throw new Error( `Missing English string for ${stringRepo}/${stringKey}` );
        }

        if ( entry ) {
          stringMap[ locale ] = entry.value;
        }
      }

      // TODO: some simplification if they ALL have the same value?

      const rootDirToModule = path.relative( path.dirname( stringModulePath ), './src' ).replaceAll( path.sep, '/' );
      const moduleString = `// Copyright ${new Date().getFullYear() + ''}, University of Colorado Boulder

/* eslint-disable */
/* @formatter:off */

/**
 * Auto-generated from scenerystack build
 */

import '${rootDirToModule}/globals.js';
import LocalizedString from '${rootDirToModule}/chipper/js/browser/LocalizedString.js';
import LocalizedStringProperty from '${rootDirToModule}/chipper/js/browser/LocalizedStringProperty.js';
import Tandem from '${rootDirToModule}/tandem/js/Tandem.js';

export const ${stringKeyToIdentifier( stringRepo, stringKey )} = new LocalizedStringProperty(
  new LocalizedString( ${JSON.stringify( `${requireJSNamespace}/${stringKey}` )}, ${JSON.stringify( stringMap, null, 2 )}, Tandem.OPT_OUT ),
  Tandem.OPT_OUT
);
`;
      fs.writeFileSync( stringModulePath, moduleString, 'utf8' );
    }
  }

  // Patch up actual string modules, so that we are exporting all of the strings
  // IF the user wants to e.g. import JoistStrings (should work well after tree shaking)
  for ( const stringModulePath of stringModulePaths ) {
    let content;

    // console.log( `rewriting ${stringModulePath}` );

    const repo = stringModulePath.split( '/' )[ 1 ];
    const namespace = _.camelCase( repo );
    const stringModuleName = `${pascalCase( repo )}Strings`;


    if ( usedStrings[ repo ] ) {
      const imports: string[] = [];
      const recursiveMap: any = {};

      for ( const stringKey of usedStrings[ repo ] ) {
        const singleStringModulePath = stringKeyToRelativePath( repo, stringKey );
        const identifier = stringKeyToIdentifier( repo, stringKey );

        const importBits = singleStringModulePath.replace( /\.ts$/, '.js' ).split( '/' );
        importBits[ 1 ] = '.';
        imports.push( `import { ${identifier} } from '${importBits.slice( 1 ).join( '/' )}';` );

        const parts = stringKey.split( '.' );

        let map = recursiveMap;
        for ( let i = 0; i < parts.length; i++ ) {
          const part = parts[ i ];
          const islastPart = i === parts.length - 1;

          if ( islastPart ) {
            map[ part ] = stringKey;
          }
          else {
            map[ part ] = map[ part ] || {};
            map = map[ part ];
          }
        }
      }

      const mapToString = ( recursiveMap: any, indent = '' ): string => {
        if ( typeof recursiveMap === 'string' ) {
          return stringKeyToIdentifier( repo, recursiveMap );
        }
        else {
          return `{\n${Object.keys( recursiveMap ).map( key => {
            return `  ${indent}"${key}": ${mapToString( recursiveMap[ key ], indent + '  ' )}`;
          } ).join( ',\n' )}\n${indent}}`;
        }
      };

      content = `// Copyright ${new Date().getFullYear() + ''}, University of Colorado Boulder

/* eslint-disable */
/* @formatter:off */

/**
 * Auto-generated from scenerystack build
 */

import ${namespace} from './${namespace}.js';
${imports.join( os.EOL )}

// Detected no strings (probably had demo strings)
const ${stringModuleName} = ${mapToString( recursiveMap )};

${namespace}.register( '${stringModuleName}', ${stringModuleName} );

export default ${stringModuleName};
`;
    }
    else {
      // No strings (probably had demo strings).
      content = `// Copyright ${new Date().getFullYear() + ''}, University of Colorado Boulder

/* eslint-disable */
/* @formatter:off */

/**
 * Auto-generated from scenerystack build
 */

import ${namespace} from './${namespace}.js';

// Detected no strings (probably had demo strings)
const ${stringModuleName} = {};

${namespace}.register( '${stringModuleName}', ${stringModuleName} );

export default ${stringModuleName};
`;
    }

    fs.writeFileSync( stringModulePath, content, 'utf8' );
  }

  licensePaths.forEach( src => {
    const dest = `./third-party-licenses/${path.basename( src )}`;
    fs.cpSync( src, dest );
  } );

  // type=module compatibility ... lots of very hacky things for vite build to work, since the detection code in each
  // library seems to go absolutely haywire.
  const patch = ( file: string, before: string, after: string ) => {
    const qsm = fs.readFileSync( file, 'utf-8' );
    if ( !qsm.includes( before ) ) {
      console.error( `could not find ${before} in ${file}` );
    }
    fs.writeFileSync( file, qsm.replace( before, after ) );
  };
  patch(
    './src/query-string-machine/js/QueryStringMachine.js',
    `}( this, () => {`,
    `}( self, () => {`
  );
  patch(
    './src/sherpa/lib/himalaya-1.1.0.js',
    `module.exports=f()`,
    `self.himalaya=f()`
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
};

const conditionalLog = ( string: string ) => {
  if ( string.trim().length ) {
    console.log( string );
  }
};
const conditionalError = ( string: string ) => {
  if ( string.trim().length ) {
    console.error( string );
  }
};

const tscRun = async ( production: boolean ): Promise<void> => {
  console.log( `running tsc (${production ? 'prod' : 'dev'})` );

  const tscResult = await execute( 'node', [
    '../perennial-alias/node_modules/typescript/bin/tsc',
    ...( production ? [] : [ '--project', 'tsconfig.dev.json' ] )
  ], '.', { errors: 'resolve' } );

  conditionalLog( tscResult.stdout );
  conditionalError( tscResult.stderr );
  if ( tscResult.code !== 0 ) {
    console.error( 'tsc failed' );
    process.exit( 1 );
  }
};

const rollupRun = async () => {
  // Use rollup for bundles
  console.log( 'running rollup' );
  const rollupResult = await execute( 'npx', [ 'rollup', '-c' ], '.', { errors: 'resolve' } );

  conditionalLog( rollupResult.stdout );
  conditionalError( rollupResult.stderr );
  if ( rollupResult.code !== 0 ) {
    console.error( 'rollup failed' );
    process.exit( 1 );
  }
};

( async () => {

  // dependencies.json
  await writeDependencies();

  // copy "production version" into ./src/
  await copyAndPatch( {
    removeAssertions: true,
    removeNamespacing: true
  } );

  // tsc files into ./dist/prod/
  await tscRun( true );

  // copy "development version" into ./src/
  await copyAndPatch( {
    removeAssertions: false,
    removeNamespacing: false
  } );

  // tsc files into ./dist/dev/
  await tscRun( false );

  // copy "production version" into ./src/ (again, so that it will be the ending version
  // note: this is repeated, so we can get the "production" version done first for faster testing
  await copyAndPatch( {
    removeAssertions: true,
    removeNamespacing: true
  } );

  // Use rollup for bundles written to ./dist/
  await rollupRun();
} )();
