// Copyright 2024, University of Colorado Boulder

/**
 * Extracts documentation from a TS/JS file.
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
};

export type ClassDocumentation = {
  type: 'class';
  name: string;
  properties: ClassPropertyDocumentation[];
};

export type ClassPropertyDocumentation = {
  type: 'classProperty';
  name: string;
  isReadonly: boolean;
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
        console.log( 'class', className );

        // heritage
        // console.log( child.heritageClauses );

        // type parameters
        // console.log( child.typeParameters );

        const properties: ClassPropertyDocumentation[] = [];

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

            properties.push( {
              type: 'classProperty',
              name: name,
              isReadonly: isReadonly,
              typeString: typeString
            } );
          }
        }

        const clazz = {
          type: 'class',
          name: className,
          properties: properties
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
    console.log( kindOf( child ), child.modifiers ? child.modifiers.map( kindOf ) : '' );

    if ( ts.isClassDeclaration( child ) ) {
      for ( const subChild of child.getChildren() ) {
        console.log( `  ${kindOf( subChild )}` );
      }
      for ( const member of child.members ) {
        console.log( `  :${kindOf( member )}` );
      }
    }

    if ( [
      ts.SyntaxKind.TypeAliasDeclaration,
      ts.SyntaxKind.ExpressionStatement,
      ts.SyntaxKind.FunctionDeclaration,
      ts.SyntaxKind.ExportAssignment
    ].includes( child.kind ) ) {
      for ( const subChild of child.getChildren() ) {
        console.log( `  ${kindOf( subChild )}` );
      }
    }
  }

  return {
    repo: repo,
    sourcePath: sourcePath,
    sourceName: sourceName,
    topLevelComments: topLevelComments,
    classes: classes,
    exports: exports
  };
};