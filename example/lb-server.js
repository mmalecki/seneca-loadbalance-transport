var type = process.argv[2]
var port = parseInt(process.argv[3], 10)

if (!type || !port) {
  console.error('usage: lb-server.js <type> <port>')
  process.exit(1)
}

var seneca = require('seneca')()
seneca
  .use(function () {
    this.add({ a: 1 }, function (args, done) {
      console.log('got request')
      done(null, { b: 1 + args.a })
    })
    this.add({ role: 'transport', cmd: 'ping' }, function (args, cb) {
      // Silence errors about endpoint not found.
      cb()
    })
  })
  .listen({ type: type, port: port })
