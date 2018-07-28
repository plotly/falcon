import React, {Component} from 'react';
import PropTypes from 'prop-types';
import TreeView from 'react-treeview';
import {isEmpty, has} from 'ramda';

import {DIALECTS} from '../../../constants/constants';
import {getPathNames} from '../../../utils/utils';

const BASENAME_RE = /[^\\/]+$/;

class TableTree extends Component {
    constructor(props) {
        super(props);

        this.storeSchemaTree = this.storeSchemaTree.bind(this);
    }

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

    storeSchemaTree() {
        const {schemaRequest, getSqlSchema, updatePreview} = this.props;

        if (typeof schemaRequest === 'undefined') {
            getSqlSchema();
        }
        else if (isEmpty(schemaRequest)) {
            getSqlSchema();
        }
        else if (schemaRequest.status === 200 && !has('treeSchema', this.props.preview)) {
            const treeSchema = {};
            schemaRequest.content.rows.forEach(function(row) {
                const [tableName, columnName, dataType] = row;

                if (treeSchema.hasOwnProperty(tableName)) {
                    treeSchema[tableName][columnName] = dataType;
                } else {
                    treeSchema[tableName] = {
                        [columnName]: dataType
                    };
                }
            });

            updatePreview({treeSchema});
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

        const preview = this.props.preview || {};
        const treeSchema = preview.treeSchema;

        if (!treeSchema) {
            return (<div className="loading">{'Updating'}</div>);
        }

        const label = this.getLabel(this.props.connectionObject);
        const labelNode = <span className="node">{label}</span>;

        return (
            <div style={{padding: '5px 0 0 10px', maxHeight: 650, overflowY: 'auto'}}>
                <TreeView key={label} nodeLabel={labelNode} defaultCollapsed={false}>{
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
                    })
                }</TreeView>
            </div>
        );
    }
}

export default TableTree;
