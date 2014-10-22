var EventEmitter = require('events').EventEmitter;
var deck = require('deck');
var Lazy = require('lazy');
var Hash = require('hashish');
var Q = require('q');

function Markov(order) {
  if (!order) order = 2;
  this.order = order;
  this.db = {};
}
  
/**
 * TODO
 * add import/export of json
 * add incremental updates of model
 * use promises
 * use probabilities if not already
 * use natural's ngram generator?
 */
Markov.prototype.seed = function (seed) {
  var defer = Q.defer();
  var resolve = defer.resolve.bind(defer);
  var reject = defer.reject.bind(defer);

  if (seed instanceof EventEmitter) {
    Lazy(seed).lines.forEach(this.seed.bind(this));
    
    seed.on('error', reject);
    seed.on('end', resolve);
  }
  else {
    var text = (Buffer.isBuffer(seed) ? seed.toString() : seed)
    var words = text.split(/\s+/);
    var links = [];
    
    for (var i = 0; i < words.length; i += this.order) {
      var link = words.slice(i, i + this.order).join(' ');
      links.push(link);
    }
    
    if (links.length <= 1) {
      defer.resolve();
      return;
    }
    
    for (var i = 1; i < links.length; i++) {
      var word = links[i-1];
      var cword = clean(word);
      var next = links[i];
      var cnext = clean(next);
      
      var node = Hash.has(this.db, cword)
        ? this.db[cword]
        : {
          count : 0,
          words : {},
          next : {},
          prev : {},
        };
      this.db[cword] = node;
      
      node.count ++;
      node.words[word] = (
        Hash.has(node.words, word) ? node.words[word] : 0
      ) + 1;
      node.next[cnext] = (
        Hash.has(node.next, cnext) ? node.next[cnext] : 0
      ) + 1
      if (i > 1) {
        var prev = clean(links[i-2]);
        node.prev[prev] = (
          Hash.has(node.prev, prev) ? node.prev[prev] : 0
        ) + 1;
      }
      else {
        node.prev[''] = (node.prev[''] || 0) + 1;
      }
    }
    
    if (!Hash.has(this.db, cnext)) this.db[cnext] = {
      count : 1,
      words : {},
      next : { '' : 0 },
      prev : {},
    };
    var n = this.db[cnext];
    n.words[next] = (Hash.has(n.words, next) ? n.words[next] : 0) + 1;
    n.prev[cword] = (Hash.has(n.prev, cword) ? n.prev[cword] : 0) + 1;
    n.next[''] = (n.next[''] || 0) + 1;
    
    defer.resolve();
  }

  return defer.promise;
};

Markov.prototype.search = function (text) {
  var words = text.split(/\s+/);
  
  // find a starting point...
  var start = null;
  var groups = {};
  for (var i = 0; i < words.length; i += this.order) {
    var word = clean(words.slice(i, i + this.order).join(' '));
    if (Hash.has(this.db, word)) groups[word] = this.db[word].count;
  }
  
  return deck.pick(groups);
};

Markov.prototype.pick = function () {
  return deck.pick(Object.keys(this.db))
};

Markov.prototype.next = function (cur) {
  if (!cur || !this.db[cur]) return undefined;
  
  var next = deck.pick(this.db[cur].next);
  return next && {
    key : next,
    word : deck.pick(this.db[next].words),
  } || undefined;
};

Markov.prototype.prev = function (cur) {
  if (!cur || !this.db[cur]) return undefined;
  
  var prev = deck.pick(this.db[cur].prev);
  return prev && {
    key : prev,
    word : deck.pick(this.db[prev].words),
  } || undefined;
};

Markov.prototype.forward = function (cur, limit) {
  var res = [];
  while (cur && !limit || res.length < limit) {
    var next = this.next(cur);
    if (!next) break;
    cur = next.key;
    res.push(next.word);
  }
  
  return res;
};

Markov.prototype.backward = function (cur, limit) {
  var res = [];
  while (cur && !limit || res.length < limit) {
    var prev = this.prev(cur);
    if (!prev) break;
    cur = prev.key;
    res.unshift(prev.word);
  }
  
  return res;
};

Markov.prototype.fill = function (cur, limit) {
  var res = [ deck.pick(this.db[cur].words) ];
  if (!res[0]) return [];
  if (limit && res.length >= limit) return res;
  
  var pcur = cur;
  var ncur = cur;
  
  while (pcur || ncur) {
    if (pcur) {
      var prev = this.prev(pcur);
      pcur = null;
      if (prev) {
        pcur = prev.key;
        res.unshift(prev.word);
        if (limit && res.length >= limit) break;
      }
    }
    
    if (ncur) {
      var next = this.next(ncur);
      ncur = null;
      if (next) {
        ncur = next.key;
        res.unshift(next.word);
        if (limit && res.length >= limit) break;
      }
    }
  }
  
  return res;
};

Markov.prototype.respond = function (text, limit) {
  var cur = this.search(text) || this.pick();
  return this.fill(cur, limit);
};

Markov.prototype.word = function (cur) {
  return this.db[cur] && deck.pick(this.db[cur].words);
};

Markov.prototype.export = function() {
  return JSON.stringify(this.db);
}

Markov.prototype.import = function(json) {
  this.db = JSON.parse(json);
};

function clean (s) {
  return s
    .toLowerCase()
    .replace(/[^a-z\d]+/g, '_')
    .replace(/^_/, '')
    .replace(/_$/, '');
}

module.exports = Markov;
