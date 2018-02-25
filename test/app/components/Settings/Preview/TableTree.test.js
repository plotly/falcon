jest.unmock('../../../../../app/components/Settings/Preview/TableTree.react.js');
jest.unmock('../../../../../app/constants/constants.js');
jest.unmock('../../../../../app/utils/utils.js');

import TableTree from '../../../../../app/components/Settings/Preview/TableTree.react.js';
import {DIALECTS} from '../../../../../app/constants/constants.js';
import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

//TODO
//1. Test isConnecting
//2. Test Store Schema.  Verify that creation of the tree
describe('Dialog Selector Test', () => {

    beforeAll(() => {
        configure({ adapter: new Adapter() });
    });

    it('should verify create table tree without tree schema', () => {
        const schemaRequest = {};
        const getSqlSchema = function() {};
        const updatePreview = function() {};

        const preview = {
        };
        const connectionObject = {
            database: 'plotly',
            dialect: 'mysql',
            storage: 'a'
        };

        const tree = mount(<TableTree
            schemaRequest={schemaRequest}
            getSqlSchema={getSqlSchema}
            updatePreview={updatePreview}
            preview={preview}
            connectionObject={connectionObject}
        />);

        //Note.  TableTree was crashing if treeSchema not defined
        expect(tree).toBeDefined();
    });

    it('should verify getLabel when dialect not dataworld or sqlite', () => {
        const schemaRequest = {};
        const getSqlSchema = function() {};
        const updatePreview = function() {};
        const preview = {
            treeSchema:{}
        };
        const connectionObject = {
            database: 'plotly',
            dialect: 'mysql',
            storage: 'a'
        };

        const tree = mount(<TableTree
            schemaRequest={schemaRequest}
            getSqlSchema={getSqlSchema}
            updatePreview={updatePreview}
            preview={preview}
            connectionObject={connectionObject}
        />);

        expect(tree.instance().getLabel(connectionObject)).toBe(connectionObject.database);
    });

    it('should verify getLabel when dialect sqlite', () => {
        const schemaRequest = {};
        const getSqlSchema = function() {};
        const updatePreview = function() {};
        const preview = {
            treeSchema:{}
        };
        const connectionObject = {
            dialect: 'sqlite',
            storage: '/home/user/dbs/plotly_datasets.db'
        };

        const tree = mount(<TableTree
            schemaRequest={schemaRequest}
            getSqlSchema={getSqlSchema}
            updatePreview={updatePreview}
            preview={preview}
            connectionObject={connectionObject}
        />);

        expect(tree.instance().getLabel(connectionObject)).toBe('plotly_datasets.db');
    });

});

