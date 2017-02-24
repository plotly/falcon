import fetch from 'isomorphic-fetch';
import React, {Component} from 'react';
import {render} from 'react-dom';
import {
    baseUrl,
    dynamicRequireElectron
} from '../utils/utils';

const currentEndpoint = '/login';
const baseUrlWrapped = baseUrl().replace(currentEndpoint, '');

const CLOUD = 'cloud';
const ONPREM = 'onprem';
const SERVER_TYPES = {
    [CLOUD]: 'Plotly Cloud',
    [ONPREM]: 'Plotly On-Premise'
};

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            domain: '',
            errorMessage: '',
            serverType: CLOUD,
            status: '',
            username: ''
        };
        this.authenticateUser = this.authenticateUser.bind(this);
        this.buildOauthUrl = this.buildOauthUrl.bind(this);
        this.logIn = this.logIn.bind(this);
        this.updateStateWithEvent = this.updateStateWithEvent.bind(this);
        this.verifyAuthDone = this.verifyAuthDone.bind(this);
    }

    buildOauthUrl() {
        const oauthClientId = 'isFcew9naom2f1khSiMeAtzuOvHXHuLwhPsM7oPt';
        const isOnPrem = this.state.serverType === ONPREM;
        const plotlyDomain = isOnPrem ? this.state.domain : 'plot.ly';
        const redirect_uri = baseUrlWrapped;
        return (
            `https://${plotlyDomain}/o/authorize/?response_type=token&` +
            `client_id=${oauthClientId}&` +
            `redirect_uri=${redirect_uri}/oauth2/callback`
        );
    }

    verifyAuthDone() {
        const {username} = this.state;
        return fetch(`${baseUrlWrapped}/approved/${username}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username
            })
        }).then(res => res.json().then(json => {
            if (res.status !== 200) {
                this.setState({status: 'failure', errorMessage: json.error.message});
                this.setState({loggedIn: false});
            }
            this.setState({loggedIn: json.approved});
        })).catch( e => {
            this.setState({loggedIn: false});
        });
    }

    authenticateUser () {
        if (!this.state.username) {
            this.setState({
                status: 'failure',
                errorMessage: 'Enter your Plotly username.'
            });
            return;
        }
        if (!this.state.domain && this.state.serverType === ONPREM) {
            this.setState({
                status: 'failure',
                errorMessage: 'Enter your Plotly On Premise domain.'
            });
            return;
        }
        this.setState({errorMessage: ''});
        try {
            dynamicRequireElectron().shell.openExternal(this.buildOauthUrl());
        } catch (e) {
            window.open(this.buildOauthUrl(), '_blank');
        }
    }

    logIn () {
        const {username} = this.state;
        this.verifyAuthDone();
        if (!this.state.loggedIn) {
            this.authenticateUser();
            const checkAuth = setInterval(() => {
                this.verifyAuthDone();
                // TODO: This is not very clear for a message. Show them a link to the oauth
                // maybe in case they closed it or want to try again?
                this.setState({
                    errorMessage: `We\'re waiting for authorization of [${username}].`
                });
                if (this.state.loggedIn) {
                    clearInterval(checkAuth);
                    window.location.assign(baseUrlWrapped);
                }
            }, 1000);
        } else {
            window.location.assign(baseUrlWrapped);
        }
    }

    updateStateWithEvent(e) {
        this.setState({[e.target.name]: e.target.value});
    }

    render() {
        const renderOption = (value) => {
            const selected = this.state.serverType === value;
            return (
                <span>
                    <button
                        className={selected ? 'button-primary' : 'button'}
                        onClick={(e) => this.setState({serverType: e.target.value})}
                        value={value}
                        style={{margin: '10px'}}
                    >{SERVER_TYPES[value]}</button>
                </span>
            );
        };

        const loginButton = (
            <button
                className="btn btn-large btn-primary"
                style={{display: 'block', margin: 'auto'}}
                onClick={() => this.logIn()}
            >{'Login'}</button>
        );

        const serverTypeOptions = (
            <div className="control-group">
            <h3 className="block-center-heading">
                Choose Your Plotly Use Case
            </h3>
                <div className="controls" style={{padding: '20px'}}>
                    {renderOption(CLOUD)}
                    {renderOption(ONPREM)}
                </div>
                <span>
                    {'Learn more about our '}
                    <a href="https://plot.ly/products/cloud/">
                    {'products'}</a>.
                </span>
            </div>
        );

        const loginCloud = (
            <div className="control-group">
                <h3 className="block-center-heading">{'Plotly Log In'}</h3>
                <div className="controls" style={{padding: '20px'}}>
                    <div className="form-group">
                        <label>Your Plotly Username</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="johndoe"
                            name="username"
                            onChange={(e) => this.updateStateWithEvent(e)}
                        ></input>
                        {loginButton}
                    </div>
                </div>
            </div>
        );

        const loginOnPrem = (
            <div className="control-group">
                <h3 className="block-center-heading">{'Login Into Your Account'}</h3>
                <div className="controls" style={{padding: '20px'}}>
                    <div className="form-group">
                        <label>Your On-Prem Plotly Username</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="johndoe"
                            name="username"
                            onChange={(e) => this.updateStateWithEvent(e)}
                        ></input>
                        <label>Your On-Prem Plotly Domain</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="plotly.your-company.com"
                            name="domain"
                            onChange={(e) => this.updateStateWithEvent(e)}
                        ></input>
                        {loginButton}
                    </div>
                </div>
            </div>
        );

        const loginOptions = {
            cloud: loginCloud,
            onprem: loginOnPrem
        };

        return (
            <div className="container">
                <div className="block-center">
                    <div style={{textAlign: 'center'}}>
                        {serverTypeOptions}
                    </div>
                    <div style={{textAlign: 'center'}}>
                        {loginOptions[this.state.serverType]}
                    </div>
                    <div style={{textAlign: 'center'}}>
                        {this.state.errorMessage}
                    </div>
                </div>
            </div>
        );
    }
}

render(<Login/>, document.getElementById('root'));
