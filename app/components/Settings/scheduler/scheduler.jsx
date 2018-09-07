import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {contains} from 'ramda';
import ReactDataGrid from 'react-data-grid';
import ms from 'ms';
import matchSorter from 'match-sorter';
import cronstrue from 'cronstrue';
import Select from 'react-select';
import toHash from 'tohash';

import CreateModal from './create-modal.jsx';
import PreviewModal from './preview-modal.jsx';
import PromptLoginModal from './login-modal.jsx';
import {Row, Column} from '../../layout.jsx';
import SQL from './sql.jsx';
import Tag from './tag.jsx';
import Status from './status.jsx';

import {SQL_DIALECTS_USING_EDITOR} from '../../../constants/constants';

import './scheduler.css';

const NO_OP = () => {};

const ROW_HEIGHT = 84;

const SORT_OPTIONS = [
    {
        label: 'Least recently run',
        value: 'latent',
        fn: (a, b) => a.last_run - b.last_run
    },
    {
        label: 'Most recently run',
        value: 'recent',
        fn: (a, b) => b.last_run - a.last_run
    },
    {
        label: 'Longest duration',
        value: 'longest',
        fn: (a, b) => b.duration - a.duration
    },
    {
        label: 'Shortest duration',
        value: 'shortest',
        fn: (a, b) => a.duration - b.duration
    },
    {
        label: 'Most rows',
        value: 'most',
        fn: (a, b) => b.size - a.size
    },
    {
        label: 'Least rows',
        value: 'least',
        fn: (a, b) => a.size - b.size
    }
];

const SORT_FUNCTIONS = toHash(SORT_OPTIONS, 'value');

const flexStart = {justifyContent: 'flex-start'};
class QueryFormatter extends React.Component {
    static propTypes = {
        /*
         * Object passed by `react-data-grid` to each row. Here the value
         * is an object containg the required `query` string.
         */
        value: PropTypes.shape({
            query: PropTypes.string.isRequired
        })
    };

    render() {
        const query = this.props.value;

        return (
            <Row style={flexStart}>
                <Column style={{width: '12px'}}>
                    <Status size={12} status={query.status} />
                </Column>
                <Column
                    className="ellipsis"
                    style={{width: '50%', maxHeight: ROW_HEIGHT, padding: 8, paddingRight: '24px', fontSize: 15}}
                >
                    {query.name ? (
                        <span className="ellipsis" style={{fontSize: 16}}>
                            {query.name}
                        </span>
                    ) : (
                        <SQL>{query.query}</SQL>
                    )}
                    <em
                        className="ellipsis"
                        style={{
                            display: 'block',
                            fontSize: 15
                        }}
                    >
                        Runs every{' '}
                        {query.cronInterval
                            ? cronstrue.toString(query.cronInterval)
                            : `Runs every ${ms(query.refreshInterval * 1000, {
                                  long: true
                              })}`}
                    </em>
                </Column>
                <Column style={{width: 'auto'}}>
                    <Row style={flexStart}>{query.tags.map(tag => <Tag {...tag} />)}</Row>
                </Column>
            </Row>
        );
    }
}

class IntervalFormatter extends React.Component {
    static propTypes = {
        /*
         * Object passed by `react-data-grid` to each row. Here the value
         * is an object containg the required `refreshInterval`.
         */
        value: PropTypes.shape({
            refreshInterval: PropTypes.number.isRequired,
            cronInterval: PropTypes.string
        })
    };

    render() {
        // TODO this.props.value
        const run = {
            last_run: Date.now() - 1000,
            size: 64,
            duration: 3 * 1000,
            status: 'SUCCESS'
        };

        return (
            <Row>
                <Column>
                    <div
                        style={{
                            fontSize: 18,
                            color: run.status === 'SUCCESS' ? '#30aa65' : '#ef595b'
                        }}
                    >
                        {`${ms(Date.now() - run.last_run || Date.now(), {
                            long: true
                        })} ago`}
                    </div>
                    <em
                        style={{
                            fontSize: 12
                        }}
                    >
                        {`${run.size} rows in ${ms(run.duration, {
                            long: true
                        })}`}
                    </em>
                </Column>
            </Row>
        );
    }
}

