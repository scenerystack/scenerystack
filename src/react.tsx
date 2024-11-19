// Copyright 2024, University of Colorado Boulder

/**
 * React component containing a Scenery display.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import React, { ReactNode, useEffect, useRef } from 'react';
import { Display, Node } from './scenery/js/imports.js';

export type SceneryOptions = {
  node: Node,
  width?: number,
  height?: number,
  backgroundColor?: string | null,
  step?: ( dt: number ) => void,
  children?: ReactNode,
};

export const Scenery = ( {
                           node,
                           width,
                           height,
                           backgroundColor = null,
                           step = () => {},
                           children,
                         }: SceneryOptions ): JSX.Element => {
  const ref = useRef<HTMLDivElement | null>( null );
  const sceneRef = useRef<Node | null>( null );
  const displayRef = useRef<Display | null>( null );

  // Manual handling for the Display (creation and disposal).
  useEffect( () => {
    const element = ref.current!;

    const scene = new Node( {
      children: node ? [ node ] : []
    } );
    sceneRef.current = scene;

    const display = new Display( scene, {
      assumeFullWindow: false,
      listenToOnlyElement: true,

      container: element
    } );
    displayRef.current = display;

    display.updateOnRequestAnimationFrame( dt => {
      step( dt );

      // Auto-sizing
      if ( !width || !height ) {
        scene.children[ 0 ].left = 0;
        scene.children[ 0 ].top = 0;
        display.setWidthHeight( Math.ceil( scene.bounds.width ), Math.ceil( scene.bounds.height ) );
      }
    } );

    return () => {
      while ( element.firstChild ) {
        element.removeChild( element.firstChild! );
      }

      display.dispose();
      scene.dispose();
    };
  }, [ node, step ] );

  // Manually-specified width/height
  useEffect( () => {

    const display = displayRef.current;
    const scene = sceneRef.current;

    if ( display && scene && width && height ) {
      display.setWidthHeight( width, height );
    }
  }, [ children, width, height, node ] );

  // Background color effect
  useEffect( () => {
    const display = displayRef.current;

    if ( display ) {
      display.backgroundColor = backgroundColor;
    }
  }, [ backgroundColor ] );

  return (
    <div ref={ref}/>
  );
};
