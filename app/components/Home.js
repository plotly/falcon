import React, { Component } from 'react';
import { Link } from 'react-router';
import styles from './Home.css';


export default class Home extends Component {
    render() {
        return (
            <div>
            <div className={styles.container}>
            <h2>Plotly Databse Connector</h2>
            <Link to="/configuration">Connect to a database ...</Link>
            </div>
            </div>
        );
    }
}
