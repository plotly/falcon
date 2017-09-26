import cookie from 'react-cookies'
import fetch from 'isomorphic-fetch';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {
    baseUrl,
    dynamicRequireElectron
} from '../utils/utils';
import {Link} from './Link.react';
import {productName, version} from '../../package.json';
import {contains} from 'ramda';


const currentEndpoint = '/login';
const baseUrlWrapped = baseUrl().replace(currentEndpoint, '');
const connectorUrl = '/';

const CLOUD = 'cloud';
const ONPREM = 'onprem';
const SERVER_TYPES = {
    [CLOUD]: 'Plotly Cloud',
    [ONPREM]: 'Plotly On-Premise'
};

window.document.title = `${productName} v${version}`;
let usernameLogged = '';

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
            statusMessage: '',
            serverType: CLOUD,
            status: '',
            statusMessage: '',
            username: ''
        };
        this.buildOauthUrl = this.buildOauthUrl.bind(this);
        this.oauthPopUp = this.oauthPopUp.bind(this);
        this.logIn = this.logIn.bind(this);
    }

    componentDidMount() {
        const {serverType} = this.state;
        const that = this;
        const interval = setInterval(() => {
              usernameLogged = cookie.load('db-connector-user');
              if (usernameLogged) {
                  if (serverType === ONPREM) {
                      that.setState({
                          status: 'authorized',
                          statusMessage: 'Saving user information...'
                      });
                      that.saveDomainToSettings().then(res => {
                          if ( res.status === 200 ) {
                              window.location.assign(connectorUrl);
                          } else {
                              that.setState(
                                  status: 'failure',
                                  statusMessage: 'An error occured. Please try again.'
                              )
                          }
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
        const oauthClientId = 'isFcew9naom2f1khSiMeAtzuOvHXHuLwhPsM7oPt';
        const isOnPrem = this.state.serverType === ONPREM;
        const plotlyDomain = isOnPrem ? this.state.domain : 'https://plot.ly';
        const redirect_uri = baseUrlWrapped;
        return (
            `${plotlyDomain}/o/authorize/?response_type=token&` +
            `client_id=${oauthClientId}&` +
            `redirect_uri=${redirect_uri}/oauth2`
        );
    }

    oauthPopUp() {
        try {
            const electron = dynamicRequireElectron();
            const oauthUrl = this.buildOauthUrl();
            electron.shell.openExternal(oauthUrl);
        } catch (e) {
            console.log('Unable to openExternal, opening a popupWindow instead:');
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
        const {domain, serverType, username} = this.state;

        this.setState({status: '', statusMessage: ''});

        if (!username) {
            this.setState({
                status: 'failure',
                statusMessage: 'Enter your Plotly username.'
            });
            return;
        }
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
                        {`Authorizing ${username}...`}
                    </div>
                    <div>
                        {`You may be redirected to ${domain ? domain : 'https://plot.ly'} and asked to log in.`}
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
                    }}>
                        {`(If a login or authorization window does not pop up, visit `}
                        <div>
                            <Link href={this.buildOauthUrl()}>
                                {this.buildOauthUrl()}
                            </Link>
                        </div>
                        {` in your web browser.)`}
                    </div>

                </div>
            )
        });

        this.oauthPopUp();
    }


    render() {

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
            }}>
                <h2>
                    {'Plotly Database Connector'}
                </h2>
                <h4>
                    {'Log in to Plotly to continue'}
                </h4>

                <div>
                    <div style={{'height': 60}}>
                        <label>Connect to Plotly Cloud</label>
                        <input
                            type="radio"
                            checked={this.state.serverType !== ONPREM}
                            onChange={() => {this.setState({serverType: CLOUD})}}
                        />
                    </div>

                    <div style={{'height': 60}}>
                        <label>Connect to <Link href="https://plot.ly/products/on-premise/">Plotly On-Premise</Link></label>
                        <input
                            type="radio"
                            checked={this.state.serverType === ONPREM}
                            onChange={() => {this.setState({serverType: ONPREM})}}
                        />
                    </div>

                    {
                        this.state.serverType == ONPREM ? (
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

                    <div style={{'height': 60}}>
                        <label>Your Plotly Username</label>
                        <input
                            id="test-username"
                            type="text"
                            placeholder=""
                            onChange={e => this.setState({
                                username: e.target.value
                            })}
                        />
                    </div>
                </div>

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
                        {`The Plotly Database Connector requires a Plotly login to use.
                          Don't have an account yet?`}
                    </span>
                </div>

                <Link href={`${this.state.plotlyDomain}/accounts/login/?action=signup`}>
                    {'Create an account '}
                </Link>

            </div>
        );
    }
}

export default connect()(Login);
