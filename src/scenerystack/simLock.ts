import { asyncLoader } from '../phet-core.js';

export const simLock = asyncLoader.createLock( { name: 'simLock' } )