// Copyright 2024, University of Colorado Boulder

/**
 * Converts documentation to markdown. TODO: add context for links
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { Documentation } from './extractDoc.js';

// TODO: will need to remap imports for scenerystack
export const docToMarkdown = ( doc: Documentation ): string => {
  return `# ${doc.sourceName}

## Overview

${doc.topLevelComments.join( '\n' )}

## Usage

\`\`\`js
import { ${doc.sourceName} } from 'scenerystack/${doc.repo}';
\`\`\`

`;
};