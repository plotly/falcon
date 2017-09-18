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
            let tableTree = {};
            schemaRequest.content.rows.forEach(function(row) {
                const [tableName, columnName, dataType] = row;

                if (tableTree.hasOwnProperty(tableName)) {
                    tableTree[tableName][columnName] = dataType;
                } else {
                    tableTree[tableName] = {
                        name: tableName,  // TODO: what if a column name is name?
                        [columnName]: dataType,
                    };
                }
            });

            let tables = Object.getOwnPropertyNames(tableTree).sort().map(
                (tableName) => tableTree[tableName]
            );

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

                return (<div className='loading'>{'Loading...'}</div>);
            } 
            else if (schemaRequest.status !== 200) {
                return (
                    <div style={{padding: '5px', fontSize: '12px'}}>
                        {`ERROR ${JSON.stringify(schemaRequest).substr(0,200)}`}
                    </div>
                );
            }
        }
        else {
            return (<div className='loading'>{'Loading'}</div>);
        }

        const {treeSchema} = preview;

        const TREE_DEFAULT = [{name: 'Loading...'}];

        const dataSource = [{
            type: this.props.connectionObject.database,
            collapsed: false,
            tables: propOr(TREE_DEFAULT, 'treeSchema')(this.props.preview)
        }];

        return (
            <div style={{padding: '5px 0 0 10px'}}>
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
