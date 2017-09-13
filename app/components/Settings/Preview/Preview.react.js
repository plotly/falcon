import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {propOr} from 'ramda';
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

        console.warn('constructor');
    }

    testClass() {
        return 'test-connected';
    }

    runQuery() {
        this.props.runQuery().then(content => {
            // Cache the last successful query
            this.props.updatePreview({lastSuccessfulQuery: content});
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

        const lastSuccessfulQuery = this.props.preview.lastSuccessfulQuery;

        let rows = [];
        let columns = [];

        if (isEmpty(previewTableRequest) || previewTableRequest.status === 'loading') {
            return 'Loading previews';
        } else if (previewTableRequest.status !== 200) {
            return 'There was an error loading tables';
        } else if (isEmpty(queryRequest)) {
            {rows, columnnames} = previewTableRequest;
            return `Here is your preview: ${previewTableRequest.content}`;
        } else if (queryRequest.status === 'loading') {

            if (R.has('lastSuccessfulQuery', this.props.preview)) {
                // The is at least the 2nd query the user has run
                {rows, columnnames} = this.props.preview.lastSuccessfulQuery;
            } else {
                // The is the first query the user is running
                {rows, columnnames} = previewTableRequest;
            }
            return `
                Here is your preview: ${previewTableRequest.content}.
                Your special query is loading.
            `;
        } else if (queryRequest.status !== 200) {
            if (R.has('lastSuccessfulQuery', this.props.preview)) {
                // user's query failed but they have made a succesful query in the past
                {rows, columnnames} = this.props.preview.lastSuccessfulQuery;
                return `
                    Here is your preview: ${previewTableRequest.content}.
                    Your special query failed: ${queryRequest.content}.
                    Your last successful query was ${this.props.lastSuccessfulQuery.content}
                `;
            } else {
                // User has never made a succesful query on their own
                {rows, columnnames} = previewTableRequest;
                return `
                    Here is your preview: ${previewTableRequest.content}.
                    Your special query failed: ${queryRequest.content}.
                `;
            }
        } else {
            // User's query worked
            {rows, columns} = queryRequest.content;
            return `Here is your special query ${queryRequest.content}`;
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

        const {selectedTable, elasticsearchMappingsRequest, tablesRequest,
            connectionObject, setTable, setIndex, selectedIndex, previewTableRequest} = this.props;            
        const dialect = connectionObject.dialect;

        let columnNames = propOr([], 'columnNames')(this.props.preview);
        let rows = propOr([], 'rows')(this.props.preview);
        const showEditor = propOr(true, 'showEditor')(this.props.preview);
        const code = propOr('', 'code')(this.props.preview);

        if (rows.length === 0 || !SQL_DIALECTS_USING_EDITOR.includes(dialect)) {
            if (previewTableRequest.status === 200) {
                columnNames = previewTableRequest.content.columnnames;
                rows = previewTableRequest.content.rows;
            }
        }

        // console.warn(dialect, columnNames.length, rows.length, this.props.preview, this.previewTableRequest);

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
                                    columnNames={columnNames}
                                />
                            </TabPanel>

                            <TabPanel>
                                <ChartEditor
                                    rows={rows}
                                    columnNames={columnNames}
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
