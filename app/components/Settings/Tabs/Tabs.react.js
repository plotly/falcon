import React, {Component} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {keys} from 'ramda';
import Tab from './Tab.react';

export default class ConnectionTabs extends Component {
    constructor(props) {
        super(props);
    }

    static propTypes = {
        connections: PropTypes.object,
        selectedTab: PropTypes.string,
        newTab: PropTypes.func,
        setTab: PropTypes.func,
        deleteTab: PropTypes.func
    }

    render() {
        const {connections, selectedTab, newTab, setTab, deleteTab} = this.props;
            return (
                <div className={classnames('tabManagerWrapper', 'Flipped')}>
                    <div className={'tabManagerContainer'}>
                        {keys(connections).map(tabId =>
                            <Tab
                                connectionObject={connections[tabId]}
                                deleteTab={deleteTab}
                                isSelected={tabId === selectedTab}
                                key={tabId}
                                setTab={setTab}
                                tabId={tabId}
                                isDeletable={keys(connections).length > 1}
                            />
                        )}

                        <div className={'tabAddWrapper'}>
                            <img
                                className={'tabAdd'}
                                onClick={newTab}
                                src="images/add.png"
                                id="test-session-add"
                            >
                            </img>
                        </div>
                    </div>
                </div>
            );
    }
}
