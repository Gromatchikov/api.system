var argv = require('optimist').argv;
var io = require('socket.io-client');

var port = (argv.port == undefined ? 8055 : argv.port)
console.log('Stoping server API at port ' + port);
var socketClient = io.connect('http://localhost:' + port);

//отправка серверу события остановки
socketClient.on('connect', () => {
    socketClient.emit('eSASStop');
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});
