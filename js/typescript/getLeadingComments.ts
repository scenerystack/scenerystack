// Copyright 2025, University of Colorado Boulder

/**
 * Returns the leading comments for a TypeScript node
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ts from 'typescript';

export const getLeadingComments = ( sourceCode: string, node: ts.Node ): string[] => {
  const comments = ts.getLeadingCommentRanges( sourceCode, node.pos );

  return comments ? comments.map( comment => sourceCode.slice( comment.pos, comment.end ) ) : [];
};