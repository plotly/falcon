import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import R, {has, isEmpty, propOr} from 'ramda';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';

import SQLTable from './SQLTable.react.js';
import CodeEditorField from './CodeEditorField.react.js';
import ChartEditor from './ChartEditor.react.js';
import ApacheDrillPreview from './ApacheDrillPreview.js';
import S3Preview from './S3Preview.js';

import OptionsDropdown from '../OptionsDropdown/OptionsDropdown.react';
import {Link} from '../../Link.react';
import * as Actions from '../../../actions/sessions';
import {defaultQueries, DIALECTS, SQL_DIALECTS_USING_EDITOR} from '../../../constants/constants.js';
import getPlotJsonFromState from './components/getPlotJsonFromState.js';

class Preview extends Component {

    constructor(props) {
        super(props);
        this.testClass = this.testClass.bind(this);
        this.updateCode = this.updateCode.bind(this);
        this.toggleEditor = this.toggleEditor.bind(this);
        this.runQuery = this.runQuery.bind(this);
        this.fetchDatacache = this.fetchDatacache.bind(this);
        this.propsToState = this.propsToState.bind(this);

        this.state = {
            plotlyLinks: [],
            plotJSON: {},
            rows: [],
            columnNames: [],
            isLoading: false,
            errorMsg: '',
            successMsg: '',
            chartEditorState: {}
        };
    }

    propsToState(nextProps, props) {
        const {
            connectionObject,
            elasticsearchMappingsRequest,
            preview,
            previewTableRequest,
            queryRequest,
            schemaRequest,
            selectedIndex,
            selectedTable,
            setIndex,
            setTable,
            tablesRequest,
            updatePreview
        } = nextProps;
        const {chartEditor, lastSuccessfulQuery} = preview;

        let rows = [];
        let columnNames = [];
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
            columnNames = previewTableRequest.content.columnnames;
            successMsg = `${rows.length} rows retrieved`;
        }
        else if (queryRequest.status === 'loading') {

            if (has('lastSuccessfulQuery', preview)) {
                // The is at least the 2nd query the user has run
                rows = lastSuccessfulQuery.rows;
                columnNames = lastSuccessfulQuery.columnnames;
            } else {
                // The is the first query the user is running
                rows = previewTableRequest.content.rows;
                columnNames = previewTableRequest.content.columnnames;
            }
            isLoading = true;
        } else if (queryRequest.status !== 200) {
            if (has('lastSuccessfulQuery', preview)) {
                // user's query failed but they have made a succesful query in the past
                rows = lastSuccessfulQuery.rows;
                columnNames = lastSuccessfulQuery.columnnames;
            }
            else {
                // User has never made a succesful query on their own
                rows = previewTableRequest.content.rows;
                columnNames = previewTableRequest.content.columnnames;
                successMsg = `${rows.length} rows retrieved`;
            }
            errorMsg = JSON.stringify(queryRequest);
        }
        else {
            // User's query worked
            rows = queryRequest.content.rows;
            columnNames = queryRequest.content.columnnames;
            successMsg = `${rows.length} rows retrieved`;
        }

        let csvString = columnNames.join(', ') + '\n';
        rows.map(row => {
            csvString = csvString + row.join(', ') + '\n';
        });

        const chartEditorState = this.state.chartEditorState;
        const defaultChartEditorState = {
            xAxisColumnName: columnNames => columnNames[0],
            yAxisColumnNames: columnNames => [columnNames[1]],
            boxes: columnNames => columnNames.map(
                colName => ({name: colName, type: 'column'})),
            columnTraceTypes: columnNames => (
                R.reduce((r, k) => R.set(R.lensProp(k), 'scatter', r), {}, columnNames)
            ),
            droppedBoxNames: () => [],
            selectedColumn: () => '',
            selectedChartType: () => 'scatter'
        };

        if (columnNames !== this.state.columnNames) {
            // Reset props to defaults based off of columnNames
            R.keys(defaultChartEditorState).forEach(k => {
                chartEditorState[k] = defaultChartEditorState[k](columnNames);
            });
        } else if (columnNames.length === 0) {
            ['droppedBoxNames', 'selectedColumn', 'selectedChartType'].forEach(
                k => chartEditorState[k] = defaultChartEditorState[k]()
            );
        } else {
            R.keys(defaultChartEditorState).forEach(k => {
                if (!R.has(k, chartEditor || {})) {
                    chartEditorState[k] = defaultChartEditorState[k](columnNames);
                } else {
                    if (!R.has('chartEditor', props.preview) ||
                        nextProps.preview.chartEditor[k] !== props.preview.chartEditor[k]) {
                        chartEditorState[k] = nextProps.preview.chartEditor[k];
                    }
                }
            });
        }

        const plotJSON = getPlotJsonFromState({
            columnNames,
            rows,
            ...chartEditorState
        });

