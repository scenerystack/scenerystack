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
 *
 * Conditional exports (development/others) used in bundlers:
 * - https://vite.dev/config/shared-options#resolve-conditions
 * - https://webpack.js.org/guides/package-exports/
 * - https://parceljs.org/features/dependency-resolution/
 * We are using that instead of import.meta.env.PROD / process.env.NODE_ENV
 * because of broader support.
 * Note: could use PURE annotations in the future:
 *   https://github.com/javascript-compiler-hints/compiler-notations-spec/blob/main/pure-notation-spec.md
 */

// Because it doesn't like scenerystack URLs
/* eslint-disable phet/todo-should-have-issue */

// Because we can't use IntentionalAny
/* eslint-disable @typescript-eslint/no-explicit-any */

// TODO: we should be able to split this file into modules

import fs from 'fs';
import os from 'os';
import path from 'path';
import execute from '../../perennial-alias/js/common/execute.js';
import _ from 'lodash';
import pascalCase from '../../chipper/js/common/pascalCase.js';
import ts from 'typescript';
import { getExportNames } from './typescript/getExportNames.js';
import { writeDependencies } from './writeDependencies.js';
import { scenerystackRepos } from './data/scenerystackRepos.js';
import { allowedNamespaces } from './data/allowedNamespaces.js';
import { exportedNamespaces } from './data/exportedNamespaces.js';

