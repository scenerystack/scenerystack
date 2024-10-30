self.phet = self.phet || {};
self.phet.chipper = self.phet.chipper || {};

import _ from 'lodash';
import he from 'he';
import { LineBreaker } from 'linebreak-ts';
import FlatQueue from 'flatqueue';
import base64js from 'base64-js';
import TextEncoder from 'text-encoder-lite';

// @ts-ignore
self._ = _;

// @ts-ignore
self.he = he;

// @ts-ignore
self.LineBreaker = LineBreaker;

// @ts-ignore
self.FlatQueue = FlatQueue;

// @ts-ignore
self.byteLength = base64js.byteLength;
// @ts-ignore
self.toByteArray = base64js.toByteArray;
// @ts-ignore
self.fromByteArray = base64js.fromByteArray;

// @ts-ignore
self.TextEncoderLite = TextEncoder.TextEncoderLite;
// @ts-ignore
self.TextDecoderLite = TextEncoder.TextDecoderLite;

import './assert/js/assert.js';
import './tandem/js/PhetioIDUtils.js';