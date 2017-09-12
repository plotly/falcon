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

    handlePTR(PTR) {
        if (PTR.status >= 400) {
            this.props.updatePreview({
                error: JSON.stringify(PTR),
                loading: false
            });
        } else if (PTR.status === 'loading') {
            this.props.updatePreview({
                loading: true
            });
        } else if (PTR.status === 200) {
            const {columnnames, rows} = PTR.content;
            if (columnnames && rows) {
                this.props.updatePreview({
                    columnNames: columnnames,
                    rows: rows,
                    loading: false,
                    error: ''
                });
            }
            else{
                console.warn('Undefined cols or rows:', columnNames, rows);
            }            
        }        
    }

    componentDidMount() {
        const {previewTableRequest} = this.props;
        this.handlePTR(previewTableRequest);
    }

    testClass() {
        return 'test-connected';
    }

    runQuery() {
        const query = propOr('', 'code')(this.props.preview);
        const {connectionObject, dispatch} = this.props;

        console.warn('runQuery:', query, this.props.preview);

        const p = dispatch(Actions.runSqlQuery(
            connectionObject.id,
            connectionObject.dialect,
            query
        ));

        p.then( result => {
            console.warn('result', result);
            const {columnnames, rows} = result;
            if (typeof rows !== undefined) {
                this.props.updatePreview({
                    columnNames: columnnames,
                    rows: rows,
                    loading: false,
                    error: ''
                });
            }
        })
        .catch( error => {
            this.props.updatePreview(error: error);
            console.error(error);
        });

    }

    updateCode(newCode) {
        this.props.updatePreview({
            code: newCode
        });
    }

    toggleEditor() {
        this.props.updatePreview({
            showEditor: this.props.preview.showEditor ? false : true
        });
    }

    render() {
        const ErrorMsg = () => {
            const error = propOr(false, error)(this.props.preview);
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
            const loading = propOr(false, loading)(this.props.preview);
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

        if (columnNames.length === 0) {
            if (previewTableRequest.status === 200) {
                let {columnnames, rows} = previewTableRequest.content;
                columnNames = columnnames;
            }
        }

        return (
            <div className={'previewContainer'}>
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

               {S3Preview(this.props)}
               {ApacheDrillPreview(this.props)}
               {LoadingMsg()}
               {ErrorMsg()}
            </div>
        );
    }
};

export default connect()(Preview);
