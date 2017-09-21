import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {has, isEmpty, propOr, transpose} from 'ramda';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';

import SQLTable from './SQLTable.react.js';
import CodeEditorField from './CodeEditorField.react.js';
import ChartEditor from './ChartEditor.react.js';
import ApacheDrillPreview from './ApacheDrillPreview.js'
import S3Preview from './S3Preview.js'

import OptionsDropdown from '../OptionsDropdown/OptionsDropdown.react';
import * as Actions from '../../../actions/sessions';
import {DIALECTS, SQL_DIALECTS_USING_EDITOR} from '../../../constants/constants.js';
import {submitStyle} from './components/editorConstants.js';

class Preview extends Component {

    constructor(props) {
        super(props);
        this.testClass = this.testClass.bind(this);
        this.updateCode = this.updateCode.bind(this);
        this.toggleEditor = this.toggleEditor.bind(this);
        this.runQuery = this.runQuery.bind(this);
    }

    testClass() {
        return 'test-connected';
    }

    runQuery() {
        this.props.runSqlQuery().then(content => {
            /* 
            * Cache the last successful query
            * lastSuccessfulQuery is the result of the last successful query
            * and should have the form {rows:[[]], columnnames:[]}
            */
            if( !has('error', content) && has('rows', content) && has('columnnames', content) ){
                this.props.updatePreview({lastSuccessfulQuery: content});
            }
        });
    }

    updateCode(newCode) {
        this.props.updatePreview({
            code: newCode
        });
    }

    toggleEditor() {
        const showEditor = propOr(true, 'showEditor')(this.props.preview);
        this.props.updatePreview({
            showEditor: showEditor ? false : true
        });
    }

    render() {

        const {selectedTable, elasticsearchMappingsRequest, tablesRequest, schemaRequest, connectionObject, 
            setTable, setIndex, selectedIndex, updatePreview, preview, previewTableRequest, queryRequest} = this.props;

        const lastSuccessfulQuery = preview.lastSuccessfulQuery;        
        const dialect = connectionObject.dialect;
        const showEditor = propOr(true, 'showEditor')(preview);
        const code = propOr('', 'code')(preview);
        const error = propOr('', 'error')(preview);

        let rows = [];
        let columnnames = [];
        let isLoading = false;
        let errorMsg = '';
        let successMsg = '';

        if (isEmpty(previewTableRequest) || previewTableRequest.status === 'loading') {            
            isLoading = true;
        } 
        else if (previewTableRequest.status !== 200) {
            errorMsg = JSON.stringify(previewTableRequest);
        } 
        else if (isEmpty(queryRequest)) {
            rows = previewTableRequest.content.rows;
            columnnames = previewTableRequest.content.columnnames;
            successMsg = `${rows.length} rows retrieved`;
        } 
        else if (queryRequest.status === 'loading') {

            if (has('lastSuccessfulQuery', preview)) {
                // The is at least the 2nd query the user has run
                rows = lastSuccessfulQuery.rows;
                columnnames = lastSuccessfulQuery.columnnames;
            } else {
                // The is the first query the user is running
                rows = previewTableRequest.content.rows;
                columnnames = previewTableRequest.content.columnnames;
            }
            isLoading = true;
        } else if (queryRequest.status !== 200) {
            if (has('lastSuccessfulQuery', preview)) {
                // user's query failed but they have made a succesful query in the past
                rows = lastSuccessfulQuery.rows;
                columnnames = lastSuccessfulQuery.columnnames;
            } 
            else {
                // User has never made a succesful query on their own
                rows = previewTableRequest.content.rows;
                columnnames = previewTableRequest.content.columnnames;
                successMsg = `${rows.length} rows retrieved`;
            }
            errorMsg = JSON.stringify(queryRequest);
        } 
        else {
            // User's query worked
            rows = queryRequest.content.rows;
            columnnames = queryRequest.content.columnnames;
            successMsg = `${rows.length} rows retrieved`;
        }


        let dataGrid = {cols: {}};
        const columnData = transpose(rows);
        columnnames.map((yColName, i) => {
            dataGrid.cols[yColName] = {data: columnData[i]}
        })

        return (
            <div className={'previewContainer'}>
                <div>
                    {SQL_DIALECTS_USING_EDITOR.includes(dialect) &&
                        <div>
                            <code>
                                <small>
                                    <a onClick={this.toggleEditor}>
                                        {showEditor ? 'Hide Editor' : 'Show Editor'}
                                    </a>
                                </small>
                            </code>

                            <div style={{display: showEditor ? 'block' : 'none', position:'relative'}}>
                                <CodeEditorField
                                    value={code}
                                    onChange={this.updateCode}
                                    connectionObject={connectionObject}
                                    runQuery={this.runQuery}
                                    schemaRequest={schemaRequest}
                                    preview={preview}
                                    updatePreview={updatePreview}
                                />
                                <a
                                    className='btn btn-primary runButton'
                                    onClick={this.runQuery}
                                    disabled={!isLoading}
                                >
                                    {isLoading ? 'Loading...' : 'Run'}
                                </a>
                            </div>
                        </div>
                    }

                    {!SQL_DIALECTS_USING_EDITOR.includes(dialect) &&
                        <OptionsDropdown
                            connectionObject={connectionObject}
                            selectedTable={selectedTable}
                            elasticsearchMappingsRequest={elasticsearchMappingsRequest}
                            tablesRequest={tablesRequest}
                            setTable={setTable}
                            setIndex={setIndex}
                            selectedIndex={selectedIndex}
                        />
                    }
                </div>

                {errorMsg &&
                    <div className="errorStatus">
                        <p>{`ERROR ${errorMsg}`}</p>
                    </div>
                }

                {dialect !== DIALECTS['S3'] && dialect !== DIALECTS['APACHE_DRILL'] &&
                    <div>
                        <Tabs forceRenderTabPanel={true}>
                            <TabList>
                                <Tab>Table</Tab>
                                <Tab>Chart</Tab>
                                <Tab>Export</Tab>
                            </TabList>

                            <TabPanel
                                style={{fontFamily: `'Ubuntu Mono', courier, monospace`}}
                            >
                                <SQLTable
                                    rows={rows}
                                    columnNames={columnnames}
                                />
                            </TabPanel>

                            <TabPanel>
                                <ChartEditor
                                    rows={rows}
                                    columnNames={columnnames}
                                />
                            </TabPanel>

                            <TabPanel>
                                <form
                                    action='https://plot.ly/datagrid'
                                    method='post'
                                    target='_blank'
                                    name='data'
                                >
                                    <input type='hidden' name='data' value={JSON.stringify(dataGrid)} />
                                    <input 
                                        type="submit" 
                                        style={submitStyle}
                                        value={`Export ${rows.length} rows to plot.ly`}
                                    />
                                </form>                                
                            </TabPanel>                            
                        </Tabs>
                    </div>
                }

                {successMsg &&
                    <div className="successMsg">
                        <p>{successMsg}</p>
                    </div>
                }

               {S3Preview(this.props)}
               {ApacheDrillPreview(this.props)}
            </div>
        );
    }
};

export default connect()(Preview);
