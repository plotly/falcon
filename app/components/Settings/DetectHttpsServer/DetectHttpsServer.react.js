import React, {Component} from 'react';

let INTERVAL_ID;

class DetectHttpsServer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            successfulFetch: false
        };
    }

    // TODO - Maybe make this it's own stateful component
    componentWillMount() {

        // TODO - It seems like you need to restart the app in order for the
        // app to use the newly installed certs -
        // the fetch won't change from failure to success
        // with a single app session.
        // So, I don't think this needs to be a setInterval..
        // TODO - verify this.

        INTERVAL_ID = setInterval(() => {
            // TODO - Instead of "secure", use "status"
            fetch('https://connector.plot.ly:5001/secure')
            .then(request => {
                console.warn('successfulFetch: true');
                this.setState({successfulFetch: true});
            })
            .catch(err => {
                if (err.message === 'failed to fetch') {
                    console.warn('successfulFetch: false');
                    this.setState({successfulFetch: false});
                }
            });
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(INTERVAL_ID);
    }

    render() {
        console.warn(this.state);
        if (this.state.successfulFetch) {
            console.warn('renderSuccess');
            return this.props.renderSuccess;
        } else {
            console.warn('renderFailed');
            return this.props.renderFailed;
        }
    }

}

export default DetectHttpsServer;
