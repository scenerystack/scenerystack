import fs from 'fs';
import { extractDoc } from './extractDoc.js';

const testDoc = ( sourcePath: string ) => {
  const doc = extractDoc( fs.readFileSync( `./src/${sourcePath}`, 'utf-8' ), sourcePath );

  console.log( doc.debug );
  doc.debug = null;
  console.log( JSON.stringify( doc, null, 2 ) );
};

// testDoc( 'dot/js/Bounds2.ts' );
// testDoc( 'scenery/js/layout/nodes/AlignBox.ts' );
// testDoc( 'scenery/js/nodes/Node.ts' );
// testDoc( 'twixt/js/Animation.ts' );

// testDoc( 'axon/js/NumberProperty.ts' );
// testDoc( 'sun/js/ComboBoxButton.ts' );
// testDoc( 'joist/js/i18n/localeProperty.ts' );
testDoc( 'scenery/js/listeners/PressListener.ts' );
//
// // console.log( JSON.stringify( extractDoc( fs.readFileSync( './src/dot/js/Bounds2.ts', 'utf-8' ), 'dot/js/Bounds2.ts' ), null, 2 ) );
// console.log( JSON.stringify( extractDoc( fs.readFileSync( './src/scenery/js/layout/nodes/AlignBox.ts', 'utf-8' ), 'scenery/js/layout/nodes/AlignBox.ts' ), null, 2 ) );
