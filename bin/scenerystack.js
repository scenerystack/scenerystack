#!/usr/bin/env node

// Hooks for `npx scenerystack <command>`.

const args = process.argv.slice( 2 );

const command = args[ 0 ];

switch ( command ) {
  case 'test':
    break;
  case 'build':
    break;
  default:
    console.error( `Unknown command: ${command}` );
    break;
}