module.exports = function (seneca) {
  seneca.add({ role: 'calc', cmd: 'add' }, function (args, cb) {
    cb(null, { result: args.a + args.b })
  })
}
