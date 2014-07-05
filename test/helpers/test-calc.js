module.exports = function (seneca, t, cb) {
  seneca.act('role:calc,cmd:add', { a: 1, b: 1 }, function (err, res) {
    if (err) return t.fail(err)
    t.equal(res.result, 2)
    cb()
  })
}
