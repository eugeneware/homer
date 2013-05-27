var request = require('request');

function HomerClient(hostname, port) {
  this.hostname = hostname;
  this.port = port;
}

HomerClient.prototype.request = function (action, verb, args, cb) {
  request[verb](this.base() + action,
    { form: args },
    function (err, res, body) {
      if (err) return cb(err);
      var result = JSON.parse(body);
      if (result.status !== 'OK') {
        return cb(new Error(result.message));
      }
      cb(null, result.data);
    });
}

HomerClient.prototype.base = function () {
  return 'http://' + this.hostname + ':' + this.port + '/';
}

HomerClient.prototype.register = function (hostname, password, cb) {
  this.request('register', 'post', { hostname: hostname, password: password }, cb);
};

HomerClient.prototype.update = function (hostname, password, cb) {
  this.request('update', 'post', { hostname: hostname, password: password }, cb);
};

HomerClient.prototype.lookup = function (hostname, password, cb) {
  this.request('lookup', 'get', { hostname: hostname, password: password }, cb);
};

HomerClient.prototype.ip = function (cb) {
  this.request('ip', 'get', { }, cb);
};

module.exports = HomerClient;
