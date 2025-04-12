/* eslint-disable */
/* @formatter:off */

import asyncLoader from '../../phet-core/js/asyncLoader.js';
import { madeWithSceneryStackOnDarkDataURI } from './madeWithSceneryStackOnDarkDataURI.js';

const image = new Image();
const unlock = asyncLoader.createLock( image );
image.onload = unlock;
image.src = madeWithSceneryStackOnDarkDataURI;
export default image;