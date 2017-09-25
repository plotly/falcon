import React, {Component} from 'react';
import TreeView from 'react-treeview';
import {isEmpty, has, propOr} from 'ramda';
import * as Actions from '../../../actions/sessions'

class TableTree extends Component {

    constructor(props) {
        super(props);

        this.storeSchemaTree = this.storeSchemaTree.bind(this);
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
            let treeSchema = {};
            schemaRequest.content.rows.forEach(function(row) {
                const [tableName, columnName, dataType] = row;

                if (treeSchema.hasOwnProperty(tableName)) {
                    treeSchema[tableName][columnName] = dataType;
                } else {
                    treeSchema[tableName] = {
                        [columnName]: dataType,
                    };
                }
            });

            updatePreview({treeSchema});
        }
    }

    componentDidMount() {
        this.storeSchemaTree();
    }

    componentWillReceiveProps(nextProps) {
        this.storeSchemaTree();
    }

    render() {
        const schemaRequest = this.props.schemaRequest || {};
        const status = schemaRequest.status;

        if (typeof status === 'undefined' || status === 'loading') {
            return (<div className='loading'>{'Loading'}</div>);
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
            return (<div className='loading'>{'Updating'}</div>);
        }

        const database = this.props.connectionObject.database;
        const databaseLabel = <span className="node">{database}</span>;

        return (
            <div style={{padding: '5px 0 0 10px'}}>
                <TreeView key={database} nodeLabel={databaseLabel} defaultCollapsed={false}>{
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
};

export default TableTree;
