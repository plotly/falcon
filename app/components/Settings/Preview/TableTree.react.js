import React, {Component} from 'react';
import PropTypes from 'prop-types';
import TreeView from 'react-treeview';
import {isEmpty, has} from 'ramda';

import {DIALECTS} from '../../../constants/constants';
import {getPathNames} from '../../../utils/utils';

const BASENAME_RE = /[^\\/]+$/;

class TableTree extends Component {

    static propTypes = {
        schemaRequest: PropTypes.object,
        getSqlSchema: PropTypes.func,
        updatePreview: PropTypes.func,
        preview: PropTypes.object,
        connectionObject: PropTypes.shape({
            database: PropTypes.string,
            dialect: PropTypes.string,
            storage: PropTypes.string
        })
    }

    /**
     *
     * @param {object} props - Component Props
     * @param {object} props.schemaRequest - Schema Request
     * @param {function} props.getSqlSchema - Get SQL Schema Function
     * @param {function} props.updatePreview - Update Preview Function
     * @param {object} props.preview - Preview details
     * @param {object} props.connectionObject - Connection Object
     * @param {object} props.connectionObject.database - Database Name
     * @param {object} props.connectionObject.dialect - Dialect for DB
     * @param {object} props.connectionObject.storage - Storage
     */
    constructor(props) {
        super(props);
        this.storeSchemaTree = this.storeSchemaTree.bind(this);
    }

    /**
     * Gets the label for tree
     * @param {object} connectionObject - Connection Object
     * @param {object} connectionObject.database - Database if not dialect not Data World or SQLite
     * @param {object} connectionObject.storage - If dialect is SQLLite
     * @param {object} connectionObject.url - If dialect is Dataworld
     * @returns {string} label
     */
    getLabel(connectionObject) {
        switch (connectionObject.dialect) {
            case DIALECTS.SQLITE:
                return BASENAME_RE.exec(connectionObject.storage)[0] || connectionObject.storage;
            case DIALECTS.DATA_WORLD:
                return getPathNames(connectionObject.url)[2];
            case DIALECTS.CSV:
                return connectionObject.label || connectionObject.id || connectionObject.database;
            case DIALECTS.ORACLE:
                return connectionObject.connectionString;
            default:
                return connectionObject.database;
        }
    }

    /**
     * Checks to see whether it is still loading the request for the schema.  If loading
     * or undefined, returns loading.  If status not 200 returns Error message
     * @param {object} status - Request Status
     * @param {object} schemaRequest - Scheme Request
     * @param {object} treeSchema - Tree Schema
     * @returns {object} div containing connect message
     */
    isConnecting(status, schemaRequest, treeSchema) {
        if (typeof status === 'undefined' || status === 'loading') {
            return (<div className="loading">{'Loading'}</div>);
        }

        if (status !== 200) {
            return (
                <div style={{padding: '5px', fontSize: '12px'}}>
                    {`ERROR ${JSON.stringify(schemaRequest)}`}
                </div>
            );
        }

        if (!treeSchema) {
            return (<div className="loading">{'Updating'}</div>);
        }
    }

    /**
     * The following method will create the tree schema
     * @param {object} schemaRequest - The Schema Request
     * @returns {object} treeSchema - Formatted Tree Schema
     */
    createTreeSchema(schemaRequest) {
        const treeSchema = {};

        if ((schemaRequest) && (schemaRequest.content) &&
                (schemaRequest.content.rows) && (schemaRequest.content.rows.length > 0)) {
            schemaRequest.content.rows.forEach(function(row) {
                const {tableName, columnName, dataType} = row;

                if (treeSchema.hasOwnProperty(tableName)) {
                    treeSchema[tableName][columnName] = dataType;
                } else {
                    treeSchema[tableName] = {
                        [columnName]: dataType
                    };
                }
            });
        }

        return treeSchema;
    }

    /**
     * The following method will store the schema request
     * @returns {undefined}
    */
    storeSchemaTree() {
        const {schemaRequest, getSqlSchema, updatePreview, preview} = this.props;

        if (typeof schemaRequest === 'undefined') {
            getSqlSchema();
        }
        else if (isEmpty(schemaRequest)) {
            getSqlSchema();
        }

        else if (schemaRequest.status === 200 && !has('treeSchema', preview)) {
            const treeSchema = this.createTreeSchema(schemaRequest);
            updatePreview({treeSchema});
        }
    }

    /**
     * The following method will return a list of tree nodes based on
     * the tree schema.  Returns nothing if treeSchema is undefined
     * @param {object} treeSchema - Tree Schema
     * @returns {array} TreeView
     */
    getTreeNodes(treeSchema) {
        if (typeof treeSchema !== 'undefined') {
            Object.getOwnPropertyNames(treeSchema).sort().map(tableName => {
                const tableSchema = treeSchema[tableName];
                const tableLabel = <span className="node">{tableName}</span>;
                return (
                    <TreeView nodeLabel={tableLabel} key={tableName} defaultCollapsed={true}>{
                        Object.getOwnPropertyNames(tableSchema).sort().map(columnName => {
                            return (
                                <div className="info">{columnName}: <code>{tableSchema[columnName]}</code></div>
                            );
                        })
                    }</TreeView>
                );
            });
        }
    }

    componentDidMount() {
        this.storeSchemaTree();
    }

    componentWillReceiveProps() {
        this.storeSchemaTree();
    }

    render() {
        const schemaRequest = this.props.schemaRequest || {};
        const status = schemaRequest.status;
        const preview = this.props.preview || {};
        const treeSchema = preview.treeSchema;

        this.isConnecting(status, schemaRequest, treeSchema);

        const label = this.getLabel(this.props.connectionObject);
        const labelNode = <span className="node">{label}</span>;

        return (
            <div style={{padding: '5px 0 0 10px', maxHeight: 650, overflowY: 'auto'}}>
                <TreeView key={label} nodeLabel={labelNode} defaultCollapsed={false}>{
                    this.getTreeNodes(treeSchema)
                }</TreeView>
            </div>
        );
    }
}

export default TableTree;