function mapRow(row) {
    return {
        query: row,
        run: row
    };
}

class Scheduler extends Component {
    static defaultProps = {
        queries: [],
        tags: {
            Xero: {
                title: 'Xero',
                color: '#F2C94C'
            },
            Important: {
                title: 'Important',
                color: '#56CCF2'
            },
            'Stage 2': {
                title: 'Stage 2',
                color: '#D14CF2'
            }
        }, // TODO
        refreshQueries: NO_OP,
        openLogin: NO_OP,
        createScheduledQuery: NO_OP,
        updateScheduledQuery: NO_OP,
        deleteScheduledQuery: NO_OP,
        openQueryPage: NO_OP
    };

    static propTypes = {
        queries: PropTypes.arrayOf(
            PropTypes.shape({
                query: PropTypes.string.isRequired,
                refreshInterval: PropTypes.number.isRequired,
                fid: PropTypes.string.isRequired
            }).isRequired
        ),
        tags: PropTypes.object,
        initialCode: PropTypes.string,
        requestor: PropTypes.string,
        dialect: PropTypes.string,
        preview: PropTypes.object,
        refreshQueries: PropTypes.func.isRequired,
        openLogin: PropTypes.func.isRequired,
        createScheduledQuery: PropTypes.func.isRequired,
        updateScheduledQuery: PropTypes.func.isRequired,
        deleteScheduledQuery: PropTypes.func.isRequired,
        openQueryPage: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            search: '',
            sort: null,
            selectedQuery: null,
            createModalOpen: Boolean(this.props.initialCode)
        };
        this.columns = [
            {
                key: 'query',
                name: 'Query',
                filterable: true,
                formatter: QueryFormatter
            },
            {
                key: 'run',
                name: 'Last run',
                filterable: true,
                formatter: IntervalFormatter
            }
        ];

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.getRows = this.getRows.bind(this);
        this.rowGetter = this.rowGetter.bind(this);
        this.openPreview = this.openPreview.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.openCreateModal = this.openCreateModal.bind(this);
        this.closeCreateModal = this.closeCreateModal.bind(this);
        this.createQuery = this.createQuery.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleSearchChange(e) {
        this.setState({search: e.target.value});
    }

    handleSortChange(change) {
        // on clear, change is null
        this.setState({sort: change ? change.value : null});
    }

    getRows() {
        const rows = this.props.queries.map(query =>
            Object.assign({}, query, {
                // TODO real tags, move `this.props.tags[k]` below matchSorter
                tags: ['Xero', 'Important']
            })
        );

        const sort = SORT_FUNCTIONS[this.state.sort];

        return matchSorter(rows, this.state.search, {keys: ['query', 'name', 'status', 'tags']}).sort(sort && sort.fn);
    }

    rowGetter(i) {
        const row = this.getRows()[i];

        return mapRow(
            Object.assign({}, row, {
                tags: row.tags.map(k => this.props.tags[k])
            })
        );
    }

    openPreview(i, query) {
        this.setState({selectedQuery: query.query});
    }

    closePreview() {
        this.setState({selectedQuery: null});
    }

    openCreateModal() {
        this.setState({createModalOpen: true});
    }

    closeCreateModal() {
        this.setState({createModalOpen: false});
    }

    createQuery(queryConfig) {
        if (!this.props.requestor) {
            return;
        }
        const newQueryParams = {
            ...queryConfig,
            requestor: this.props.requestor
        };
        return this.props.createScheduledQuery(newQueryParams).then(res => {
            if (res.error) {
                throw res.error;
            }
            return res;
        });
    }

    handleUpdate(queryConfig) {
        if (!this.props.requestor) {
            return;
        }
        const newQueryParams = {
            ...queryConfig,
            requestor: this.props.requestor
        };
        return this.props.updateScheduledQuery(newQueryParams).then(res => {
            if (res.error) {
                throw res.error;
            }
            return res;
        });
    }

