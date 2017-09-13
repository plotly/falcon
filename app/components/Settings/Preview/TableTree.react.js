import React, {Component} from 'react';
import {connect} from 'react-redux';
import TreeView from 'react-treeview';
import {propOr} from 'ramda';
import * as Actions from '../../../actions/sessions'

class TableTree extends Component {

    constructor(props) {
        super(props);

        this.state = {
            tables: [{name: 'Loading...'}]
        };

        this.getSchemaTree = this.getSchemaTree.bind(this);
    }

    getSchemaTree() {
        const {schemaRequest, getSqlSchema} = this.props;

        if (isEmpty(schemaRequest)) {
            getSqlSchema();
        } else if (
            schemaRequest.status === 200 &&
            !isEmpty(this.props.preview.treeSchema)
        ) {
            let lastTableName = '';
            let tableName;
            let tables = [];
            let newTableObject = {};
            let DB_HAS_ONLY_ONE_TABLE;
            const TABLE_NAME = 0;
            const COLUMN_NAME = 1;
            const DATA_TYPE = 2;
            schemaRequest.content.rows.map(function(row, i) {
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

            console.warn('Tables ---> ', tables);

            this.props.updatePreview({
                treeSchema: tables
            });
        }
    }

    componentDidMount() {
        this.getSchemaTree();
    }

    componentWillReceiveProps() {
        this.getSchemaTree();
    }

    render() {
        const {schemaRequest, preview} = this.props;
        if (isEmpty(schemaRequest) || schemaRequest.status === 'loading' ||
            (schemaRequest.status === 200 && isEmpty(preview.treeSchema))) {
            return 'Loading...';
        } else if (schemaRequest.status !== 200) {
            return `Error: ${schemaRequest.content}`;
        }

        const {treeSchema} = preview;

        const TREE_DEFAULT = [{name: 'Loading...'}];

        const dataSource = [{
            type: this.props.connectionObject.database,
            collapsed: false,
            tables: propOr(TREE_DEFAULT, 'treeSchema')(this.props.preview)
        }];

        /*console.warn(this.props.preview, dataSource.tables);
        if (!dataSource.tables || dataSource.tables === TREE_DEFAULT) {
            console.warn('default tree');
            this.getSchemaTree();
        }*/

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

export default connect()(TableTree);
