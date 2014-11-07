seneca-loadbalance-transport - a [Seneca](http://senecajs.org) plugin
=====================================================================

## Seneca Load-Balance Transport Plugin

This plugin provides a message transport that load balances accross a
set of underlying message transports.

[![Build Status](https://travis-ci.org/mmalecki/seneca-loadbalance-transport.png?branch=master)](https://travis-ci.org/mmalecki/seneca-loadbalance-transport)

[![NPM](https://nodei.co/npm/seneca-loadbalance-transport.png)](https://nodei.co/npm/seneca-loadbalance-transport/)
[![NPM](https://nodei.co/npm-dl/seneca-loadbalance-transport.png)](https://nodei.co/npm-dl/seneca-loadbalance-transport/)

For a gentle introduction to Seneca itself, see the
[senecajs.org](http://senecajs.org) site.

Current Version: 0.1.0

Tested on: Seneca 0.5.21, Node 0.10.31


### Install

To install use:

```sh
npm install seneca
npm install seneca-loadbalance-transport
```




## Usage

```js
require('seneca')()
  .use('loadbalance-transport', {
    workers:[
      { type: 'tcp', port: 9000 },   // same options you would pass normally to a transport
      { type: 'tcp', port: 9001 },
      { type: 'http', port: 9002 }, // transports do not have to be of same type
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
