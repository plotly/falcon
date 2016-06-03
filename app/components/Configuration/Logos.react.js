import React, {Component, PropTypes} from 'react';
import styles from './Logos.css';
import classnames from 'classnames';

/*
    Displays interactive database engine logos and alters
    the chosen `configuration` engine parameter.
    TODO: take out the selectedEngine variable and use
    `configuration.get('engine')` inestead?
*/

const ENGINES = {
    MYSQL: 'mysql',
    SQLITE: 'sqlite',
    POSTGRES: 'postgres',
    MARIADB: 'mariadb',
    MSSQL: 'mssql'
};

const LOGOS = {
    POSTGRES: './images/postgresqlLogo.png',
    MYSQL: './images/mysqlLogo.png',
    MARIADB: './images/mariadbLogo.png',
    MSSQL: './images/mssqlLogo.png',
    SQLITE: './images/sqliteLogo.png'
};

export default class Logos extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedEngine: null
        };
    }

	render() {
        const {merge} = this.props;

		const logos = Object.keys(ENGINES).map(engine => (
            <div className={classnames(
                    styles.logo, {
                        [styles.logoSelected]:
                            this.state.selectedEngine === ENGINES[engine]
                    }
                )}
                onClick={() => {
                    this.setState({selectedEngine: ENGINES[engine]});
                    merge({engine: ENGINES[engine]});
                }}
            >
                <img
                    className={styles.logoImage}
                    src={LOGOS[engine]}
                />
            </div>
        ));

		return (
			<div>{logos}</div>
		);
	}
}
