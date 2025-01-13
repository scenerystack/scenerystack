// Copyright 2024, University of Colorado Boulder

/**
 * Converts documentation to markdown.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import path from 'path';
import { Documentation } from './extractDoc.js';
import type { ExportMap } from './generateSceneryStackDocumentation.js';

const DEBUG = true;

export const docToMarkdown = (
  doc: Documentation,
  exportMap: ExportMap,
  entryPoint: string,
  primaryName: string
): string => {

  const pathBits = doc.sourcePath.split( '/' );
  const repo = pathBits[ 0 ];
  const pathBase = path.basename( doc.sourcePath );
  const githubRepoURL = `https://github.com/phetsims/${repo}`;
  const githubPathURL = `${githubRepoURL}/blob/main/${pathBits.slice( 1 ).join( '/' )}`;

  const escapeChars = ( str: string ): string => {
    // see https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet
    // HTML Entity Encoding
    return str
      .replace( /&/g, '&amp;' )
      .replace( /</g, '&lt;' )
      .replace( />/g, '&gt;' );
  };

  return `# ${primaryName}

## Overview

${escapeChars( doc.topLevelComments.join( '\n' ) )}

## Usage

\`\`\`js
import { ${doc.sourceName} } from 'scenerystack/${doc.repo}';
\`\`\`

## Source Code

See the source for [${pathBase}](${githubPathURL}) in the [${repo}](githubRepoURL) repository.
${DEBUG ? `
## Debugging Info

### Documentation

\`\`\`json
${JSON.stringify( doc, null, 2 )}
\`\`\`

### Export Map

\`\`\`json
${JSON.stringify( exportMap, null, 2 )}
\`\`\`
` : ''}`;
};