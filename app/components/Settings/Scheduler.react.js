import React, {Component} from 'react';
import PropTypes from 'prop-types';

import ReactDataGrid from 'react-data-grid';
import ms from 'ms';
import tohash from 'tohash';

import {Controlled as CodeMirror} from 'react-codemirror2';

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

const Column = props => (
  <Row {...props} style={{ flexDirection: 'column', ...props.style }} />
);

const Tag = ({ title, color }) => (
  <span
    style={{
      display: 'inline-block',
      textAlign: 'center',
      backgroundColor: color,
      color: 'white',
      padding: '2px 4px',
      fontSize: 16,
      marginRight: '1rem',
      borderRadius: '2px'
    }}
  >
    {title}
  </span>
);

class QueryFormatter extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  render() {
    const query = this.props.value;
    return (
      <Row
        style={{
          borderLeft: `2px solid ${query.status === 'SUCCESS' ? '#30aa65' : '#ef595b'}`
        }}
      >
        <Column style={{ padding: '0 24px' }}>
          <div style={{ fontSize: 18 }}>
            {query.query}
          </div>
          <em style={{ fontSize: 12 }}>
            {query.interval}
          </em>
        </Column>
        <Column style={{ padding: '0 24px' }}>
          <div>
            {query.tags.map(Tag)}
          </div>
        </Column>
      </Row>
    );
  }
}

class RunFormatter extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  render() {
    const run = this.props.value;
    return (
      <Row>
        <Column style={{ padding: '0 24px' }}>
          <div
            style={{
              fontSize: 18,
              color: run.status === 'SUCCESS' ? '#30aa65' : '#ef595b'
            }}
          >
            {`${ms(Date.now() - run.last_run, { long: true })} ago`}
          </div>
          <em style={{ fontSize: 12 }}>
            {`${run.size} rows in ${ms(run.time, { long: true })}`}
          </em>
        </Column>
      </Row>
    );
  }
}

const Overlay = props => (
  props.open
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
    : null
);

class CreateModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: props.initialCode
    };
    this.updateCode = this.updateCode.bind(this);
    this.options = {
      lineNumbers: true,
      mode: 'text/x-mysql', // TODO
      tabSize: 4,
      readOnly: false
      // extraKeys: {
      //   'Shift-Enter': runQuery
      // }
    };
  }

  updateCode(editor, meta, code) {
    this.setState({ code });
  }

  render() {
    return (
      <Overlay {...this.props} onClick={this.props.onClickAway} className="scheduler">
        <Column
          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
          style={{ width: '60%', background: 'white' }}
        >
          <Row>
            <Column>
              <h5 style={{ paddingLeft: '16px' }}>Create Scheduled Query</h5>
              <p style={{ marginTop: 0 }}>
                A scheduled query runs and updates its corresponding dataset in
                Plotly Cloud. Learn more about scheduled queries here.
              </p>
            </Column>
          </Row>
          <Row>
            <Column>
              <Row style={{ justifyContent: 'flex-start' }}>
                <div style={{ paddingLeft: '16px', marginRight: '24px' }}>Query</div>
                <CodeMirror
                  options={this.options}
                  value={this.state.code}
                  onBeforeChange={this.updateCode}
                />
              </Row>
            </Column>
          </Row>
          <Row>
            <button style={{ width: '100%', margin: '0 16px 16px' }}>Schedule Query</button>
          </Row>
        </Column>
      </Overlay>
    );
  }
}

const SORT = {
  recent: (a, b) => b.last_run - a.last_run,
  latent: (a, b) => a.last_run - b.last_run,
  longest: (a, b) => b.time - a.time,
  shortest: (a, b) => a.time - b.time,
  most: (a, b) => b.size - a.size,
  least: (a, b) => a.size - b.size
};

function mapRows (sortFnKey, rows) {
  return rows
    .sort(SORT[sortFnKey])
    .map(r => ({
      query: r,
      run: r
    }));
}

class Scheduler extends Component {
  constructor(props) {
    super(props);
    const rows = this.props.rows.map(r =>
      Object.assign({}, r, { tags: r.tags.map(t => this.props.tags[t]) }));

    this.state = {
      rows: mapRows('recent', rows),
      createModalOpen: false
    };
    this.sort = this.sort.bind(this);
  }

  sort(sortFnKey) {
    this.setState(mapRows(sortFnKey, this.rows));
  }

  columns = [
    {
      key: 'query',
      name: 'Query',
      width: 875,
      filterable: true,
      formatter: QueryFormatter
    },
    {
      key: 'run',
      name: 'Last run',
      width: 325,
      filterable: true,
      formatter: RunFormatter
    }
  ]

  render() {
    return (
      <React.Fragment>
        <Row
          style={{
            marginTop: 24,
            marginBottom: 24,
            justifyContent: 'space-between'
          }}
        >
          <input placeholder="Search scheduled queries..."/>
          <button
            style={{ marginRight: '16px' }}
            onClick={() => this.setState({ createModalOpen: true })}
          >
            Create Scheduled Query
          </button>
        </Row>
        <Row style={{ marginBottom: 16, padding: '0 16px', justifyContent: 'space-between' }}>
          <Column style={{ width: 300 }}>
            <Row>
              <Column style={{ borderRight: '1px solid grey', marginRight: 12 }}>
                {this.state.rows.length} queries
              </Column>
              <Column>
                Success ({this.state.rows.filter(r => r.query.status === 'SUCCESS').length})
              </Column>
              <Column>
                Error ({this.state.rows.filter(r => r.query.status === 'ERROR').length})
              </Column>
            </Row>
          </Column>
          <Column style={{ width: 300 }}>
            <Row>
              <Column>
                Tags ▼
              </Column>
              <Column style={{ borderRight: '1px solid grey', marginRight: 4 }}>
                Sort ▼
              </Column>
              <Column>
                <button style={{ marginRight: '32px' }}>⟳</button>
              </Column>
            </Row>
          </Column>
        </Row>
        <Row style={{ padding: '0 16px', width: 'auto' }}>
          <ReactDataGrid
            ref={node => (this.grid = node)}
            columns={this.columns}
            rowGetter={index => this.state.rows[index]}
            rowsCount={this.state.rows.length}
            rowHeight={84}
            headerRowHeight={32}
          />
        </Row>
        <CreateModal
          open={this.state.createModalOpen}
          onClickAway={() => this.setState({ createModalOpen: false })}
        />
      </React.Fragment>
    );
  }
}

Scheduler.defaultProps = {
  tags: tohash([
    { title: 'XERO', color: '#f2c94c' },
    { title: 'Important', color: '#56ccf2' },
    { title: 'Stage 2', color: '#d14cf2' }
  ], 'title'),

  rows: [
    {
      query: 'SELECT * FROM stripe.customers',
      interval: 'Runs every 15 minutes',
      tags: ['XERO'],
      status: 'SUCCESS',
      last_run: 1500,
      size: 115,
      time: 50 * 1000
    },
    {
      query: 'SELECT * FROM amex.customers',
      interval: 'Runs every Tuesday at 3:00pm',
      tags: ['XERO', 'Important'],
      status: 'SUCCESS',
      last_run: 1500,
      size: 64,
      time: 3 * 60 * 1000
    },
    {
      query: 'SELECT * FROM amex.customers',
      interval: 'Runs every Tuesday at 3:00pm',
      tags: ['Stage 2'],
      status: 'ERROR',
      last_run: 1500,
      size: 0,
      time: 3000
    }
  ]
};

export default Scheduler;
