var argv = require('optimist').argv;
var systemAPIServer = require('./systemAPIServer.js')();

var port = (argv.port == undefined ? process.env.npm_package_config_port : argv.port);
//запуск сервера
console.log('Start server API at port '+ port);
systemAPIServer.start(argv.port);