const repos = scenerystackRepos;

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

    const stringReposInfo: { repo: string; requirejsNamespace: string }[] = [];
    for ( const repo of stringRepos ) {
      const requireJSNamespace = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf8' ) ).phet.requirejsNamespace;

      stringReposInfo.push( { repo: repo, requirejsNamespace: requireJSNamespace } );
    }

    fs.mkdirSync( './src/babel', { recursive: true } );

    const emptyStringMap: Record<string, any> = {};
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

  type ExportEntry = {
    isType: boolean;
    requiresSim: boolean; // will it fail if run in a non-simulation context
    originalName: string;
    exportedName: string;
    path: string;
  };

  const usedStrings: Record<string, string[]> = {};
  const stringModulePaths: string[] = [];
  const writtenFileContents: { path: string; contents: string }[] = [];
  const removedNamespacePatterns: string[] = [];
  const exportEntries: Record<string, ExportEntry[]> = {
    // Our main export points are listed below.
    'adapted-from-phet': [],
    alpenglow: [],
    assert: [],
    axon: [],
    bamboo: [],
    brand: [],
    chipper: [],
    dot: [],
    init: [],
    joist: [],
    kite: [],
    mobius: [],
    nitroglycerin: [],
    perennial: [],
    'phet-core': [],
    phetcommon: [],
    'query-string-machine': [],
    scenery: [],
    'scenery-phet': [],
    sim: [],
    splash: [],
    sun: [],
    tambo: [],
    tandem: [],
    tappi: [],
    twixt: [],
    'utterance-queue': [],
    vegas: []
  };

  const copyAndModify = ( repo: string, srcDir: string, destDir: string, writeFile = true ) => {
    fs.mkdirSync( destDir, { recursive: true } );

    const entries = fs.readdirSync( srcDir, { withFileTypes: true } );

    for ( const entry of entries ) {
      const srcPath = path.join( srcDir, entry.name );
      const destPath = path.join( destDir, entry.name );

      const name = path.basename( srcPath );

      if ( srcPath.includes( `alpenglow${path.sep}doc` ) ) {
        continue;
      }
      if ( [
        'eslint.config.mjs',
        'alpenglow/tests',
        'brand/phet',
        'brand/phet-io',
        'chipper/data',
        'chipper/js/common',
        'chipper/js/data',
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
        'perennial-alias/js/common',
        'perennial-alias/js/eslint',
        'perennial-alias/js/grunt',
        'perennial-alias/js/npm-dependencies',
        'perennial-alias/js/scripts',
        'perennial-alias/js/test',
        'perennial-alias/js/listContinuousTests.',
        'phet-types.d.ts',
        'phet-types-module.d.ts',
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
        'load-unbuilt-strings.',

        // we will create our own brand when needed.
        'brand/adapted-from-phet/js/Brand.',

        // includes griddle!!!
        'tappi/js/demo/patterns/PatternsScreen',
        'tappi/js/demo/patterns/view/PatternsScreenView',
        'tappi/js/view/VibrationChart',
        'tappi/js/main',

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
        // TODO: see if we can get much more general rules, this seems a bit ridiculous to maintain
        'axon/js/axon-tests.',
        'bamboo/js/bamboo-tests.',
        'bamboo/js/*Tests.ts',
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
        'dot/js/UtilsTests.',
        'chipper/js/browser/sim-tests',
        'phet-core/js/qunitStartWithoutPhetioTests.',
        'query-string-machine-tests.',
        'QueryStringMachineTests.',
        'chipper-tests.',
        'MipmapElementTests.ts',
        'PixelComparisonTestUtils.ts',

        // Unneeded mains
        'alpenglow/js/main.',
        'axon/js/main.',
        'bamboo/js/main.',
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
        'vegas/js/main.'
      ].some( aPath => srcPath.includes( aPath.replaceAll( '/', path.sep ) ) ) ) {
        continue;
      }

      if ( entry.isDirectory() ) {
        if ( !name.includes( '.' ) && !badDirectoryNames.includes( name ) ) {
          copyAndModify( repo, srcPath, destPath, writeFile );
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
          // TODO: remove this
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
              insertImport( 'import _ from \'lodash\';' );
            }

            // Replace lodash sherpa import
            const lodashImportRegex = /import _ from '[^'\n]*sherpa\/js\/lodash\.js';/g;
            if ( modifiedContent.match( lodashImportRegex ) ) {
              modifiedContent = modifiedContent.replace( lodashImportRegex, 'import _ from \'lodash\';' );
            }

            // Replace fluent sherpa imports
            // e.g.
            // input: '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/bundle.js';
            // output: 'fluent-bundle'
            const fluentImportRegex = /import (.+) from '[^'\n]*sherpa\/lib\/fluent\/fluent-(\w+)-[^'\n]*';/g;
            while ( modifiedContent.match( fluentImportRegex ) ) {
              modifiedContent = modifiedContent.replace( fluentImportRegex, 'import $1 from \'@fluent/$2\';' );
            }

            // Replace big.js import
            const bigImportRegex = /import Big from '[^'\n]*sherpa\/lib\/big-6\.2\.1\.js';/g;
            if ( modifiedContent.match( bigImportRegex ) ) {
              modifiedContent = modifiedContent.replace( bigImportRegex, 'import Big from \'big.js\';' );
            }

            // Replace himalaya import + smooth things over
            if ( modifiedContent.includes( 'sherpa/lib/himalaya-1.1.0.js' ) ) {
              // RichText, basically

              // remove import line
              modifiedContent = modifiedContent.replace( `${os.EOL}import '../../../sherpa/lib/himalaya-1.1.0.js';`, '' );

              // remove remapping of variables
              modifiedContent = modifiedContent.replace( `${os.EOL}// @ts-expect-error - Since himalaya isn't in tsconfig`, '' );
              modifiedContent = modifiedContent.replace( `${os.EOL}const himalayaVar = himalaya;`, '' );
              modifiedContent = modifiedContent.replace( `${os.EOL}assert && assert( himalayaVar, 'himalaya dependency needed for RichText.' );`, '' );

              // insert import
              insertImport( 'import { parse as himalayaParse } from \'himalaya\';' );

              // replace usages
              modifiedContent = modifiedContent.replaceAll( /himalayaVar\.parse/g, 'himalayaParse' );
            }

            // Remove game-up-camera imports (since it is 3rd-party)
            if ( modifiedContent.includes( 'game-up-camera' ) ) {
              const gameUpCameraImportRegex = /import '[^'\n]*sherpa\/lib\/game-up-camera-1\.0\.0\.js';/g;

              modifiedContent = modifiedContent.replace( gameUpCameraImportRegex, '' );
            }

            if ( modifiedContent.includes( 'import { Pattern } from \'@fluent/bundle\';' ) ) {
              modifiedContent = modifiedContent.replace( 'import { Pattern } from \'@fluent/bundle\';', '' );
              modifiedContent = modifiedContent.replace( 'export type { Pattern as FluentPattern };', `export type FluentPattern = string | ComplexPattern;
type ComplexPattern = Array<PatternElement>;
type PatternElement = string | Expression;
type Expression = SelectExpression | VariableReference | TermReference | MessageReference | FunctionReference | Literal;
type SelectExpression = {
  type: "select";
  selector: Expression;
  variants: Array<Variant>;
  star: number;
};
type VariableReference = {
  type: "var";
  name: string;
};
type TermReference = {
  type: "term";
  name: string;
  attr: string | null;
  args: Array<Expression | NamedArgument>;
};
type MessageReference = {
  type: "mesg";
  name: string;
  attr: string | null;
};
type FunctionReference = {
  type: "func";
  name: string;
  args: Array<Expression | NamedArgument>;
};
type Variant = {
  key: Literal;
  value: FluentPattern;
};
type NamedArgument = {
  type: "narg";
  name: string;
  value: Literal;
};
type Literal = StringLiteral | NumberLiteral;
type StringLiteral = {
  type: "str";
  value: string;
};
type NumberLiteral = {
  type: "num";
  value: number;
  precision: number;
};
` );
            }

            if ( modifiedContent.includes( '$(' ) ) {
              insertImport( 'import $ from \'jquery\';' );
            }
            if ( modifiedContent.includes( 'paper.' ) ) {
              insertImport( 'import paper from \'paper\';' );
            }
            if ( modifiedContent.includes( 'he.decode' ) ) {
              insertImport( 'import he from \'he\';' );
            }
            if ( modifiedContent.includes( 'Math.seedrandom' ) ) {
              insertImport( 'import \'seedrandom\';' );

              modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error\s+assert && assert\( Math\.seedrandom/g, 'assert && assert( Math.seedrandom' );
              modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error\s+this\.seedrandom = Math\.seedrandom/g, 'this.seedrandom = Math.seedrandom' );
            }
            if ( modifiedContent.includes( 'window.saveAs( blob, filename )' ) ) {
              insertImport( 'import saveAs from \'file-saver\';' );

              modifiedContent = modifiedContent.replaceAll( /\/\/ @ts-expect-error when typescript knows anything about window\. \. \.\.\s+window\.saveAs\( blob, filename \);/g, 'saveAs( blob, filename );' );

              // // @ts-expect-error when typescript knows anything about window. . ..
              // window.saveAs( blob, filename );

            }
            if ( modifiedContent.match( /THREE[^:]/g ) ) {
              insertImport( 'import * as THREE from \'three\';' );

              if ( modifiedContent.includes( '.needsUpdate = true;' ) ) {
                modifiedContent = modifiedContent.replaceAll( 'this.attributes.position.needsUpdate = true;', '// @ts-expect-error\nthis.attributes.position.needsUpdate = true;' );
                modifiedContent = modifiedContent.replaceAll( 'this.attributes.normal.needsUpdate = true;', '// @ts-expect-error\nthis.attributes.normal.needsUpdate = true;' );
              }
            }
            if ( modifiedContent.includes( 'LineBreaker' ) ) {
              insertImport( 'import { LineBreaker } from \'linebreak-ts\';' );

              modifiedContent = modifiedContent.replace( 'lineBreaker[ Symbol.iterator ]', '// @ts-expect-error\nlineBreaker[ Symbol.iterator ]' );
              modifiedContent = modifiedContent.replace( 'for ( const brk of lineBreaker ) {', '// @ts-expect-error\nfor ( const brk of lineBreaker ) {' );
            }
            if ( modifiedContent.includes( 'FlatQueue' ) ) {
              insertImport( 'import FlatQueue from \'flatqueue\';' );

              modifiedContent = modifiedContent.replaceAll( 'new window.FlatQueue()', 'new FlatQueue()' );
              modifiedContent = modifiedContent.replaceAll( '// @ts-expect-error because FlatQueue is not declared as a global', '' );
            }
            if ( modifiedContent.includes( 'fromByteArray(' ) ) {
              insertImport( 'import base64js from \'base64-js\';const fromByteArray = base64js.fromByteArray;' );
            }
            if ( modifiedContent.includes( 'TextEncoderLite' ) ) {
              insertImport( 'import TextEncoder from \'text-encoder-lite\';' );

              modifiedContent = modifiedContent.replace( '// @ts-expect-error - fromByteArray Exterior lib', '' );
              modifiedContent = modifiedContent.replace( 'new TextEncoderLite', 'new TextEncoder.TextEncoderLite' );
            }

            // NOTE: keep last, so it will be up top
            insertImport( `import '${getImportPath( 'src/globals.js' )}';` );
          }

          // Use `self` instead of `window` for WebWorker compatibility
          // See https://github.com/scenerystack/scenerystack/issues/3
          {
            modifiedContent = modifiedContent.replace( /([ (,!])window(\??[., ])/g, '$1self$2' );

            // Handle Namespace so it works correctly (it was failing in web workers)
            modifiedContent = modifiedContent.replaceAll( '!globalThis.hasOwnProperty( \'window\' )', '!globalThis.self' );
          }

          // const kindOf = ( node: ts.Node ) => ts.SyntaxKind[ node.kind ];

          if ( removeAssertions ) {
            const sourceAST = ts.createSourceFile(
              srcPath,
              modifiedContent,
              ts.ScriptTarget.ESNext,
              true
            );

            const isAssertIdentifier = ( node: ts.Node ): boolean => {
              return ts.isIdentifier( node ) && ( node.text === 'assert' || node.text === 'assertSlow' || node.text === 'affirm' );
            };

            const isAssertAmpersands = ( node: ts.Node ): boolean => {
              return ts.isBinaryExpression( node ) &&
                     node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
                     isAssertNode( node.left ); // support assert && something && something-else
            };

            const isAssertNode = ( node: ts.Node ): boolean => {
              return isAssertIdentifier( node ) || isAssertAmpersands( node );
            };

            const isAssertIf = ( node: ts.Node ): boolean => {
              return ts.isIfStatement( node ) && isAssertNode( node.expression );
            };

            const assertionNodes: ts.Node[] = [];

            const recur = ( node: ts.Node ) => {
              if ( isAssertAmpersands( node ) || isAssertIf( node ) ) {
                assertionNodes.push( node );
              }
              // Don't recurse into the children of an assertion (we will strip it)
              else {
                for ( const child of node.getChildren() ) {
                  recur( child );
                }
              }
            };
            recur( sourceAST.getChildren()[ 0 ] );

            // Strip out assertions
            for ( const assertionNode of assertionNodes.reverse() ) {
              const replacement = ts.isExpressionStatement( assertionNode.parent ) ? '' : ( ts.isIfStatement( assertionNode.parent ) && ts.isIfStatement( assertionNode ) ? ' if ( false ) {}' : 'false' );

              // We need to exclude ts-expect-error
              const needsFullStart = modifiedContent.slice( assertionNode.getFullStart(), assertionNode.getEnd() ).includes( '@ts-expect-error' );

              const start = needsFullStart ? assertionNode.getFullStart() : assertionNode.getStart();
              const end = assertionNode.getEnd();

              if ( end - start < replacement.length ) {
                throw new Error( 'cannot maintain source map compatibility' );
              }

              // Replace with same-length things so source maps will still work
              const paddedReplacement = _.repeat( ' ', end - start - replacement.length ) + replacement;

              modifiedContent = modifiedContent.slice( 0, start ) + paddedReplacement + modifiedContent.slice( end );
            }
          }

          if ( removeNamespacing ) {
            const namespaceName = repo === 'tandem' ? 'tandemNamespace' : ( repo === 'utterance-queue' ? 'utteranceQueueNamespace' : _.camelCase( repo ) );

            const sourceAST = ts.createSourceFile(
              srcPath,
              modifiedContent,
              ts.ScriptTarget.ESNext,
              true
            );

            const mainChildren = sourceAST.getChildren()[ 0 ].getChildren();

            // Note: could traverse tree to see if this is done internally.
            for ( const node of [ ...mainChildren ].reverse() ) {
              if (
                ts.isExpressionStatement( node ) &&
                ts.isCallExpression( node.expression ) &&
                ts.isPropertyAccessExpression( node.expression.expression ) &&
                node.expression.expression.name.getText() === 'register' &&
                node.expression.expression.expression.getText() === namespaceName &&
                node.expression.arguments.length >= 2 &&
                ts.isStringLiteral( node.expression.arguments[ 0 ] )
              ) {
                const namespacePattern = `${namespaceName}.${node.expression.arguments[ 0 ].text}`;
                if ( !allowedNamespaces.includes( namespacePattern ) ) {
                  removedNamespacePatterns.push( namespacePattern );

                  // Replace with same-length things so source maps will still work
                  modifiedContent = modifiedContent.slice( 0, node.getStart() ) + _.repeat( ' ', node.getEnd() - node.getStart() ) + modifiedContent.slice( node.getEnd() );
                }
              }
            }
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

        writtenFileContents.push( {
          path: srcPath,
          contents: modifiedContent
        } );
        if ( writeFile ) {
          fs.writeFileSync( destPath, modifiedContent, 'utf8' );
        }

        const addExportFor = ( name: string, isType: boolean ): void => {

          // Skip scenery imports (we will grab things directly)
          if ( repo === 'scenery' && destPath.includes( 'imports.ts' ) ) {
            return;
          }

          // Skip kite imports (we will grab things directly)
          if ( repo === 'kite' && destPath.includes( 'imports.ts' ) ) {
            return;
          }

          const originalName = name;
          let exportedName = name === 'default' ? path.basename( destPath ).replace( /\.[jt]s$/g, '' ) : name;

          if ( repo === 'kite' && exportedName === 'Line' ) {
            exportedName = 'KiteLine';
          }
          if ( repo === 'dot' && exportedName === 'Utils' ) {
            exportedName = 'DotUtils';
          }
          if ( repo === 'dot' && exportedName === 'Rectangle' ) {
            exportedName = 'DotRectangle';
          }

          let exportFile = repo;

          if ( repo === 'sun' && destPath.includes( 'Dialog' ) ) {
            exportFile = 'sim';
          }
          if ( repo === 'joist' && [ 'Screen', 'Sim' ].some( s => destPath.includes( s ) ) ) {
            exportFile = 'sim';
          }
          if ( repo === 'perennial-alias' ) {
            exportFile = 'perennial';
          }
          if ( destPath.includes( 'adapted-from-phet' ) && repo === 'brand' ) {
            exportFile = 'adapted-from-phet';
          }
          if ( repo === 'scenerystack' ) {
            // ENSURE it gets mapped
            if ( srcPath.includes( 'assert.ts' ) ) {
              exportFile = 'assert';
            }
            else if ( srcPath.includes( 'onReadyToLaunch.ts' ) ) {
              exportFile = 'sim';
            }
            else if ( srcPath.includes( 'QueryStringMachine.ts' ) ) {
              exportFile = 'query-string-machine';
            }
            else if ( srcPath.includes( 'init.ts' ) ) {
              exportFile = 'init';
            }
            else if ( srcPath.includes( 'splash.ts' ) ) {
              exportFile = 'splash';
            }
            else {
              throw new Error( `${srcPath} in scenerystack does not have explicit mapping` );
            }
          }

          const entry = {
            isType: isType,
            requiresSim: exportFile === 'sim',
            originalName: originalName,
            exportedName: exportedName,
            path: destPath
          };

          exportEntries[ exportFile ].push( entry );
        };

        const exportNames = getExportNames( modifiedContent );

        for ( const name of exportNames.exports ) {
          addExportFor( name, false );
        }
        for ( const name of exportNames.typeExports ) {
          addExportFor( name, true );
        }
      }
    }
  };

  repos.forEach( repo => {
    copyAndModify( repo, `../${repo}`, `./src/${repo}` );
  } );
  // Process some scenerystack files that do NOT get copied/modified
  copyAndModify( 'scenerystack', './src/scenerystack', './src/scenerystack', false );

  // Patch up unknown duplicated exports
  {
    // ReadOnlyProperty exports PropertyOptions, which is then re-exported by Property
    {
      const readOnlyPropertyOptionsExport = exportEntries.axon.find( e => e.exportedName === 'PropertyOptions' && e.path.includes( 'ReadOnlyProperty' ) );
      const duplicatePropertyExport = exportEntries.axon.find( e => e.exportedName === 'PropertyOptions' && !e.path.includes( 'ReadOnlyProperty' ) );

      if ( readOnlyPropertyOptionsExport && duplicatePropertyExport ) {
        exportEntries.axon.splice( exportEntries.axon.indexOf( duplicatePropertyExport ), 1 );
      }
    }

    const fixNamedAndDefaultExport = ( entries: ExportEntry[], name: string ): void => {
      const rangedPropertyExport = entries.find( e => e.exportedName === name && e.originalName === name );
      const rangedPropertyDefaultExport = entries.find( e => e.exportedName === name && e.originalName === 'default' );

      if ( rangedPropertyExport && rangedPropertyDefaultExport ) {
        entries.splice( entries.indexOf( rangedPropertyExport ), 1 );
      }
    };

    // TRangedProperty exports as a name AND default. Leave the default export
    fixNamedAndDefaultExport( exportEntries.axon, 'TRangedProperty' );
    fixNamedAndDefaultExport( exportEntries.joist, 'concreteRegionAndCultureProperty' );
  }

  const flattenedExportEntries = _.flatten( Object.values( exportEntries ) );

  // Sanity checks for export name conflicts
  {
    const globalNameSet = new Set<string>();
    for ( const exportFile of Object.keys( exportEntries ) ) {
      const entries = exportEntries[ exportFile ];

      for ( const entry of entries ) {
        if ( globalNameSet.has( entry.exportedName ) ) {
          const entries = flattenedExportEntries.filter( e => e.exportedName === entry.exportedName );

          throw new Error( `duplicate export for ${entry.exportedName}: ${JSON.stringify( entries, null, 2 )}` );
        }
        globalNameSet.add( entry.exportedName );
      }
    }
  }

  // Propagate the "sim"-ness of exports (ones that lead to code that will fail if not run in a simulation)
  {
    const exportedPaths = _.uniq( flattenedExportEntries.map( entry => entry.path ) );

    // Initialize sim-required paths
    const simRequiredPaths: string[] = [];
    for ( const entry of flattenedExportEntries ) {
      if ( entry.requiresSim && !simRequiredPaths.includes( entry.path ) ) {
        simRequiredPaths.push( entry.path );
      }
    }

    // Iteratively expand the paths that are required
    let hadSimChange = true;
    while ( hadSimChange ) {
      hadSimChange = false;

      for ( const exportedPath of exportedPaths ) {
        if ( simRequiredPaths.includes( exportedPath ) ) {
          continue;
        }

        const contents = fs.readFileSync( `./${exportedPath}`, 'utf8' );

        for ( const simRequiredPath of simRequiredPaths ) {
          const pathString = path.relative( path.dirname( exportedPath ), simRequiredPath ).replaceAll( path.sep, '/' ).replace( /\.ts$/, '.js' ) + '\';';

          if ( contents.includes( pathString ) ) {
            simRequiredPaths.push( exportedPath );
            hadSimChange = true;
            break;
          }
        }
      }
    }

    for ( const entry of flattenedExportEntries ) {
      if ( simRequiredPaths.includes( entry.path ) ) {
        entry.requiresSim = true;

        if ( !exportEntries.sim.includes( entry ) ) {
          exportEntries.sim.push( entry );
        }

        // More complicated removal
        for ( const exportNamespace of Object.keys( exportEntries ) ) {
          if ( exportNamespace !== 'sim' && exportEntries[ exportNamespace ].includes( entry ) ) {
            exportEntries[ exportNamespace ].splice( exportEntries[ exportNamespace ].indexOf( entry ), 1 );
          }
        }
      }
    }
  }

  // Create barrel files
  {
    for ( const exportNamespace of Object.keys( exportEntries ) ) {
      const entries = exportEntries[ exportNamespace ];

      const exportLines: string[] = [];

      const modulePaths = _.uniq( entries.map( entry => entry.path ) ).sort();

      for ( const modulePath of modulePaths ) {
        const matchingEntries = entries.filter( entry => entry.path === modulePath );

        const addLine = ( entries: ExportEntry[], isType: boolean ): void => {
          // Remove namespaces that are not exported
          entries = entries.filter( entry => {
            return exportedNamespaces.includes( entry.exportedName ) || !entry.exportedName.match( new RegExp( `^${_.camelCase( exportNamespace )}(Namespace)?$` ) );
          } );

          if ( entries.length ) {
            const exportLine = `export ${isType ? 'type ' : ''}{ ${entries.map( entry => {
              return entry.exportedName === entry.originalName ? entry.exportedName : `${entry.originalName} as ${entry.exportedName}`;
            } ).join( ', ' )} } from '${modulePath.replace( /^src/, '.' ).replace( /\.ts$/, '.js' ).replaceAll( path.sep, '/' )}';`;

            exportLines.push( exportLine );
          }
        };
        addLine( matchingEntries.filter( entry => !entry.isType ), false );
        addLine( matchingEntries.filter( entry => entry.isType ), true );
      }

      // TODO: write?
      // TODO: scenery missing? --- NOT missing, we just need to figure out which things ARE types, and which are NOT. OOOF

      const barrelFileContents = `// Copyright ${new Date().getFullYear() + ''}, University of Colorado Boulder

/* eslint-disable */
/* @formatter:off */

/**
 * "Barrel" file for ${exportNamespace}, so that we can export all of the API of the repo.
 *
 * Auto-generated from scenerystack build
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

${exportLines.join( os.EOL )}`;

      if ( exportNamespace !== 'splash' ) {
        fs.writeFileSync( `./src/${exportNamespace}.ts`, barrelFileContents, 'utf8' );
      }
    }
  }

  // Sanity checks for namespace removals
  {
    for ( const fileContent of writtenFileContents ) {
      const sourceAST = ts.createSourceFile(
        'fake.ts',
        fileContent.contents,
        ts.ScriptTarget.ESNext,
        true
      );

      const recur = ( node: ts.Node ): void => {
        if (
          ts.isPropertyAccessExpression( node ) &&
          ts.isIdentifier( node.name )
        ) {
          const name = node.name.getText();
          const fullText = node.getText();

          for ( const pattern of removedNamespacePatterns ) {
            const parts = pattern.split( '.' );

            if ( name === parts[ 1 ] && fullText.includes( pattern ) ) {
              throw new Error( `Namespace pattern used: ${pattern} in ${fileContent.path}` );
            }
          }
        }

        for ( const child of node.getChildren() ) {
          recur( child );
        }
      };
      recur( sourceAST.getChildren()[ 0 ] );
    }
  }

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

    const repo = stringModulePath.split( path.sep )[ 1 ];
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
    '}( this, () => {',
    '}( self, () => {'
  );
  // TODO: move patches up above
  patch(
    './src/scenery/js/util/rich-text/richTextContentToString.ts',
    '// @ts-expect-error - we should get a string from this',
    ''
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
  // NOTE: do this last, since it will leave the assertions/namespaces untouched
  // so source maps will look nicer
  await copyAndPatch( {
    removeAssertions: false,
    removeNamespacing: false
  } );

  // tsc files into ./dist/dev/
  await tscRun( false );

  // Use rollup for bundles written to ./dist/
  await rollupRun();
} )().catch( e => {
  console.error( e );
  process.exit( 1 );
} );