var dns = require('native-dns');

module.exports = {
  create: makeServer
};

function makeServer(db) {
  var server = dns.createServer();

  server.on('request', function (request, response) {
    db.get(request.question[0].name, function (err, data) {
      response.answer.push(dns.A({
        name: request.question[0].name,
        address: data.ip,
        ttl: 60,
      }));
      response.send();
    });
  });

  server.on('error', function (err, buff, req, res) {
    console.log(err.stack);
  });

  return server;
}
