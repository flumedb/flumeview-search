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
  var search = sbot._flumeUse('search', LevelView(11, function (data,seq) {
    var words = {}
    if(data.value.content.text) {
      var text = data.value.content.text
      for(var word; word = match.exec(text); ) {
        word = word[0]
        if(word && word.length >= 3 && !words[word]) words[word] = true
      }
    }
    return Object.keys(words).sort().map(function (e) {
      return [e.toLowerCase(), -data.timestamp]
    })
  }))

  index.query = function (opts) {
    if(isString(opts)) {
      opts = {query: opts}
    }
    var pushable = Pushable(function () {
      while(aborts.length) aborts.shift()()
    })

    var terms = opts.query.split(/\s+/)
    var mask = 0, found = {}, ended = 0
    var aborts = terms.filter(function (e) {
      return e.length >= 3
    }).map(function (term, i) {
      mask |= 1 << i
      var sink
      pull(
        search.read({
          gt: [term, null], lte: [term, undefined],
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
}



