// Copyright 2025, University of Colorado Boulder

/**
 * If in the form of `typeof VALUES[number]`, return `VALUES`
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ts from 'typescript';

export const getPossibleStringEnumName = ( type: ts.TypeNode ): string | null => {
  if ( ts.isIndexedAccessTypeNode( type ) && ts.isTypeQueryNode( type.objectType ) && type.indexType.kind === ts.SyntaxKind.NumberKeyword ) {
    return type.objectType.exprName.getText();
  }
  else {
    return null;
  }
};