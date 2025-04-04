// Copyright 2013-2025, University of Colorado Boulder

/*
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import '../globals.js';
import { QueryStringMachine } from '../query-string-machine/js/QueryStringMachineModule.js';
import { isProduction } from './isProduction.js';

type Assert = ( predicate: any, ...messages: any[] ) => void;

const assertConsoleLog = !isProduction;

export let assert: Assert | null = null;
export let assertSlow: Assert | null = null;

// list of callbacks called when an assertion is triggered, before throwing the error.
export const assertionHooks: ( () => void )[] = [];

export const assertFunction = function( predicate: any, ...messages: any[] ) {
  if ( !predicate ) {

    // don't treat falsy as a message.
    messages = messages.filter( message => !!messages );

    // Log the stack trace to IE.  Just creating an Error is not enough, it has to be caught to get a stack.
    if ( self.navigator && self.navigator.appName === 'Microsoft Internet Explorer' ) {
      messages.push( `stack=\n${new Error().stack}` );
    }

    // Add "Assertion Failed" to the front of the message list
    const assertPrefix = messages.length > 0 ? 'Assertion failed: ' : 'Assertion failed';
    console && console.error && console.error( assertPrefix, ...messages );

    assertionHooks.forEach( hook => hook() );

    if ( QueryStringMachine && QueryStringMachine.containsKey( 'debugger' ) ) {
      debugger; // eslint-disable-line no-debugger
    }

    // Check if Error.stackTraceLimit exists and is writable
    const descriptor = Object.getOwnPropertyDescriptor( Error, 'stackTraceLimit' );
    const stackTraceWritable = descriptor && ( descriptor.writable || ( descriptor.set && typeof descriptor.set === 'function' ) );

    if ( stackTraceWritable ) {

      // @ts-ignore
      Error.stackTraceLimit = 20;
    }

    const error = new Error( assertPrefix + messages.join( '\n ' ) );
    if ( QueryStringMachine.containsKey( 'eacontinue' ) ) {
      console.log( error.stack );
    }
    else {
      throw error;
    }
  }
};

export const enableAssert = () => {
  if ( !assert ) {
    assert = assertFunction;
    assertConsoleLog && self.console && self.console.log && self.console.log( 'enabling assert' );
  }
};
export const disableAssert = () => {
  if ( assert ) {
    assert = null;
    assertConsoleLog && self.console && self.console.log && self.console.log( 'disabling assert' );
  }
}
export const enableAssertSlow = () => {
  if ( !assertSlow ) {
    assertSlow = assertFunction;
    assertConsoleLog && self.console && self.console.log && self.console.log( 'enabling assertSlow' );
  }
}
export const disableAssertSlow = () => {
  if ( assertSlow ) {
    assertSlow = null;
    assertConsoleLog && self.console && self.console.log && self.console.log( 'disabling assertSlow' );
  }
}