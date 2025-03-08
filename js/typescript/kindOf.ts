// Copyright 2025, University of Colorado Boulder

/**
 * Returns the kind of a TypeScript node as a string
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ts from 'typescript';

export const kindOf = ( node: ts.Node ): string => ts.SyntaxKind[ node.kind ];