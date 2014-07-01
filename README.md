# seneca-loadbalance-transport
Load balancing transport for [Seneca](http://senecajs.org).

## Usage
```js
require(‘seneca’)()
  .use('loadbalance-transport', {
    workers:[
      { type: 'tcp', port: 9000 },   // same options you would pass normally to a transport
      { type: 'tcp', port:9001 },
      { type: 'http', port:9002 }, // transports do not have to be of same type
    ]
  })
  .client({ type: 'loadbalance' })
  .ready(function(){
    var seneca = this

    // this should round robin
    setInterval(function () {
      seneca.act('a:1', function (err, out) {
        console.dir(arguments)
      })
    }, 222)
  })
```

## Acknowledgements
This project was kindly sponsored by the awesome people at
[nearForm](http://nearform.com) and is somewhat based on
[`seneca-shard-store`](https://github.com/mcollina/seneca-shard-store).
