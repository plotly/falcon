import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {Table, Column, Cell} from 'fixed-data-table';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import CodeEditorField from './CodeEditorField.react.js';
import ChartEditor from './ChartEditor.react.js';
import ApacheDrillPreview from './ApacheDrillPreview.js'
import S3Preview from './S3Preview.js'
import OptionsDropdown from '../OptionsDropdown/OptionsDropdown.react';
import * as Actions from '../../../actions/sessions';
import {DIALECTS, SQL_DIALECTS_USING_EDITOR} from '../../../constants/constants.js'

class Preview extends Component {

    constructor(props) {
        super(props);
        this.testClass = this.testClass.bind(this);
        this.updateCode = this.updateCode.bind(this);
        this.toggleEditor = this.toggleEditor.bind(this);
        this.runQuery = this.runQuery.bind(this);

        this.state = {
            code: '',
            rows: [],
            columnNames: [],
            error: '',
            loading: true,
            showEditor: true
        };
    }

    componentDidMount() {
        const {previewTableRequest} = this.props;
        if (previewTableRequest.status >= 400) {
            this.setState({
                error: JSON.stringify(previewTableRequest),
                loading: false
            });
        } else if (previewTableRequest.status === 'loading') {
            this.setState({
                loading: true
            });
        } else if (previewTableRequest.status === 200) {
            const {columnnames, rows} = previewTableRequest.content;
            this.setState({
                columnNames: columnnames,
                rows: rows,
                loading: false,
                error: ''
            });
        } else {
            return null;
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.previewTableRequest.status === 200) {
            const {columnnames, rows} = previewTableRequest.content;
            if (!this.state.columnNames.length) {
                this.setState({
                    columnNames: columnnames,
                    rows: rows,
                    loading: false,
                    error: ''
                });
            }
        }
    }

    testClass() {
        return 'test-connected';
    }

    updateRowsAndColumns(columnnames, rows) {
        this.setState({
            columnNames: columnnames,
            rows: rows,
            loading: false,
            error: ''
        });
    }

    runQuery() {
        const query = this.state.code;
        const {connectionObject, dispatch} = this.props;

        console.warn('runQuery:', query, connectionObject);

        const p = dispatch(Actions.runSqlQuery(
            connectionObject.id,
            connectionObject.dialect,
            query
        ));

        p.then( result => {
            const {columnnames, rows} = result;
            if (typeof rows !== undefined) {
                this.updateRowsAndColumns(columnnames, rows);
            }
        })
        .catch( error => {
            this.setState(error: error);
            console.error(error);
        });

    }

    updateCode(newCode) {
        this.setState({
            code: newCode
        });
    }

    toggleEditor() {
        this.setState({
            showEditor: this.state.showEditor ? false : true
        });
    }

    render() {
        const ErrorMsg = () => {
            if (this.state.error) {
                return (
                    <div>
                        <div>{'An error occurred while trying to load this table:'}</div>
                        <div style={{color: 'red'}}>{this.state.error}</div>
                    </div>
                );
            }
            return null;
        };


        const LoadingMsg = () => {
            if (this.state.loading) {
                return (<div>{'Loading...'}</div>);
            }
            return null;
        };

        const dialect = this.props.connectionObject.dialect;

        if (this.props.previewTableRequest.status === 200 && 
            !SQL_DIALECTS_USING_EDITOR.includes(dialect)) {
            const {columnnames, rows} = this.props.previewTableRequest.content;
            const columnNames = columnnames;
        }
        else{
            const {columnNames, rows} = this.state;           
        }

        return (
            <div className={'previewContainer'}>

                {/*
                * Show the SQL code editor for SQL databases
                * Show the dropdown for ElasticSearch, etc
                */}                

                {SQL_DIALECTS_USING_EDITOR.includes(dialect) &&
                    <div>
                        <code>
                            <small>
                                <a onClick={this.toggleEditor}>
                                    {this.state.showEditor ? 'Hide Editor' : 'Show Editor'}
                                </a>
                            </small>
                        </code>

                        <div style={{display: this.state.showEditor ? 'block' : 'none'}}>
                            <CodeEditorField
                                value={this.state.code}
                                onChange={this.updateCode}
                                connectionObject={this.props.connectionObject}
                                runQuery={this.runQuery}
                            />
                            <a
                                className='btn btn-primary'
                                onClick={this.runQuery}
                                style={{float: 'right', maxWidth: 100}}
                            >
                                Run
                            </a>
                        </div>
                    </div>
                }

                {!SQL_DIALECTS_USING_EDITOR.includes(dialect) &&
                    <OptionsDropdown
                        connectionObject={this.props.connectionObject}
                        selectedTable={this.props.selectedTable}
                        elasticsearchMappingsRequest={this.props.elasticsearchMappingsRequest}
                        tablesRequest={this.props.tablesRequest}
                        setTable={this.props.setTable}
                        setIndex={this.props.setIndex}
                        selectedIndex={this.props.selectedIndex}
                        updateRowsAndColumns={this.updateRowsAndColumns}
                    />
                }

                {rows && dialect !== DIALECTS['APACHE_DRILL'] && dialect !== DIALECTS['S3'] &&
                    <Tabs forceRenderTabPanel={true}>
                        <TabList>
                            <Tab>Table</Tab>
                            <Tab>Chart</Tab>
                        </TabList>

                        <TabPanel>
                            <Table
                                rowHeight={50}
                                rowsCount={rows.length}
                                width={800}
                                height={200}
                                headerHeight={40}
                                {...this.props}>
                                {columnNames.map(function(colName, colIndex){
                                    return <Column
                                        columnKey={colName}
                                        key={colIndex}
                                        label={colName}
                                        flexgrow={1}
                                        width={200}
                                        header={<Cell>{colName}</Cell>}
                                        cell={({rowIndex, ...props}) => (
                                            <Cell
                                                height={20}
                                                {...props}
                                            >
                                                {rows[rowIndex][colIndex]}
                                            </Cell>
                                        )}
                                    />;
                                })}
                            </Table>
                        </TabPanel>

                        <TabPanel>
                            <ChartEditor
                                rows={rows}
                                columnNames={columnNames}
                            />
                        </TabPanel>
                    </Tabs>                    
                }

               {S3Preview()}
               {ApacheDrillPreview()}

               {SQL_DIALECTS_USING_EDITOR.includes(dialect) && LoadingMsg()}
               {SQL_DIALECTS_USING_EDITOR.includes(dialect) && ErrorMsg()}
            </div>
        );
    }
};

export default connect()(Preview);
