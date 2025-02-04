// Copyright 2025, University of Colorado Boulder

/**
 * List of namespace accesses that are allowed (not stripped out when namespaces
 * are stripped out).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// We won't remove these namespaces, because they seem to be used internally
export const allowedNamespaces = [
  // noted circularity
  'dot.Quaternion',

  // used for assignment
  'kite.svgPath',
  'kite.Edge',

  // unclassified
  'brand.Brand',
  'joist.ScreenshotGenerator'
];