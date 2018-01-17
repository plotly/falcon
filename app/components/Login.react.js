import cookie from 'react-cookies';
import fetch from 'isomorphic-fetch';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
    baseUrl,
    dynamicRequireElectron,
    homeUrl,
    isOnPrem,
    plotlyUrl
} from '../utils/utils';
import {Link} from './Link.react';
import {build, version} from '../../package.json';


const currentEndpoint = '/login';
const baseUrlWrapped = baseUrl().replace(currentEndpoint, '');
const connectorUrl = homeUrl() + '/';

const CLOUD = 'cloud';
const ONPREM = 'onprem';

window.document.title = `${build.productName} v${version}`;
let usernameLogged = '';

// http://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
const PopupCenter = (url, title, w, h) => {
    // Fixes dual-screen position
    const dualScreenLeft = 'screenLeft' in window ? window.screenLeft : screen.left;
    const dualScreenTop = 'screenTop' in window ? window.screenTop : screen.top;

    const width = window.innerWidth
        ? window.innerWidth
        : document.documentElement.clientWidth
            ? document.documentElement.clientWidth
            : screen.width;
    const height = window.innerHeight
        ? window.innerHeight
        : document.documentElement.clientHeight
            ? document.documentElement.clientHeight
            : screen.height;

    const left = ((width / 2) - (w / 2)) + dualScreenLeft;
    const top = ((height / 2) - (h / 2)) + dualScreenTop;
    const popupWindow = window.open(url, title, `scrollbars=yes, width=${w}, height=${h}, top=${top}, left=${left}`);
    return popupWindow;
};

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            domain: (isOnPrem() ? plotlyUrl() : 'https://plot.ly'),
            statusMessage: '',
            serverType: CLOUD,
            status: ''
        };
        this.buildOauthUrl = this.buildOauthUrl.bind(this);
        this.oauthPopUp = this.oauthPopUp.bind(this);
        this.logIn = this.logIn.bind(this);
    }

    componentDidMount() {
        const {serverType} = this.state;
        /*
         * This repeatedly checks whether the the auth related cookies have been
         * set for the user. Only meant for headless-server, since electron
         * does not support cookies. For electron we initiate an eventListener
         * to check for authentication.
         */
        setInterval(() => {
            usernameLogged = cookie.load('db-connector-user');
            if (usernameLogged) {
                if (serverType === ONPREM) {
                    this.setState({
                        status: 'authorized',
                        statusMessage: 'Saving user information...'
                    });
                    this.saveDomainToSettings().then(res => res.text().then(text => {
                        if (res.status === 200) {
                            window.location.assign(connectorUrl);
                        } else {
                            this.setState({
                                status: 'failure',
                                statusMessage: text
                            });
                        }
                    })).catch(err => {
                        this.setState({
                            status: 'failure',
                            statusMessage: err.message
                        });
                    });
                }
                else {
                    window.location.assign(connectorUrl);
                }
            }
        }, 1000);

    }

    saveDomainToSettings() {

        const {domain} = this.state;
        let PLOTLY_API_SSL_ENABLED = true;
        let PLOTLY_API_DOMAIN = '';
        if (domain.startsWith('https://')) {
            PLOTLY_API_SSL_ENABLED = true;
            PLOTLY_API_DOMAIN = domain.replace('https://', '');
        } else {
            PLOTLY_API_SSL_ENABLED = false;
            PLOTLY_API_DOMAIN = domain.replace('http://', '');
        }
        return fetch(`${baseUrlWrapped}/settings`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                PLOTLY_API_DOMAIN, PLOTLY_API_SSL_ENABLED
            })
        });

    }
    buildOauthUrl() {
        const {domain} = this.state;
        /* global PLOTLY_ENV */
        const oauthClientId = PLOTLY_ENV.OAUTH2_CLIENT_ID;

        const redirect_uri = baseUrlWrapped;
        return (
            `${domain}/o/authorize/?response_type=token&` +
            `client_id=${oauthClientId}&` +
            `redirect_uri=${redirect_uri}/oauth2/callback`
        );
    }

    oauthPopUp() {
        try {
            const electron = dynamicRequireElectron();
            const oauthUrl = this.buildOauthUrl();
            electron.shell.openExternal(oauthUrl);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log('Unable to openExternal, opening a popupWindow instead:');
            // eslint-disable-next-line no-console
            console.log(e);
            const popupWindow = PopupCenter(
                this.buildOauthUrl(), 'Authorization', '500', '500'
            );
            if (window.focus) {
                popupWindow.focus();
            }
        }
    }

    logIn () {
        const {domain, serverType} = this.state;

        this.setState({status: '', statusMessage: ''});

        if (serverType === ONPREM) {
            if (!domain) {
                this.setState({
                    status: 'failure',
                    statusMessage: 'Enter your Plotly On Premise domain.'
                });
                return;
            } else if (!(domain.startsWith('http://') ||
                         domain.startsWith('https://'))) {

                this.setState({
                    status: 'failure',
                    statusMessage: (
                        'The Plotly domain must start with "http://" or "https://"'
                    )
                });
                return;

            }
        }

        this.setState({
            statusMessage: (
                <div>
                    <div>
                        {'Authorizing ...'}
                    </div>
                    <div>
                        {`You may be redirected to ${domain} and asked to log in.`}
                    </div>

                    <div style={{
                        'marginTop': '14px',
                        'fontStyle': 'italic',
                        'textAlign': 'left',
                        'fontSize': '10px',
                        'marginLeft': '10px',
                        'marginRight': '10px',
                        'border': 'thin lightgrey solid',
                        'borderLeft': 'none',
                        'borderRight': 'none'
                    }}
                    >
                        {'(If a login or authorization window does not pop up, visit '}
                        <div>
                            <Link href={this.buildOauthUrl()} className="externalLink">
                                {this.buildOauthUrl()}
                            </Link>
                        </div>
                        {' in your web browser.)'}
                    </div>

                </div>
            )
        });

        this.oauthPopUp();
    }


    render() {
      const {domain} = this.state;
        return (
            <div style={{
                'width': '80%',
                'backgroundColor': 'white',
                'border': 'thin lightgrey solid',
                'borderRadius': '5px',
                'textAlign': 'center',
                'marginLeft': 'auto',
                'marginRight': 'auto',
                'minWidth': '800px'
            }}
            >
                <h2>
                    {'Falcon SQL Client'}
                </h2>
                <h4>
                    {'Log in to Plotly to continue'}
                </h4>

                {!isOnPrem() &&
                <div>
                    <div style={{'height': 60}}>
                        <label>Connect to Plotly Cloud</label>
                        <input
                            type="radio"
                            checked={this.state.serverType !== ONPREM}
                            onChange={() => {this.setState({serverType: CLOUD});}}
                        />
                    </div>

                    <div style={{'height': 60}}>
                        <label>Connect to <Link href="https://plot.ly/products/on-premise/" className="externalLink">Plotly On-Premise</Link></label>
                        <input
                            type="radio"
                            checked={this.state.serverType === ONPREM}
                            onChange={() => {this.setState({serverType: ONPREM});}}
                        />
                    </div>

                    {
                        this.state.serverType === ONPREM ? (
                            <div style={{'height': 60}}>
                                <label>Your Plotly On-Premise Domain</label>
                                <input
                                    type="text"
                                    placeholder="https://plotly.your-company.com"
                                    onChange={e => this.setState({
                                        domain: e.target.value
                                    })}
                                />
                            </div>
                        ) : null
                    }

                </div>}
                <div>
                    <button id="test-login-button" onClick={this.logIn}>
                        {'Log in'}
                    </button>
                </div>

                <div style={{textAlign: 'center'}}>
                    {this.state.statusMessage}
                </div>

                <div style={{'marginTop': '30px'}}>
                    <span>
                        {'To schedule queries and update data, the Falcon SQL Client requires a Plotly login.'}
                    </span>
                </div>

                {!isOnPrem() &&
                <div>
                    <span>
                        {'Don\'t have an account yet?'}
                    </span>
                    <Link href={`${domain}/accounts/login/?action=signup`} className="externalLink">
                        {'Create an account '}
                    </Link>
                </div>}
            </div>
        );
    }
}

export default connect()(Login);
