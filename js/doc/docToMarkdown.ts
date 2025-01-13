// Copyright 2024, University of Colorado Boulder

/**
 * Converts documentation to markdown.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import path from 'path';
import { ClassMethodDocumentation, Documentation } from "./extractDoc.js";
import type { ExportMap } from './generateSceneryStackDocumentation.js';

const DEBUG = true;
const TYPE_MAP = {
  class: 'Class'
};

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

  const exports = Object.keys( exportMap );
  const getExportForExternalExport = ( exportName: string ): string => {
    return exportMap[ exportName ].importName;
  };
  const getExportInfo = ( exportName: string ) => {
    return doc.exports.find( info => info.name === getExportForExternalExport( exportName ) ) ?? null;
  };

  const typeStyle = ( typeString: string ): string => {
    return `<span style="font-weight: 400; opacity: 80%;">${escapeChars( typeString )}</span>`;
  };

  const typeSuffix = ( typeString: string ): string => {
    if ( typeString === 'any' ) {
      return '';
    }
    else {
      return ` : ${typeStyle( typeString )}`;
    }
  };

  const methodParameters = ( method: ClassMethodDocumentation ): string => {
    return method.parameters.length ? ` ${method.parameters.map( param => `${param.dotDotDot ? '...' : ''}${param.name}${param.question ? '?' : ''}${typeSuffix( param.typeString )}` ).join( ', ' )} ` : '';
  };

  exports.sort( ( a, b ) => {
    if ( exportMap[ a ].importName === 'default' ) {
      return -1;
    }
    if ( exportMap[ b ].importName === 'default' ) {
      return 1;
    }
    return a.localeCompare( b );
  } );

  // TODO: more functional (this blows it away if we ever reuse docs (we might)
  const debug = doc.debug;
  doc.debug = null;

  return `# ${primaryName}

## Overview

${escapeChars( doc.topLevelComments.join( '\n' ) )}

${exports.filter( exportName => getExportInfo( exportName ) ).map( exportName => {
  
  const exportInfo = getExportInfo( exportName )!;
  const obj = exportInfo.object;
  
  let body = '';
  
  // Import statement
  if ( obj.type === 'class' ) {
    body += `### Import
\`\`\`js
import { ${exportName} } from 'scenerystack/${entryPoint}';
\`\`\`
`;
  }
  
  if ( obj.type === 'class' ) {
    
    const constructor = obj.methods.find( method => method.name === 'constructor' ) ?? null;
    if ( constructor ) {
      body += '### Constructor\n\n';
      body += `#### new ${exportName}(${methodParameters( constructor )}) {: #constructor }\n\n`;
    }
    
    if ( obj.methods.length ) {
      body += '### Instance Methods\n\n';
      body += obj.methods.filter( method => method.name !== 'constructor' ).map( method => {
        return `#### ${method.name}(${methodParameters( method )})${typeSuffix( method.returnTypeString )} {: #${method.name} }`;
      } ).join( '\n\n' ) + '\n\n';
    }
    
    if ( obj.properties.length ) {
      body += '### Instance Properties\n\n';
      body += obj.properties.map( prop => {
        return `#### ${prop.name}${typeSuffix( prop.typeString )} {: #${prop.name} }`;
      } ).join( '\n\n' ) + '\n\n';
    }
    
    if ( obj.staticMethods.length ) {
      body += '### Static Methods\n\n';
      body += obj.staticMethods.map( method => {
        return `#### ${method.name}(${methodParameters( method )})${typeSuffix( method.returnTypeString )} {: #${method.name} }`;
      } ).join( '\n\n' ) + '\n\n';
    }
    
    if ( obj.staticProperties.length ) {
      body += '### Static Properties\n\n';
      body += obj.staticProperties.map( prop => {
        return `#### ${prop.name}${typeSuffix( prop.typeString )} {: #${prop.name} }`;
      } ).join( '\n\n' ) + '\n\n';
    }
  }
  
  return `## ${TYPE_MAP[ obj.type ]} ${exportName}${body.length ? `\n${body}` : ''}`;
} ).join( '\n\n' )}

## Source Code

See the source for [${pathBase}](${githubPathURL}) in the [${repo}](${githubRepoURL}) repository.
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

### Doc Debug

\`\`\`
${debug}
\`\`\`
` : ''}`;
};