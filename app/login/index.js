import fetch from 'isomorphic-fetch';
import React, {Component} from 'react';
import {render} from 'react-dom';
import {
    baseUrl,
    dynamicRequireElectron
} from '../utils/utils';
import {Link} from '../components/Link.react';
import {productName, version} from '../package.json';


const currentEndpoint = '/login';
const baseUrlWrapped = baseUrl().replace(currentEndpoint, '');
const connectorUrl = baseUrlWrapped + '/database-connector';

const CLOUD = 'cloud';
const ONPREM = 'onprem';
const SERVER_TYPES = {
    [CLOUD]: 'Plotly Cloud',
    [ONPREM]: 'Plotly On-Premise'
};

window.document.title = `${productName} v${version}`;

// http://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
const PopupCenter = (url, title, w, h) => {
    // Fixes dual-screen position
    const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const left = ((width / 2) - (w / 2)) + dualScreenLeft;
    const top = ((height / 2) - (h / 2)) + dualScreenTop;
    const popupWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
    return popupWindow;
};

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            domain: '',
            statusMessasge: '',
            serverType: CLOUD,
            status: '',
            username: ''
        };
        this.authenticateUser = this.authenticateUser.bind(this);
        this.buildOauthUrl = this.buildOauthUrl.bind(this);
        this.oauthPopUp = this.oauthPopUp.bind(this);
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

    oauthPopUp() {
        try {
            dynamicRequireElectron().shell.openExternal(this.buildOauthUrl());
        } catch (e) {
            const popupWindow = PopupCenter(
                this.buildOauthUrl(), 'Authorization', '500', '500'
            );
            if (window.focus) {
                popupWindow.focus();
            }
        }
    }

    verifyAuthDone() {
        const {username} = this.state;
        return fetch(`${baseUrlWrapped}/settings/approved/${username}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username
            })
        }).then((res) => res.json().then((json) => {
            if (res.status !== 200) {
                this.setState({
                    status: 'failure',
                    statusMessasge: json.error.message
                });
                this.setState({loggedIn: false});
            }
            this.setState({loggedIn: json.approved});
        })).catch((e) => {
            this.setState({loggedIn: false});
        });
    }

    authenticateUser () {
        if (!this.state.username) {
            this.setState({
                status: 'failure',
                statusMessasge: 'Enter your Plotly username.'
            });
            return;
        }
        if (!this.state.domain && this.state.serverType === ONPREM) {
            this.setState({
                status: 'failure',
                statusMessasge: 'Enter your Plotly On Premise domain.'
            });
            return;
        }
        this.setState({statusMessasge: ''});
        this.oauthPopUp();
    }

    logIn () {
        const {username} = this.state;
        this.setState({
            statusMessasge:
            `Authorizing [${username}] ...`
        });
        this.verifyAuthDone();
        setTimeout(() => {
            if (!this.state.loggedIn) {
                this.authenticateUser();
                const checkAuth = setInterval(() => {
                    this.verifyAuthDone();
                    if (this.state.loggedIn) {
                        clearInterval(checkAuth);
                        window.location.assign(connectorUrl);
                    }
                }, 1000);
            } else {
                window.location.assign(connectorUrl);
            }
        }, 1000);
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
                id="test-login-button"
                className="btn btn-large btn-primary"
                style={{display: 'block', margin: 'auto'}}
                onClick={this.logIn}
            >{'Login'}</button>
        );

        const serverTypeOptions = (
            <div className="control-group">
            <h3 className="block-center-heading">
                {'I am connecting to...'}
            </h3>
                <div className="controls" style={{padding: '20px'}}>
                    {renderOption(CLOUD)}
                    {renderOption(ONPREM)}
                </div>
                <span style={{borderBottom: '2px solid #E7E8E9', cursor: 'pointer'}}>
                    {Link(
                        'https://plot.ly/products/cloud/',
                        'Learn more about our products.'
                    )}
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
                            id="test-username"
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
                            id="test-username"
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
                        {this.state.statusMessasge}
                    </div>
                </div>
            </div>
        );
    }
}

render(<Login/>, document.getElementById('root'));
