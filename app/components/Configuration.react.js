import React, { Component, PropTypes } from 'react';
import DropdownMenu from 'react-dd-menu';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';
import {baseUrl} from '../utils/utils';
import {Link} from './Link.react';
import {contains} from 'ramda';

const LINKS = {
    PLANS: 'http://plot.ly/plans/',
    DOCS: 'http://help.plot.ly/database-connectors/',
    TYPEFORM: 'https://plotly.typeform.com/to/KUiCSl'
};
const ONPREM = contains('external-data-connector', window.location.href);

export default class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMenuOpen: false
        }
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
    }

    toggle() {
        this.setState({ isMenuOpen: !this.state.isMenuOpen });
    }

    close() {
        this.setState({ isMenuOpen: false });
    }

    render() {
        const menuOptions = {
            isOpen: this.state.isMenuOpen,
            close: this.close,
            toggle: <button type="button" onClick={this.toggle}>MENU</button>,
            align: 'right',
            animate: false
        };

        return (
            <div className="fullApp">
                <div className="header">
                    <span className="logoAndTitle">
                        <h5 className="applicationTitle">
                            Plotly SQL Query Tool
                        </h5>
                    </span>

                    <span className="supportLinksContainer">
                        <div className="externalLinkContainer">
                            <DropdownMenu {...menuOptions}>
                                {
                                    ONPREM ?
                                    null : <li><Link className="supportLinks" href={LINKS.PLANS}>Plans and Pricing</Link></li>
                                }
                                {
                                    ONPREM ?
                                    null : <li><Link className="supportLinks" href={'https://plot.ly/create'}>Chart & SQL Editor</Link></li>
                                }
                                <li><Link className="supportLinks" href={LINKS.DOCS}>Documentation</Link></li>
                                <li><Link className="supportLinks" href={LINKS.TYPEFORM}>Request a Connector</Link></li>
                            </DropdownMenu>
                        </div>
                    </span>
                </div>

                <Settings/>

            </div>

        );
    }
}

Configuration.propTypes = {
    sessionsActions: PropTypes.object
};
