import React, {Component, PropTypes} from 'react';
import styles from './EngineSelector.css';
import classnames from 'classnames';
import {ENGINES} from '../Constants/SupportedEngines.react';

/*
    Displays interactive database engine logos and alters
    the chosen `configuration` engine parameter.
    TODO: take out the selectedEngine variable and use
    `configuration.get('engine')` inestead?
*/

const LOGOS = {
    POSTGRES: './images/postgresLogo.png',
    MYSQL: './images/mysqlLogo.png',
    MARIADB: './images/mariadbLogo.png',
    MSSQL: './images/mssqlLogo.png',
    SQLITE: './images/sqliteLogo.png'
};

export default class EngineSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedEngine: props.configuration.get('engine')
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
                portNumber: null,
                databasePath: null,
                server: null
            });
        };

		const logos = Object.keys(ENGINES).map(engine => (
            <div>
                <div className={classnames(
                        styles.logo, {
                            [styles.logoSelected]:
                                this.state.selectedEngine === ENGINES[engine]
                        }
                    )}
                    onClick={() => {
                        this.setState({selectedEngine: ENGINES[engine]});
                        merge({engine: ENGINES[engine]});
                        resetAllToNull();
                    }}
                >
                    <img
                        className={styles.logoImage}
                        src={LOGOS[engine]}
                    />
                </div>
            </div>
        ));

		return (
			<div>{logos}</div>
		);
	}
}
