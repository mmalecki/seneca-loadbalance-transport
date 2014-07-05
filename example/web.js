var express = require('express')

var webPort = parseInt(process.argv[2], 10)

var seneca = require('seneca')()
seneca
  .use(require('../'), {
    workers:[
      { type: 'tcp', port: 9000 },   // same options you would pass normally to a transport
      { type: 'tcp', port: 9001 }
    ]
  })
  .use(require('seneca-web'))
  .ready(function () {
    seneca.act('role:web', {
      use: {
        prefix: '/loadbalance',
        pin: { role: 'loadbalance', cmd: '*' },
        map: {
          add: { POST: true },
          list: { GET: true },
          close: { POST: true },
          remove: { POST: true }
        }
      }
    })

    var app = express()
    console.dir(seneca.export('web').toString())
    app.use(seneca.export('web'))
    app.use(require('connect-query'))
    app.listen(webPort)
  })
