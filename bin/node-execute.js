// Copyright 2024, University of Colorado Boulder

/**
 * Command execution wrapper (with common settings) - Stripped to work in node.js JS-only without winston or other dependencies.
 *
 * Taken from a transpiled file. TODO: get something less ugly and more maintainable (we don't want to add dependencies)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

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
 */ function execute(cmd, args, cwd, providedOptions = {}) {
    const startTime = Date.now();

    const errorsOption = providedOptions.errors ?? 'reject';
    const childProcessEnvOption = providedOptions.childProcessOptions?.env ?? _extends({}, process.env);
    const childProcessShellOption = providedOptions.childProcessOptions?.shell ?? ( cmd !== 'node' && cmd !== 'git' && process.platform.startsWith('win') );
    const logOutput = providedOptions.logOutput ?? false;

    // const options = _.merge({
    //     errors: 'reject',
    //     childProcessOptions: {
    //         // Provide additional env variables, and they will be merged with the existing defaults.
    //         // eslint-disable-next-line phet/no-object-spread-on-non-literals
    //         env: _extends({}, process.env),
    //         // options.shell value to the child_process.spawn. shell:true is required for a NodeJS security update, see https://github.com/phetsims/perennial/issues/359
    //         // In this case, only bash scripts fail with an EINVAL error, so we don't need to worry about node/git (and in
    //         // fact don't want the overhead of a new shell).
    //         shell: cmd !== 'node' && cmd !== 'git' && process.platform.startsWith('win')
    //     }
    // }, providedOptions);
    assert(errorsOption === 'reject' || errorsOption === 'resolve', 'Errors must reject or resolve');
    return new Promise((resolve, reject)=>{
        let rejectedByError = false;
        let stdout = ''; // to be appended to
        let stderr = '';
        // console.log( cmd, args, cwd, childProcessEnvOption, childProcessShellOption );
        const childProcess = child_process.spawn(cmd, args, {
          cwd: cwd,
          env: childProcessEnvOption,
          shell: childProcessShellOption
        });
        childProcess.on('error', (error)=>{
            rejectedByError = true;
            if (errorsOption === 'resolve') {
                resolve({
                    code: 1,
                    stdout: stdout,
                    stderr: stderr,
                    cwd: cwd,
                    error: error,
                    time: Date.now() - startTime
                });
            } else {
                reject(new ExecuteError(cmd, args, cwd, stdout, stderr, -1, Date.now() - startTime));
            }
        });
        // winston.debug(`Running ${cmd} ${args.join(' ')} from ${cwd}`);
        childProcess.stderr && childProcess.stderr.on('data', (data)=>{
            stderr += data;
            if ( logOutput ) {
              process.stdout.write( '' + data );
            }
            // winston.debug(`stderr: ${data}`);
        });
        childProcess.stdout && childProcess.stdout.on('data', (data)=>{
            stdout += data;
            if ( logOutput ) {
              process.stdout.write( '' + data );
            }
            // winston.debug(`stdout: ${data}`);
        });
        childProcess.on('close', (code)=>{
            // winston.debug(`Command ${cmd} finished. Output is below.`);
            // winston.debug(stderr && `stderr: ${stderr}` || 'stderr is empty.');
            // winston.debug(stdout && `stdout: ${stdout}` || 'stdout is empty.');
            if (!rejectedByError) {
                if (errorsOption === 'resolve') {
                    resolve({
                        code: code,
                        stdout: stdout,
                        stderr: stderr,
                        cwd: cwd,
                        time: Date.now() - startTime
                    });
                } else {
                    if (code !== 0) {
                        reject(new ExecuteError(cmd, args, cwd, stdout, stderr, code, Date.now() - startTime));
                    } else {
                        resolve(stdout);
                    }
                }
            }
        });
    });
}
let ExecuteError = class ExecuteError extends Error {
    constructor(cmd, args, cwd, stdout, stderr, code, time// ms
    ){
        super(`${cmd} ${args.join(' ')} in ${cwd} failed with exit code ${code}${stdout ? `\nstdout:\n${stdout}` : ''}${stderr ? `\nstderr:\n${stderr}` : ''}`), this.cmd = cmd, this.args = args, this.cwd = cwd, this.stdout = stdout, this.stderr = stderr, this.code = code, this.time = time;
    }
};
module.exports = execute;