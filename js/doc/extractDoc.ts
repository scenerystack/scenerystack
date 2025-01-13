// Copyright 2024, University of Colorado Boulder

/**
 * Extracts documentation from a TS/JS file.
 *
 * TODO: how to handle getters/setters/getter-setters?
 *   GetAccessorDeclaration / SetAccessorDeclaration
 *   They have name/modifiers
 *   SetAccessor: Will have SyntaxList with single Parameter (like methods)
 *   GetAccessor: ColonToken then return value, like methods
 * TODO: figure out how to handle options types nicely
 * TODO: avoid things that say repo-internal (or such)
 * TODO: class inheritance
 * TODO: class template params
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ts from 'typescript';

export type Documentation = {
  repo: string;
  sourcePath: string;
  sourceName: string;
  topLevelComments: string[];
  classes: ClassDocumentation[];
  exports: ExportDocumentation[];
  debug: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type ClassDocumentation = {
  type: 'class';
  name: string;

  methods: ClassMethodDocumentation[];
  staticMethods: ClassMethodDocumentation[];
  properties: ClassPropertyDocumentation[];
  staticProperties: ClassPropertyDocumentation[];
};

export type ClassMethodDocumentation = {
  type: 'classMethod';
  name: string;
  isProtected: boolean;
  parameters: MethodParameterDocumentation[];
  returnTypeString: string;
};

export type ClassPropertyDocumentation = {
  type: 'classProperty';
  name: string;
  isReadonly: boolean;
  isProtected: boolean;
  typeString: string;
};

export type MethodParameterDocumentation = {
  name: string;
  dotDotDot: boolean;
  question: boolean;
  // TODO: initializer?
  typeString: string;
};

type ExportableType = ClassDocumentation;

export type ExportDocumentation = {
  name: string; // 'default' an option
  object: ExportableType;
};

type HasModifiers = ts.ParameterDeclaration | ts.PropertyDeclaration | ts.FunctionDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.IndexSignatureDeclaration | ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration | ts.ModuleDeclaration | ts.ImportEqualsDeclaration | ts.ImportDeclaration | ts.ExportDeclaration | ts.ExportAssignment;

export const extractDoc = ( sourceCode: string, sourcePath: string, sourceFile?: ts.SourceFile ): Documentation => {
  const sourceAST = sourceFile ? sourceFile : ts.createSourceFile(
    sourcePath,
    sourceCode,
    ts.ScriptTarget.ESNext,
    true
  );
  const sourcePathBits = sourcePath.split( '/' );
  const repo = sourcePathBits[ 0 ];
  const sourceName = sourcePathBits[ sourcePathBits.length - 1 ].replace( /\.ts$/, '' ).replace( /\.js$/, '' );

  let debug = '';

  const kindOf = ( node: ts.Node ) => ts.SyntaxKind[ node.kind ];

  const hasExportModifier = ( node: HasModifiers ): boolean => {
    return !!node.modifiers && node.modifiers.some( modifier => modifier.kind === ts.SyntaxKind.ExportKeyword );
  };

  const hasDefaultExportModifier = ( node: HasModifiers ): boolean => {
    return hasExportModifier( node ) && !!node.modifiers && node.modifiers.some( modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword );
  };

  const getLeadingComments = ( node: ts.Node ): string[] => {
    const comments = ts.getLeadingCommentRanges( sourceCode, node.pos );

    return comments ? comments.map( comment => sourceCode.slice( comment.pos, comment.end ) ) : [];
  };

  const destarBlockComment = ( string: string ) => {
    return string.split( '\n' ).filter( line => {
      const isCommentStart = line.match( /^ *\/\*+ *$/g );
      const isCommentEnd = line.match( /^ *\*+\/ *$/g );
      return !isCommentStart && !isCommentEnd;
    } ).map( line => {
      let destarred = line.replace( /^ *\* ?/, '' );

      // If the line is effectively empty (composed of only spaces), set it to the empty string.
      if ( destarred.replace( / /g, '' ).length === 0 ) {
        destarred = '';
      }
      return destarred;
    } ).join( '\n' );
  };

  const deSlashLineComment = ( string: string ) => {
    return string.replace( /^\/\/ ?/, '' );
  };

  const cleanupComment = ( string: string ) => {
    if ( string.startsWith( '/*' ) ) {
      return destarBlockComment( string );
    }
    else if ( string.startsWith( '//' ) ) {
      return deSlashLineComment( string );
    }
    else {
      return string;
    }
  };

  const mainChildren = sourceAST.getChildren()[ 0 ].getChildren();

  const topLevelComments = mainChildren.filter( node => node.kind === ts.SyntaxKind.ImportDeclaration ).map( node => {
    return getLeadingComments( node ).map( cleanupComment );
  } ).flat().filter( comment => !( comment.includes( 'Copyright' ) && comment.includes( 'University of Colorado Boulder' ) ) );

  const classes: ClassDocumentation[] = [];
  const exports: ExportDocumentation[] = [];

  for ( const child of mainChildren ) {

    if ( ts.isClassDeclaration( child ) ) {
      const className = child.name?.getText();

      if ( className ) {
        debug += `class: ${className}\n`;

        // heritage
        // console.log( child.heritageClauses );

        // type parameters
        // console.log( child.typeParameters );

        const methods: ClassMethodDocumentation[] = [];
        const staticMethods: ClassMethodDocumentation[] = [];
        const properties: ClassPropertyDocumentation[] = [];
        const staticProperties: ClassPropertyDocumentation[] = [];

        for ( const member of child.members ) {
          if ( ts.isPropertyDeclaration( member ) ) {

            const name = member.name.getText();

            if ( name.startsWith( '_' ) ) {
              continue;
            }

            if ( member.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword ) ) {
              continue;
            }

            const isReadonly = member.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword ) ?? false;
            const isStatic = member.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.StaticKeyword ) ?? false;
            const isProtected = member.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword ) ?? false;
            const type = member.type;
            const initializer = member.initializer;

            let typeString = type?.getText() ?? null;

            // TODO: handle Identifier<boo> also
            if ( typeString === null && initializer && ts.isNewExpression( initializer ) && ts.isIdentifier( initializer.expression ) ) {
              typeString = initializer.expression.getText();
            }

            if ( typeString === null ) {
              typeString = 'any';
            }

            ( isStatic ? staticProperties : properties ).push( {
              type: 'classProperty',
              name: name,
              isReadonly: isReadonly,
              isProtected: isProtected,
              typeString: typeString
            } );
          }
          if ( ts.isMethodDeclaration( member ) || ts.isConstructorDeclaration( member ) ) {

            const name = ts.isMethodDeclaration( member ) ? member.name.getText() : 'constructor';

            if ( name.startsWith( '_' ) ) {
              continue;
            }

            if ( member.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword ) ) {
              continue;
            }

            const isStatic = member.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.StaticKeyword ) ?? false;
            const isProtected = member.modifiers?.some( modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword ) ?? false;

            // TODO: see how comment extraction works. First thing might be JSDocComment type

            const children = member.getChildren();

            const openParenIndex = children.findIndex( child => child.kind === ts.SyntaxKind.OpenParenToken );
            const colonIndex = children.findIndex( child => child.kind === ts.SyntaxKind.ColonToken );

            if ( openParenIndex === -1 ) {
              throw new Error( 'Expected OpenParenToken' );
            }

            const parameterSyntaxList = children[ openParenIndex + 1 ];
            if ( parameterSyntaxList.kind !== ts.SyntaxKind.SyntaxList ) {
              throw new Error( 'Expected SyntaxList' );
            }

            const parameterNodes = parameterSyntaxList.getChildren().filter( child => ts.isParameter( child ) );

            const parameters = parameterNodes.map( parameterNode => {
              return {
                name: parameterNode.name.getText(),
                dotDotDot: !!parameterNode.dotDotDotToken,
                question: !!parameterNode.questionToken,
                typeString: parameterNode.type?.getText() ?? 'any'
              };
            } );

            let returnTypeString = 'any';
            if ( colonIndex !== -1 ) {
              returnTypeString = children[ colonIndex + 1 ].getText();
            }

            /*
              eg
                :MethodDeclaration PublicKeyword
                  JSDocComment
                  SyntaxList
                    PublicKeyword
                  Identifier
                  OpenParenToken
                  SyntaxList
                    Parameter
                    CommaToken
                    Parameter
                    CommaToken
                    Parameter
                    CommaToken
                    Parameter
                  CloseParenToken
                  ColonToken
                  ThisType
                  Block
             */

            ( isStatic ? staticMethods : methods ).push( {
              type: 'classMethod',
              name: name,
              isProtected: isProtected,
              parameters: parameters,
              returnTypeString: returnTypeString
            } );

          }
        }

        const clazz = {
          type: 'class',
          name: className,
          methods: methods,
          staticMethods: staticMethods,
          properties: properties,
          staticProperties: staticProperties
        } as const;

        classes.push( clazz );

        if ( hasExportModifier( child ) ) {
          // TODO: ' as ... '
          const isDefault = hasDefaultExportModifier( child );
          const name = isDefault ? 'default' : className;
          exports.push( {
            name: name,
            object: clazz
          } );
        }
      }
    }
    else if ( ts.isExportAssignment( child ) ) {
      const isDefault = child.getChildren().some( subChild => kindOf( subChild ) === 'DefaultKeyword' );
      const name = isDefault ? 'default' : child.name?.getText() ?? null;
      // NOTE: only a simple case for now
      const identifierName = child.getChildren().find( subChild => ts.isIdentifier( subChild ) )?.getText() ?? null;

      if ( name && identifierName ) {
        let exportableObject: ExportableType | null = null;

        for ( const clazz of classes ) {
          if ( clazz.name === identifierName ) {
            exportableObject = clazz;
            break;
          }
        }

        if ( exportableObject ) {
          exports.push( {
            name: name,
            object: exportableObject
          } );
        }
      }
    }
    else if ( ts.isTypeAliasDeclaration( child ) ) {

    }
    else if ( ts.isExpressionStatement( child ) ) {

    }
    else if ( ts.isFunctionDeclaration( child ) ) {

    }

    // @ts-expect-error
    debug += `${kindOf( child )} ${child.modifiers ? child.modifiers.map( kindOf ) : ''}\n`;

    if ( ts.isClassDeclaration( child ) ) {
      for ( const subChild of child.getChildren() ) {
        debug += `  ${kindOf( subChild )}\n`;
      }
      for ( const member of child.members ) {
        // @ts-expect-error
        debug += `  :${kindOf( member )} ${member.modifiers ? member.modifiers.map( kindOf ) : ''}\n`;

        if ( [ ts.SyntaxKind.PropertyDeclaration, ts.SyntaxKind.MethodDeclaration, ts.SyntaxKind.GetAccessor, ts.SyntaxKind.SetAccessor ].includes( member.kind ) ) {
          for ( const subChild of member.getChildren() ) {
            debug += `    ${kindOf( subChild )}\n`;

            if ( subChild.kind === ts.SyntaxKind.SyntaxList ) {
              for ( const subSubChild of subChild.getChildren() ) {
                // @ts-expect-error
                debug += `      ${kindOf( subSubChild )} ${member.modifiers ? member.modifiers.map( kindOf ) : ''}\n`;

                if ( ts.isParameter( subSubChild ) ) {
                  for ( const subSubSubChild of subSubChild.getChildren() ) {
                    debug += `        ${kindOf( subSubSubChild )}\n`;
                  }
                }
              }
            }
          }
        }
      }
    }

    if ( [
      ts.SyntaxKind.TypeAliasDeclaration,
      ts.SyntaxKind.ExpressionStatement,
      ts.SyntaxKind.FunctionDeclaration,
      ts.SyntaxKind.ExportAssignment
    ].includes( child.kind ) ) {
      for ( const subChild of child.getChildren() ) {
        debug += `  ${kindOf( subChild )}\n`;
      }
    }
  }

  return {
    repo: repo,
    sourcePath: sourcePath,
    sourceName: sourceName,
    topLevelComments: topLevelComments,
    classes: classes,
    exports: exports,
    debug: debug
  };
};