# flumeview-search

fulltext search as a flumeview.

## example

``` js
var FlumeViewSearch = require('flumeview-search')
var pull = require('pull-stream')
var Flume = require('flumedb')
var OffsetLog = require('flumelog-offset')

var minLength = 3 //index words at least this long

var db = Flume(OffsetLog('/tmp/flume-search-example'))

  .use('search', FlumeViewSearch(1, minLength, function (doc) {
    return doc.text //return the string you want indexed
  })

pull(
  db.search.query({query: 'foo bar baz', limit: 10}),
  pull.drain(console.log)
)
```

## api

### FlumeViewSearch(version, minLength, map) => search

`version` is the view version. if this number changes to what is on disk, the index will
regenerate.

`minLength` is the minimum word length to index. by default this is 3 letters.

`map` is a function that takes the document, and returns a string containing the text to be
indexed.

### search.query ({query, limit, keys, values}) => PullSource

create a pull-stream source of results for this query. query should be a string,
and may contain multiple words. (words shorter than `minLength` are ignored)
The order is in reverse chronological order.



## License

MIT



