# Changelog

## [Unreleased]

## [3.0.0] - 2025-09-08

### Changed

- **Breaking:** `DerivedProperty.toFixed()` renamed to `DerivedProperty.toFixedProperty()` for consistency
- **Breaking:** `ButtonModel.produceSoundEmitter` renamed to `ButtonModel.fireCompleteEmitter` across all button models
- **Breaking:** `NumberDisplay.valueStringProperty` renamed to `NumberDisplay.accessibleValueStringProperty` for clearer visual/accessible string separation
- **Breaking:** `ToggleSwitch.leftValueContextResponse`/`rightValueContextResponse` renamed to `accessibleContextResponseLeftValue`/`accessibleContextResponseRightValue`
- **Breaking:** `Checkbox.checkedContextResponse`/`uncheckedContextResponse` renamed to `accessibleContextResponseChecked`/`accessibleContextResponseUnchecked`
- **Breaking:** `Checkbox.voicingCheckedObjectResponse`/`voicingUncheckedObjectResponse` renamed to `voicingObjectResponseChecked`/`voicingObjectResponseUnchecked`
- **Breaking:** `PlayControlButton.startPlayingLabel`/`endPlayingLabel` renamed to `startPlayingAccessibleName`/`endPlayingAccessibleName`
- **Breaking:** `NumberSpinner` individual arrow button styling options (`arrowButtonFill`, `arrowButtonStroke`, `arrowButtonLineWidth`) replaced with single `arrowButtonOptions` object
- **Breaking:** `AudioModel.toolbarEnabledProperty` renamed to `AudioModel.voicingToolbarEnabledProperty`
- **Breaking:** Query parameter `?supportsTier1Voicing` renamed to `?supportsCoreVoicing`
- **Breaking:** Query parameter `?printVoicingResponses` renamed to `?logVoicingResponses`
- **Breaking:** `VoicingNode` and `ReadingBlockNode` renamed to `TVoicingNode` and `TReadingBlockNode`
- **Breaking:** `eraser_png.ts` replaced with `eraser_svg.ts`
- **Breaking:** `VoicingPanelSection.contextResponseExpanded`/`contextResponseCollapsed` renamed to `accessibleContextResponseExpanded`/`accessibleContextResponseCollapsed` for consistency with accessibility naming patterns

### Added

