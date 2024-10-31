// Copyright 2024, University of Colorado Boulder

/**
 * "Barrel" file for twixt, so that we can export all of the API of the repo.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

export { default as Animation } from './twixt/js/Animation.js';
export type { AnimationOptions } from './twixt/js/Animation.js';
export { default as DampedAnimation } from './twixt/js/DampedAnimation.js';
export type { DampedAnimationOptions } from './twixt/js/DampedAnimation.js';
export { default as Easing } from './twixt/js/Easing.js';
export { default as Transition } from './twixt/js/Transition.js';
export type { PartialTransitionOptions, SlideTransitionOptions, WipeTransitionOptions, DissolveTransitionOptions, TransitionOptions } from './twixt/js/Transition.js';
export { default as TransitionNode } from './twixt/js/TransitionNode.js';
export type { TransitionNodeOptions } from './twixt/js/TransitionNode.js';
export { default as twixt } from './twixt/js/twixt.js';
