var type = process.argv[2]
var port = parseInt(process.argv[3], 10)

require('seneca')()
  .use(function () {
    this.add({ a: 1 }, function (args, done) {
      done({ b: 1 + args.a })
    })
  })
  .listen({ type: type, port: port })
