jest.unmock('../../../../../app/components/Settings/Preview/TableTree.react.js');
jest.unmock('../../../../../app/constants/constants.js');
jest.unmock('../../../../../app/utils/utils.js');

import TableTree from '../../../../../app/components/Settings/Preview/TableTree.react.js';
import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import sinon from 'sinon';

// TODO
// 1. Test isConnecting
// 2. Test Store Schema.  Verify that creation of the tree
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

        // Note.  TableTree was crashing if treeSchema not defined
        expect(tree).toBeDefined();
    });

    it('should verify getLabel when dialect not dataworld or sqlite', () => {
        const schemaRequest = {};
        const getSqlSchema = function() {};
        const updatePreview = function() {};
        const preview = {
            treeSchema: {}
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
            treeSchema: {}
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

    it('should verify isConnecting status is loading', () => {
        const schemaRequest = {};
        const getSqlSchema = function() {};
        const updatePreview = function() {};
        const preview = {
            treeSchema: {}
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
        const status = 'loading';

        let connecting = mount(tree.instance().isConnecting(status, schemaRequest, {}));

        expect(connecting.find('.loading').length).toBe(1);

        connecting = mount(tree.instance().isConnecting(status, schemaRequest, {}));

        expect(connecting.find('.loading').length).toBe(1);
    });

    it('should verify isConnecting status is error', () => {
        const schemaRequest = {
            message: 'error'
        };
        const getSqlSchema = function() {};
        const updatePreview = function() {};
        const preview = {
            treeSchema: {}
        };
        const connectionObject = {
            dialect: 'sqlite',
            storage: '/home/user/dbs/plotly_datasets.db'
        };

        const status = 500;

        const tree = mount(<TableTree
            schemaRequest={schemaRequest}
            getSqlSchema={getSqlSchema}
            updatePreview={updatePreview}
            preview={preview}
            connectionObject={connectionObject}
        />);

        const connecting = mount(tree.instance().isConnecting(status, schemaRequest, {}));

        expect(connecting.text()).toBe('ERROR {"message":"error"}');
    });

    it('should verify isConnecting status updating', () => {
        const schemaRequest = {
            message: 'error'
        };
        const getSqlSchema = function() {};
        const updatePreview = function() {};
        const preview = {
            treeSchema: {}
        };
        const connectionObject = {
            dialect: 'sqlite',
            storage: '/home/user/dbs/plotly_datasets.db'
        };

        const status = 200;

        const tree = mount(<TableTree
            schemaRequest={schemaRequest}
            getSqlSchema={getSqlSchema}
            updatePreview={updatePreview}
            preview={preview}
            connectionObject={connectionObject}
        />);

        const connecting = mount(tree.instance().isConnecting(status, schemaRequest));

        expect(connecting.text()).toBe('Updating');
    });

    it('should call getSqlSchema becuase schemaRequest undefined', () => {
        let schemaRequest;
        const getSqlSchema = sinon.spy();
        const updatePreview = function() {};
        const preview = {
            treeSchema: {}
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

        tree.instance().storeSchemaTree();

        sinon.assert.calledTwice(getSqlSchema);
    });

    it('should call getSqlSchema becuase schemaRequest empty', () => {
        const schemaRequest = {};
        const getSqlSchema = sinon.spy();
        const updatePreview = function() {};
        const preview = {
            treeSchema: {}
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

        tree.instance().storeSchemaTree();
        sinon.assert.calledTwice(getSqlSchema);
    });

    it('should call getSqlSchema becuase schemaRequest empty', () => {
        const schemaRequest = {
            status: 200
        };
        const getSqlSchema = sinon.spy();
        const updatePreview = function() {};
        const preview = {
            treeSchema: {}
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

        tree.instance().storeSchemaTree();

        sinon.assert.notCalled(getSqlSchema);
    });

    it('should create the tree schema with one row', () => {

        let list = new Array();
        let row = {
            tableName:'test', 
            columnName:'name', 
            dataType:'varchar'
        };

        list.push( row );
        let content = {
            rows:list
        };

        const schemaRequest = {
            status: 200,
            content:content
            
        };
        const getSqlSchema = sinon.spy();
        const updatePreview = function() {};
        const preview = {
            treeSchema: {}
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

        const treeSchema = tree.instance().createTreeSchema( schemaRequest );

        console.log( 'Tree Schema', treeSchema);
        expect(tree).toBeDefined();

    });

});

