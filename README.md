scenerystack
=======

Built version of SceneryStack, a framework for multimodal and inclusive Interactive Web Applications using Typescript.

See [scenerystack.org](https://scenerystack.org) for more information.

## Installation

```bash
npm install scenerystack
```

## Building Latest Sources

In an empty directory, run:

```bash
npx scenerystack checkout
```

This will clone all of the needed SceneryStack repositories into the current directory. If run multiple times, it will update the checkout with newer sources.

To build, then run:

```bash
npx scenerystack build
```

The build version of scenerystack will be available under `./scenerystack`. You can refer to this built copy in your package.json's dependencies with `"scenerystack": "file:../scenerystack""` (or equivalent path).

## Building Specific Versions

Alternatively if you want to make modifications to a specific version of the scenerystack package, you can check out a specific version and build:

```bash
npx scenerystack checkout 0.0.14
npx scenerystack build
```

## Modifying SceneryStack

SceneryStack code is split across multiple repositories. All of these repositories will be cloned into the current directory when you run `npx scenerystack checkout`. You can make modifications to any of these repositories, and then run `npx scenerystack build` to build the entire stack.

[scenerystack.org](https://scenerystack.org) has more information about each repository. All of the repositories are hosted at https://github.com/phetsims/, e.g. https://github.com/phetsims/scenery.