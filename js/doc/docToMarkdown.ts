// Copyright 2024, University of Colorado Boulder

// Because it doesn't like scenerystack URLs
/* eslint-disable phet/todo-should-have-issue */

/**
 * Converts documentation to markdown.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import path from 'path';
import { ClassMethodDocumentation, ClassPropertyDocumentation, Documentation, TypeDocumentation, TypeIntersectionDocumentation, TypeLiteralDocumentation } from './extractDoc.js';
import type { ExportMap } from './generateSceneryStackDocumentation.js';

const DEBUG = false;
const TYPE_MAP = {
  class: 'Class',
  type: 'Type'
};

export const docToMarkdown = (
  doc: Documentation,
  exportMap: ExportMap,
  entryPoint: string,
  primaryName: string,
  wrapNameString: ( name: string, string?: string ) => string,
  getURLForName: ( name: string ) => string | null
): string => {

  const pathBits = doc.sourcePath.split( '/' );
  const repo = pathBits[ 0 ] === 'perennial-alias' ? 'perennial' : pathBits[ 0 ];
  const pathBase = path.basename( doc.sourcePath );
  const githubRepoURL = `https://github.com/phetsims/${repo}`;
  const githubPathURL = `${githubRepoURL}/blob/main/${pathBits.slice( 1 ).join( '/' )}`;

  let sandboxId = 0;

  const escapeChars = ( str: string ): string => {
    // see https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet
    // HTML Entity Encoding
    return str
      .replace( /&/g, '&amp;' )
      .replace( /</g, '&lt;' )
      .replace( />/g, '&gt;' );
  };

  const convertComment = ( comment: string ): string => {
    let result = '';

    let index = 0;
    let beginIndex: number;

    // e.g. turn `Node` into [Node](URL)
    const escapeWithLinks = ( section: string ) => {
      const backtickMatches = [ ...section.matchAll( /`[^`\n]+`/g ) ].reverse();

      for ( const match of backtickMatches ) {
        const backtick = match[ 0 ];
        const name = backtick.slice( 1, -1 );

        const url = getURLForName( name );
        if ( url ) {
          section = `${section.slice( 0, match.index )}[${name}](${url})${section.slice( match.index + backtick.length )}`;
        }
      }

      return escapeChars( section );
    };

    while ( ( beginIndex = comment.indexOf( '#begin ', index ) ) >= 0 ) {
      if ( beginIndex > index ) {
        result += escapeWithLinks( comment.slice( index, beginIndex ) );
        index = beginIndex;
      }

      // Get the rest of the line after the '#begin ':
      const parameters = comment.slice( index + '#begin '.length, comment.indexOf( '\n', index ) ).trim().split( ' ' );
      const type = parameters[ 0 ];
      const endString = `#end ${type}`;
      index = comment.indexOf( '\n', index ) + 1;
      const endIndex = comment.indexOf( endString, index );
      const body = comment.slice( index, endIndex );

      if ( type === 'sandbox' ) {
        const options: Record<string, boolean> = {};
        let returnName = 'content';

        parameters.forEach( parameter => {
          if ( parameter.startsWith( 'showDisplay=' ) ) {
            options.showDisplay = parameter === 'showDisplay=true';
          }
          if ( parameter.startsWith( 'showCode=' ) ) {
            options.showCode = parameter === 'showCode=true';
          }
          if ( parameter.startsWith( 'showErrors=' ) ) {
            options.showErrors = parameter === 'showErrors=true';
          }
          if ( parameter.startsWith( 'showPDOM=' ) ) {
            options.showPDOM = parameter === 'showPDOM=true';
          }
          if ( parameter.startsWith( 'showAriaLive=' ) ) {
            options.showAriaLive = parameter === 'showAriaLive=true';
          }
          if ( parameter.startsWith( 'returnName=' ) ) {
            returnName = parameter.slice( 'returnName='.length );
          }
        } );

        let paddedBody = body.replace( '#on', '/*START*/' ).replace( '#off', '/*END*/' );
        if ( !paddedBody.includes( '/*START*/' ) ) {
          paddedBody = `/*START*/\n${paddedBody}`;
        }
        if ( !paddedBody.includes( '/*END*/' ) ) {
          paddedBody = `${paddedBody}\n/*END*/`;
        }

        const id = `sandbox-${sandboxId++}`;
        result += `<div id="${id}" class="sandbox-example"></div>`;
        result += '<script type="module" async>';
        result += `
import { createSandbox } from "/js/createSandbox.js";

createSandbox( "${id}", ( scene, stepEmitter, display ) => {
  const box = ( () => {
${paddedBody}
    return ${returnName};
  } )();
  scene.addChild( box );
}, { ${Object.keys( options ).map( key => `${key}: ${options[ key ]}` ).join( ', ' )} } );
`;
        result += '</script>';
      }
      else if ( type === 'raw' ) {
        result += body;
      }
      else {
        result += escapeWithLinks( body );
      }

      index = endIndex + endString.length;
    }
    result += escapeWithLinks( comment.slice( index ) );

    return result;
  };

  const exports = Object.keys( exportMap );
  const getExportForExternalExport = ( exportName: string ): string => {
    return exportMap[ exportName ].importName;
  };
  const getExportInfo = ( exportName: string ) => {
    return doc.exports.find( info => info.name === getExportForExternalExport( exportName ) ) ?? null;
  };

  const indentMultiline = ( string: string, indent: string ): string => {
    return string.split( '\n' ).map( line => `${indent}${line}` ).join( '\n' );
  };

  const wrapNamesIn = ( string: string ): string => {
    const matches = Array.from( string.matchAll( /\w+/g ) );

    let result = '';
    let lastIndex = 0;

    for ( const match of matches ) {
      const matchIndex = match.index;
      const word = match[ 0 ];

      result += escapeChars( string.slice( lastIndex, matchIndex ) );
      result += wrapNameString( word );

      lastIndex = matchIndex + word.length;
    }

    // After last match
    result += escapeChars( string.slice( lastIndex ) );

    return result;
  };

  const typeStyle = ( typeString: string ): string => {
    if ( !typeString ) {
      return '';
    }
    return `<span style="font-weight: 400;">${wrapNamesIn( typeString )}</span>`;
  };

  const typeSuffix = ( typeString: string ): string => {
    if ( typeString === 'any' || typeString === 'void' || !typeString ) {
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

!!! warning "Under Construction"
    This documentation is auto-generated, and is a work in progress. Please see the source code at
    [${githubPathURL}](${githubPathURL}) for the most up-to-date information.

## Overview

${convertComment( doc.topLevelComments.join( '\n' ) )}

${exports.filter( exportName => getExportInfo( exportName ) ).map( exportName => {
  
  const exportInfo = getExportInfo( exportName )!;
  const obj = exportInfo.object;
  
  const getID = ( name: string ) => {
    const id = `${exportName === primaryName ? '' : `${exportName}-`}${name}`;
    return ` {: #${id} data-toc-label='${id}' }`;
  };
  
  const getConstructorID = ( name: string ) => {
    const id = `${exportName === primaryName ? '' : `${exportName}-`}${name}`;
    return ` {: #${id}-constructor data-toc-label='new ${id}' }`;
  };
  
  const methodDoc = ( method: ClassMethodDocumentation ): string => {
    const headerText = `${method.name}(${methodParameters( method )})${typeSuffix( method.returnTypeString )}${getID( method.name )}`;
    return `#### ${headerText}${method.isProtected ? '\n\n(protected)' : ''}${method.comment ? `\n\n${convertComment( method.comment )}` : ''}`;
  };
  
  const propertyDoc = ( property: ClassPropertyDocumentation ): string => {
    const headerText = `${property.name}${typeSuffix( property.typeString )}${getID( property.name )}`;
    const attribs = [ property.isProtected ? 'protected' : '', property.isReadonly ? 'readonly' : '' ].filter( attrib => attrib.length ).join( ', ' );
    return `#### ${headerText}${attribs.length ? `\n\n(${attribs})` : ''}${property.comment ? `\n\n${convertComment( property.comment )}` : ''}`;
  };

  let body = '';
  
  if ( obj.comment ) {
    body += `${convertComment( obj.comment )}\n\n`;
  }
  
  // Import statement
  if ( obj.type === 'class' || obj.type === 'type' ) {
    body += `\`\`\`js
import ${obj.type === 'type' ? 'type ' : ''}{ ${exportName} } from 'scenerystack/${entryPoint}';
\`\`\`
`;
  }
  
  if ( obj.type === 'class' ) {

    const constructor = obj.methods.find( method => method.name === 'constructor' ) ?? null;
    if ( constructor ) {
      body += '### Constructor\n\n';
      body += `#### new ${exportName}(${methodParameters( constructor )})${getConstructorID( exportName )}\n\n`;
    }
    
    if ( obj.methods.length ) {
      body += '### Instance Methods\n\n';
      body += obj.methods.filter( method => method.name !== 'constructor' ).map( methodDoc ).join( '\n\n' ) + '\n\n';
    }
    
    if ( obj.properties.length ) {
      body += '### Instance Properties\n\n';
      body += obj.properties.map( propertyDoc ).join( '\n\n' ) + '\n\n';
    }
    
    if ( obj.staticMethods.length ) {
      body += '### Static Methods\n\n';
      body += obj.staticMethods.map( methodDoc ).join( '\n\n' ) + '\n\n';
    }
    
    if ( obj.staticProperties.length ) {
      body += '### Static Properties\n\n';
      body += obj.staticProperties.map( propertyDoc ).join( '\n\n' ) + '\n\n';
    }
  }
  
  if ( obj.type === 'type' ) {
    const isLiteralLike = ( typeDoc: TypeDocumentation ): boolean => {
      return typeDoc.type === 'typeLiteral' ||
        ( typeDoc.type === 'typeIntersection' && typeDoc.types.length > 0 && typeDoc.types[ 0 ].type === 'typeLiteral' );
    };
    
    const toSingleString = ( typeDoc: TypeDocumentation ): string => {
      if ( typeDoc.type === 'typeLiteral' ) {
        return `{ ${typeDoc.members.map( property => `${property.name}${property.question ? '?' : ''}${property.typeDoc ? `: ${toSingleString( property.typeDoc )}` : ''}` ).join( '; ' )} }`;
      }
      else if ( typeDoc.type === 'typeIntersection' ) {
        return typeDoc.types.map( toSingleString ).join( ' & ' );
      }
      else if ( typeDoc.type === 'typeUnion' ) {
        return typeDoc.types.map( toSingleString ).join( ' | ' );
      }
      else if ( typeDoc.type === 'typeReference' ) {
        return `${typeDoc.name}${typeDoc.arguments.length ? `<${typeDoc.arguments.map( toSingleString ).join( ', ' )}>` : ''}`;
      }
      else if ( typeDoc.type === 'typeStringLiteral' ) {
        return JSON.stringify( typeDoc.text );
      }
      else if ( typeDoc.type === 'typeRaw' ) {
        return typeDoc.typeString;
      }
      else {
        throw new Error( `missing type to toSingleString: ${JSON.stringify( typeDoc )}` );
      }
    };
    
    const toNestedString = ( typeDoc: TypeDocumentation, indent = '' ): string => {
      const literal = ( typeDoc.type === 'typeLiteral' ? typeDoc : ( typeDoc as TypeIntersectionDocumentation ).types[ 0 ] ) as TypeLiteralDocumentation;
      const signatures = literal.members;
      const nonLiterals = typeDoc.type === 'typeIntersection' ? [ ...typeDoc.types.slice( 1 ) ] : [];
      
      // TODO: add comments docs to these?
      
      let result = '';
      
      for ( const signature of signatures ) {
        result += `${indent}- **${signature.name}**${signature.question ? '?' : ''}`;
        
        // Finish the main line
        if ( signature.typeDoc ) {
          if ( isLiteralLike( signature.typeDoc ) ) {
            result += ':\n';
          }
          else {
            result += `: ${wrapNamesIn( toSingleString( signature.typeDoc ) )}\n`;
          }
        }
        else {
          result += '\n';
        }
        
        if ( signature.comment ) {
          // Break for separation from rest of signature
          result += `<br>${indentMultiline( convertComment( signature.comment ), `${indent}  ` )}\n`;
        }
        
        // Sub-options
        if ( signature.typeDoc && isLiteralLike( signature.typeDoc ) ) {
          result += toNestedString( signature.typeDoc, `${indent}  ` );
        }
      }
      
      if ( nonLiterals.length ) {
        result += `- &amp; ${nonLiterals.map( nonLiteral => wrapNamesIn( toSingleString( nonLiteral ) ) ).join( ' &amp; ' )}\n`;
      }
      
      return result;
    };
    
    // Nested 
    if ( isLiteralLike( obj.typeDoc ) ) {
      body += '\n\n';
      body += toNestedString( obj.typeDoc );
      body += '\n\n';
    }
    else {
      body += '\n\n';
      body += `${wrapNamesIn( toSingleString( obj.typeDoc ) )}\n\n`;
    }
    
    // TODO: add comments
    
    // TODO: we will want to recursively output nested structures for literals (i.e. nested options)
  }
  
  return `## ${TYPE_MAP[ obj.type ]} ${exportName} {: #${exportName} }\n\n${body.length ? `\n${body}` : ''}`;
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