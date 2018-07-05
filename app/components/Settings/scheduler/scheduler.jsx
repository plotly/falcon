import React, {Component} from 'react';
import PropTypes from 'prop-types';

import ReactDataGrid from 'react-data-grid';
import ms from 'ms';
import matchSorter from 'match-sorter';

import CreateModal from './createModal.jsx';
import PreviewModal from './previewModal.jsx';
import PromptLoginModal from './loginModal.jsx';
import { Row, Column } from '../../layout.jsx';
import SQL from './sql.jsx';

import './scheduler.css';

const NO_OP = () => {};

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
            <Row>
                <Column style={{ paddingRight: '24px', fontSize: 15 }}>
                    <SQL>{query.query}</SQL>
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
            refreshInterval: PropTypes.number.isRequired
        })
    };

    render() {
        const run = this.props.value;
        return (
            <Row>
                <Column>
                    <em
                        style={{
                            fontSize: 15
                        }}
                    >
                        {`Runs every ${ms(run.refreshInterval * 1000, {
                            long: true
                        })}`}
                    </em>
                </Column>
            </Row>
        );
    }
}

function mapRows(rows) {
    return rows.map(r => ({
        query: r,
        run: r
    }));
}

class Scheduler extends Component {
    static defaultProps = {
        queries: [],
        refreshQueries: NO_OP,
        openLogin: NO_OP,
        createScheduledQuery: NO_OP,
        updateScheduledQuery: NO_OP,
        deleteScheduledQuery: NO_OP
    };

    static propTypes = {
        queries: PropTypes.arrayOf(
            PropTypes.shape({
                query: PropTypes.string.isRequired,
                refreshInterval: PropTypes.number.isRequired,
                fid: PropTypes.string.isRequired
            }).isRequired
        ),
        initialCode: PropTypes.string,
        requestor: PropTypes.string,
        dialect: PropTypes.string,
        refreshQueries: PropTypes.func.isRequired,
        openLogin: PropTypes.func.isRequired,
        createScheduledQuery: PropTypes.func.isRequired,
        updateScheduledQuery: PropTypes.func.isRequired,
        deleteScheduledQuery: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            search: '',
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
                name: 'Interval',
                filterable: true,
                formatter: IntervalFormatter
            }
        ];

        this.handleSearchChange = this.handleSearchChange.bind(this);
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
        this.setState({ search: e.target.value });
    }

    getRows() {
        return mapRows(
            matchSorter(this.props.queries, this.state.search, {
                keys: ['query']
            })
        );
    }

    rowGetter(i) {
        return this.getRows()[i];
    }

    openPreview(i, query) {
        this.setState({ selectedQuery: query.query });
    }

    closePreview() {
        this.setState({ selectedQuery: null });
    }

    openCreateModal() {
        this.setState({ createModalOpen: true });
    }

    closeCreateModal() {
        this.setState({ createModalOpen: false });
    }

    createQuery(queryConfig) {
        const newQueryParams = {
            ...queryConfig,
            requestor: this.props.requestor
        };
        this.props.createScheduledQuery(newQueryParams);
        this.closeCreateModal();
    }

    handleUpdate(queryConfig) {
        const newQueryParams = {
            ...queryConfig,
            requestor: this.props.requestor
        };
        this.props.updateScheduledQuery(newQueryParams);
        this.closePreview();
    }

    handleDelete(fid) {
        this.props.deleteScheduledQuery(fid);
        this.closePreview();
    }

    render() {
        const rows = this.getRows();
        const loggedIn = this.props.requestor;

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
                    <button
                        style={{ marginRight: '16px' }}
                        onClick={this.openCreateModal}
                    >
                        Create Scheduled Query
                    </button>
                </Row>
                <Row
                    style={{
                        marginBottom: 16,
                        padding: '0 16px',
                        justifyContent: 'space-between'
                    }}
                >
                    <Column style={{ width: 300 }}>
                        <Row>
                            <Column style={{ marginLeft: 8 }}>
                                {rows.length} queries
                            </Column>
                        </Row>
                    </Column>
                    <Column style={{ width: 300 }}>
                        <Row>
                            <Column>
                                <button
                                    className="refresh-button"
                                    onClick={this.props.refreshQueries}
                                    style={{ marginRight: '8px' }}
                                >
                                    ⟳
                                </button>
                            </Column>
                        </Row>
                    </Column>
                </Row>
                <Row
                    className="scheduler-table"
                    style={{ padding: '0 16px 16px', width: 'auto' }}
                >
                    <ReactDataGrid
                        onRowClick={this.openPreview}
                        columns={this.columns}
                        rowGetter={this.rowGetter}
                        rowsCount={rows.length}
                        rowHeight={84}
                        headerRowHeight={32}
                    />
                </Row>

                <CreateModal
                    initialCode={this.props.initialCode}
                    open={loggedIn && this.state.createModalOpen}
                    onClickAway={this.closeCreateModal}
                    onSubmit={this.createQuery}
                    dialect={this.props.dialect}
                />
                <PromptLoginModal
                    open={!loggedIn && this.state.createModalOpen}
                    onClickAway={this.closeCreateModal}
                    onSubmit={this.props.openLogin}
                />

                <PreviewModal
                    onClickAway={this.closePreview}
                    query={this.state.selectedQuery}
                    onSave={this.handleUpdate}
                    onDelete={this.handleDelete}
                    dialect={this.props.dialect}
                />
            </React.Fragment>
        );
    }
}

export default Scheduler;
