var sudo = require('electron-sudo');
var fs = require('fs');

var keyFile = './ssl/certs/server/privkey.pem';
var csrFile = 'ssl/certs/server/csr.pem';

var options = {
    name: 'Your application name',
    process: {
        options: {
            env: {'VAR': 'VALUE'}
        },
        on: (ps) => {
            ps.stdout.on('data', function(data) {console.log(data);});
            setTimeout(function() {
                ps.kill();
            }, 50000);
        }
    }
};

try {
    fs.accessSync(keyFile, fs.F_OK);
    fs.accessSync(csrFile, fs.F_OK);
    console.log('Found key files.');

    // Do something
} catch (e) {
    console.log('Did not find keys, generating...');
    // if error returned, keys do not exist -- let's create them
    sudo.exec('sh ./ssl/createKeys.sh', options, function(error) {
        if (error) {
            console.log(error);
        } else {
            console.log('Keys generated.');
        }
    });
}

var hosts = '/etc/hosts';
var connectorURL = 'connector.plotly.com';
var redirectTo = '10.0.0.1';

try {
    fs.readFile(hosts, function (err, data) {
        if (data.indexOf(connectorURL) < 0) {
            console.log('connector.plotly.com is not wired to a local port.');
            sudo.exec('sh ./ssl/redirectConnector.sh', options, function(error) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('connector.plotly.com is now wired to a local port.');
                }
            });
        } else {
            console.log('connector.plotly.com is already wired to a local port.');
        }
    });
} catch (error) {
    console.log('An error occured.', error);
}
