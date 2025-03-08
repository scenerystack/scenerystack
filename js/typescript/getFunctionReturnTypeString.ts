// Copyright 2025, University of Colorado Boulder

/**
 * Returns the return type of a function as a string
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ts from 'typescript';

export const getFunctionReturnTypeString = ( type: ts.Node ): string => {
  const children = type.getChildren();
  const colonIndex = children.findIndex( child => child.kind === ts.SyntaxKind.ColonToken );

  let returnTypeString = 'any';
  if ( colonIndex !== -1 ) {
    returnTypeString = children[ colonIndex + 1 ].getText();
  }

  return returnTypeString;
};