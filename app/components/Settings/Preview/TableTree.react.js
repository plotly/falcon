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
            let lastTableName = '';
            let tableName;
            let tables = [];
            let newTableObject = {};
            let DB_HAS_ONLY_ONE_TABLE;
            const TABLE_NAME = 0;
            const COLUMN_NAME = 1;
            const DATA_TYPE = 2;
            const schema = schemaRequest.content;
            schema.rows.map(function(row, i) {
                tableName = row[TABLE_NAME];
                DB_HAS_ONLY_ONE_TABLE = (tables.length === 0 && i === schema.rows.length-1);
                if (tableName !== lastTableName || DB_HAS_ONLY_ONE_TABLE) {
                    if (Object.keys(newTableObject).length !== 0) {
                        tables.push(newTableObject);
                    }
                    newTableObject = {name: tableName};
                    lastTableName = tableName;
                }
                newTableObject[row[COLUMN_NAME]] = row[DATA_TYPE];
            });

            updatePreview({
                treeSchema: tables
            });
        }
    }

    componentDidMount() {
        this.storeSchemaTree();
    }

    componentWillReceiveProps(nextProps) {
        this.storeSchemaTree();
    }

    render() {
        const {schemaRequest, preview} = this.props;


        if (typeof schemaRequest !== 'undefined') {
            if (isEmpty(schemaRequest) || schemaRequest.status === 'loading' ||
                (schemaRequest.status === 200 && isEmpty(preview.treeSchema))) {

                return (<div>{'Loading...'}</div>);
            } 
            else if (schemaRequest.status !== 200) {
                return (<div>{`Error: ${JSON.stringify(schemaRequest)}`}</div>);
            }
        }
        else {
            return (<div>{'Loading'}</div>);
        }

        const {treeSchema} = preview;

        const TREE_DEFAULT = [{name: 'Loading...'}];

        const dataSource = [{
            type: this.props.connectionObject.database,
            collapsed: false,
            tables: propOr(TREE_DEFAULT, 'treeSchema')(this.props.preview)
        }];

        return (
            <div style={{padding: '30px 0 0 10px'}}>
                {dataSource.map((node, i) => {
                    const type = node.type;
                    const label = <span className="node">{type}</span>;
                    return (
                        <TreeView key={type + '|' + i} nodeLabel={label} defaultCollapsed={false}>
                            {node.tables.map(tbl => {
                                const label2 = <span className="node">{tbl.name}</span>;
                                return (
                                    <TreeView nodeLabel={label2} key={tbl.name} defaultCollapsed={true}>
                                        {Object.keys(tbl).map(col => {
                                            if (col !== 'name') {
                                                return (
                                                    <div className="info">{col}: <code>{tbl[col]}</code></div>
                                                );
                                            }
                                        })}
                                    </TreeView>
                                );
                            })}
                        </TreeView>
                    );
                })}
            </div>
        );
    }
};

export default TableTree;
