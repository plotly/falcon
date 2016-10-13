export class Sessions {
    constructor() {
        this.sessionSelected = null;
        this.sessions = {};
        this.getSession = this.getSession.bind(this);
        this.createSession = this.createSession.bind(this);
        this.getSessions = this.getSessions.bind(this);
        this.getSessionSelected = this.getSessionSelected.bind(this);
        this.setSessionSelected = this.setSessionSelected.bind(this);
        this.getDialect = this.getDialect.bind(this);
        this.showSessions = this.showSessions.bind(this);
        this.deleteSession = this.deleteSession.bind(this);
        this.addSession = this.addSession.bind(this);
    }

    createSession(sessionId, object) {
        this.sessions[sessionId] = object;
    }

    getSession() {
        return this.sessions[this.sessionSelected];
    }

    getSessions() {
        return this.sessions;
    }

    getSessionSelected() {
        return this.sessionSelected;
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
