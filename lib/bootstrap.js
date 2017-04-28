const semver = require('semver');

var util = require('util');
var npm = require('npm');

//Распечатать структуру объекта
var inspect = function(name, module) {
    console.log('Inspect "' + name + '":' + util.inspect(module));
}

//Получить полное имя модуля
var getFullName = function (name, version) {
    var v = semver.clean(version);
    if (v) {
        return name + '@' + v;
    } else {
        return name;
    }
};

//Получить URL репозитория с указанием ветки/тега
var getFullURL = function (repoURL, name, version) {
    var fullURL;
    if (repoURL){
        fullURL = repoURL;
    } else {
        fullURL = process.env.npm_package_config_remoteRepoURL;
    }
    fullURL = fullURL + name + '.git';

    var v = semver.clean(version);
    if (v) {
        fullURL = fullURL + '#r' + v;
    }
    return fullURL;
};

var loadModule = function (obj, repoURL, name, version, callback) {
    var mod;
    try {
        //todo mod = require(fullModuleName); и ограничить версию major.minor для накатки fix
        console.log('System API module "%s" require...', getFullName(name, version));
        mod = new require(name)();
        return mod;
    } catch (err){
        errFlag = true;
        console.error('Error require', err.code, err);
        if (err.code == 'MODULE_NOT_FOUND') {
            installModule(obj, repoURL, name, version, callback);
        }
    }
}

//Установить свойство и модуль, если ранее не был установлен
//todo установка зависимости на модуль с версией name@version (fullModuleName)
var demandModuleProperty = function (obj, repoURL, name, version, callback) {
    var fullModuleName = getFullName(name, version);
    var errFlag = false;
    if (!obj.hasOwnProperty(fullModuleName)) {
        console.log('System API module "%s" defining', fullModuleName);
        var mod = loadModule(obj, repoURL, name, version, callback);
        if (mod == undefined){
            return;
        }
        Object.defineProperty(obj, fullModuleName, {
            configurable: true,
            enumerable: true,
            get: function () {
                Object.defineProperty(obj, fullModuleName, {
                    configurable: false,
                    enumerable: true,
                    value: mod
                });
                console.log('System API module "%s" defined', fullModuleName);
                inspect('parent object', obj);
                inspect(fullModuleName, obj[fullModuleName]);
            }
        });
    }
    if (!errFlag) {
        console.log('Callback for "%s"', fullModuleName);
        callback(obj[fullModuleName]);
    }
};

//установка модуля из репозитория
//todo установка модуля в папку с версией name@version, ограничить версию major.minor для накатки fix
var installModule = function(obj, repoURL, name, version, callback){
    console.log('Installing module %s version %s', name, version);
    var fullURL = getFullURL(repoURL, name, version);
    npm.load({progress: true, '--save-optional': true, '--force': true, '--ignore-scripts': true},function(err) {
        // handle errors

        // install module
        npm.commands.install([fullURL], function(er, data) {
            // log errors or data
            if (!er){
                console.info('System API module "%s" installed', name);
                //повторная попытка определения свойства
                demandModuleProperty(obj, repoURL, name, version, callback);
            } else {
                console.error('Error NPM Install', er.code, er);
            }
        });

        npm.on('log', function(message) {
            // log installation progress
            console.log('NPM logs:' + message);
        });
    });
};

module.exports.inspect = inspect;
module.exports.getFullName = getFullName;
module.exports.getFullURL = getFullURL;
module.exports.demandModuleProperty = demandModuleProperty;

console.log('Bootstrap system API loaded');