import React, {Component} from 'react';
import PropTypes from 'prop-types';

import ReactDataGrid from 'react-data-grid';
import ms from 'ms';
import matchSorter from 'match-sorter';

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

class Scheduler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: null
    };
    this.columns = [
      {
        key: 'query',
        name: 'Query',
        width: 875,
        filterable: true,
        formatter: QueryFormatter
      },
      {
        key: 'run',
        name: 'Interval',
        width: 325,
        filterable: true,
        formatter: IntervalFormatter
      }
    ];

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.getRows = this.getRows.bind(this);
    this.rowGetter = this.rowGetter.bind(this);
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
            // ref={node => (this.grid = node)}
            columns={this.columns}
            rowGetter={this.rowGetter}
            rowsCount={rows.length}
            rowHeight={84}
            headerRowHeight={32}
          />
        </Row>
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
