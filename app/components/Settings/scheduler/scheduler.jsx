import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {contains} from 'ramda';
import ReactDataGrid from 'react-data-grid';
import ReactToolTip from 'react-tooltip';
import ms from 'ms';
import matchSorter from 'match-sorter';
import cronstrue from 'cronstrue';
import Select from 'react-select';
import pluralize from 'pluralize';

import CreateModal from './modals/create-modal/create-modal.jsx';
import PreviewModal from './modals/preview-modal.jsx';
import PromptLoginModal from './modals/login-modal/login-modal.jsx';
import TagModal from './modals/tags-modal/tags-modal.jsx';
import {Row, Column} from '../../layout.jsx';
import SQL from './presentational/sql';
import Tag from './presentational/tag';
import TagPicker from './pickers/tag-picker.jsx';
import Status from './presentational/status';
import {CallCountWidget, toIndividualCallCountString} from './presentational/api-call-counts';

import {decapitalize} from '../../../utils/utils';
import {SQL_DIALECTS_USING_EDITOR} from '../../../constants/constants';
import {EXE_STATUS} from '../../../../shared/constants.js';
import {mapQueryToDailyCallCount} from '../../../utils/queryUtils';

import './scheduler.css';

const NO_OP = () => {};
const ROW_HEIGHT = 84;

const sortLastExecution = (key, reverse) => (a, b) => {
    const s = ((a.lastExecution && a.lastExecution[key]) || 0) - ((b.lastExecution && b.lastExecution[key]) || 0);
    return reverse ? -1 * s : s;
};
const sortCallCount = reverse => (a, b) => {
    const s = mapQueryToDailyCallCount(b) - mapQueryToDailyCallCount(a);
    return reverse ? -1 * s : s;
};

const SORT_OPTIONS = [
    {
        id: 'nextScheduledAt-asc',
        label: 'Next to run',
        fn: (a = {}, b = {}) => (a.nextScheduledAt || 0) - (b.nextScheduledAt || 0)
    },
    {
        id: 'startedAt-desc',
        label: 'Most recently run',
        fn: sortLastExecution('startedAt', true)
    },
    {
        id: 'startedAt-asc',
        label: 'Least recently run',
        fn: sortLastExecution('startedAt', false)
    },
    {
        id: 'duration-desc',
        label: 'Longest duration',
        fn: sortLastExecution('duration', true)
    },
    {
        id: 'duration-asc',
        label: 'Shortest duration',
        fn: sortLastExecution('duration', false)
    },
    {
        id: 'rowCount-desc',
        label: 'Most rows',
        fn: sortLastExecution('rowCount', true)
    },
    {
        id: 'rowCount-asc',
        label: 'Least rows',
        fn: sortLastExecution('rowCount', false)
    },
    {
        id: 'callCount-desc',
        label: 'Most API calls/day',
        fn: sortCallCount()
    },
    {
        id: 'callCount-asc',
        label: 'Least API calls/day',
        fn: sortCallCount(true)
    }
];

// react select requires value prop for all options
SORT_OPTIONS.forEach(option => {
    option.value = option.id;
});

// helpers
const addSlug = (str, slug) => {
    if (str.indexOf(slug) > -1) {
        return str;
    }
    return str.trim() + (str.trim().length ? ' ' : '') + slug;
};

const mapRow = row => {
    return {
        query: row,
        run: row.lastExecution
    };
};

