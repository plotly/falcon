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

    componentWillReceiveProps(nextProps) {
        this.setState({
            selectedEngine: nextProps.configuration.get('engine')
        });
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

        const items = Object.keys(ENGINES).map(engineKey => (
            <div>
                <input type="radio"
                    className={styles.engineInput}
                    value={ENGINES[engineKey]}
                    checked={this.state.selectedEngine === ENGINES[engineKey]}
                    onChange={e => {
                        this.setState({selectedEngine: ENGINES[engineKey]});
                        merge({engine: e.target.value});
                    }}
                />

                <label className={styles.engineLabel}>
                    {engineKey}
                </label>

            </div>
        ));

		return (
			<div>{logos}</div>
		);
	}
}