    handleDelete(fid) {
        if (!this.props.requestor) {
            return;
        }
        this.props.deleteScheduledQuery(fid);
        this.closePreview();
    }

    render() {
        const rows = this.getRows();
        const loggedIn = Boolean(this.props.requestor);

        return (
            <React.Fragment>
                <Row
                    style={{
                        marginTop: 24,
                        marginBottom: 24,
                        justifyContent: 'space-between'
                    }}
                >
                    <input
                        value={this.state.search}
                        onChange={this.handleSearchChange}
                        placeholder="Search scheduled queries..."
                    />
                    {!contains(this.props.dialect, SQL_DIALECTS_USING_EDITOR) && (
                        <button style={{marginRight: '16px'}} onClick={this.openCreateModal}>
                            Create Scheduled Query
                        </button>
                    )}
                </Row>
                <Row
                    style={{
                        marginBottom: 16,
                        padding: '0 16px',
                        justifyContent: 'space-between'
                    }}
                >
                    <Column style={{width: 300}}>
                        <Row>
                            <Column
                                style={{
                                    padding: '4px 0',
                                    marginLeft: 8,
                                    borderRight: '1px solid rgba(0, 0, 0, 0.12)'
                                }}
                            >
                                {rows.length} {rows.length === 1 ? ' query' : ' queries'}
                            </Column>
                            <Column style={{padding: '4px 0', marginLeft: 24}}>
                                Success ({rows.filter(row => row.status === 'SUCCESS').length})
                            </Column>
                            <Column style={{padding: '4px 0', marginLeft: 8}}>
                                Error ({rows.filter(row => row.status === 'FAILURE').length})
                            </Column>
                        </Row>
                    </Column>
                    <Column style={{width: 300}}>
                        <Row style={{width: 'auto', justifyContent: 'flex-end'}}>
                            <Column>
                                <Select
                                    searchable={false}
                                    value={this.state.sort}
                                    options={SORT_OPTIONS}
                                    onChange={this.handleSortChange}
                                />
                            </Column>
                            <Column style={{marginLeft: 16, width: 'auto'}}>
                                <button
                                    className="refresh-button"
                                    onClick={this.props.refreshQueries}
                                    style={{marginRight: '8px'}}
                                >
                                    ⟳
                                </button>
                            </Column>
                        </Row>
                    </Column>
                </Row>
                <Row className="scheduler-table" style={{margin: '0 16px 16px', width: 'auto'}}>
                    <ReactDataGrid
                        onRowClick={this.openPreview}
                        columns={this.columns}
                        rowGetter={this.rowGetter}
                        rowsCount={rows.length}
                        rowHeight={ROW_HEIGHT}
                        headerRowHeight={32}
                    />
                </Row>

                <CreateModal
                    initialCode={this.props.initialCode}
                    open={loggedIn && this.state.createModalOpen}
                    onClickAway={this.closeCreateModal}
                    onSubmit={this.createQuery}
                    dialect={this.props.dialect}
                    openQueryPage={this.props.openQueryPage}
                />
                <PromptLoginModal
                    open={!loggedIn && this.state.createModalOpen}
                    onClickAway={this.closeCreateModal}
                    onSubmit={this.props.openLogin}
                    preview={this.props.preview}
                />

                {/*
                  Preview modal is now only rendered if a `selectedQuery` has been
                  set. This simplifies the rerender logic.
                */}
                {this.state.selectedQuery && (
                    <PreviewModal
                        onClickAway={this.closePreview}
                        query={this.state.selectedQuery}
                        currentRequestor={this.props.requestor}
                        onLogin={this.props.openLogin}
                        onSave={this.handleUpdate}
                        onDelete={this.handleDelete}
                        dialect={this.props.dialect}
                        openQueryPage={this.props.openQueryPage}
                    />
                )}
            </React.Fragment>
        );
    }
}

export default Scheduler;
