import React, {Component} from 'react';
import PropTypes from 'prop-types';

import ReactDataGrid from 'react-data-grid';
import ms from 'ms';
import matchSorter from 'match-sorter';
import enhanceWithClickOutside from 'react-click-outside'

import { Link } from '../Link.react';
import { plotlyUrl } from '../../utils/utils';

const Row = props => (
  <div
    className="row" {...props}
    style={{
      display: 'flex',
      boxSizing: 'border-box',
      justifyContent: 'space-around',
      width: '100%',
      ...props.style
    }}
  >
    {props.children}
  </div>
);

Row.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object
};

const Column = props => (
  <Row {...props} style={{ flexDirection: 'column', ...props.style }} />
);

Column.propTypes = {
  style: PropTypes.object
};

class QueryFormatter extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  render() {
    const query = this.props.value;
    return (
      <Row>
        <Column style={{ padding: '0 24px' }}>
          <div style={{ fontSize: 18 }}>
            {query.query}
          </div>
        </Column>
        {/* add tags here */}
      </Row>
    );
  }
}

class IntervalFormatter extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  render() {
    const run = this.props.value;
    return (
      <Row>
        <Column style={{ padding: '0 24px' }}>
          <em
            style={{
              fontSize: 18
            }}
          >
            {`Runs every ${ms(run.refreshInterval * 1000, { long: true })}`}
          </em>
        </Column>
      </Row>
    );
  }
}

function mapRows (rows) {
  return rows
    .map(r => ({
      query: r,
      run: r
    }));
}

const Overlay = props => props.open
  ? (
    <div
      {...props}
      onClick={props.onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        margin: '0 auto',
        position: 'fixed',
        background: 'rgba(0, 0, 0, 0.1)',
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      {props.children}
    </div>
  )
  : null;

Overlay.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  open: PropTypes.bool
};

const rowStyle = {
  justifyContent: 'flex-start',
  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  padding: '16px 0px'
};
const boxStyle = { boxSizing: 'border-box', width: '50%' };

const MetaPreview = enhanceWithClickOutside(class extends Component {
  handleClickOutside() {
    // eslint-disable-next-line
    this.props.onClickAway();
  }
  render() {
    const props = this.props;

    const [account, gridId] = props.query.fid.split(':');
    const link = `${plotlyUrl()}/~${account}/${gridId}`;

    return (
      <Column
        style={{ width: '50%', background: 'white' }}
      >
        <Row style={{ padding: '32px', justifyContent: 'flex-start' }}>
          <h5 style={{ margin: 0 }}>{props.query.query}</h5>
        </Row>
        <Column style={{ background: '#F5F7FB', padding: '32px' }}>
          <Row style={rowStyle}>
            <div style={boxStyle}>Query</div>
            <div style={boxStyle}>{props.query.query}</div>
          </Row>
          <Row style={rowStyle}>
            <div style={boxStyle}>Interval</div>
            <em style={boxStyle}>
              Runs every <b>{ms(props.query.refreshInterval * 1000, { long: true })}</b>
            </em>
          </Row>
          <Row style={rowStyle}>
            <div style={boxStyle}>Live Dataset</div>
            <Link href={link} style={boxStyle}>{link}</Link>
          </Row>
        </Column>
      </Column>
    );
  }
});

const MetaPreviewModal = (props) => {
  if (!props.query) return null;

  return (
    <Overlay {...props} open={props.query !== null} className="scheduler">
      <MetaPreview {...props} />
    </Overlay>
  );
};

MetaPreviewModal.propTypes = {
  query: PropTypes.object
};

class Scheduler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: null,
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
      matchSorter(
        this.props.queries,
        this.state.search,
        { keys: ['query'] }
      )
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
          {/* Add create scheduled query button here */}
        </Row>
        <Row style={{ marginBottom: 16, padding: '0 16px', justifyContent: 'space-between' }}>
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
                <button onClick={this.props.refreshQueries} style={{ marginRight: '32px' }}>⟳</button>
              </Column>
            </Row>
          </Column>
        </Row>
        <Row style={{ padding: '0 16px', width: 'auto' }}>
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
          onClickAway={this.closePreview}
          query={this.state.selectedQuery}
        />
      </React.Fragment>
    );
  }
}

Scheduler.propTypes = {
  queries: PropTypes.arrayOf(PropTypes.shape({
    query: PropTypes.string,
    refreshInterval: PropTypes.number
  })),
  refreshQueries: PropTypes.func
};

export default Scheduler;
