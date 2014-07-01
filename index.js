'use strict'

var Seneca = require('seneca')

var name = 'loadbalance-transport'

function makeSeneca(worker) {
  return Seneca()
    .client(worker)
}

module.exports = function (seneca, opts, cb) {
  var senecas = opts.workers.map(makeSeneca)

  function wrapOne(args, cb_) {
  }

  function wrapMany(args, cb_) {
  }

  var store = {
    name: name,
    save: wrapOne,
    load: wrapOne,
    list: wrapMany,
    remove: wrapMany,
    close: wrapMany,
    native: function (cb_) {
      cb_(null, opts)
    }
  }

  seneca.store.init(seneca, opts, store, function (err, tag, description) {
    if (err) return cb(err)
    cb(null, { name: name, tag: tag })
  })
}
