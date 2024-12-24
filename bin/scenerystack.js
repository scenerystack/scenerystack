#!/usr/bin/env node

// Hooks for `npx scenerystack <command>`.

// NOTE: if testing locally, do something like `npx --prefix ../git/scenerystack scenerystack checkout`

const https = require( 'https' );
const fs = require( 'fs' );
const assert = require( 'assert' );
const child_process = require( 'child_process' );

function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}

/**
 * NOTE: Transpiled/adapted version of execute() to run without dependencies.
 *
 * Executes a command, with specific arguments and in a specific directory (cwd).
 *
 * Resolves with the stdout: {string}
 * Rejects with { code: {number}, stdout: {string} } -- Happens if the exit code is non-zero.
 *
 * @param cmd - The process to execute. Should be on the current path.
 * @param args - Array of arguments. No need to extra-quote things.
 * @param cwd - The working directory where the process should be run from
 * @param providedOptions
 * @rejects {ExecuteError}
 */
function execute( cmd, args, cwd, providedOptions = {} ) {
  const startTime = Date.now();

  const errorsOption = providedOptions.errors ?? 'reject';
  const childProcessEnvOption = providedOptions.childProcessOptions?.env ?? _extends( {}, process.env );
  const childProcessShellOption = providedOptions.childProcessOptions?.shell ?? ( cmd !== 'node' && cmd !== 'git' && process.platform.startsWith( 'win' ) );
  const logOutput = providedOptions.logOutput ?? false;

  assert( errorsOption === 'reject' || errorsOption === 'resolve', 'Errors must reject or resolve' );
  return new Promise( ( resolve, reject ) => {
    let rejectedByError = false;
    let stdout = ''; // to be appended to
    let stderr = '';
    const childProcess = child_process.spawn( cmd, args, {
      cwd: cwd,
      env: childProcessEnvOption,
      shell: childProcessShellOption
    } );
    childProcess.on( 'error', ( error ) => {
      rejectedByError = true;
      if ( errorsOption === 'resolve' ) {
        resolve( {
          code: 1,
          stdout: stdout,
          stderr: stderr,
          cwd: cwd,
          error: error,
          time: Date.now() - startTime
        } );
      }
      else {
        reject( new ExecuteError( cmd, args, cwd, stdout, stderr, -1, Date.now() - startTime ) );
      }
    } );
    childProcess.stderr && childProcess.stderr.on( 'data', ( data ) => {
      stderr += data;
      if ( logOutput ) {
        process.stdout.write( '' + data );
      }
    } );
    childProcess.stdout && childProcess.stdout.on( 'data', ( data ) => {
      stdout += data;
      if ( logOutput ) {
        process.stdout.write( '' + data );
      }
    } );
    childProcess.on( 'close', ( code ) => {
      if ( !rejectedByError ) {
        if ( errorsOption === 'resolve' ) {
          resolve( {
            code: code,
            stdout: stdout,
            stderr: stderr,
            cwd: cwd,
            time: Date.now() - startTime
          } );
        }
        else {
          if ( code !== 0 ) {
            reject( new ExecuteError( cmd, args, cwd, stdout, stderr, code, Date.now() - startTime ) );
          }
          else {
            resolve( stdout );
          }
        }
      }
    } );
  } );
}
let ExecuteError = class ExecuteError extends Error {
  constructor( cmd, args, cwd, stdout, stderr, code, time// ms
  ) {
    super( `${cmd} ${args.join( ' ' )} in ${cwd} failed with exit code ${code}${stdout ? `\nstdout:\n${stdout}` : ''}${stderr ? `\nstderr:\n${stderr}` : ''}` ), this.cmd = cmd, this.args = args, this.cwd = cwd, this.stdout = stdout, this.stderr = stderr, this.code = code, this.time = time;
  }
};

