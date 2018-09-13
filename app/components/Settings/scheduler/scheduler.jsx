import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {contains} from 'ramda';
import ReactDataGrid from 'react-data-grid';
import ms from 'ms';
import matchSorter from 'match-sorter';
import cronstrue from 'cronstrue';
import Select from 'react-select';

import CreateModal from './create-modal.jsx';
import PreviewModal from './preview-modal.jsx';
import PromptLoginModal from './login-modal.jsx';
import {Row, Column} from '../../layout.jsx';
import SQL from './sql.jsx';
import Tag from './tag.jsx';
import Status from './status.jsx';

import {SQL_DIALECTS_USING_EDITOR, FAILED} from '../../../constants/constants';

import './scheduler.css';

const NO_OP = () => {};

const ROW_HEIGHT = 84;

const sortLastExecution = (key, reverse) => (a, b) => {
    const s = (a.lastExecution && a.lastExecution[key]) || 0 - (b.lastExecution && b.lastExecution[key]) || 0;
    return reverse ? -1 * s : s;
};
const SORT_OPTIONS = [
    {
        label: 'Most recently run',
        value: sortLastExecution('completedAt', true)
    },
    {
        label: 'Least recently run',
        value: sortLastExecution('completedAt')
    },
    {
        label: 'Longest duration',
        value: sortLastExecution('duration', true)
    },
    {
        label: 'Shortest duration',
        value: sortLastExecution('duration')
    },
    {
        label: 'Most rows',
        value: sortLastExecution('rowCount', true)
    },
    {
        label: 'Least rows',
        value: sortLastExecution('rowCount')
    }
];

const flexStart = {justifyContent: 'flex-start'};
const widthAuto = {width: 'auto'};
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
                    <Status size={12} status={query.lastExecution && query.lastExecution.status} />
                </Column>
                <Column
                    className="ellipsis"
                    style={{width: '50%', maxHeight: ROW_HEIGHT, padding: '0px 0px 8px 12px', fontSize: 15}}
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
                        {query.cronInterval
                            ? cronstrue.toString(query.cronInterval)
                            : `Runs every ${ms(query.refreshInterval * 1000, {
                                  long: true
                              })}`}
                    </em>
                </Column>
                <Column style={widthAuto}>
                    <Row style={flexStart}>{query.tags.map(tag => <Tag key={tag.name} {...tag} />)}</Row>
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
        value: PropTypes.oneOfType([
            PropTypes.shape({
                completedAt: PropTypes.number,
                duration: PropTypes.number,
                rowsCount: PropTypes.number,
                status: PropTypes.string
            }),
            // when value is undefined, `react-data-grid` passes ''
            PropTypes.string
        ])
    };

    render() {
        const run = this.props.value;

        return (
            <Row>
                <Column>
                    {!run && '—'}
                    {run && (
                        <div
                            style={{
                                fontSize: 18,
                                color: run.status !== FAILED ? '#30aa65' : '#ef595b'
                            }}
                        >
                            {`${ms(Date.now() - run.completedAt, {
                                long: true
                            })} ago`}
                        </div>
                    )}
                    {run && (
                        <em
                            style={{
                                fontSize: 12
                            }}
                        >
                            {`${run.rowCount} rows in ${ms(run.duration / 1000, {
                                long: true
                            })}`}
                        </em>
                    )}
                </Column>
            </Row>
        );
    }
}

function mapRow(row) {
    return {
        query: row,
        run: row.lastExecution
    };
}

class Scheduler extends Component {
    static defaultProps = {
        queries: [],
        tags: [],
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
        tags: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                color: PropTypes.string
            })
        ),
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

    handleSortChange(sort) {
        // on clear, `sort` is null
        this.setState({sort});
    }

    getRows() {
        return matchSorter(this.props.queries, this.state.search, {keys: ['query', 'name', 'status', 'tags']}).sort(
            this.state.sort && this.state.sort.value
        );
    }

    rowGetter(i) {
        const row = this.getRows()[i];

        return mapRow(
            Object.assign({}, row, {
                tags: row.tags ? row.tags.map(id => this.props.tags.find(t => t.id === id)) : []
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
                                Success ({
                                    rows.filter(row => (row.lastExecution && row.lastExecution.status) !== FAILED)
                                        .length
                                })
                            </Column>
                            <Column style={{padding: '4px 0', marginLeft: 8}}>
                                Error ({
                                    rows.filter(row => (row.lastExecution && row.lastExecution.status) === FAILED)
                                        .length
                                })
                            </Column>
                        </Row>
                    </Column>
                    <Column style={{width: 300}}>
                        <Row style={{width: 'auto', justifyContent: 'flex-end'}}>
                            <Column>
                                <Select
                                    placeholder="Sort by..."
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
                    tags={this.props.tags}
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
                        tags={this.props.tags}
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
