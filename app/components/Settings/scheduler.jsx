import React, {Component} from 'react';
import PropTypes from 'prop-types';

import ReactDataGrid from 'react-data-grid';
import ms from 'ms';
import matchSorter from 'match-sorter';
import Highlight from 'react-highlight';

import { Link } from '../Link.react.js';
import { Row, Column } from '../layout.jsx';
import Modal from '../modal.jsx';
import { plotlyUrl } from '../../utils/utils.js';

import './scheduler.css';

const NO_OP = () => {};

export const SQL = props => (
    <Highlight className="sql">{props.children}</Highlight>
);
SQL.propTypes = {
    children: PropTypes.string
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
                <Column style={{ paddingRight: '24px' }}>
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

const rowStyle = {
    justifyContent: 'flex-start',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    padding: '16px 0px'
};
const boxStyle = { boxSizing: 'border-box', width: '50%' };

const MetaPreview = props => {
    if (!props.query) {
        return null;
    }
    const [account, gridId] = props.query.fid.split(':');
    const link = `${plotlyUrl()}/~${account}/${gridId}`;

    return (
        <Column style={{ width: '50%', background: 'white' }}>
            <Row
                style={{
                    padding: '32px',
                    position: 'relative',
                    justifyContent: 'flex-start'
                }}
            >
                <h5 style={{ margin: 0 }}>{props.query.query}</h5>
                <button
                    onClick={props.onCloseBtnClick}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        padding: '2px 4px'
                    }}
                >
                    &times;
                </button>
            </Row>
            <Column style={{ background: '#F5F7FB', padding: '32px' }}>
                <Row style={rowStyle}>
                    <div style={boxStyle}>Query</div>
                    <div style={boxStyle}>
                        <SQL>{props.query.query}</SQL>
                    </div>
                </Row>
                <Row style={rowStyle}>
                    <div style={boxStyle}>Update Frequency</div>
                    <em style={boxStyle}>
                        Runs every{' '}
                        <b>
                            {ms(props.query.refreshInterval * 1000, {
                                long: true
                            })}
                        </b>
                    </em>
                </Row>
                <Row style={rowStyle}>
                    <div style={boxStyle}>Live Dataset</div>
                    <Link href={link} style={boxStyle}>
                        {link}
                    </Link>
                </Row>
            </Column>
        </Column>
    );
};

MetaPreview.propTypes = {
    onCloseBtnClick: PropTypes.func,
    query: PropTypes.object
};

export const MetaPreviewModal = props => (
    <Modal {...props} open={props.query !== null}>
        <MetaPreview {...props} />
    </Modal>
);

MetaPreviewModal.propTypes = {
    query: PropTypes.object
};

function mapRows(rows) {
    return rows.map(r => ({
        query: r,
        run: r
    }));
}

class Scheduler extends Component {
    constructor(props) {
        super(props);
        this.state = {
            search: '',
            selectedQuery: null
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

    render() {
        const rows = this.getRows();

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
                    style={{ padding: '0 16px', width: 'auto' }}
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
                <MetaPreviewModal
                    onCloseBtnClick={this.closePreview}
                    onClickAway={this.closePreview}
                    query={this.state.selectedQuery}
                />
            </React.Fragment>
        );
    }
}

Scheduler.defaultProps = {
    queries: [],
    refreshQueries: NO_OP
};

Scheduler.propTypes = {
    queries: PropTypes.arrayOf(
        PropTypes.shape({
            query: PropTypes.string.isRequired,
            refreshInterval: PropTypes.number.isRequired,
            fid: PropTypes.string.isRequired
        }).isRequired
    ),
    refreshQueries: PropTypes.func.isRequired
};

export default Scheduler;
