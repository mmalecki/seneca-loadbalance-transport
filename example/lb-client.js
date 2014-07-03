require('seneca')()
  .use(require('../'), {
    workers:[
      { type: 'tcp', port: 9000 },   // same options you would pass normally to a transport
      { type: 'tcp', port: 9001 }
    ]
  })
  .ready(function(){
    var seneca = this

    // this should round robin
    console.log('ready')
    setInterval(function () {
      seneca.act({ a: 1 }, function (err, out) {
        console.dir(arguments)
      })
      seneca.act({ role: 'loadbalance', cmd: 'list' }, function (err, out) {
        console.dir(arguments)
      })
    }, 1000)
  })
  .client({ type: 'loadbalance-transport' })