- Add `PhetUnit` class with rich unit objects supporting visual/accessible string patterns, localization, and dependency tracking
- Add `ReadOnlyProperty` support for `units: Unit` in addition to string units for rich formatting capabilities
- Add automatic number formatting in `NumberDisplay`, `NumberControl`, and `Slider` when provided with `Unit`-typed properties
- Add `NumberFormatting` module with utilities like `getFormattedNumber`, `getFormattedVisualNumber`, `getFormattedAccessibleNumber`
- Add `AccessibleStrings` module with `DualString`, `DualStringNumber`, `DualValuePattern` types for dual visual/accessible formatting
- Add `DEFAULT_FORMATTED_NUMBER_VISUAL_OPTIONS` and `DEFAULT_FORMATTED_NUMBER_ACCESSIBLE_OPTIONS` constants for consistent formatting
- Add `StringUtils.toFixedLTR()` method for number formatting with automatic LTR wrapping for RTL text compatibility
- Add `TinyEmitter` and `Emitter` support for `disableListenerLimit` option to bypass assertion checks on listener count limits (used in high-frequency scenarios like `localeProperty`)
- Add `GatedEnabledProperty` and `GatedVisibleProperty` (split from `GatedBooleanProperty`)
- Add `RangedDynamicProperty`, `PhetioReadOnlyProperty`, and `EnumerationDeprecatedProperty` exports
- Add `DerivedProperty.toFixedProperty()` method for creating derived properties with fixed decimal precision
- Add `RANGE_PROPERTY_TANDEM_NAME` exported constant from `NumberProperty` for consistent tandem naming of range properties
- Add `Node.focusedProperty` lazily-created BooleanProperty indicating focus state with automatic cleanup on disposal
- Add complete drag listener forwarding system with `DragListener.createForwardingListener()`, `KeyboardDragListener.createForwardingListener()`, and `RichDragListener.createForwardingListener()`
- Add `ButtonNode` accessibility with `accessibleContextResponse` and `speakVoicingNameResponseOnFire` options for comprehensive button accessibility and voicing support
- Add `ToggleSwitch` accessibility with `accessibleContextResponseLeftValue` and `accessibleContextResponseRightValue` options
- Add `ComboBox` and `ComboBoxListBox` accessibility with `accessibleContextResponse` option for selection feedback
- Add `Checkbox` accessibility enhancements with `accessibleContextResponseChecked`/`accessibleContextResponseUnchecked` and separate voicing responses (`voicingContextResponseChecked`/`voicingContextResponseUnchecked`, `voicingObjectResponseChecked`/`voicingObjectResponseUnchecked`)
- Add `RoundMomentaryButton` and `RectangularMomentaryButton` accessibility with `accessibleContextResponseValueOn`/`accessibleContextResponseValueOff` options for context-aware accessibility responses
- Add `AquaRadioButton` accessibility with `accessibleContextResponse` option for providing accessible responses when radio button value changes
- Add `RectangularRadioButtonGroup` and `AquaRadioButtonGroup` comprehensive voicing support with `voicingNameResponse`, `voicingHintResponse`, and `speakVoicingNameResponseOnFocus` options
- Add `BucketFront` interactive highlighting extending `InteractiveHighlighting( Node )` instead of plain `Node`
- Add `BucketFront` gradient customization with `gradientLuminanceLeft` and `gradientLuminanceRight` options (defaults: 0.5 and -0.5)
- Add `NumberSpinner` enhanced configuration with `arrowButtonOptions` and `linkedElementOptions` for better customization and PhET-iO support
- Add `TimerToggleButton` customization with `offIconOptions` for timer off state appearance
- Add `PlayControlButton` accessibility enhancements with `accessibleContextResponse` and `voicingNameResponse` options
- Add `GroupSelectView` comprehensive accessibility with `grabbedRoleDescription`, `releasedRoleDescription`, `grabbedAccessibleContextResponse`, and `releasedAccessibleContextResponse` options
- Add `GroupSelectView` improved focus management that preserves selection state across focus changes
- Add `ZoomButtonGroup` accessibility options with `accessibleNameZoomIn`/`accessibleNameZoomOut` and `accessibleHelpTextZoomIn`/`accessibleHelpTextZoomOut` options
- Add `StopwatchNode` major accessibility overhaul with keyboard support, focus-based value readout, and enhanced time formatting (see [phetsims/scenery-phet#929](https://github.com/phetsims/scenery-phet/issues/929))
- Add `StopwatchNode` integration with `AccessibleDraggableOptions` for keyboard accessibility
- Add `StopwatchNode` focus listener with `addAccessibleContextResponse` for value readout and automatic LTR wrapping for RTL language support
- Add `RulerNode` PhET-iO instrumentation control with `instrumentUnitsLabelText` option (default: true) and enhanced type support for `majorTickLabels` accepting both `string[]` and `number[]`
- Add default sound players for `BackButton` with `sharedSoundPlayers.get( 'goBack' )` replacing custom SoundClip creation
- Add default sound players for `InfoButton` with `nullSoundPlayer` since info buttons typically open dialogs that make their own sounds
- Add `VoicingToolbar` system replacing legacy toolbar with `VoicingToolbarAlertManager` and `VoicingToolbarItem` components
- Add `VoicingToolbar` directory restructure from `joist/js/toolbar/` to `joist/js/voicingToolbar/` for better organization
- Add `AccessibleInteractiveOptions`, `AccessibleListNode`, and `BidirectionalControlChars` accessibility components
- Add `AccessibleListNode` with proper ARIA structure and `AccessibleListItem` type
- Add `ScreenSummaryContent` support for `AccessibleListNode` in `SectionContent` type for structured accessible content
- Add `ScreenSummaryContent` exported `SectionContent` and `ScreenSummaryContentOptions` types for better type support
- Add Fluent localization system with `FluentPattern`, `FluentConstant`, `FluentContainer`, `createFluentMessageProperty`, and `FluentVisitor`
- Add `FluentBundle` integration with enhanced `FluentBundlePattern` type and improved message/term handling
- Add ParallelDOM response methods: `addCategorizedResponse()`, `addAccessibleObjectResponse()`, `addAccessibleContextResponse()`, `addAccessibleHelpResponse()`
- Add BCP 47 locale integration with `bcp47LocaleProperty` automatically updating HTML `lang` attribute when locale changes (see [phetsims/chipper#1332](https://github.com/phetsims/chipper/issues/1332))
- Add WCAG size compliance with `?wcagSize` query parameter forcing all interactive elements to meet WCAG AA touch target size requirements (24x24 CSS pixels minimum, 44x44 for optimal)
- Add `WCAGSizeNode` component for WCAG-compliant size management
- Add enhanced voicing types `TVoicingNode` and `TReadingBlockNode` for better voicing integration (updated from `isVoicing` and `isReadingBlock` function return types)
- Add `RadioButtonGroupFocusListener` for improved radio button group focus handling
- Add `DescriptionContext` restoration with `ExternalLoadError` for description loading
- Add card interaction sounds with `CardSounds` generator and `cardMovementSoundClips` array
- Add complete set of individual card sound exports: `cardDrop_mp3`, `cardPickup_mp3`, `cardMovement1_mp3` through `cardMovement6_mp3`, `goBack_mp3`, `shareWhooshSound_mp3`
- Add `ChangeSoundPlayer` type to `ValueChangeSoundPlayer` options
- Add `FaucetNode` sound options with `grabSoundPlayer` and `releaseSoundPlayer` for sophisticated sound logic in different interaction scenarios
- Add `?fluentTable=<value>` query parameter for displaying Fluent localization tables during development
- Add `GrabDragInteraction` enhancements with new `grabbed` string support and improved documentation structure
- Add `FlowBox` accessibility with `accessibleHelpTextBehavior: HELP_TEXT_BEFORE_CONTENT` for proper help text positioning
- Add `fluentConstantFromStringProperty` and `fluentPatternFromStringProperty` utility functions for creating Fluent localization from string properties
- Add `StringUtils.toFixedNumberLTR()` method for number formatting with automatic LTR wrapping that removes trailing zeros (uses toFixedNumber)
- Add `ResetButton.adjustShapeForStroke` option for `ResetAllButton` to expand geometry and accommodate stroke styling
- Add structured keyboard help text support with `tabToGetStarted.accessibleHelpText` and `tabToGetStarted.readingBlockNameResponse` properties
- Add `PreferencesDialogConstants.trackFillLeft: null` option for ToggleSwitch default values in preferences
- Add Vietnamese translations for multiple preference strings including audio features, accessibility intro, and visual highlights

### Removed

- Remove legacy `Toolbar` class replaced by `VoicingToolbar` system with directory restructure from `joist/js/toolbar/` to `joist/js/voicingToolbar/`
- Remove `DescriptionContext.ts` and `DescriptionRegistry.ts` with functionality moved to other systems
- Remove complex line dash transformation system in `HighlightPath` in favor of simpler consistent dashing
- Remove `PlayPauseButton.voicingNameResponse` automatic generation and associated voicing context response override behavior

### Fixed

- Fix automatic LTR wrapping in `PatternStringProperty` for better RTL text support with `StringUtils.wrapLTR()` and `StringUtils.toFixedLTR()`
- Fix improved number formatting with automatic left-to-right Unicode marks for proper display in RTL contexts
- Fix `ResetAllButton` geometry by adjusting shape for stroke with proper margin calculations (changed from radius-based to fixed 0.75 margins)
- Fix Fluent localization system by migrating from deprecated `FluentPattern.fromStringProperty` to new `fluentPatternFromStringProperty` utility function across all fluent string files
- Fix ResetShape geometry calculation with stroke adjustment parameters for better visual consistency

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