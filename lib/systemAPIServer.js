var http = require('http');
var sio = require('socket.io');
var bootstrapSA = require('./bootstrap.js');
var modules = new Object();

function SAServer() {
    if (!(this instanceof SAServer)) {
        return new SAServer();
    }

    this.app = http.createServer();
    this.sioApp = sio.listen(this.app);

    this.sioApp.sockets.on('connection', function (client) {
        client.on('eSASExec', function (data) {
            try {
                console.info('SAserver event eSASExec:');
                console.info(data);

                bootstrapSA.demandModuleProperty(modules, data.repoURL, data.module, data.version, function (module) {
                    var fullModuleName = bootstrapSA.getFullName(data.module, data.version)
                    var api = modules[fullModuleName];
                    if (api != undefined) {
                        var result = api[data.method](data.params);
                        console.info('Result eSASExec', result);
                        client.emit('eSACExec', {data: result || '', from: fullModuleName});
                    } else {
                        console.error('[', 'Error ', fullModuleName, '] is ', undefined);
                        client.emit('eSACOnError', { message: 'Error define api module' + fullModuleName});
                    }
                });
            } catch (_error) {
                console.error('[', 'Error eSASExec', ( _error.code ? _error.code : ''), ']', _error);
                client.emit('eSACOnError', { message: 'Error :(', error: _error.stack || ''});
            }
        });
        client.on('disconnect', () => {
            console.log('User disconnected');
        });
        client.on('eSASStop', () => {
            process.exit(0);
        });
        console.info('User connected');
    });
    console.info('System API server loaded');
}

//запуск сервера
SAServer.prototype.start = function startSAServer(port) {
    // диалоговое окно
    this.currentPort = port;
    if (this.currentPort == undefined) {
        this.currentPort = process.env.npm_package_config_port;
    }
    this.app.listen(this.currentPort);
    console.log('System API server running at http://127.0.0.1:'+ this.currentPort);

    bootstrapSA.inspect('parent object', modules);
};

module.exports = SAServer;