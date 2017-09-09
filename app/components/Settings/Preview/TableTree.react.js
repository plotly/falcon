import React, {Component} from 'react';
import {connect} from 'react-redux';
import TreeView from 'react-treeview';
import * as Actions from '../../../actions/sessions'


class TableTree extends Component {

    constructor(props) {
        super(props);

        this.state = { 
            tables: [{name: 'Loading...'}] 
        };
    }    

    componentDidMount() {
        const {connectionObject, dispatch}  = this.props;
        const p = dispatch(Actions.getSqlSchema(
            connectionObject.id,
            connectionObject.dialect,
            connectionObject.database
        ));

        p.then( (schema) => {
            let lastTableName = '';
            let tableName;
            let tables = [];
            let newTableObject = {};
            const TABLE_NAME = 2;
            const COLUMN_NAME = 3;
            const DATA_TYPE = 7;            
            schema.rows.map(function(row) {
                tableName = row[TABLE_NAME];
                if (tableName !== lastTableName) {
                    if (Object.keys(newTableObject).length !== 0) {
                        tables.push(newTableObject);
                    }
                    newTableObject = {name: tableName};
                    lastTableName = tableName;
                }
                newTableObject[row[COLUMN_NAME]] = row[DATA_TYPE];
            });
            this.setState({tables: tables});
        })
        .catch(function(error) {
            console.error(error);
        });
    }

    render() {
        
        const dataSource = [{
            type: this.props.connectionObject.database,
            collapsed: false,
            tables: this.state.tables
        }];

        return (
            <div>
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
