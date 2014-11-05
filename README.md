markov
======

Generate markov chains for chatbots and freestyle rap contests.

examples
========

qwantz
------

```javascript
  var util = require('util');
  var fs = require('fs');
  
  var Markov = require('markov');
  var m = new Markov();
  
  var s = fs.readSync(__dirname + '/qwantz.txt');
  m.train(s);

  var stdin = process.openStdin();
  util.print('> ');
  
  stdin.on('data', function (line) {
    var res = m.respond(line.toString()).join(' ');
    console.log(res);
    util.print('> ');
  });
```

```bash
  $ node example/qwantz.js 
  > Hello friend.
  Oh, that hurts me. How could fall apart, not unlike this tiny house. remains a danger when you? As I see him (quite often, Yes, As Thank I you? take have on! forgotten male, That oppression is is a A friend
  > That is troubling news!
  I've I had must to guard do against with such the a irony part of of their their fundamental fundamental injustices.
  > Justice eh? SOMEBODY LIGHT UP THE BATSIGNAL
  crazy I Utahraptor feel slipped alot in better! your about problems the put future! behind full You? of go My down perspective. The
```

## methods

### new Markov(minimumWords, caseSensitive, stripPunctuation)

Create a new markov object. Optionally set `minimumWords` (default 1), `caseSensitive` (default false), `stripPunctuation` (default false).

### .train(text)

Train the markov object with a string `text`, ignoring text with fewer than `minimumWords` words.

### .search(text)

Search for and return some key found in the text body `text`.

Return `undefined` if no matches were found.

### .pickWord(nodes, words)

Choose a word at random from `nodes`, optionally favoring words in `words`.

### .next(key)

Find a key likely to follow after `key`.

Returns a hash with keys `key`, the canonical next key and `word`, a raw form of
`key` as it appeared in the training text.

### .prev(key)

Find a key likely to come before `key`.

Returns a hash with keys `key`, the canonical next key and `word`, a raw form of
`key` as it appeared in the training text.

### .fill(key, limit)

Generate a markov chain in both directions starting at `key`. Return an array of
the raw word forms along the way including the raw word form of the supplied
`key`.

Stop when the traversal hits a terminal entry or when limit words have been
generated if limit is specified.

### .respond(text, limit)

Search for a starting key in `text` and then call `.fill(key, limit)` on it.

## tests

```bash
npm test
```
