# Webpack Cylic Dependency Checker

This tool analyzes your Webpack stats.json file to look for cyclic dependencies using "depth first" traversal. It detects cycles between any number of files, as well as files that require themeselves.

**Why?** Some tools like [Flow](https://flowtype.org/), and some editors, will crash or hang forever when trying to analyze projects that use cyclic dependencies. Also cyclic dependencies are often a symptom of poorly organized code. Detecting them can help clean up a project. See the [examples of cycle](https://github.com/DelvarWorld/webpack-cyclic-dependency-checker#examples-of-cycles) for a demonstration.

## Install

```sh
npm install --save-dev webpack-cyclic-dependency-checker
```
## Command Line Usage

First, generate a Webpack stats.json file by passing in the `--json` flag. The full command might look something like:

```sh
webpack --json --config webpack.config.js > stats.json
```

Then pass the relative stats.json file path to this tool:

```sh
iscyclic stats.json
```

If there's a cycle in your dependencies, the output will resemble:

```sh
Detected cycle!
(14) ./src/index.js -> (327) ./src/components/HomePage.js -> (14) ./src/index.js
```

You can see in this example output `./src/index.js` is repeated at the beginning and end. That's showing the full cycle.

The numbers are the Webpack module IDs. This tool won't show the specific lines of the require / import statements, but it's fairly simple to find those lines in the specified files

## Command Line Options

#### `--include-node-modules`

By default all dependencies inside `node_modules` are ignored. This tool is mainly designed to detect cycles in your source code. If you want to include searching for cycles in external dependencies, use the `--include-node-modules` flag:

```sh
iscyclic stats.json --include-node-modules
```

## Use in Node.js

You can require the functions used in this library directly in Node.js.


```js
const cyclicUtils = require( 'cyclicUtils' );

const statsJson = require( './path/to/stats.json' );
const includeNodeModules = false;

const dependencyGraph = cyclicUtils.getDependencyGraphFromStats(
    statsJson, includeNodeModules
);

const cycle = cyclicUtils.isCyclic( dependencyGraph );
```

Check out [cli.js](https://github.com/DelvarWorld/webpack-cyclic-dependency-checker/blob/master/src/cli.js) to see how the output is parsed.

#### `getDependencyGraphFromStats( json:Object, includeNodeModules:booelan )`

Generates the dependency graph from Webpack's stats.json file. The output looks something like:

```js
{
    1: [ 2 ],
    2: [],
}
```

Where the key is the Webpack module ID, and the array is the IDs of each dependency.

#### `isCyclic( dependencyGraph:Object )`

Returns the an array of module IDs in the cycle if a cycle is detected. Otherwise returns `null`.

## Examples of Cycles

#### Cycle Through Multiple Files

**A.js**
```js
import B from './B.js';
```

**B.js**
```js
import C from './C.js';
```

**C.js**
```js
import A from './A.js';
```

This results in a cycle, from `A` to `B` to `C` with the "back edge" going from `C` to `A`.

#### Cycle Through Self

**A.js**
```
import { something } from './A';
export { something: true };
```

A cycle like this is usually a mistake in the code, but it's perfectly valid ES6 syntax.