// shared styles
const flexStart = {justifyContent: 'flex-start'};
const tagStyle = {
    maxWidth: '80px'
};

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

        let tags = query.tags
            .filter(Boolean)
            .map(tag => <Tag key={tag.name} style={tagStyle} className="ellipsis" {...tag} />);

        if (tags && tags.length > 4) {
            const numHidden = tags.length - 4;
            tags = tags.slice(0, 4);
            tags.push(<span style={{lineHeight: 2.2, opacity: 0.5}}>+ {numHidden}</span>);
        }

        return (
            <Row style={flexStart}>
                <Column style={{width: '40px', alignItems: 'center', flexShrink: 0}}>
                    <Status size={20} status={query.lastExecution && query.lastExecution.status} />
                </Column>
                <Column
                    className="ellipsis"
                    style={{
                        width: '70%',
                        maxHeight: ROW_HEIGHT,
                        padding: '0px 0px 4px 12px',
                        fontSize: 16
                    }}
                >
                    {query.name ? (
                        <span className="ellipsis" style={{fontSize: 18}}>
                            {query.name}
                        </span>
                    ) : (
                        <SQL>{query.query}</SQL>
                    )}
                    <em
                        className="ellipsis"
                        style={{
                            display: 'block',
                            fontSize: 12,
                            opacity: 0.5
                        }}
                    >
                        <span data-tip={toIndividualCallCountString(mapQueryToDailyCallCount(query))}>
                            {query.cronInterval
                                ? `Runs ${decapitalize(cronstrue.toString(query.cronInterval))}`
                                : `Runs every ${ms(query.refreshInterval * 1000, {
                                      long: true
                                  })}`}
                        </span>
                    </em>
                </Column>
                <Column style={{width: 'auto', margin: '0 16px'}}>
                    <Row style={{justifyContent: 'flex-start', maxWidth: 400}}>{tags}</Row>
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
                startedAt: PropTypes.number,
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

        const startedAt = run && run.startedAt && Date.now() - run.startedAt;

        return (
            <Row>
                <Column>
                    {!run && '—'}
                    {startedAt ? (
                        <div
                            data-tip={new Date(run.startedAt).toISOString()}
                            style={{
                                fontSize: 16,
                                color: run.status !== EXE_STATUS.failed ? '#00cc96' : '#ef595b'
                            }}
                        >
                            {startedAt < 60 * 1000
                                ? 'Just now'
                                : `${ms(startedAt, {
                                      long: true
                                  })} ago`}
                        </div>
                    ) : (
                        run &&
                        run.status === EXE_STATUS.running && (
                            <span style={{fontSize: 16, color: '#e4cf11'}}>Currently running</span>
                        )
                    )}
                    {run &&
                        run.errorMessage && (
                            <em
                                style={{
                                    fontSize: 12,
                                    opacity: 0.5
                                }}
                            >
                                <div className="ellipsis">{run.errorMessage}</div>
                            </em>
                        )}
                    {run &&
                        run.duration && (
                            <em
                                style={{
                                    fontSize: 12,
                                    opacity: 0.5
                                }}
                            >
                                {`${pluralize('row', run.rowCount, true)} in ${ms(run.duration * 1000, {
                                    long: true
                                })}`}
                            </em>
                        )}
                </Column>
            </Row>
        );
    }
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
            tags: [],
            selectedQuery: null,
            createModalOpen: Boolean(this.props.initialCode),
            manageTags: false
        };
        this.columns = [
            {
                key: 'query',
                name: 'Query',
                filterable: true,
                formatter: QueryFormatter
            },
            {
                width: 400,
                key: 'run',
                name: 'Last run',
                filterable: true,
                formatter: IntervalFormatter
            }
        ];

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.getRowsWithoutStatus = this.getRowsWithoutStatus.bind(this);
        this.getRows = this.getRows.bind(this);
        this.rowGetter = this.rowGetter.bind(this);
        this.openPreview = this.openPreview.bind(this);
        this.closePreview = this.closePreview.bind(this);
        this.openCreateModal = this.openCreateModal.bind(this);
        this.closeCreateModal = this.closeCreateModal.bind(this);
        this.createQuery = this.createQuery.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.filterRunning = this.filterRunning.bind(this);
        this.filterSuccess = this.filterSuccess.bind(this);
        this.filterFailed = this.filterFailed.bind(this);
        this.filterTag = this.filterTag.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
    }

    componentDidMount() {
        this.refreshQueriesInterval = setInterval(this.props.refreshQueries, 60 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.refreshQueriesInterval);
    }

    handleSearchChange(e) {
        this.setState({search: e.target.value});
    }

    handleSortChange(sort) {
        this.setState(({search}) => {
            // remove old sort slugs
            const newSearch = search.replace(/sort:\S+/g, '');

            if (sort) {
                return {
                    sort,
                    search: addSlug(newSearch, `sort:${sort.id}`)
                };
            }

            // on clear, `sort` is null
            return {
                sort,
                search: newSearch
            };
        });
    }

    getRowsWithoutStatus() {
        let rows = this.props.queries;
        const sortFilter = this.state.search.match(/sort:(\S+)/);
        const tagFilter = this.state.search.match(/tag:(?:"(.*?)"|(\S+))/g);

        if (tagFilter) {
            const selectedTags = tagFilter
                .map(t => /tag:(?:"(.*?)"|(\S+))/.exec(t))
                .map(match => match && (match[1] || match[2])) // match with or without quotes
                .map(name => this.props.tags.find(t => t.name === name))
                .map(tag => tag && tag.id)
                .filter(Boolean);

            rows = rows.filter(q => selectedTags.every(t => q.tags && q.tags.indexOf(t) > -1));
        }

        // remove tags in search
        const search = this.state.search.replace(/\w+:(?:"(.*?)"|(\S+))/g, '');

        rows = matchSorter(rows, search.trim(), {keys: ['query', 'name']});
        if (sortFilter && sortFilter[1]) {
            const sort = SORT_OPTIONS.find(o => o.id === sortFilter[1]);

            rows.sort(sort && sort.fn);
        }

        return rows;
    }

    getRows() {
        const rows = this.getRowsWithoutStatus();
        const statusFilter = this.state.search.match(/status:(\S+)/);

        if (statusFilter && statusFilter[1]) {
            if (statusFilter[1] === 'error') {
                return rows.filter(q => (q.lastExecution && q.lastExecution.status) === EXE_STATUS.failed);
            } else if (statusFilter[1] === 'success') {
                return rows.filter(q => (q.lastExecution && q.lastExecution.status) === EXE_STATUS.ok);
            } else if (statusFilter[1] === 'running') {
                return rows.filter(q => (q.lastExecution && q.lastExecution.status) === EXE_STATUS.running);
            }
        }

        return rows;
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
        this.setState({selectedQuery: query.query.fid});
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

    filterRunning() {
        this.setState(({search}) => {
            const stripFilter = search.replace(/status:\w+/g, '');

            return {
                search: addSlug(stripFilter, 'status:running')
            };
        });
    }

    filterSuccess() {
        this.setState(({search}) => {
            const stripFilter = search.replace(/status:\w+/g, '');

            return {
                search: addSlug(stripFilter, 'status:success')
            };
        });
    }

    filterFailed() {
        this.setState(({search}) => {
            const stripFilter = search.replace(/status:\w+/g, '');

            return {
                search: addSlug(stripFilter, 'status:error')
            };
        });
    }

    filterTag(tags) {
        const existingSearchString = this.state.search;
        const search = tags.length
            ? addSlug(existingSearchString, `tag:"${tags[tags.length - 1].name}"`)
            : existingSearchString.replace(/tag:(?:"(.*?)"|(\S+))/g, '');

        this.setState({
            tags,
            search
        });
    }

    resetSearch() {
        this.setState({
            search: '',
            sort: null,
            tags: []
        });
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
        const statuslessRows = this.getRowsWithoutStatus();
        const rows = this.getRows();
        const loggedIn = Boolean(this.props.requestor);

        const totalCallsPerDay = this.props.queries.reduce((accum, currQuery) => {
            return accum + mapQueryToDailyCallCount(currQuery);
        }, 0);

        const statusFilter = this.state.search.match(/status:(\S+)/);

        return (
            <React.Fragment>
                <Row
                    style={{
                        marginBottom: 8,
                        justifyContent: 'space-between',
                        alignItems: 'center'
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
                    <div style={{marginRight: '16px'}}>
                        <CallCountWidget count={totalCallsPerDay} />
                    </div>
                </Row>
                <Row
                    style={{
                        marginBottom: 22,
                        padding: '0 16px',
                        justifyContent: 'space-between'
                    }}
                >
                    <Column style={{width: '100%', maxWidth: 350}}>
                        <div style={{display: 'flex'}}>
                            <div
                                style={{
                                    padding: '4px 0',
                                    marginLeft: 6,
                                    paddingRight: '10px',
                                    borderRight: '1px solid rgba(0, 0, 0, 0.12)'
                                }}
                            >
                                {rows.length} {rows.length === 1 ? ' query' : ' queries'}
                            </div>
                            <div
                                className="status-filter"
                                style={{
                                    fontWeight: statusFilter && statusFilter[1] === 'success' && 'bold',
                                    padding: '4px 0',
                                    marginLeft: 10,
                                    cursor: 'pointer'
                                }}
                                onClick={this.filterSuccess}
                            >
                                Success (
                                {
                                    statuslessRows.filter(
                                        row => (row.lastExecution && row.lastExecution.status) === EXE_STATUS.ok
                                    ).length
                                }
                                )
                            </div>
                            <div
                                className="status-filter"
                                style={{
                                    fontWeight: statusFilter && statusFilter[1] === 'error' && 'bold',
                                    padding: '4px 0',
                                    marginLeft: 12,
                                    cursor: 'pointer'
                                }}
                                onClick={this.filterFailed}
                            >
                                Error (
                                {
                                    statuslessRows.filter(
                                        row => (row.lastExecution && row.lastExecution.status) === EXE_STATUS.failed
                                    ).length
                                }
                                )
                            </div>
                            <div
                                className="status-filter"
                                style={{
                                    fontWeight: statusFilter && statusFilter[1] === 'running' && 'bold',
                                    padding: '4px 0',
                                    marginLeft: 12,
                                    cursor: 'pointer'
                                }}
                                onClick={this.filterRunning}
                            >
                                Running (
                                {
                                    statuslessRows.filter(
                                        row => (row.lastExecution && row.lastExecution.status) === EXE_STATUS.running
                                    ).length
                                }
                                )
                            </div>
                        </div>
                    </Column>
                    <Column style={{width: '100%', maxWidth: 720}}>
                        <Row style={{width: 'auto', justifyContent: 'flex-end'}}>
                            <Column style={{maxWidth: 168, marginRight: 16}}>
                                {this.state.search && (
                                    <u
                                        className="clear-state"
                                        onClick={this.resetSearch}
                                        style={{
                                            fontWeight: 'bold',
                                            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Clear current search
                                    </u>
                                )}
                            </Column>
                            <Column
                                style={{
                                    position: 'relative',
                                    padding: '4px 0',
                                    marginRight: 8
                                }}
                            >
                                <TagPicker
                                    placeholder="Filter tags..."
                                    searchable={false}
                                    onChange={this.filterTag}
                                    value={this.state.tags}
                                    options={this.props.tags}
                                />
                                <div
                                    style={{position: 'absolute', bottom: '-16px'}}
                                    onClick={() => this.setState({manageTags: true})}
                                >
                                    <u className="tag-manager-text">manage tags</u>
                                </div>
                            </Column>
                            <Column style={{maxWidth: 180}}>
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
                        minHeight={Math.max(ROW_HEIGHT * rows.length + 32, 350)}
                    />
                </Row>

                {this.state.manageTags && <TagModal onClickAway={() => this.setState({manageTags: false})} />}

                <CreateModal
                    initialCode={this.props.initialCode}
                    open={loggedIn && this.state.createModalOpen}
                    onClickAway={this.closeCreateModal}
                    onSubmit={this.createQuery}
                    dialect={this.props.dialect}
                    openQueryPage={this.props.openQueryPage}
                    tags={this.props.tags}
                    totalCallsPerDay={totalCallsPerDay}
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
                        query={this.props.queries.find(q => this.state.selectedQuery === q.fid)}
                        tags={this.props.tags}
                        currentRequestor={this.props.requestor}
                        onLogin={this.props.openLogin}
                        onSave={this.handleUpdate}
                        onDelete={this.handleDelete}
                        dialect={this.props.dialect}
                        openQueryPage={this.props.openQueryPage}
                        totalCallsPerDay={totalCallsPerDay}
                    />
                )}
                <ReactToolTip className="tool-tip" />
            </React.Fragment>
        );
    }
}

export default Scheduler;
