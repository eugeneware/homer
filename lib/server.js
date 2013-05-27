var dns = require('native-dns');

module.exports = {
  create: makeServer
};

function makeServer(db) {
  var server = dns.createServer();

  server.on('request', function (request, response) {
    db.get(request.question[0].name, function (err, data) {
      if (data && data.ip) {
        response.answer.push(dns.A({
          name: request.question[0].name,
          address: data.ip,
          ttl: 60,
        }));
      } else {
        response.header.rcode = 3;
      }
      response.send();
    });
  });

  server.on('error', function (err, buff, req, res) {
    console.log(err.stack);
  });

  return server;
}
