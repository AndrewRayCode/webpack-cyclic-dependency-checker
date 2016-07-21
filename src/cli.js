#!/usr/bin/env node
// Needed for this to be executed as a command line utility

const cyclicUtils = require('./');
const path = require('path');
const fs = require('fs');
const commandLineArgs = require('command-line-args');

const usage = '    Usage: iscyclic stats.json [--include-node-modules]';
const options = commandLineArgs([
    { name: 'include-node-modules', type: Boolean },
]);

const fileName = process.argv[ 2 ];
if( !fileName ) {
    console.error( 'No filename was passed to this script!' );
    console.error( usage );
    process.exit( 1 );
}

// Verify the existence of the stats.json file passed in...
const filePath = path.join( process.cwd(), process.argv[ 2 ] );

try {
    // This command throws if file isn't found
    const stats = fs.lstatSync( filePath );

    // Lol flow control
    if( !stats.isFile() ) {
        throw new Error();
    }
} catch( e ) {
    console.error( 'Input file ' + filePath + ' was not found!' );
    console.error( usage );
    process.exit( 1 );
}

const statsJson = require( filePath );

const dependencyGraph = cyclicUtils.getDependencyGraphFromStats(
    statsJson, options[ 'include-node-modules' ]
);

const cycle = cyclicUtils.isCyclic( dependencyGraph );
if( cycle ) {

    console.log( 'Detected cycle!' );
    console.log( cycle.map( id => {
        const mod = statsJson.modules.find(
            mod => mod.id.toString() === id.toString()
        );
        if( mod ) {
            return '(' + id + ') ' + mod.name;
        }
    }).filter( m => !!m ).join( ' -> ' ) );
    return true;

} else {

    console.log( 'No cycle detected in', filePath );

}
