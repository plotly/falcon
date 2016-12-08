import {parseCSV} from '../../backend/parse.js';
import {assert} from 'chai';

const TEST_CASES = [
    {
        input: 'Aardvark,Banana Camel\n3.14,4',
        output: [['Aardvark', 'Banana Camel'], ['3.14', '4']],
        name: 'simple'
    },
    {
        input: 'Aardvark,"Banana, Camel"\n3.14,4',
        output: [['Aardvark', 'Banana, Camel'], ['3.14', '4']],
        name: 'Quote protected commas'
    },
    {
        input: 'Aardvark, " Banana, Camel"\n3.14, 2015-01-01 12:10:14',
        output: [['Aardvark', ' Banana, Camel'], ['3.14', '2015-01-01 12:10:14']],
        name: 'Extra spaces and dates'
    },
    {
        input: 'Single',
        output: [['Single']],
        name: 'single entry'
    },
    {
        input: '',
        output: [[], []],
        name: 'Empty'
    }
];

describe('parseCSV', function(){
    TEST_CASES.forEach(function(testCase) {
        const {name, input, output} = testCase;
        it(`Parses a simple CSV string for test case ${name}`, function(done) {
            parseCSV(input).then(function(rowsAndColumns){
                assert.deepEqual(
                    output[0], rowsAndColumns.columnnames
                );
                assert.deepEqual(
                    output.slice(1), rowsAndColumns.rows
                );
                done();
            }).catch(done);
        });
    });
});
