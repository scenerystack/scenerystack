#!/usr/bin/env node

// Experimental progress toward a working CLI for setting up, building and serving simulations

const fs = require( 'fs' );

const args = process.argv.slice( 2 );

const command = args[ 0 ];

const test = () => {
  console.log( 'test' );

  console.log( fs.readFileSync( './package.json', 'utf-8' ) );
};

const build = () => {
  console.log( 'build' );
};

switch ( command ) {
  case 'test':
    test();
    break;
  case 'build':
    build();
    break;
  default:
    console.error( `Unknown command: ${command}` );
    break;
}