        this.setState({
            chartEditorState,
            columnNames,
            csvString,
            errorMsg,
            isLoading,
            plotJSON,
            rows,
            successMsg
        });
    }

    fetchDatacache(payload, type) {

        const payloadJSON = JSON.stringify({payload: payload, type: type});

        fetch('/datacache', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            credentials: 'include',
            body: payloadJSON
        }).then(resp => {
            return resp.json();
        }).then(data => {
            const plotlyLinks = this.state.plotlyLinks;
            if (!('error' in data)) {
                plotlyLinks.unshift({type: type, url: data.url});
            } else {
                plotlyLinks.unshift({type: 'error', message: data.error.message});
            }
            this.setState({ plotlyLinks: plotlyLinks });
        });
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
            if (!has('error', content) && has('rows', content) && has('columnnames', content)) {
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

    componentWillReceiveProps(nextProps) {
        this.propsToState(nextProps, this.props);
    }

    componentWillMount() {
        this.propsToState(this.props, {});
    }

    render() {

        const {
            connectionObject,
            elasticsearchMappingsRequest,
            preview,
            previewTableRequest,
            queryRequest,
            schemaRequest,
            selectedIndex,
            selectedTable,
            setIndex,
            setTable,
            tablesRequest,
            updatePreview
        } = this.props;

        const {
            chartEditorState,
            columnNames,
            csvString,
            errorMsg,
            isLoading,
            plotJSON,
            rows,
            successMsg
        } = this.state;

        const dialect = connectionObject.dialect;
        const showEditor = propOr(true, 'showEditor')(preview);
        const code = propOr(defaultQueries(dialect, selectedTable), 'code')(preview);
        const error = propOr('', 'error')(preview);

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

                            <div style={{display: showEditor ? 'block' : 'none', position: 'relative'}}>
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
                                    className="btn btn-primary runButton"
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

                {dialect !== DIALECTS.S3 && dialect !== DIALECTS.APACHE_DRILL &&
                    <div>
                        <Tabs forceRenderTabPanel={true}>
                            <TabList>
                                <Tab>Chart</Tab>
                                <Tab>Table</Tab>
                                <Tab>Export</Tab>
                            </TabList>

                            <TabPanel>
                                <ChartEditor
                                    rows={rows}
                                    columnNames={columnNames}
                                    plotJSON={plotJSON}
                                    updateProps={newProps => {
                                        updatePreview({'chartEditor': R.merge(
                                            chartEditorState,
                                            newProps
                                        )});
                                    }}
                                    {...chartEditorState}
                                />
                            </TabPanel>

                            <TabPanel
                                style={{fontFamily: `'Ubuntu Mono', courier, monospace`, marginTop: '20px'}}
                            >
                                <SQLTable
                                    rows={rows}
                                    columnNames={columnNames}
                                />
                            </TabPanel>

                            <TabPanel>
                                <div className="export-options-container">
                                    <div style={{margin: '20px 0'}}>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => this.fetchDatacache(csvString, 'grid')}
                                        >
                                            Send CSV to plot.ly
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => this.fetchDatacache(csvString, 'csv')}
                                        >
                                            Download CSV
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => this.fetchDatacache(
                                                JSON.stringify(plotJSON),
                                                'plot'
                                            )}
                                        >
                                            Send chart to plot.ly
                                        </button>
                                    </div>
                                    <div style={{width: 650, height: 200, border: '1px solid #dfe8f3',
                                        fontFamily: '\'Ubuntu Mono\', courier, monospace', paddingTop: 10,
                                        padding: 20, marginTop: 10, overflow: 'hidden', overflowY: 'scroll'}}
                                    >
                                        {this.state.plotlyLinks.map(link => (
                                            <div style={{borderTop: '1px solid #dfe8f3', marginTop: 20}}>
                                                {link.type == 'grid' &&
                                                    <div>
                                                        <div style={{color: '#00cc96'}}>🎉  Link to your CSV on Plot.ly ⬇️</div>
                                                        <Link href={link.url} target="_blank" className="externalLink">{link.url}</Link>
                                                    </div>
                                                }
                                                {link.type == 'csv' &&
                                                    <div>
                                                        <div style={{color: '#00cc96'}}>💾  Your CSV has been saved ⬇️</div>
                                                        <Link href={link.url} target="_blank" style="externalLink">{link.url}</Link>
                                                    </div>
                                                }
                                                {link.type == 'plot' &&
                                                    <div>
                                                        <div style={{color: '#00cc96'}}>📈  Link to your chart on Plot.ly ⬇️</div>
                                                        <Link href={link.url} target="_blank" style="externalLink">{link.url}</Link>
                                                    </div>
                                                }
                                                {link.type == 'error' &&
                                                    <div>
                                                        <div style={{color: '#D36046'}}>{`[ERROR] ${link.message}`}</div>
                                                    </div>
                                                }
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
}

export default connect()(Preview);
