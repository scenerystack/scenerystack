#!/usr/bin/env node

// Experimental progress toward a working CLI for setting up, building and serving simulations

const child_process = require( 'child_process' );
const fs = require( 'fs' );

const args = process.argv.slice( 2 );

const command = args[ 0 ];

const gruntCommand = /^win/.test( process.platform ) ? 'grunt.cmd' : 'grunt';

const simpleExecute = ( cmd, args, cwd ) => {
  return new Promise( ( resolve, reject ) => {
    console.log( `Running ${cmd} ${args.join( ' ' )} from ${cwd}` );

    const childProcess = child_process.spawn( cmd, args, {
      cwd: cwd,
      env: process.env,
      shell: cmd !== 'node' && cmd !== 'git' && /^win/.test( process.platform )
    } );

    childProcess.on( 'error', error => {
      console.log( `Error: ${error} on ${cmd} ${args} from ${cwd}` );
      reject( {
        error: error,
        cmd: cmd,
        args: args,
        cwd: cwd
      } );
    } );

    childProcess.on( 'close', code => {
      if ( code !== 0 ) {
        reject( {
          code: code,
          cmd: cmd,
          args: args,
          cwd: cwd
        } );
      }
      else {
        resolve();
      }
    } );
  } );
};


const rebuild = async () => {
  if ( fs.existsSync( `./.scenerystack` ) ) {
    fs.rmSync( `./.scenerystack`, {
      recursive: true
    } );
  }
  fs.mkdirSync( `./.scenerystack`, { recursive: true } );

  const packageJSON = JSON.parse( fs.readFileSync( './package.json', 'utf-8' ) );

  const simRepo = packageJSON.name;
  const author = packageJSON.author || 'YOUR_NAME_HERE';
  const title = packageJSON.title || simRepo;

  console.log( `building ${simRepo}` );

  // Copy common repos into .scenerystack
  const commonRepos = fs.readdirSync( './node_modules/scenerystack/dist/repos' );
  for ( const commonRepo of commonRepos ) {
    fs.cpSync( `./node_modules/scenerystack/dist/repos/${commonRepo}`, `./.scenerystack/${commonRepo}`, { recursive: true } );
  }

  await simpleExecute( 'npm', [ 'install' ], './.scenerystack/chipper' );
  // await simpleExecute( 'npm', [ 'install' ], './.scenerystack/perennial' ); // TODO: can we ditch this?
  await simpleExecute( 'npm', [ 'install' ], './.scenerystack/perennial-alias' );

  await simpleExecute( gruntCommand, [ 'create-sim', `--repo=${simRepo}`, `--author=${author}`, `--title=${title}` ], './.scenerystack/perennial-alias' );

  // Copy own repo into .scenerystack/${simRepo}
  // fs.mkdirSync( `./.scenerystack/${simRepo}`, { recursive: true } );
  // for ( const file of fs.readdirSync( '.' ) ) {
  //   // TODO: check all gitignore?
  //   if ( !file.startsWith( '.' ) && !file.startsWith( 'node_modules' ) && file !== 'dist' ) {
  //     fs.cpSync( `./${file}`, `./.scenerystack/${simRepo}/${file}`, { recursive: true } );
  //   }
  // }
};

// TODO: filter out things from sherpa!! licensing!





const test = async () => {
  await rebuild();
};

const build = async () => {
  await rebuild();
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