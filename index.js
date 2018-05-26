var LevelView = require('flumeview-level')
var pull = require('pull-stream')
var Pushable = require('pull-pushable')
var paramap = require('pull-paramap')
function isString (s) {
  return 'string' === typeof s
}

module.exports = function (version, length, map) {
  length = length || 3
  var match = /\w+/ig
  var create = LevelView(version, function (data, seq) {
    var words = {}
    var text = map(data)
    if(text) {
      for(var word; word = match.exec(text); ) {
        word = word[0]
        if(word && word.length >= length && !words[word]) words[word] = true
      }
      return Object.keys(words).sort().map(function (e) {
        return [e.toLowerCase(), -seq]
      })
    }
    return []
  })
  return function (log, name) {
    var index = create(log, name)

    index.methods = index.methods || {}
    index.methods.query = 'source'
    index.query = function (opts) {
      if(isString(opts)) {
        opts = {query: opts}
      }
      var pushable = Pushable(function () {
        while(aborts.length) aborts.shift()()
      })

      var terms = opts.query.trim().split(/[^\w]+/).filter(Boolean).filter(function (e) {
        return e.length >= length
      })
      var mask = 0, found = {}, ended = 0
      var aborts = terms.map(function (term, i) {
        mask |= 1 << i
        var sink
        pull(
          index.read({
            gt: [term, null], lte: [term+'~', undefined],
            keys: true, values: false
          }),
          sink = pull.drain(function (data) {
            if(found[data.seq] == mask) return
            if((found[data.seq] |= (1 << i)) == mask)
              pushable.push(+data.seq)
          }, function (end) {
            if(++ ended== terms.length)
              pushable.end()
          })
        )
        return function () {
          sink.abort(function () {})
        }
      })
      return pull(
        pushable,
        opts.values !== false ? paramap(log.get): pull.through(),
        opts.limit ? pull.take(opts.limit) : pull.through()
      )
    }
    return index
  }
}

