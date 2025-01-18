// Copyright 2025, University of Colorado Boulder

// Because it doesn't like scenerystack URLs
/* eslint-disable phet/todo-should-have-issue */

/**
 * Write documentation into the community docs system (assuming it is
 * checked out as a sibling to this repo).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';
import ts from 'typescript';
import { Documentation, extractDoc } from './extractDoc.js';
import { docToMarkdown } from './docToMarkdown.js';
import execute from '../../../perennial-alias/js/common/execute.js';

// NOTE: This is the order of entry points in documentation
const entryPoints = [
  'scenery',
  'axon',
  'sun',
  'phet-core',
  'dot',
  'kite',
  'sim',
  'scenery-phet',

  // now alphabetical?

  'adapted-from-phet',
  'alpenglow',
  'assert',
  'bamboo',
  'brand',
  'chipper',
  'init',
  'joist',
  'mobius',
  'nitroglycerin',
  'perennial',
  'phetcommon',
  'query-string-machine',
  'splash',
  'tambo',
  'tandem',
  'tappi',
  'twixt',
  'utterance-queue',
  'vegas'
] as const;

const EXTERNAL_DOC_URLS: Record<string, string> = {
  // TODO: expand this list
  HTMLCanvasElement: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement'
};

const KEYWORD_LIST = [
  'null', 'undefined', 'this', 'number', 'string', 'boolean', 'unknown', 'any', 'bigint', 'symbol', 'never', 'void'
];

export type ExportEntry = {
  module: string;
  importName: string;
};
export type ExportMap = Record<string, ExportEntry>;
export type EntryPoint = string;
export type Module = string;

export const generateSceneryStackDocumentation = async (): Promise<void> => {

  const resolveModule = ( module: Module ): string => {
    // We always specify the '.js' suffix, but we might be reading a '.ts' file
    const jsModule = module.replace( /\.ts$/, '.js' );
    const tsModule = module.replace( /\.js$/, '.ts' );

    const jsExists = fs.existsSync( `./src/${jsModule}` );
    const tsExists = fs.existsSync( `./src/${tsModule}` );

    if ( jsExists === tsExists ) {
      throw new Error( `JS/TS not found or both found for ${jsModule} and ${tsModule}` );
    }

    return jsExists ? jsModule : tsModule;
  };

  const loadModuleAsString = ( module: Module ): string => {
    return fs.readFileSync( `./src/${resolveModule( module )}`, 'utf-8' );
  };

  const getModulesFromExportMap = ( exportMap: ExportMap ): Module[] => {
    const modules: Module[] = [];

    for ( const key of Object.keys( exportMap ) ) {
      const entry = exportMap[ key ];

      if ( !modules.includes( entry.module ) ) {
        modules.push( entry.module );
      }
    }

    return modules;
  };

  const subsetExportMapWithModule = ( exportMap: ExportMap, module: Module ): ExportMap => {
    const subsetExportMap: ExportMap = {};

    for ( const key of Object.keys( exportMap ) ) {
      const entry = exportMap[ key ];

      if ( entry.module === module ) {
        subsetExportMap[ key ] = entry;
      }
    }

    return subsetExportMap;
  };

  const getImportExport = ( sourceFilePath: Module, tsSourceFile: ts.SourceFile ): {
    referencedFiles: string[];
    exportMap: ExportMap;
  } => {
    const referencedFiles: string[] = [];
    const exportMap: ExportMap = {};

    // Filter out top-level requires
    const isRawModuleIncluded = ( module: string ): boolean => {
      return module.startsWith( '.' );
    };

    const mapModule = ( module: string ): Module => {
      return path.normalize( `${path.dirname( sourceFilePath )}/${module}` ).replace( /^\.\//, '' );
    };

    const visit = ( node: ts.Node ) => {
      // Handle import statements
      if ( ts.isImportDeclaration( node ) && node.moduleSpecifier ) {
        const moduleName = node.moduleSpecifier.getText().replace( /['"]/g, '' );

        if ( isRawModuleIncluded( moduleName ) ) {
          const mappedModuleName = mapModule( moduleName );
          if ( !referencedFiles.includes( mappedModuleName ) ) {
            referencedFiles.push( mappedModuleName );
          }
        }
      }

      // Handle export statements with "from"
      if ( ts.isExportDeclaration( node ) && node.moduleSpecifier ) {
        const moduleName = node.moduleSpecifier.getText().replace( /['"]/g, '' );

        if ( isRawModuleIncluded( moduleName ) ) {
          const mappedModuleName = mapModule( moduleName );
          if ( !referencedFiles.includes( mappedModuleName ) ) {
            referencedFiles.push( mappedModuleName );
          }

          if ( node.exportClause ) {
            if ( ts.isNamedExports( node.exportClause ) ) {
              for ( const element of node.exportClause.elements ) {
                const exportedName = element.name.getText();
                const originalName = element.propertyName ? element.propertyName.getText() : exportedName;
                exportMap[ exportedName ] = { module: mappedModuleName, importName: originalName };
              }
            }
          }
          else {
            // exports everything!
            exportMap[ '*' ] = { module: mappedModuleName, importName: '*' };
          }
        }
      }

      // Recursively visit child nodes
      ts.forEachChild( node, visit );
    };

    visit( tsSourceFile );

    return {
      referencedFiles: referencedFiles,
      exportMap: exportMap
    };
  };

  const entryPointModules: Module[] = entryPoints.map( entryPoint => `${entryPoint}.ts` );

  const scannedModules: Module[] = [];
  const pendingModules = [ ...entryPointModules ]; // COPY!
  const exportMaps: Record<Module, ExportMap> = {};
  const docMap: Record<Module, Documentation> = {};

  while ( pendingModules.length ) {
    const currentModule = pendingModules.pop()!;

    scannedModules.push( currentModule );

    const sourceCode = loadModuleAsString( currentModule );

    const modulePath = resolveModule( currentModule );

    const sourceAST = ts.createSourceFile(
      modulePath,
      sourceCode,
      ts.ScriptTarget.ESNext,
      true
    );

    docMap[ currentModule ] = extractDoc( sourceCode, modulePath, sourceAST );

    const importExport = getImportExport( currentModule, sourceAST );

    for ( const file of importExport.referencedFiles ) {
      if ( !scannedModules.includes( file ) && !pendingModules.includes( file ) ) {
        pendingModules.push( file );
      }
    }

    exportMaps[ currentModule ] = importExport.exportMap;
  }

  scannedModules.sort();

  const getResolvedExportEntry = ( module: Module, exportName: string ): ExportEntry => {
    if ( exportMaps[ module ][ exportName ] ) {
      const entry = exportMaps[ module ][ exportName ];

      // follow re-exports
      return getResolvedExportEntry( entry.module, entry.importName );
    }
    else if ( exportMaps[ module ][ '*' ] ) {
      const entry = exportMaps[ module ][ '*' ];

      // follow * to the next module
      return getResolvedExportEntry( entry.module, exportName );
    }
    else {
      // Presumably the export originates from this module
      return {
        module: module,
        importName: exportName
      };
    }
  };

  const getResolvedExportMap = ( module: string ): ExportMap => {
    const exportMap: ExportMap = {};

    for ( const externalName of Object.keys( exportMaps[ module ] ) ) {
      const entry = exportMaps[ module ][ externalName ];

      if ( externalName === '*' ) {
        // TODO: OH NO, this will go badly if it is defined just in this tile
        const starMap = getResolvedExportMap( entry.module );

        for ( const key in starMap ) {
          if ( key !== 'default' ) {
            if ( exportMap[ key ] ) {
              throw new Error( `duplicate export name ${externalName} from *` );
            }

            exportMap[ key ] = starMap[ key ];
          }
        }
      }
      else {
        if ( exportMap[ externalName ] ) {
          throw new Error( `duplicate export name ${externalName}` );
        }
        exportMap[ externalName ] = getResolvedExportEntry( entry.module, entry.importName );
      }
    }

    return exportMap;
  };

  const resolvedExportMaps: Record<EntryPoint, ExportMap> = {};

  const globalExportMap: ExportMap = {};

  for ( const entryPoint of entryPoints ) {
    const exportMap = getResolvedExportMap( `${entryPoint}.ts` );
    resolvedExportMaps[ entryPoint ] = exportMap;

    for ( const key of Object.keys( exportMap ) ) {
      if ( key !== 'default' ) {
        if ( globalExportMap[ key ] ) {
          throw new Error( `duplicate export name ${key}` );
        }
        globalExportMap[ key ] = exportMap[ key ];
      }
    }
  }

  const getPageName = ( entryPoint: EntryPoint, module: Module ): string => {
    const exportMap = resolvedExportMaps[ entryPoint ];
    const moduleExportMap = subsetExportMapWithModule( exportMap, module );
    return Object.keys( moduleExportMap ).find( key => moduleExportMap[ key ].importName === 'default' ) ?? path.basename( module ).replace( /\.[tj]s$/, '' );
  };

  const getURLForName = ( name: string ): string | null => {
    const entryPoint = entryPoints.find( entryPoint => Object.hasOwn( resolvedExportMaps[ entryPoint ], name ) );
    if ( entryPoint ) {
      const sourceModule = resolvedExportMaps[ entryPoint ][ name ].module;
      const page = `../${entryPoint}/${getPageName( entryPoint, resolvedExportMaps[ entryPoint ][ name ].module )}.md`;

      // TODO: This detection isn't working. Carousel + CarouselOptions is example
      const isSameName = name === getPageName( entryPoint, sourceModule );

      return `${page}${isSameName ? '' : `#${name}`}`;
    }
    else if ( EXTERNAL_DOC_URLS[ name ] ) {
      return EXTERNAL_DOC_URLS[ name ];
    }
    else {
      return null;
    }
  };

  const wrapNameString = ( name: string, string: string = name ): string => {
    const url = getURLForName( name );

    // TODO: number/string/boolean/etc. highlighting? Use KEYWORD_LIST
    if ( url ) {
      return `[${string}](${url})`;
    }
    else if ( KEYWORD_LIST.includes( name ) ) {
      return `<span style="color: hsla(calc(var(--md-hue) + 180deg),80%,40%,1);">${string}</span>`;
      // TODO: can we get this working with accent colors that are more built-in?
      // return `<!--<span style="color: var(&#45;&#45;md-accent-fg-color);">${string}</span>-->`;
    }
    else {
      return string;
    }
  };

  let navYAML = '';

  for ( const entryPoint of entryPoints ) {

    navYAML += `      - ${entryPoint}:\n`;

    const exportMap = resolvedExportMaps[ entryPoint ];

    const modules = getModulesFromExportMap( exportMap );

    // Sort with "stripped" names
    modules.sort( ( a, b ) => {
      return a.replace( /^.*\//g, '' ).localeCompare( b.replace( /^.*\//g, '' ) );
    } );

    // Wipe directory and recreate
    await rimraf( `../community/docs/reference/api/${entryPoint}` );
    fs.mkdirSync( `../community/docs/reference/api/${entryPoint}`, { recursive: true } );

    for ( const module of modules ) {

      const pageName = getPageName( entryPoint, module );

      navYAML += `        - ${pageName}: reference/api/${entryPoint}/${pageName}.md\n`;

      const moduleExportMap = subsetExportMapWithModule( exportMap, module );

      console.log( `${entryPoint}/${pageName}.md` );
      // TODO: just log missing exports!

      const markdown = docToMarkdown( docMap[ module ], moduleExportMap, entryPoint, pageName, wrapNameString );

      fs.writeFileSync( `../community/docs/reference/api/${entryPoint}/${pageName}.md`, markdown );
    }

    const mkdocsYAML = fs.readFileSync( '../community/mkdocs.yml', 'utf-8' );

    /*
      We will put the strings between these places:

  - Reference:
    - API:
    ....
  - Community:
     */

    const beforeString = `### AUTO-GENERATE BELOW
`;
    const afterString = `### AUTO-GENERATE ABOVE
`;

    const apiIndex = mkdocsYAML.indexOf( beforeString );
    const communityIndex = mkdocsYAML.indexOf( afterString );

    if ( apiIndex === -1 || communityIndex === -1 ) {
      throw new Error( 'Could not find API or Community in mkdocs.yml' );
    }

    const newMkdocsYAML = mkdocsYAML.slice( 0, apiIndex + beforeString.length ) + navYAML + mkdocsYAML.slice( communityIndex );

    fs.writeFileSync( '../community/mkdocs.yml', newMkdocsYAML );

    // Add these changed files
    await execute( 'git', [ 'add', 'mkdocs.yml' ], '../community' );
    await execute( 'git', [ 'add', 'docs/reference/api' ], '../community' );
  }

  console.log( 'complete' );
};