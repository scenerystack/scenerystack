// Copyright 2025, University of Colorado Boulder

/**
 * Returns information about non-type and type export names (from a string source JS/TS file)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ts from 'typescript';
import { hasDefaultExportModifier, hasExportModifier } from './modifiers.js';

export const getExportNames = ( js: string ): { exports: string[]; typeExports: string[] } => {
  const sourceFile = ts.createSourceFile(
    'module.ts',
    js,
    ts.ScriptTarget.Latest,
    true
  );

  const exports: string[] = [];
  const typeExports: string[] = [];

  const visit = ( node: ts.Node ) => {
    if (
      ( ts.isVariableStatement( node ) || ts.isFunctionDeclaration( node ) ||
        ts.isClassDeclaration( node ) || ts.isEnumDeclaration( node ) ||
        ts.isTypeAliasDeclaration( node ) || ts.isInterfaceDeclaration( node ) ) && hasExportModifier( node )
    ) {
      const array = ts.isTypeAliasDeclaration( node ) || ts.isInterfaceDeclaration( node ) ? typeExports : exports;

      if ( hasDefaultExportModifier( node ) ) {
        array.push( 'default' );
      }
      else if ( ts.isVariableStatement( node ) ) {
        node.declarationList.declarations.forEach( declaration => {
          if ( ts.isIdentifier( declaration.name ) ) {
            array.push( declaration.name.text );
          }
        } );
      }
      else if ( node.name ) {
        array.push( node.name.text );
      }
    }

    const getGeneralNameArray = ( originalName: string ): string[] => {
      return ( sourceFile.getChildren()[ 0 ].getChildren().some( child => {
        return ts.isTypeAliasDeclaration( child ) && child.name.text === originalName;
      } ) ) ? typeExports : exports;
    };

    if ( ts.isExportAssignment( node ) ) {
      let array = exports;

      if ( ts.isIdentifier( node.expression ) ) {
        array = getGeneralNameArray( node.expression.text );
      }

      array.push( 'default' );
    }

    if ( ts.isExportDeclaration( node ) ) {
      const exportClause = node.exportClause;
      if ( exportClause && ts.isNamedExports( exportClause ) ) {
        exportClause.elements.forEach( specifier => {
          const exportedName = specifier.name.text;
          const originalName = specifier.propertyName?.text || exportedName;

          if ( js.includes( 'PhetioProperty' ) ) { console.log( exportedName, originalName, node.isTypeOnly, getGeneralNameArray( originalName ) ); }

          const array = node.isTypeOnly ? typeExports : getGeneralNameArray( originalName );

          // alias?
          if ( exportedName === 'default' ) {
            array.push( 'default' );
          }
          else {
            array.push( exportedName );
          }
        } );
      }
    }

    ts.forEachChild( node, visit );
  };

  ts.forEachChild( sourceFile, visit );

  return {
    exports: exports,
    typeExports: typeExports
  };
};