/* eslint-disable */
/* @formatter:off */

import asyncLoader from '../../phet-core/js/asyncLoader.js';
import { madeWithSceneryStackSplashDataURI } from './madeWithSceneryStackSplashDataURI.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = madeWithSceneryStackSplashDataURI;
export default image;