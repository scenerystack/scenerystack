// Copyright 2025, University of Colorado Boulder

/**
 * Writes out a dependencies.json-format file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import fs from 'fs';
import execute from '../../perennial-alias/js/common/execute.js';
import { scenerystackRepos } from './data/scenerystackRepos.js';

export const writeDependencies = async () => {
  // dependencies.json
  {
    const dependenciesJSON: Record<string, string | { sha: string | null; branch: string | null }> = {
      comment: `# ${new Date().toString()}`
    };

    for ( const repo of scenerystackRepos ) {
      if ( !fs.existsSync( `../${repo}` ) ) {
        throw new Error( `repo not found: ${repo}` );
      }

      let sha = null;
      let branch = null;

      try {
        sha = ( await execute( 'git', [ 'rev-parse', 'HEAD' ], `../${repo}` ) ).trim();
        branch = ( await execute( 'git', [ 'rev-parse', '--abbrev-ref', 'HEAD' ], `../${repo}` ) ).trim();
      }
      catch( e ) {
        // We support repos that are not git repositories, see https://github.com/phetsims/chipper/issues/1011
        console.log( `Did not find git information for ${repo}` );
      }

      dependenciesJSON[ repo ] = { sha: sha, branch: branch };
    }

    fs.writeFileSync( './dependencies.json', JSON.stringify( dependenciesJSON, null, 2 ) );
  }
};