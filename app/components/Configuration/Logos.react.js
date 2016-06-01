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

		const logos = Object.keys(ENGINES).map(ENGINE => (
            <div className={classnames(
                    styles.logo, {
                        [styles.logoSelected]:
                            this.state.selectedEngine === ENGINES[ENGINE]
                    }
                )}
                onClick={() => {
                    this.setState({selectedEngine: ENGINES[ENGINE]});
                    merge({engine: ENGINES[ENGINE]});
                }}
            >
                <img
                    className={styles.logoImage}
                    src={LOGOS[ENGINE]}
                />
            </div>
        ));

		return (
			<div>{logos}</div>
		);
	}
}
