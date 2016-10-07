
export class Sessions {
    constructor() {
        this.sessionSelected = null;
        this.sessions = {};
    }


    setSessionSelected(sessionSelected) {
        this.sessionSelected = sessionSelected;
    }


    getDialect() {
        return this.sessions[this.sessionSelected].options.dialect;
    }


    showSessions(responseSender) {
        const sessionKeys = Object.keys(this.sessions);
        return new Promise(
            (resolve, reject) => {
                resolve(responseSender({
                    error: null,
                    sessions: sessionKeys.map((key) => {
                        if (this.sessions[key]) {
                            const dialect = this.sessions[key].options.dialect;
                            const username = this.sessions[key].config.username;
                            let host = this.sessions[key].config.host;
                            if (!host) {host = 'localhost';}
                            return {[key]: `${dialect}:${username}@${host}`};
                        } else {
                            // if session created (with API) but not connected yet.
                            return {[key]: 'Session currently empty.'};
                        }
                    })
                }));
            }
        );
    }


    deleteSession(sessionId) {
        let setSessionTo = null;
        if (Object.keys(this.sessions).length > 0) {
            setSessionTo = Object.keys(this.sessions)[0];
        }
        this.log(`${setSessionTo}`, 1);
        return new Promise(
            (resolve, reject) => {
                this.setSessionSelected(Object.keys(this.sessions)[0]);
                resolve(delete this.sessions[`${sessionId}`]);
            });
    }


    addSession({sessionId, dialect, database}) {
        return new Promise(
            (resolve, reject) => {
                resolve(this.sessions[`${sessionId}`] = {
                    options: {dialect},
                    config: {database}
                });
            });
    }
}
