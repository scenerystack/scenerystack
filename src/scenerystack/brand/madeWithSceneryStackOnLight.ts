/* eslint-disable */
/* @formatter:off */

import asyncLoader from '../../phet-core/js/asyncLoader.js';
import { madeWithSceneryStackOnLightDataURI } from './madeWithSceneryStackOnLightDataURI.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = madeWithSceneryStackOnLightDataURI;
export default image;