module.exports = function (seneca) {
  var r = Math.random()
  seneca.add('role:random,cmd:get', function (args, cb) {
    cb(null, { r: r })
  })
}
