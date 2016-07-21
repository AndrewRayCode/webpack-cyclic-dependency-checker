const chai = require('chai');
const expect = chai.expect;

const cyclicUtils = require('../src/index.js');

// These tests could use some slimming down but they work for now

describe( 'getDependencyGraphFromStats', () => {

    it('gets dependencies from stats', () => {

        const id1 = '1';
        const id2 = '2';

        const input = {
            modules: [{
                name: id1,
                id: id1,
                reasons: [{
                    name: id2,
                    moduleId: id2
                }]
            }, {
                name: id2,
                id: id2,
                reasons: [{
                    name: id1,
                    moduleId: id1
                }]
            }]
        };

        const results = cyclicUtils.getDependencyGraphFromStats( input );

        // The result should be the above graph inverted. The above input
        // basically says "id1" is in this bundle because "id2" required it
        // (the "reason"). We need to invert it to show that id2 requires id1
        const expectedResults = {};
        expectedResults[ id1 ] = [ id2 ];
        expectedResults[ id2 ] = [ id1 ];

        expect( results ).to.deep.equal( expectedResults );

    });

    it('ignores node modules by default', () => {

        const id1 = '1';
        const id2 = './~/2';
        const id3 = 'node_modules/2';
        const id4 = '4';

        const input = {
            modules: [{
                name: id1,
                id: id1,
                reasons: [{
                    name: id2,
                    moduleId: id2
                }]
            }, {
                name: id2,
                id: id2,
                reasons: [{
                    name: id1,
                    moduleId: id1
                }]
            }, {
                name: id3,
                id: id3,
                reasons: [{
                    name: id4,
                    moduleId: id4
                }]
            }, {
                name: id4,
                id: id4,
                reasons: [{
                    name: id1,
                    moduleId: id1
                }]
            }]
        };

        const results = cyclicUtils.getDependencyGraphFromStats( input );

        // Modules starting with ./~/ and node_modules (I don't know when/why
        // webpack picks one over the other are third party dependencies and
        // are ignored by default
        const expectedResults = {};

        // Should only have a top level id1 in here. Listing node_module in
        // deps is fine. Won't happen in real world
        expectedResults[ id1 ] = [ id4 ];

        expect( results ).to.deep.equal( expectedResults );
        expect( results ).to.not.include.key( id2 );
        expect( results ).to.not.include.key( id3 );

    });

    it('includes node modules with flag', () => {

        const id1 = '1';
        const id2 = './~/2';
        const id3 = 'node_modules/2';

        const input = {
            modules: [{
                name: id1,
                id: id1,
                reasons: [{
                    name: id2,
                    moduleId: id2
                }]
            }, {
                name: id2,
                id: id2,
                reasons: [{
                    name: id1,
                    moduleId: id1,
                }],
            }, {
                name: id3,
                id: id3,
                reasons: [{
                    name: id1,
                    moduleId: id1,
                }],
            }]
        };

        const results = cyclicUtils.getDependencyGraphFromStats( input, true );

        // id1 and id2 should go in the graph
        const expectedResults = {};
        expectedResults[ id1 ] = [ id2, id3 ];
        expectedResults[ id2 ] = [ id1 ];
        expect( results ).to.deep.equal( expectedResults );

        // Nothing is in the bundle because of id3, so it shouldn't get added
        expect( results ).to.not.include.key( id3 );

    });

});

describe( 'isCyclic', () => {

    it( 'detects self cycle', () => {

        const id = '1';

        const input = {};
        input[ id ] = [ id ];

        expect( cyclicUtils.isCyclic( input ) ).to.deep.equal( [ id, id ] );

    });

    it( 'detects 2 file cycle', () => {

        const id1 = '1';
        const id2 = '2';

        const input = {};
        input[ id1 ] = [ id2 ];
        input[ id2 ] = [ id1 ];

        expect( cyclicUtils.isCyclic( input ) ).to.deep.equal( [ id1, id2, id1 ] );

    });

    it( 'detects 3 file cycle', () => {

        const id1 = '1';
        const id2 = '2';
        const id3 = '3';

        const input = {};
        input[ id1 ] = [ id2 ];
        input[ id2 ] = [ id3 ];
        input[ id3 ] = [ id1 ];

        expect( cyclicUtils.isCyclic( input ) ).to.deep.equal( [ id1, id2, id3, id1 ] );

    });

    it( 'detects no cycle in no cycle graph', () => {

        const id1 = '1';
        const id2 = '2';
        const id3 = '3';

        const input = {};
        input[ id1 ] = [ id2 ];
        input[ id2 ] = [ id3 ];
        input[ id3 ] = [];

        expect( cyclicUtils.isCyclic( input ) ).to.equal( null );

    });

});
