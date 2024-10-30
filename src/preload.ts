import './minimal-preload';

import $ from 'jquery';
import paper from 'paper';

// @ts-ignore
self.$ = $;

// @ts-ignore
self.paper = paper;

import './query-string-machine/js/QueryStringMachine.js';

self.phet.chipper.packageObject = {
  'name': 'scenerystack'
};
self.phet.chipper.stringRepos = [
  {
    'repo': 'joist',
    'requirejsNamespace': 'JOIST'
  },
  {
    'repo': 'scenery-phet',
    'requirejsNamespace': 'SCENERY_PHET'
  },
  {
    'repo': 'sun',
    'requirejsNamespace': 'SUN'
  },
  {
    'repo': 'tambo',
    'requirejsNamespace': 'TAMBO'
  },
  {
    'repo': 'vegas',
    'requirejsNamespace': 'VEGAS'
  }
];
self.phet.chipper.strings = {
  en: {
    "SCENERY_PHET/scenery-phet.title": "scenery-phet demo",
    "SCENERY_PHET/screen.buttons": "Buttons",
    "SCENERY_PHET/screen.components": "Components",
    "SCENERY_PHET/screen.dialogs": "Dialogs",
    "SCENERY_PHET/screen.keyboard": "Keyboard",
    "SCENERY_PHET/screen.sliders": "Sliders",
    "SCENERY_PHET/screen.spinners": "Spinners",
    "SCENERY_PHET/WavelengthSlider.pattern_0wavelength_1units": "{0} {1}",
    "SCENERY_PHET/frequencyUnitsPattern": "{{frequency}} THz",
    "SCENERY_PHET/stopwatchValueUnitsPattern": "{{value}} {{units}}",
    "SCENERY_PHET/units_nm": "nm",
    "SCENERY_PHET/shortCircuit": "Short circuit!",
    "SCENERY_PHET/heat": "Heat",
    "SCENERY_PHET/cool": "Cool",
    "SCENERY_PHET/key.tab": "Tab",
    "SCENERY_PHET/key.shift": "Shift",
    "SCENERY_PHET/key.alt": "Alt",
    "SCENERY_PHET/key.option": "Option",
    "SCENERY_PHET/key.k": "K",
    "SCENERY_PHET/key.l": "L",
    "SCENERY_PHET/key.capsLock": "Caps Lock",
    "SCENERY_PHET/key.enter": "Enter",
    "SCENERY_PHET/key.space": "Space",
    "SCENERY_PHET/key.esc": "Esc",
    "SCENERY_PHET/key.fn": "Fn",
    "SCENERY_PHET/key.pageUp": "Pg Up",
    "SCENERY_PHET/key.pageDown": "Pg Dn",
    "SCENERY_PHET/key.home": "Home",
    "SCENERY_PHET/key.end": "End",
    "SCENERY_PHET/key.a": "A",
    "SCENERY_PHET/key.c": "C",
    "SCENERY_PHET/key.d": "D",
    "SCENERY_PHET/key.r": "R",
    "SCENERY_PHET/key.s": "S",
    "SCENERY_PHET/key.w": "W",
    "SCENERY_PHET/key.one": "1",
    "SCENERY_PHET/key.two": "2",
    "SCENERY_PHET/key.three": "3",
    "SCENERY_PHET/key.toGrabOrRelease": "to <b>Grab</b> or <b>Release</b>",
    "SCENERY_PHET/webglWarning.title": "Running with low graphics quality",
    "SCENERY_PHET/webglWarning.body": "WebGL is not enabled or not available. Click to learn more.",
    "SCENERY_PHET/webglWarning.contextLossFailure": "Sorry, a graphics error has occurred.",
    "SCENERY_PHET/webglWarning.contextLossReload": "Reload",
    "SCENERY_PHET/webglWarning.ie11StencilBody": "Update Internet Explorer by installing recommended Windows Update patches.",
    "SCENERY_PHET/keyboardHelpDialog.sliderControls": "Slider Controls",
    "SCENERY_PHET/keyboardHelpDialog.adjustSlider": "Adjust slider",
    "SCENERY_PHET/keyboardHelpDialog.spinnerControls": "Spinner Controls",
    "SCENERY_PHET/keyboardHelpDialog.adjustInSmallerSteps": "Adjust in smaller steps",
    "SCENERY_PHET/keyboardHelpDialog.adjustInLargerSteps": "Adjust in larger steps",
    "SCENERY_PHET/keyboardHelpDialog.jumpToMinimum": "Jump to minimum",
    "SCENERY_PHET/keyboardHelpDialog.jumpToMaximum": "Jump to maximum",
    "SCENERY_PHET/keyboardHelpDialog.adjust": "Adjust",
    "SCENERY_PHET/keyboardHelpDialog.slider": "slider",
    "SCENERY_PHET/keyboardHelpDialog.spinner": "spinner",
    "SCENERY_PHET/keyboardHelpDialog.heatCoolControls": "Heat/Cool Controls",
    "SCENERY_PHET/keyboardHelpDialog.maximumHeat": "Maximum heat",
    "SCENERY_PHET/keyboardHelpDialog.maximumCool": "Maximum cool",
    "SCENERY_PHET/keyboardHelpDialog.heatCoolOff": "Off",
    "SCENERY_PHET/keyboardHelpDialog.verbSliderPattern": "{{verb}} {{slider}}",
    "SCENERY_PHET/keyboardHelpDialog.verbInSmallerStepsPattern": "{{verb}} in smaller steps",
    "SCENERY_PHET/keyboardHelpDialog.verbInLargerStepsPattern": "{{verb}} in larger steps",
    "SCENERY_PHET/keyboardHelpDialog.minimum": "minimum",
    "SCENERY_PHET/keyboardHelpDialog.maximum": "maximum",
    "SCENERY_PHET/keyboardHelpDialog.jumpToMinimumPattern": "Jump to {{minimum}}",
    "SCENERY_PHET/keyboardHelpDialog.jumpToMaximumPattern": "Jump to {{maximum}}",
    "SCENERY_PHET/keyboardHelpDialog.generalNavigation": "General Navigation",
    "SCENERY_PHET/keyboardHelpDialog.basicActions": "Basic Actions",
    "SCENERY_PHET/keyboardHelpDialog.moveToNextItem": "Move to next item",
    "SCENERY_PHET/keyboardHelpDialog.moveToPreviousItem": "Move to previous item",
    "SCENERY_PHET/keyboardHelpDialog.moveToNextItemOrGroup": "Move to next item or group",
    "SCENERY_PHET/keyboardHelpDialog.moveToPreviousItemOrGroup": "Move to previous item or group",
    "SCENERY_PHET/keyboardHelpDialog.pressButtons": "Press buttons",
    "SCENERY_PHET/keyboardHelpDialog.moveBetweenItemsInAGroup": "Move between items in a group",
    "SCENERY_PHET/keyboardHelpDialog.setValuesInKeypad": "Set values within keypad",
    "SCENERY_PHET/keyboardHelpDialog.resetAll": "Reset All",
    "SCENERY_PHET/keyboardHelpDialog.exitADialog": "Exit a dialog",
    "SCENERY_PHET/keyboardHelpDialog.toggleCheckboxes": "Toggle checkboxes",
    "SCENERY_PHET/keyboardHelpDialog.or": "or",
    "SCENERY_PHET/keyboardHelpDialog.hyphen": "-",
    "SCENERY_PHET/keyboardHelpDialog.grabOrReleaseHeadingPattern": "Grab or Release {{thing}}",
    "SCENERY_PHET/keyboardHelpDialog.grabOrReleaseLabelPattern": "Grab or release {{thing}}",
    "SCENERY_PHET/keyboardHelpDialog.comboBox.chooseAThingPattern": "Choose a {{thingTitle}}",
    "SCENERY_PHET/keyboardHelpDialog.comboBox.headingString": "Change Choice",
    "SCENERY_PHET/keyboardHelpDialog.comboBox.popUpListPattern": "1. Show {{thingPlural}}",
    "SCENERY_PHET/keyboardHelpDialog.comboBox.moveThroughPattern": "2. Move through {{thingPlural}}",
    "SCENERY_PHET/keyboardHelpDialog.comboBox.chooseNewPattern": "3. Change {{thingSingular}}",
    "SCENERY_PHET/keyboardHelpDialog.comboBox.closeWithoutChanging": "4. Close without changing",
    "SCENERY_PHET/keyboardHelpDialog.comboBox.options": "choices",
    "SCENERY_PHET/keyboardHelpDialog.comboBox.option": "choice",
    "SCENERY_PHET/keyboardHelpDialog.moveDraggableItems": "Move Draggable Items",
    "SCENERY_PHET/keyboardHelpDialog.move": "Move",
    "SCENERY_PHET/keyboardHelpDialog.moveSlower": "Move slower",
    "SCENERY_PHET/speed.normal": "Normal",
    "SCENERY_PHET/speed.slow": "Slow",
    "SCENERY_PHET/keyboardHelpDialog.faucetControls.faucetControls": "Faucet Controls",
    "SCENERY_PHET/keyboardHelpDialog.faucetControls.adjustFaucetFlow": "Adjust faucet flow",
    "SCENERY_PHET/keyboardHelpDialog.faucetControls.adjustInSmallerSteps": "Adjust in smaller steps",
    "SCENERY_PHET/keyboardHelpDialog.faucetControls.adjustInLargerSteps": "Adjust in larger steps",
    "SCENERY_PHET/keyboardHelpDialog.faucetControls.closeFaucet": "Close faucet",
    "SCENERY_PHET/keyboardHelpDialog.faucetControls.openFaucetFully": "Open faucet fully",
    "SCENERY_PHET/keyboardHelpDialog.faucetControls.openFaucetBriefly": "Open faucet briefly",
    "SCENERY_PHET/keyboardHelpDialog.timingControls.timingControls": "Timing Controls",
    "SCENERY_PHET/keyboardHelpDialog.timingControls.pauseOrPlayAction": "Pause or play action",
    "SCENERY_PHET/speed.fast": "Fast",
    "SCENERY_PHET/symbol.ohms": "Ω",
    "SCENERY_PHET/symbol.resistivity": "ρ",
    "SCENERY_PHET/comboBoxDisplay.valueUnits": "{{value}} {{units}}",
    "SCENERY_PHET/wavelengthNMValuePattern": "{0} nm",
    "SCENERY_PHET/measuringTapeReadoutPattern": "{{distance}} {{units}}",
    "SCENERY_PHET/wavelength": "Wavelength",
    "SCENERY_PHET/rulerCapitalized": "Ruler",
    "SCENERY_PHET/ruler": "Ruler",
    "SCENERY_PHET/zero": "zero",
    "SCENERY_PHET/one": "one",
    "SCENERY_PHET/two": "two",
    "SCENERY_PHET/three": "three",
    "SCENERY_PHET/four": "four",
    "SCENERY_PHET/five": "five",
    "SCENERY_PHET/six": "six",
    "SCENERY_PHET/seven": "seven",
    "SCENERY_PHET/eight": "eight",
    "SCENERY_PHET/nine": "nine",
    "SCENERY_PHET/ten": "ten",

    'SCENERY_PHET/a11y.keyboardHelpDialog.general.resetAllDescriptionPattern': 'Reset All with {{altOrOption}} plus R.',

    "VEGAS/vegas.title": "vegas demo",
    "VEGAS/screen.components": "Components",
    "VEGAS/screen.finiteChallenges": "Finite Challenges",
    "VEGAS/screen.infiniteChallenges": "Infinite Challenges",
    "VEGAS/pattern.0challenge.1max": "Challenge {0} of {1}",
    "VEGAS/pattern.0hours.1minutes.2seconds": "{0}:{1}:{2}",
    "VEGAS/pattern.0minutes.1seconds": "{0}:{1}",
    "VEGAS/keepTrying": "Keep Trying",
    "VEGAS/good": "Good!",
    "VEGAS/great": "Great!",
    "VEGAS/excellent": "Excellent!",
    "VEGAS/yourNewBest": "(Your New Best!)",
    "VEGAS/pattern.0yourBest": "(Your Best: {0})",
    "VEGAS/continue": "Continue",
    "VEGAS/label.level": "Level: {0}",
    "VEGAS/label.scorePattern": "Score: {0}",
    "VEGAS/check": "Check",
    "VEGAS/next": "Next",
    "VEGAS/button.newGame": "New Game",
    "VEGAS/showAnswer": "Show Answer",
    "VEGAS/label.time": "Time: {0}",
    "VEGAS/label.score.max": "Score: {0} out of {1}",
    "VEGAS/tryAgain": "Try Again",
    "VEGAS/selectLevel": "Select Level",
    "VEGAS/startOver": "Start Over",
    "VEGAS/pattern.score.number": "Score: {{score}}",
    "VEGAS/keepGoing": "Keep Going",
    "VEGAS/newLevel": "New Level",
    "VEGAS/score": "Score:",
    "VEGAS/done": "Done",
    "VEGAS/youCompletedAllLevels": "You completed all levels!",
    "VEGAS/chooseYourLevel": "Choose Your Level!",
  }
};
self.phet.chipper.stringMetadata = {};
self.phet.chipper.localeData = {
  'en': {
    'locale3': 'eng',
    'englishName': 'English',
    'localizedName': 'English',
    'direction': 'ltr'
  }
};

