import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {has, isEmpty, propOr} from 'ramda';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';

import SQLTable from './SQLTable.react.js';
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
            console.warn(content);
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

        let rows = [];
        let columnnames = [];

        if (isEmpty(previewTableRequest) || previewTableRequest.status === 'loading') {
            console.warn('Loading previews');
        } 
        else if (previewTableRequest.status !== 200) {
            console.warn('There was an error loading tables');
        } 
        else if (isEmpty(queryRequest)) {
            rows = previewTableRequest.content.rows;
            columnnames = previewTableRequest.content.columnnames;
            console.warn(`Here is your preview: ${previewTableRequest.content.columnnames}`);
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
            console.warn(`
                Here is your preview: ${rows} ${columnnames}.
                Your special query is loading.
            `);
        } else if (queryRequest.status !== 200) {
            if (has('lastSuccessfulQuery', preview)) {
                // user's query failed but they have made a succesful query in the past
                rows = lastSuccessfulQuery.rows;
                columnnames = lastSuccessfulQuery.columnnames;
                console.warn(`
                    Here is your preview: ${previewTableRequest.content}.
                    Your special query failed: ${queryRequest.content}.
                    Your last successful query was ${rows} ${columnnames}.
                `);
            } 
            else {
                // User has never made a succesful query on their own
                rows = previewTableRequest.content.rows;
                columnnames = previewTableRequest.content.columnnames;
                //console.warn(`
                //    Here is your preview: ${previewTableRequest.content}.
                //    Your special query failed: ${queryRequest.content}.
                //`);
            }
        } 
        else {
            // User's query worked
            rows = queryRequest.content.rows;
            columnnames = queryRequest.content.columnnames;
            console.warn('Here is your special query result', rows, columnnames);
        }


        const ErrorMsg = () => {
            const error = propOr(false, 'error')(this.props.preview);
            if (error) {
                return (
                    <div>
                        <div>{'An error occurred while trying to load this table:'}</div>
                        <div style={{color: 'red'}}>{error}</div>
                    </div>
                );
            }
            return null;
        };


        const LoadingMsg = () => {
            const loading = propOr(false, 'loading')(this.props.preview);
            if (loading) {
                return (<div>{'Loading...'}</div>);
            }
            return null;
        };

        /*if (rows.length === 0 || !SQL_DIALECTS_USING_EDITOR.includes(dialect)) {
            if (previewTableRequest.status === 200) {
                columnnames = previewTableRequest.content.columnnames;
                rows = previewTableRequest.content.rows;
            }
        }*/

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

                            <div style={{display: showEditor ? 'block' : 'none'}}>
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

                {dialect !== DIALECTS['S3'] && dialect !== DIALECTS['APACHE_DRILL'] &&
                    <div>
                        <Tabs forceRenderTabPanel={true}>
                            <TabList>
                                <Tab>Table</Tab>
                                <Tab>Chart</Tab>
                            </TabList>

                            <TabPanel>
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
                        </Tabs>
                    </div>
                }

               {S3Preview(this.props)}
               {ApacheDrillPreview(this.props)}
               {LoadingMsg()}
               {ErrorMsg()}
            </div>
        );
    }
};

export default connect()(Preview);
