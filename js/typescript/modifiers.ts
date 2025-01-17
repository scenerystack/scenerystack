// Copyright 2025, University of Colorado Boulder

/**
 * Whether a given TS node has certain modifiers
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ts, { HasModifiers } from 'typescript';

export const hasExportModifier = ( node: HasModifiers ): boolean => {
  return !!node.modifiers && node.modifiers.some( modifier => modifier.kind === ts.SyntaxKind.ExportKeyword );
};

export const hasDefaultExportModifier = ( node: HasModifiers ): boolean => {
  return hasExportModifier( node ) && !!node.modifiers && node.modifiers.some( modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword );
};

export const hasPrivateModifier = ( type: HasModifiers ): boolean => {
  return type.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword ) ?? false;
};

export const hasProtectedModifier = ( type: HasModifiers ): boolean => {
  return type.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword ) ?? false;
};

export const hasStaticModifier = ( type: HasModifiers ): boolean => {
  return type.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.StaticKeyword ) ?? false;
};

export const hasReadonlyModifier = ( type: HasModifiers ): boolean => {
  return type.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword ) ?? false;
};