# Changelog

## [Unreleased]

## [2.0.1] - 2025-04-15

### Fixed

- `splash` was incorrectly included in joist exports, thus breaking scrolling/zoom on standalone SceneryStack.

## [2.0.0] - 2025-04-15

### Changed

- `asyncLoader` behavior changed to allow multiple stages, and a built-in lock that will prevent early triggering of listeners. If waiting for asyncLoader listeners directly (not using `onReadyToLaunch`), you will need to call `asyncLoader.stageComplete()` once you have kicked off loading of all resources. 
- `DOM` Nodes now explicitly require size-constrained elements. Beforehand, div elements would be limited to 65536px in width, but now will be precisely measured. Ensure DOM elements will have a computed width/height, and will not expand to fit.
- `alertDescriptionUtterance` on Nodes was renamed to `addAccessibleResponse`.
- `looksOverProperty` on ButtonModel/PressListener was renamed to `isOverOrFocusedProperty`.
- `pdomAttributes` on `AccessibleDraggableOptions` was changed to directly use `accessibleRoleDescription`.
- `QueryStringMachine` now strictly typed.
- `GroupSortInteractionView` was refactored and has appearance changes.
- `BooleanRectangularToggleButton`: added default accessibleName.
- Sims: default brand changed to `made-with-scenerystack` (instead of `adapted-from-phet`).
- Sims: `init()` defaults for simFeatures were improved to be more consistent with the default features of SceneryStack.
- `GameTimer`: `isRunningProperty` is now private, and `isRunning()` should be used.

### Removed

- pdomHeading - Should be replaced with the `accessibleHeading`/`accessibleHeadingIncrement` feature.
- jQuery dependency removed (unnecessary, and was causing deprecation warnings on NPM install)
- `allowOverlap` on `Hotkey`/`KeyboardListener`/`GrabDragInteraction` - Use the `overlapBehavior` property instead.
- `AccessibleNumberSpinner`: removed `accessibleRoleDescription` (see the option on `Node`)
- `PeakDetectorAudioNode` and `peak-detector`, since they were marked as experimental and resulted in console errors on sim runs.
- Sims: `isDebugBuild` in `init()` was removed as an option, since it only controlled assertions (which are now much more directly controlled).
- Sims: `supportsTier1Voicing` in `init()` was removed, since it is a PhET-specific simulation term. `supportsVoicing` can be used instead.
- Sims: `phetSplashScreenDownloadComplete` global - now uses modules for the complete event.

### Added

- `made-with-scenerystack` brand, and associated images (splash under `scenerystack/init`, others under `scenerystack/brand`).
- `Node`: `accessibleHeading`/`accessibleHeadingIncrement` - Feature that will auto-compute heading levels.
- `Display`: `baseHeadingLevel` - option to control the base heading level for headings created with `accessibleHeading`.
- `Node`: `accessibleParagraphContent` - lower-level API for setting accessible paragraph content.
- `Node`: `accessibleParagraphBehavior` - allows controlling what changes are applied when `accessibleParagraph` is set.
- `Node`: `accessibleRoleDescription` - sets an aria-roledescription, describing its interactive purpose and user interaction methods.
- `Voicing`: `voicingPressable` - if true, a VoicingActivationResponseListener will be added so that responses are spoken when you press on the Node.
- `Color`: `getHSLA`/`getHue`/`getSaturation`/`getLightness`.
- `LocalizedStringProperty.getTranslatedStringProperty` - allows getting specific translated string properties for a given locale.
- `isDevelopment`/`isProduction` - under `scenerystack/init`, provides global flags for which environment is being used.
- Runtime `phet.chipper.isSceneryStack` flag set to true for SceneryStack (allows disabling assertions that are specific to PhET simulations).
- More nitroglycerin view nodes: `H2O2Node`, `N205Node`, `PNode`.
- `InteractiveHighlighting.forwardInteractiveHighlightFromPress`, with forwarding in `DragListener`.
- `NumberPicker`: `backgroundStrokeDisabledOpacity`/`arrowDisabledOpacity`.
- `overlapBehavior` on `Hotkey`/`KeyboardListener`/`GrabDragInteraction` - Describes how to handle overlapping hotkeys: 'prevent' | 'allow' | 'handle'.
- (assorted translated strings)

### Fixed

- Assertions through `scenerystack/assert` should now be functioning normally. In 1.0.0, the exported `assert` would not update, and many assertions were not run.
- Assorted internal fixes that failed due to assertions now working (e.g. supportsPanAndZoom option). Includes fully stripping assertions/logging that were erroneously included in 1.0.0.
- Sims: splash screen more explicitly launched at the start, and fixed with newer asyncLoader.
- Sims: navbar alignment of custom brand images has been fixed (with vertical alignment).

## [1.0.0] - 2025-03-11