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

This will clone all of the needed SceneryStack repositories into the current directory.

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