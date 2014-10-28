var EventEmitter = require('events').EventEmitter;
var deck = require('deck');
var Lazy = require('lazy');
var Q = require('q');
var _ = require('underscore');

function Markov(order) {
  this.order = order || 2;
  this.db = {};
}
  
Markov.prototype.train = function(str) {
  var defer = Q.defer();

  if (str instanceof EventEmitter) {
    Lazy(str).lines.forEach(this.trainString.bind(this));
    
    str.on('error', defer.reject.bind(defer));
    str.on('end', defer.resolve.bind(defer));
  }
  else {
    this.trainString(str);
    defer.resolve();
  }

  return defer.promise;
};

Markov.prototype.trainString = function(str) {
  var text = (Buffer.isBuffer(str) ? str.toString() : str)
  var words = text.split(/\s+/);
  var links = [];

  for (var i = 0; i < words.length; i += this.order) {
    var link = words.slice(i, i + this.order).join(' ');
    links.push(link);
  }

  if (links.length > 1) {
    for (var i = 1; i < links.length; i++) {
      var word = links[i-1];
      var cword = clean(word);
      var next = links[i];
      var cnext = clean(next);
      
      var node = this.addDefaultDbRow(cword);

      node.count++;
      node.words[word] = _.isNumber(node.words[word]) ? node.words[word] + 1 : 1;
      node.next[cnext] = _.isNumber(node.next[cnext]) ? node.next[cnext] + 1 : 1;

      if (i > 1) {
        var prev = clean(links[i-2]);
        node.prev[prev] = _.isNumber(node.prev[prev]) ? node.prev[prev] + 1 : 1;
      }
      else {
        node.prev[''] = _.isNumber(node.prev['']) ? node.prev[''] + 1 : 1;
      }
    }
    
    var n = this.addDefaultDbRow(cnext);

    n.count++;
    n.words[next] = _.isNumber(n.words[next]) ? n.words[next] + 1 : 1;
    n.prev[cword] = _.isNumber(n.prev[cword]) ? n.prev[cword] + 1 : 1;
    n.next[''] = _.isNumber(n.next['']) ? n.next[''] + 1 : 1;
  }
};

Markov.prototype.search = function(text) {
  var words = text.split(/\s+/);
  
  // find a starting point...
  var start = null;
  var groups = {};
  for (var i = 0; i < words.length; i += this.order) {
    var word = clean(words.slice(i, i + this.order).join(' '));

    if (this.db[word] !== undefined) {
      groups[word] = this.db[word].count;
    }
  }
  
  return deck.pick(groups);
};

Markov.prototype.pick = function() {
  return deck.pick(Object.keys(this.db))
};

Markov.prototype.next = function(cur) {
  if (!cur || !this.db[cur]) return undefined;
  
  var next = deck.pick(this.db[cur].next);
  return next && {
    key: next,
    word: deck.pick(this.db[next].words),
  } || undefined;
};

Markov.prototype.prev = function(cur) {
  if (!cur || !this.db[cur]) return undefined;
  
  var prev = deck.pick(this.db[cur].prev);
  return prev && {
    key: prev,
    word: deck.pick(this.db[prev].words),
  } || undefined;
};

Markov.prototype.forward = function(cur, limit) {
  var res = [];
  while (cur && !limit || res.length < limit) {
    var next = this.next(cur);
    if (!next) break;
    cur = next.key;
    res.push(next.word);
  }
  
  return res;
};

Markov.prototype.backward = function(cur, limit) {
  var res = [];
  while (cur && !limit || res.length < limit) {
    var prev = this.prev(cur);
    if (!prev) break;
    cur = prev.key;
    res.unshift(prev.word);
  }
  
  return res;
};

Markov.prototype.fill = function(cur, limit) {
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

Markov.prototype.respond = function(text, limit) {
  var cur = this.search(text) || this.pick();
  return this.fill(cur, limit);
};

Markov.prototype.word = function(cur) {
  return this.db[cur] && deck.pick(this.db[cur].words);
};

Markov.prototype.export = function() {
  return JSON.stringify(_.pick(this, ['db', 'order']));
}

Markov.prototype.import = function(json) {
  var data = JSON.parse(json);
  _.extend(this, _.pick(data, ['db', 'order']));
};

Markov.prototype.addDefaultDbRow = function(word) {
  if (!_.isObject(this.db[word])) {
    this.db[word] = {};
  }
  _.defaults(this.db[word], defaultDbRow());

  return this.db[word];
};

function clean(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z\d]+/g, '_')
    .replace(/^_/, '')
    .replace(/_$/, '');
}

function defaultDbRow() {
  return {
    count: 0,
    words: {},
    next: {},
    prev: {}
  };
};

module.exports = Markov;
