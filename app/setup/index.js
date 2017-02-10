import fetch from 'isomorphic-fetch';
import React, {Component} from 'react';
import {render} from 'react-dom';
import {baseUrl, isWebBrowser, dynamicRequireElectron} from '../utils/utils';

const CLOUD = 'cloud';
const ONPREM = 'onprem';
const SERVER_TYPES = {
    [CLOUD]: 'Plotly Cloud',
    [ONPREM]: 'Plotly On-Premise'
};

class Setup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            domain: '',
            errorMessage: '',
            loggedIn: false,
            serverType: '',
            status: '',
            username: ''
        };
        this.authenticateUser = this.authenticateUser.bind(this);
        this.buildOauthUrl = this.buildOauthUrl.bind(this);
        this.chooseServerType = this.chooseServerType.bind(this);
        this.setTimeoutAuthDone = this.setTimeoutAuthDone.bind(this);
        this.updateStateWithEvent = this.updateStateWithEvent.bind(this);
        this.verifyAuthDone = this.verifyAuthDone.bind(this);
    }

    buildOauthUrl() {
        const oauthClientId = 'isFcew9naom2f1khSiMeAtzuOvHXHuLwhPsM7oPt';
        const isOnPrem = this.state.serverType === ONPREM;
        const plotlyDomain = isOnPrem ? this.state.domain : 'plot.ly';
        const redirect_uri = baseUrl().replace('/setup', '');
        return (
            `https://${plotlyDomain}/o/authorize/?response_type=token&` +
            `client_id=${oauthClientId}&` +
            // TODO: Is there a better way? On premise has the `external-data-connector`
            // route so cant use window.location.origin.
            `redirect_uri=${redirect_uri}/oauth2/callback`
        );
    }

    chooseServerType(serverType) {
        this.setState({serverType});
    }

    verifyAuthDone() {
        const {username} = this.state;
        console.log(`baseUrl() ${baseUrl()}`);
        fetch(`${baseUrl()}/hasauth`, {
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
            }
            this.setState({loggedIn: json.hasAuth});
        }));
        // TODO: More error handling here? Probably need a catch here.
    }

    createCertificates() {
        const {username} = this.state;
        fetch(`${baseUrl()}/hasauth`, {
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
            }
            this.setState({loggedIn: json.hasAuth});
        }));
    }

    setTimeoutAuthDone () {
        const {username} = this.state;
        const checkAuth = setInterval(() => {
            // TODO: This is not very clear for a message. Show them a link to the
            // maybe in case they closed it or want to try again?
            this.setState({
                errorMessage: `We\'re waiting for authorization of [${username}].`});
            this.verifyAuthDone();
            if (this.state.loggedIn) {
                // TODO: Is there a better way? On premise has the `external-data-connector`
                // route so cant use window.location.origin.
                clearInterval(checkAuth);
                const appRoute = baseUrl().replace('/setup', '/');
                window.location.assign(appRoute);
            }
        }, 1000);
    }

    authenticateUser () {
        if (!this.state.username) {
            this.setState({
                status: 'failure',
                errorMessage: 'Plotly username can not be empty.'
            });
            return;
        }
        if (!this.state.domain && this.state.serverType === ONPREM) {
            this.setState({
                status: 'failure',
                errorMessage: 'Plotly On Premise domain can not be empty.'
            });
            return;
        }
        this.setState({errorMessage: ''});
        this.setTimeoutAuthDone();
        if (isWebBrowser) {
            window.open(this.buildOauthUrl(), '_blank');
        } else {
            dynamicRequireElectron().shell.openExternal(this.buildOauthUrl());
        }
    }

    updateStateWithEvent(e) {
        this.setState({[e.target.name]: e.target.value});
    }

    render() {
        const {errorMessage, status} = this.state;
        const submitButton = (value) => {
            return (
                <button
                    onClick={(e) => this.chooseServerType(e.target.value)}
                    className="btn btn-large btn-primary"
                    value={value}
                    style={{margin: '10px'}}
                >
                    {SERVER_TYPES[value]}
                </button>
            );
        };

        const loginButton = () => {
            return (
                <button
                    className="btn btn-large btn-primary"
                    style={{display: 'block', margin: 'auto'}}
                    onClick={() => this.authenticateUser()}
                >{'Login'}</button>
            );
        };

        const chooseServerType = () => {
            return (
                <div className="control-group">
                <h3 className="block-center-heading">
                    Choose Your Plotly Use Case
                </h3>
                    <div className="controls" style={{padding: '20px'}}>
                        {submitButton(CLOUD)}
                        {submitButton(ONPREM)}
                    </div>
                    <span>
                        {'Learn more about our services '}
                        <a href="https://plot.ly/products/cloud/">
                        {'here'}</a>.
                    </span>
                </div>
            );
        };

        const loginCloud = () => {
            return (
                <div className="control-group">
                    <h3 className="block-center-heading">{'Login Into Your Account'}</h3>
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
                            {loginButton()}
                        </div>
                    </div>
                </div>

            );
        };

        const loginOnPrem = () => {
            return (
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
                            {loginButton()}
                        </div>
                    </div>
                </div>
            );
        };

        const loginOptions = {
            cloud: loginCloud(),
            onprem: loginOnPrem()
        };

        const content = () => {
            return (
                this.state.serverType
                ? loginOptions[this.state.serverType]
                : chooseServerType()
            );
        };

        return (
            <div className="container">
                <div className="block-center">
                    <div style={{textAlign: 'center'}}>
                        {content()}
                    </div>
                    <div style={{textAlign: 'center'}}>
                        {this.state.errorMessage}
                    </div>
                </div>
            </div>
        );
    }
}

render(<Setup/>, document.getElementById('root'));
