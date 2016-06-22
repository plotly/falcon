import React, {Component, PropTypes} from 'react';
import styles from './DialectSelector.css';
import classnames from 'classnames';
import {DIALECTS} from '../Constants/SupportedDialects.react';

/*
    Displays interactive database dialect logos and alters
    the chosen `configuration` dialect parameter.
    TODO: take out the selectedDialect variable and use
    `configuration.get('dialect')` inestead?
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
        this.state = {
            selectedDialect: props.configuration.get('dialect')
        };
    }

	render() {
        const {configActions} = this.props;
        const {merge} = configActions;

        const resetAllToNull = () => {
            merge({
                username: null,
                password: null,
                database: null,
                port: null,
                storage: null,
                host: null
            });
        };

		const logos = Object.keys(DIALECTS).map(dialect => (
            <div>
                <div className={classnames(
                        styles.logo, {
                            [styles.logoSelected]:
                                this.state.selectedDialect === DIALECTS[dialect]
                        }
                    )}
                    onClick={() => {
                        this.setState({selectedDialect: DIALECTS[dialect]});
                        merge({dialect: DIALECTS[dialect]});
                        resetAllToNull();
                    }}
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
