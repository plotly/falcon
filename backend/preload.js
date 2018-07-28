// this file is preloaded by electron in the renderer process
// (it has access to electron's API, even when nodeIntegration has been disabled)

const {ipcRenderer, remote} = require('electron');

const propertyOptions = {
    configurable: false,
    enumerable: false,
    writable: false
};

process.once('loaded', () => {
    const $falcon = {};

    Object.defineProperty(window, '$falcon', {
        value: $falcon,
        ...propertyOptions
    });

    Object.defineProperty($falcon, 'showOpenDialog', {
        value: remote.dialog.showOpenDialog,
        ...propertyOptions
    });

    let onUsername;
    let receivedUsernameBeforeCallback;
    let username;
    function sendUsername(event, user) {
        try {
            if (onUsername) {
                receivedUsernameBeforeCallback = false;
                onUsername(event, user);
            } else {
                receivedUsernameBeforeCallback = true;
                username = user;
            }
        } catch (error) {
            console.error(error); // eslint-disable-line
        }
    }

    ipcRenderer.on('username', sendUsername);

    Object.defineProperty($falcon, 'setUsernameListener', {
        value: (value) => {
            onUsername = value;

            if (receivedUsernameBeforeCallback) {
                sendUsername(null, username);
            }
        },
        ...propertyOptions
    });
});
