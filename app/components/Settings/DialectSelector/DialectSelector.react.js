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
        this.resetAllToNull = this.connect.bind(this);
        this.testClass = this.connect.bind(this);
        this.isSelected = this.connect.bind(this);
        this.state = {
            selectedDialect: props.configuration.get('dialect')
        };
    }

    logoIsSelected(dialect) {
        return this.state.selectedEngine === ENGINES[dialect];
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

<<<<<<< HEAD:app/components/Settings/DialectSelector/DialectSelector.react.js
        const resetAllToNull = () => {
            configActions.update({
                username: null,
                password: null,
                database: null,
                port: null,
                storage: null,
                host: null
            });
        };

		const logos = Object.keys(DIALECTS).map(dialect => (
=======
		const logos = Object.keys(ENGINES).map(dialect => (
>>>>>>> :cow2: take out functions out of render:app/components/Settings/EngineSelector/EngineSelector.react.js
            <div>
                <div className={classnames(
                        styles.logo, {
                            [styles.logoSelected]:
                                this.state.selectedDialect === DIALECTS[dialect]
                        }
                    )}
                    onClick={() => {
<<<<<<< HEAD:app/components/Settings/DialectSelector/DialectSelector.react.js
                        this.setState({selectedDialect: DIALECTS[dialect]});
                        configActions.update({dialect: DIALECTS[dialect]});
                        resetAllToNull();
=======
                        this.setState({selectedEngine: ENGINES[dialect]});
                        merge({dialect: ENGINES[dialect]});
                        this.resetAllToNull();
>>>>>>> :cow2: take out functions out of render:app/components/Settings/EngineSelector/EngineSelector.react.js
                    }}
                    id={ENGINES[dialect] + 'logo'}
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
