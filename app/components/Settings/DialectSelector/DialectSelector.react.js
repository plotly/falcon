import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './DialectSelector.css';
import classnames from 'classnames';
import {DIALECTS} from '../../../constants/constants';
import {dissoc} from 'ramda';

/*
    Displays interactive database dialect logos and alters
    the chosen `configuration` dialect parameter.
*/

let LOGOS = {
    REDSHIFT: './images/redshift-logo.png',
    POSTGRES: './images/postgres-logo.png',
    MYSQL: './images/mysql-logo.png',
    MARIADB: './images/mariadb-logo.png',
    MSSQL: './images/mssql-logo.png',
    SQLITE: './images/sqlite-logo.png'
};
// TODO: remove when #$40 is resolved
if (process.platform !== 'darwin') {
    LOGOS = dissoc('SQLITE', LOGOS);
}

export default class DialectSelector extends Component {
    constructor(props) {
        super(props);
        this.resetAll = this.resetAll.bind(this);
        this.testClass = this.testClass.bind(this);
        this.logoIsSelected = this.logoIsSelected.bind(this);
        this.state = {
            selectedDialect: props.configuration.get('dialect')
        };
    }

    testClass(dialect) {
        /*
            Sanity check, to see if the dialect selected by user is consistent
            with the configuration store.
        */

        const consistency =
            (DIALECTS[dialect]
            === this.state.selectedDialect) &&
            (DIALECTS[dialect]
            === this.props.configuration.get('dialect'));

        let className = 'test';
        if (consistency) {
            className = 'test-consistent-state';
        } else {
            className = 'test-nonconsistent-state';
        }
        return className;
    }

    logoIsSelected(dialect) {
        return this.state.selectedDialect === DIALECTS[dialect];
    }

    resetAll() {
        this.props.sessionsActions.updateConfiguration(
        {
            username: '',
            password: '',
            database: '',
            port: '',
            storage: '',
            host: ''
        });
    }

	render() {
        const {sessionsActions} = this.props;

		const logos = Object.keys(DIALECTS).map(dialect => (
            <div>
                <div className={classnames(
                        styles.logo, {
                              [styles.logoSelected]:
                              this.state.selectedDialect === DIALECTS[dialect]
                         },
                        [this.testClass(dialect)]
                    )}
                    onClick={() => {
                        this.setState({selectedDialect: DIALECTS[dialect]});
                        sessionsActions.updateConfiguration({dialect: DIALECTS[dialect]});
                        this.resetAll();
                    }}
                    id={`test-logo-${DIALECTS[dialect]}`}
                >
                    <img
                        className={styles.logoImage}
                        src={LOGOS[dialect]}
                    />
                </div>
            </div>
        ));

		return (
			<div>{logos}</div>
		);
	}
}

DialectSelector.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    sessionsActions: PropTypes.object
};
