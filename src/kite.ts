// Copyright 2024, University of Colorado Boulder

/**
 * Exports for under /kite
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// explicit exports because of scenery's Line and kite's Line
export {
  LineStyles, LINE_STYLE_DEFAULT_OPTIONS,
  Overlap,
  RayIntersection,
  SegmentIntersection,
  svgNumber,
  intersectConicMatrices,
  svgPath,
  Segment,
  Line as KiteLine,
  Quadratic,
  Cubic,
  Arc,
  EllipticalArc,
  Subpath,
  Shape,
  HalfEdge,
  Vertex,
  Edge,
  Face,
  Loop,
  Boundary,
  BoundsIntersection,
  SegmentTree,
  EdgeSegmentTree,
  VertexSegmentTree,
  Graph
} from './kite/js/imports.js';
export type {
  LineStylesOptions, LineCap, LineJoin,
  ClosestToPointResult, PiecewiseLinearOptions, DashValues, SerializedSegment,
  SerializedLine,
  SerializedQuadratic,
  SerializedCubic,
  SerializedArc,
  SerializedEllipticalArc,
  CornerRadiiOptions, SerializedShape, NonlinearTransformedOptions
} from './kite/js/imports.js';

export { default } from './kite/js/kite.js';