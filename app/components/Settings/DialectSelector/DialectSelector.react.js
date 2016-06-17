import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styles from './DialectSelector.css';
import classnames from 'classnames';
import {DIALECTS} from '../../../constants/constants';

/*
    Displays interactive database dialect logos and alters
    the chosen `configuration` dialect parameter.
*/

const LOGOS = {
    POSTGRES: './images/postgresLogo.png',
    MYSQL: './images/mysqlLogo.png',
    MARIADB: './images/mariadbLogo.png',
    MSSQL: './images/mssqlLogo.png',
    SQLITE: './images/sqliteLogo.png'
};

export default class DialectSelector extends Component {
    constructor(props) {
        super(props);
        this.resetAllToNull = this.resetAllToNull.bind(this);
        this.testClass = this.testClass.bind(this);
        this.logoIsSelected = this.logoIsSelected.bind(this);
        this.state = {
            selectedDialect: props.configuration.get('dialect')
        };
    }

    testClass(dialect) {
        /*
            Binary success or failure test class.
            Test if the logo is selected and updated in configuration.
            `test-selected` as className is set when it is. `test-unselected`
        */

        const consistency =
            (DIALECTS[dialect]
            === this.state.selectedEngine) &&
            (DIALECTS[dialect]
            === this.props.configuration.get('dialect'));

        if (consistency) {
            return 'test-consistent_state';
        } else {
            return 'test-nonconsistent_state';
        }
    }

    logoIsSelected(dialect) {
        return this.state.selectedEngine === DIALECTS[dialect];
    }

    resetAllToNull() {
        this.props.merge({
            username: null,
            password: null,
            database: null,
            port: null,
            storage: null,
            host: null
        });
    }

	render() {
        const {configActions} = this.props;

		const logos = Object.keys(DIALECTS).map(dialect => (
            <div>
                <div className={classnames(
                        styles.logo,
                        {[styles.logoSelected]: this.logoIsSelected(dialect)},
                        [this.testClass(dialect)]
                    )}
                    onClick={() => {
                        this.setState({selectedDialect: DIALECTS[dialect]});
                        configActions.update({dialect: DIALECTS[dialect]});
                        this.resetAllToNull();
                    }}
                    id={DIALECTS[dialect] + 'logo'}
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
    configActions: PropTypes.Object
};
