// Copyright 2025, University of Colorado Boulder

/**
 * Either take the last block comment, or all of the last line comments.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { getLeadingComments } from './getLeadingComments.js';
import { cleanupComment } from '../doc/cleanupComment.js';
import ts from 'typescript';
import os from 'os';

// Because it doesn't like scenerystack URLs
/* eslint-disable phet/todo-should-have-issue */

// TODO: should we look for double newlines between line comments?

// TODO: or get trailing comment too (e.g. single-line things that get doc'ed)
export const getSpecificLeadingComment = ( sourceCode: string, node: ts.Node ): string | null => {
  const comments = getLeadingComments( sourceCode, node );

  if ( comments.length === 0 ) {
    return null;
  }

  const isLastBlock = comments[ comments.length - 1 ].startsWith( '/*' );

  if ( isLastBlock ) {
    return cleanupComment( comments[ comments.length - 1 ] );
  }
  else {
    const lastNonLineComment = comments.findLastIndex( comment => !comment.startsWith( '//' ) );
    return comments.slice( lastNonLineComment + 1 ).map( cleanupComment ).join( os.EOL );
  }
};