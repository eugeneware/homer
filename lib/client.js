var request = require('request');

function HomerClient(hostname, port) {
  this.hostname = hostname;
  this.port = port;
}

HomerClient.prototype.request = function (action, args, cb) {
  request.post(this.base() + action,
    { form: args },
    function (err, res, body) {
      if (err) return cb(err);
      var result = JSON.parse(body);
      if (result.status !== 'OK') {
        return cb(new Error(result.message));
      }
      cb(null, result);
    });
}

HomerClient.prototype.base = function () {
  return 'http://' + this.hostname + ':' + this.port + '/';
}

HomerClient.prototype.register = function (hostname, password, cb) {
  this.request('register', { hostname: hostname, password: password }, cb);
};

HomerClient.prototype.update = function (hostname, password, cb) {
  this.request('update', { hostname: hostname, password: password }, cb);
};

module.exports = HomerClient;
