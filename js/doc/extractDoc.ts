// Copyright 2024, University of Colorado Boulder

// Because it doesn't like scenerystack URLs
/* eslint-disable phet/todo-should-have-issue */

/**
 * Extracts documentation from a TS/JS file.
 *
 * TODO: how to handle getters/setters/getter-setters?
 *   GetAccessorDeclaration / SetAccessorDeclaration
 *   They have name/modifiers
 *   SetAccessor: Will have SyntaxList with single Parameter (like methods)
 *   GetAccessor: ColonToken then return value, like methods
 * TODO: class inheritance (WITH mixins)
 *   TODO: show names (possibly) of inherited methods/properties???
 *   TODO: at least have methods / etc. for mixins
 * TODO: class template params
 * TODO: link to classes/names and highlight types (crosslink) nicely
 * TODO: can we inspect computed types???
 *
 * TODO: comments at the end of a line for certain things
 *
 * TODO: Node constructor docs
 *
 * TODO: objects/functions (will need to potentially record and scan definitions)
 *
 * TODO: comment patcher (so we don't have to duplicate comments, e.g. setX, getX, set X(), get X(), FooOptions.x)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ts from 'typescript';
import _ from 'lodash';
import os from 'os';
import { hasExportModifier, hasDefaultExportModifier, hasPrivateModifier, hasStaticModifier, hasReadonlyModifier, hasProtectedModifier } from '../typescript/modifiers.js';
import { kindOf } from '../typescript/kindOf.js';
import { cleanupComment } from './cleanupComment.js';
import { getLeadingComments } from '../typescript/getLeadingComments.js';
import { getSpecificLeadingComment } from '../typescript/getSpecificLeadingComment.js';
import { getPossibleStringEnumName } from '../typescript/getPossibleStringEnumName.js';
import { getFunctionReturnTypeString } from '../typescript/getFunctionReturnTypeString.js';

export type Documentation = {
  repo: string;
  sourcePath: string;
  sourceName: string;
  topLevelComments: string[];
  classes: ClassDocumentation[];
  typeAliases: TypeAliasDocumentation[];
  exports: ExportDocumentation[];
  debug: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type ClassDocumentation = {
  type: 'class';
  name: string;
  comment: string | null;
  methods: ClassMethodDocumentation[];
  staticMethods: ClassMethodDocumentation[];
  properties: ClassPropertyDocumentation[];
  staticProperties: ClassPropertyDocumentation[];
};

export type ClassMethodDocumentation = {
  type: 'classMethod';
  name: string;
  comment: string | null;
  isProtected: boolean;
  parameters: FunctionParameterDocumentation[];
  returnTypeString: string;
};

export type ClassPropertyDocumentation = {
  type: 'classProperty';
  name: string;
  comment: string | null;
  isReadonly: boolean;
  isProtected: boolean;
  typeString: string;
};

export type FunctionParameterDocumentation = {
  type: 'functionParameter';
  name: string;
  dotDotDot: boolean;
  question: boolean;
  // TODO: initializer?
  typeString: string;
};

export type TypeAliasDocumentation = {
  type: 'type';
  name: string;
  comment: string | null;
  typeDoc: TypeDocumentation;
};

export type TypePropertySignatureDocumentation = {
  type: 'typePropertySignature';
  name: string; // .name.getText()
  question: boolean; // !!.questionToken
  typeDoc: TypeDocumentation | null;
  comment: string | null;
};

export type TypeLiteralDocumentation = {
  type: 'typeLiteral';
  // TODO: rename signatures
  members: TypePropertySignatureDocumentation[];
};

export type TypeIntersectionDocumentation = {
  type: 'typeIntersection';
  types: TypeDocumentation[];
};

export type TypeUnionDocumentation = {
  type: 'typeUnion';
  types: TypeDocumentation[];
};

export type TypeReferenceDocumentation = {
  type: 'typeReference';
  name: string;
  arguments: TypeDocumentation[];
};

export type TypeStringLiteralDocumentation = {
  type: 'typeStringLiteral';
  text: string;
};

export type TypeRawDocumentation = {
  type: 'typeRaw';
  typeString: string;
};

export type ExportableType = ClassDocumentation | TypeAliasDocumentation;
export type TypeDocumentation = TypeLiteralDocumentation | TypeIntersectionDocumentation | TypeUnionDocumentation | TypeReferenceDocumentation | TypeStringLiteralDocumentation | TypeRawDocumentation;

export type ExportDocumentation = {
  name: string; // 'default' an option
  object: ExportableType;
};

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

  // given a name, find `const name = <initializer>;` and return the initializer
  const getTopLevelInitializedValue = ( name: string, topLevelNodes: readonly ts.Node[] ): ts.Expression | null => {
    for ( const node of topLevelNodes ) {
      if ( node.kind === ts.SyntaxKind.FirstStatement ) {
        for ( const child of node.getChildren() ) {
          if ( ts.isVariableDeclarationList( child ) ) {
            for ( const declaration of child.declarations ) {
              if ( declaration.name.getText() === name && declaration.initializer ) {
                return declaration.initializer;
              }
            }
          }
        }
      }
    }
    return null;
  };

  // [ 'left', 'center', 'right' ] as const => 'left' | 'center' | 'right'
  const getConstStringArrayAsType = ( expression: ts.Expression ) : TypeDocumentation | null => {
    if ( ts.isAsExpression( expression ) && ts.isArrayLiteralExpression( expression.expression ) ) {
      const stringLiterals: TypeStringLiteralDocumentation[] = [];

      for ( const element of expression.expression.elements ) {
        if ( ts.isStringLiteral( element ) ) {
          stringLiterals.push( {
            type: 'typeStringLiteral',
            text: element.text
          } );
        }
        else {
          return null;
        }
      }

      return {
        type: 'typeUnion',
        types: stringLiterals
      };
    }
    return null;
  };

  // Given a `typeof VALUES[number]`,
  // find the `const VALUES = [ 'left', 'center', 'right' ] as const;`
  // and return `'left' | 'center' | 'right'`
  const getStringUnionType = ( type: ts.TypeNode, topLevelNodes: readonly ts.Node[] ): TypeDocumentation | null => {
    const name = getPossibleStringEnumName( type );

    if ( name ) {
      const expression = getTopLevelInitializedValue( name, topLevelNodes );

      if ( expression ) {
        return getConstStringArrayAsType( expression );
      }
    }

    return null;
  };

  const getFunctionParameters = ( type: ts.Node ): FunctionParameterDocumentation[] => {
    const children = type.getChildren();

    const openParenIndex = children.findIndex( child => child.kind === ts.SyntaxKind.OpenParenToken );
    const closeParenIndex = children.findIndex( child => child.kind === ts.SyntaxKind.CloseParenToken );

    if ( openParenIndex === -1 ) {
      throw new Error( 'Expected OpenParenToken' );
    }

    // Handle no-args
    if ( openParenIndex + 1 === closeParenIndex ) {
      return [];
    }

    const parameterSyntaxList = children[ openParenIndex + 1 ];
    if ( parameterSyntaxList.kind !== ts.SyntaxKind.SyntaxList ) {
      throw new Error( 'Expected SyntaxList' );
    }

    const parameterNodes = parameterSyntaxList.getChildren().filter( child => ts.isParameter( child ) );

    return parameterNodes.map( parameterNode => {
      return {
        type: 'functionParameter',
        name: parameterNode.name.getText(),
        dotDotDot: !!parameterNode.dotDotDotToken,
        question: !!parameterNode.questionToken,
        typeString: parameterNode.type?.getText() ?? 'any'
      };
    } );
  };

  const isNameExcluded = ( name: string ): boolean => {
    return name.startsWith( '_' );
  };

  const isCommentExcluded = ( comment: string | null ): boolean => {
    if ( comment ) {
      return comment.includes( `${repo}-internal` );
    }
    else {
      return false;
    }
  };

  const parseToTypeDoc = ( type: ts.TypeNode ): TypeDocumentation => {
    if ( ts.isTypeLiteralNode( type ) ) {
      const literal: TypeLiteralDocumentation = {
        type: 'typeLiteral',
        members: []
      };

      // TODO: how to handle different... members?
      for ( const member of type.members ) {
        if ( ts.isPropertySignature( member ) ) {
          literal.members.push( {
            type: 'typePropertySignature',
            name: member.name.getText(),
            question: !!member.questionToken,
            typeDoc: member.type ? parseToTypeDoc( member.type ) : null,
            comment: getSpecificLeadingComment( sourceCode, member )
          } );
        }
      }

      return literal;
    }
    else if ( ts.isIntersectionTypeNode( type ) || ts.isUnionTypeNode( type ) ) {
      return {
        type: ts.isIntersectionTypeNode( type ) ? 'typeIntersection' : 'typeUnion',
        types: type.types.map( parseToTypeDoc )
      };
    }
    else if ( ts.isTypeReferenceNode( type ) ) {
      return {
        type: 'typeReference',
        name: type.typeName.getText(),
        arguments: type.typeArguments ? type.typeArguments.map( parseToTypeDoc ) : []
      };
    }
    else if ( ts.isLiteralTypeNode( type ) && ts.isStringLiteral( type.literal ) ) {
      return {
        type: 'typeStringLiteral',
        text: type.literal.text
      };
    }
    else {
      return {
        type: 'typeRaw',
        typeString: type.getText()
      };
    }
  };

  const mainChildren = sourceAST.getChildren()[ 0 ].getChildren();

  const topLevelComments = mainChildren.filter( node => node.kind === ts.SyntaxKind.ImportDeclaration ).map( node => {
    return getLeadingComments( sourceCode, node ).map( cleanupComment );
  } ).flat().filter( comment => !( comment.includes( 'Copyright' ) && comment.includes( 'University of Colorado Boulder' ) ) );

  const classes: ClassDocumentation[] = [];
  const typeAliases: TypeAliasDocumentation[] = [];
  const exports: ExportDocumentation[] = [];

  for ( const child of mainChildren ) {

    if ( ts.isClassDeclaration( child ) ) {
      const className = child.name?.getText();

      if ( className ) {
        debug += `class: ${className}${os.EOL}`;

        const comment = getSpecificLeadingComment( sourceCode, child );

        // heritage
        // console.log( child.heritageClauses );

        // type parameters
        // console.log( child.typeParameters );

        const methods: ClassMethodDocumentation[] = [];
        const staticMethods: ClassMethodDocumentation[] = [];
        const properties: ClassPropertyDocumentation[] = [];
        const staticProperties: ClassPropertyDocumentation[] = [];

        for ( const member of child.members ) {
          const memberComment = getSpecificLeadingComment( sourceCode, member );

          if ( ts.isPropertyDeclaration( member ) ) {

            const name = member.name.getText();

            if (
              isNameExcluded( name ) ||
              isCommentExcluded( memberComment ) ||
              hasPrivateModifier( member )
            ) {
              continue;
            }

            const type = member.type;
            const initializer = member.initializer;

            let typeString = type?.getText() ?? null;

            // TODO: handle Identifier<boo> also https://github.com/scenerystack/community/issues/80
            // Handle where the type is not declared, but we have a `foo: new SomeType` (typeString should be SomeType)
            if ( typeString === null && initializer && ts.isNewExpression( initializer ) && ts.isIdentifier( initializer.expression ) ) {
              typeString = initializer.expression.getText();
            }

            if ( typeString === null ) {
              typeString = 'any';
            }

            ( hasStaticModifier( member ) ? staticProperties : properties ).push( {
              type: 'classProperty',
              name: name,
              comment: memberComment,
              isReadonly: hasReadonlyModifier( member ),
              isProtected: hasProtectedModifier( member ),
              typeString: typeString
            } );
          }
          if ( ts.isMethodDeclaration( member ) || ts.isConstructorDeclaration( member ) ) {

            const name = ts.isMethodDeclaration( member ) ? member.name.getText() : 'constructor';

            if (
              isNameExcluded( name ) ||
              isCommentExcluded( memberComment ) ||
              hasPrivateModifier( member )
            ) {
              continue;
            }

            ( hasStaticModifier( member ) ? staticMethods : methods ).push( {
              type: 'classMethod',
              name: name,
              comment: memberComment,
              isProtected: hasProtectedModifier( member ),
              parameters: getFunctionParameters( member ),
              returnTypeString: getFunctionReturnTypeString( member )
            } );

          }
        }

        const clazz: ClassDocumentation = {
          type: 'class',
          name: className,
          comment: comment,
          methods: methods,
          staticMethods: staticMethods,
          properties: properties,
          staticProperties: staticProperties
        };

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

        if ( !exportableObject ) {
          for ( const typeAlias of typeAliases ) {
            if ( typeAlias.name === identifierName ) {
              exportableObject = typeAlias;
              break;
            }
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
      const name = child.name.getText();

      // TODO: or get trailing comment too
      const comment = getSpecificLeadingComment( sourceCode, child );

      if ( isNameExcluded( name ) || isCommentExcluded( comment ) ) {
        continue;
      }

      // See if we are pulling type from a string enum
      const typeDoc = getStringUnionType( child.type, mainChildren ) ?? parseToTypeDoc( child.type );

      const typeAlias: TypeAliasDocumentation = {
        type: 'type',
        name: name,
        comment: comment,
        typeDoc: typeDoc
      };

      typeAliases.push( typeAlias );

      if ( hasExportModifier( child ) ) {
        // TODO: ' as ... '
        const isDefault = hasDefaultExportModifier( child );
        exports.push( {
          name: isDefault ? 'default' : name,
          object: typeAlias
        } );
      }
    }
    else if ( ts.isExpressionStatement( child ) ) {
      // TODO
    }
    else if ( ts.isFunctionDeclaration( child ) ) {
      // TODO (e.g. affirm)
    }

    // @ts-expect-error
    debug += `${kindOf( child )} ${child.modifiers ? child.modifiers.map( kindOf ) : ''}${os.EOL}`;

    if ( child.kind === ts.SyntaxKind.FirstStatement ) {
      for ( const subChild of child.getChildren() ) {
        debug += `  ${kindOf( subChild )}${os.EOL}`;

        if ( ts.isVariableDeclarationList( subChild ) ) {
          // readonly declarations: NodeArray<VariableDeclaration>;

          for ( const variableDeclaration of subChild.declarations ) {
            debug += `    ${variableDeclaration.name.getText()}${os.EOL}`;
            if ( variableDeclaration.initializer ) {
              debug += `      ${kindOf( variableDeclaration.initializer )}${os.EOL}`;

              if ( ts.isAsExpression( variableDeclaration.initializer ) ) {
                debug += `        ${kindOf( variableDeclaration.initializer.expression )}${os.EOL}`;
                // readonly expression: Expression;
                // readonly type: TypeNode;

                if ( ts.isArrayLiteralExpression( variableDeclaration.initializer.expression ) ) {
                  for ( const element of variableDeclaration.initializer.expression.elements ) {
                    debug += `          ${kindOf( element )}${os.EOL}`;

                    if ( ts.isStringLiteral( element ) ) {
                      debug += `            "${element.text}"${os.EOL}`;
                    }
                    // StringLiteral???
                    // isStringLiteral =>
                  }
                }
              }
            }
          }
        }
      }
    }

    if ( ts.isTypeAliasDeclaration( child ) ) {
      debug += `  :${kindOf( child.type )}${os.EOL}`;

      if ( ts.isIndexedAccessTypeNode( child.type ) ) {
        debug += `    obj: ${kindOf( child.type.objectType )}${os.EOL}`;
        debug += `    index: ${kindOf( child.type.indexType )}${os.EOL}`;

        if ( ts.isTypeQueryNode( child.type.objectType ) && child.type.indexType.kind === ts.SyntaxKind.NumberKeyword ) {
          debug += `      "${child.type.objectType.exprName.getText()}"${os.EOL}`;

          //         readonly exprName: EntityName;
        }
/*
        readonly kind: SyntaxKind.IndexedAccessType;
        readonly objectType: TypeNode;
        readonly indexType: TypeNode;
 */
      }

      if ( ts.isIntersectionTypeNode( child.type ) || ts.isUnionTypeNode( child.type ) ) {
        for ( const type of child.type.types ) {
          debug += `    ${ts.isIntersectionTypeNode( child.type ) ? '&' : '|'}${kindOf( type )}${os.EOL}`;

          if ( ts.isTypeReferenceNode( type ) ) {
            debug += `      "${type.typeName.getText()}${type.typeArguments ? `<${type.typeArguments.map( kindOf ).join( ', ' )}>` : ''}"${os.EOL}`;
          }
          if ( ts.isLiteralTypeNode( type ) ) {
            if ( ts.isStringLiteral( type.literal ) ) {
              debug += `      "${type.literal.text}"${os.EOL}`;
            }
          }
        }
      }
      if ( ts.isTypeLiteralNode( child.type ) ) {
        for ( const member of child.type.members ) {
          // @ts-expect-error
          debug += `    .${kindOf( member )} ${member.modifiers ? member.modifiers.map( kindOf ) : ''}${os.EOL}`;

          if ( ts.isPropertySignature( member ) ) {
            debug += `      "${member.name.getText()}"${member.questionToken ? '?' : ''}: ${member.type ? kindOf( member.type ) : 'any'}${os.EOL}`;
          }
        }
      }

      if ( child.typeParameters ) {
        for ( const typeParameter of child.typeParameters ) {
          debug += `  <${kindOf( typeParameter )}${os.EOL}`;
        }
      }
    }

    if ( ts.isClassDeclaration( child ) ) {
      for ( const subChild of child.getChildren() ) {
        debug += `  ${kindOf( subChild )}${os.EOL}`;
      }
      for ( const member of child.members ) {
        // @ts-expect-error
        debug += `  :${kindOf( member )} ${member.modifiers ? member.modifiers.map( kindOf ) : ''}${os.EOL}`;

        if ( [ ts.SyntaxKind.PropertyDeclaration, ts.SyntaxKind.MethodDeclaration, ts.SyntaxKind.GetAccessor, ts.SyntaxKind.SetAccessor ].includes( member.kind ) ) {
          for ( const subChild of member.getChildren() ) {
            debug += `    ${kindOf( subChild )}${os.EOL}`;

            if ( subChild.kind === ts.SyntaxKind.SyntaxList ) {
              for ( const subSubChild of subChild.getChildren() ) {
                // @ts-expect-error
                debug += `      ${kindOf( subSubChild )} ${member.modifiers ? member.modifiers.map( kindOf ) : ''}${os.EOL}`;

                if ( ts.isParameter( subSubChild ) ) {
                  for ( const subSubSubChild of subSubChild.getChildren() ) {
                    debug += `        ${kindOf( subSubSubChild )}${os.EOL}`;
                  }
                }
              }
            }
          }
        }
      }
    }

    if ( [
      ts.SyntaxKind.ExpressionStatement,
      ts.SyntaxKind.FunctionDeclaration,
      ts.SyntaxKind.ExportAssignment
    ].includes( child.kind ) ) {
      for ( const subChild of child.getChildren() ) {
        debug += `  ${kindOf( subChild )}${os.EOL}`;
      }
    }
  }

  // Resolve and simplify exported types (so they aren't using type aliases that are not exported)
  // This helps a lot with the options patterns used.
  for ( const exportDoc of exports ) {
    if ( exportDoc.object.type === 'type' ) {
      const originalTypeDoc = exportDoc.object.typeDoc;

      const resolveAndSimplify = ( typeDoc: TypeDocumentation ): TypeDocumentation => {
        // resolve
        if ( typeDoc.type === 'typeReference' ) {
          const matchingAlias = typeAliases.find( alias => alias.name === typeDoc.name );

          // If we have a type AND it is not exported, we can inline it
          if ( matchingAlias && !exports.some( exp => exp.name === typeDoc.name ) ) {
            return resolveAndSimplify( matchingAlias.typeDoc );
          }
          else if ( typeDoc.name === 'StrictOmit' ) {
            // TODO
          }
          else if ( typeDoc.name === 'Pick' ) {
            // TODO
          }
          else if ( typeDoc.name === 'PickOptional' ) {
            // TODO
          }
          else if ( typeDoc.name === 'PickRequired' ) {
            // TODO
          }
        }
        // simplify
        else if ( typeDoc.type === 'typeIntersection' ) {
          const simplifiedAndFlattenedTypes = _.uniqWith( typeDoc.types.map( resolveAndSimplify ).map( member => {
            return member.type === 'typeIntersection' ? member.types : [ member ];
          } ).flat().filter( td => {
            // Filter out EmptySelfOptions
            if ( td.type === 'typeReference' && td.name === 'EmptySelfOptions' ) {
              return false;
            }

            return true;
          } ), _.isEqual ); // simplifies duplicates

          const literalTypes = simplifiedAndFlattenedTypes.filter( member => member.type === 'typeLiteral' );
          const nonLiteralTypes = simplifiedAndFlattenedTypes.filter( member => member.type !== 'typeLiteral' );

          const resultingTypes: TypeDocumentation[] = [];

          if ( literalTypes.length === 1 ) {
            resultingTypes.push( literalTypes[ 0 ] );
          }
          else if ( literalTypes.length > 1 ) {
            // Merge them!
            const mergedLiteral: TypeLiteralDocumentation = {
              type: 'typeLiteral',
              members: []
            };

            for ( const type of literalTypes ) {
              for ( const signature of type.members ) {
                const conflictMergedSignature = mergedLiteral.members.find( mergedSignature => mergedSignature.name === signature.name );

                if ( conflictMergedSignature ) {
                  // TODO: conflict! Handle this better

                  conflictMergedSignature.question &&= signature.question;

                  conflictMergedSignature.typeDoc = resolveAndSimplify( {
                    type: 'typeIntersection',
                    types: [ conflictMergedSignature.typeDoc, signature.typeDoc ].filter( f => f !== null )
                  } );

                  // TODO: add comments!!! OH NO
                }
                else {
                  mergedLiteral.members.push( signature );
                }
              }
            }
          }

          resultingTypes.push( ...nonLiteralTypes );

          // Write if any changes
          if ( typeDoc.types.some( type => !resultingTypes.includes( type ) ) ) {
            if ( resultingTypes.length === 1 ) {
              return resultingTypes[ 0 ];
            }
            else {
              return {
                type: 'typeIntersection',
                types: resultingTypes
              };
            }
          }
        }

        return typeDoc;
      };

      const resolvedTypeDoc = resolveAndSimplify( originalTypeDoc );
      if ( resolvedTypeDoc !== originalTypeDoc ) {
        exportDoc.object.typeDoc = resolvedTypeDoc;
      }
    }
  }

  return {
    repo: repo,
    sourcePath: sourcePath,
    sourceName: sourceName,
    topLevelComments: topLevelComments,
    classes: classes,
    typeAliases: typeAliases,
    exports: exports,
    debug: debug
  };
};