( async () => {

  const args = process.argv.slice( 2 );
  const command = args[ 0 ];

  console.log( `[scenerystack]: ${command} ${args.slice( 1 ).join( ' ' )}` );

  const repos = [
    'alpenglow',
    'assert',
    'axon',
    'babel',
    'bamboo',
    'brand',
    'chipper',
    'dot',
    'joist',
    'kite',
    'mobius',
    'nitroglycerin',
    'perennial-alias',
    'phet-core',
    'phetcommon',
    'query-string-machine',
    'scenery-phet',
    'scenery',
    'sherpa',
    'sun',
    'tambo',
    'tandem',
    'tappi',
    'twixt',
    'utterance-queue',
    'vegas'
  ];

  // Do a bunch without requiring any other dependencies
  const fetchJson = url => {
    return new Promise(( resolve, reject ) => {
      https.get( url, res => {
        if ( res.statusCode !== 200 ) {
          if ( res.statusCode === 302 ) {
            const newURL = new URL( url );
            newURL.pathname = res.headers.location;

            ( async () => {
              try {
                resolve( await fetchJson( newURL.toString() ) );
              }
              catch ( e ) {
                reject( e );
              }
            } )();
          }
          else {
            return reject( new Error( `Failed to fetch JSON: ${res.statusCode}` ) );
          }

          return;
        }

        let data = '';
        res.on( 'data', chunk => {
          data += chunk;
        } );

        res.on( 'end', () => resolve( JSON.parse( data ) ) );
      } ).on( 'error', reject );
    });
  }

  const getSceneryStackDependencies = async ( version = 'latest' ) => {
    return await fetchJson( `https://unpkg.com/scenerystack@${version}/dependencies.json` );
  };

  const clone = async repo => {
    const organization = repo === 'scenerystack' ? 'scenerystack' : 'phetsims';
    const args = [
      'clone',
      `https://github.com/${organization}/${repo === 'perennial-alias' ? 'perennial' : repo}.git`
    ];
    // remap perennial-alias
    if ( repo === 'perennial-alias' ) {
      args.push( 'perennial-alias' );
    }

    console.log( `cloning ${repo}` );
    await execute( 'git', args, '.' );
  };

  const ensureExists = async repo => {
    if ( !fs.existsSync( repo ) ) {
      await clone( repo );
    }
  };

  const isClean = async repo => {
    return execute( 'git', [ 'status', '--porcelain' ], `./${repo}` ).then( stdout => Promise.resolve( stdout.length === 0 ) );
  };

  const refreshRepo = async repo => {
    await ensureExists( repo );
    if ( await isClean( repo ) ) {
      await execute( 'git', [ 'checkout', 'main' ], `./${repo}` );

      console.log( `pulling ${repo}` );
      await execute( 'git', [ 'pull', '--rebase' ], `./${repo}` )
    }
    else {
      console.log( `${repo} has changes, skipping pull` );
    }
  };

  const getSceneryStackSHAForVersion = async version => {
    const gitLines = ( await execute( 'git', [ 'log', '-p', '--', 'package.json' ], './scenerystack' ) ).split( '\n' ).map( s => s.trim() );

    let sha = null;

    for ( const line of gitLines ) {
      if ( line.startsWith( 'commit ' ) ) {
        sha = line.substring( 'commit '.length );
      }
      if ( line.match( new RegExp( `\\+.*"version": "${version}"` ) ) ) {
        return sha;
      }
    }

    throw new Error( `version ${version} not found` );
  };

  const npmUpdate = async repo => {
    console.log( `npm update in ${repo}` );
    const npmCommand = /^win/.test( process.platform ) ? 'npm.cmd' : 'npm';
    await execute( npmCommand, [ 'prune' ], `./${repo}` );
    await execute( npmCommand, [ 'update' ], `./${repo}` );
  };

  const checkout = async version => {
    console.log( `checking out version: ${version}` );

    await refreshRepo( 'scenerystack' );

    if ( version !== 'latest' ) {
      const sha = await getSceneryStackSHAForVersion( version );

      console.log( `checkout out scenerystack ${sha} for version ${version}` );
      await execute( 'git', [ 'checkout', sha ], './scenerystack' );
    }

    const getRefForRepo = version === 'latest' ? repo => 'main' : await ( async () => {
      const dependencies = await getSceneryStackDependencies( version );

      return repo => dependencies[ repo ].sha;
    } )();

    for ( const repo of repos ) {
      await refreshRepo( repo );

      const ref = getRefForRepo( repo );

      if ( version !== 'latest' ) {
        console.log( `checking out ${repo} ${ref}` );
        await execute( 'git', [ 'checkout', ref ], `./${repo}` );
      }
    }

    await npmUpdate( 'scenerystack' );
    await npmUpdate( 'chipper' );
    await npmUpdate( 'perennial-alias' );

    console.log( 'checkout complete' );
  };

  const build = async () => {
    await execute( 'npx', [ 'tsx', 'js/build.ts' ], './scenerystack', {
      logOutput: true
    } );

    console.log( 'build complete, can use `"scenerystack": "file:../scenerystack"` or equivalent in package.json dependencies to use local package' );
  };

  switch ( command ) {
    case 'checkout':
      const version = args[ 1 ] ?? 'latest';
      await checkout( version );
      break;
    case 'build':
      await build();
      break;
    case 'help':
    case '--help':
      console.log( 'Usage: npx scenerystack <command>' );
      console.log( 'Commands:' );
      console.log( '  checkout [version] - Check out a specific version of scenerystack and its dependencies' );
      console.log( '                     - version: the version to check out (defaults to the bleeding edge development branches)' );
      console.log( '  build - Build scenerystack' );
      break;
    default:
      console.error( `Unknown command: ${command}` );
      break;
  }
} )();