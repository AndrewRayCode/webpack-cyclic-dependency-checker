// Recursively search each module's dependencies for cycles
function isCyclicRecursive( modules, key, visited, recStack ) {

    if( !( key in visited ) && modules[ key ] ) {

        // Mark the current depdenncy id as visited and part of recursion stack
        visited[ key ] = true;

        // IDs can be numbers (when used in arrays) or strings (when used as
        // object keys) so protect against that as best as possible.
        recStack.push( key.toString() );
 
        const dependencies = modules[ key ];

        // Recurse for all the dependencies in this module looking for cycles
        const found = !!dependencies.find( dependencyId => {

            // Is there a cycle through this module's dependencies?
            const isUnvisitedCycle = (
                !( visited[ dependencyId ] ) &&
                isCyclicRecursive( modules, dependencyId, visited, recStack )
            );

            // Did a dependnecy cycle? We're done!
            if( isUnvisitedCycle ) {
                return true;

            // If we found this dependency before in the recursion stack, save
            // it to the stack. This will be the final dependency listed in
            // the array, and will pop up the call stack to the previous fn
            // call, and the above if branch will be hit
            } else if( recStack.indexOf( dependencyId.toString() ) > -1 ) {
                recStack.push( dependencyId.toString() );
                return true;
            }

        });

        // Return the recursion stack (walk of ids through the graph) if a
        // cycle detected
        if( found ) {
            return found;
        }
 
    }

    recStack.pop();
    return false;

}
 
// Loops over the modules and their dependencies searching for cycles. Returns
// array of IDs if cycle found. This is based on the horrendous code
// http://www.geeksforgeeks.org/archives/18212 which is a "depth first" search
// algorithm. Is all C++ code like this??
function isCyclic( modules ) {

    // Mark all the vertices as not visited and not part of recursion
    // stack
    const keys = Object.keys( modules );

    const visited = {};
    const recStack = [];
 
    // Call the recursive helper function to detect cycle in different
    // DFS trees
    for( var i = 0; i < keys.length; i++ ) {
        if( isCyclicRecursive( modules, keys[ i ], visited, recStack ) ) {

            // We could get something like [ 0, 1, 2, 3, 1 ], where the cycle
            // doesn't include 0, but we started searching at 0. Only ouptput
            // the graph starting from the actual cycle, which is just where
            // the first and last element of the array are the same
            return recStack.slice(
                recStack.indexOf( recStack[ recStack.length - 1 ] )
            );
        }
    }
 
    return null;

}

// Webpack output paths will contain node_modules and often the tilde string
// if they come from node_modules
function isNodeModulePath( path ) {
    return !!(
        !path ||
        path.toString().indexOf( 'node_modules' ) > -1 ||
        path.toString().indexOf( './~/' ) > -1
    );
}

// Convert webpack stats.json input, which looks something like:
// {
//  modules: [
//      id: 1,
//      reasons: [{ name: 2, moduleId: 2 }]
//  ]
// }
// into a graph:
// {
//      2: [ 1 ]
// }
// Essentially grouping it by requirer, not by required file
function getDependencyGraphFromStats( stats, includeNodeModules ) {

    // remove all required modules that are node_modules if specified
    const modules = includeNodeModules ?
        stats.modules :
        stats.modules.filter( m => !isNodeModulePath( m.name ) );

    return modules.reduce( ( memo, modjule ) => {

        return modjule.reasons.reduce( ( memo, reason ) => {
            const existing = memo[ reason.moduleId ] || [];

            // ignore parent/caller modules that are in node_modules. This
            // likely is impossible because it would mean a node_module
            // includes a userland script
            if( !includeNodeModules && isNodeModulePath( reason.moduleId ) ) {
                return memo;
            }

            const newAssign = {};
            newAssign[ reason.moduleId ] = existing.concat( modjule.id );

            return Object.assign( {}, memo, newAssign );

        }, memo );

    }, {} );

}

module.exports = {
    isCyclic: isCyclic,
    getDependencyGraphFromStats: getDependencyGraphFromStats
};
