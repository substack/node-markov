var EventEmitter = require('events').EventEmitter;
var deck = require('deck');
var _ = require('underscore');

function Markov(minimumWords) {
  this.minimumWords = minimumWords || 1;
  this.db = {};
}
  
Markov.prototype.train = function(str) {
  var text = (Buffer.isBuffer(str) ? str.toString() : str)
  var words = text.split(/\s+/);

  if (words.length >= this.minimumWords) {
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var cleanWord = clean(word);

      var next = words[i + 1];
      var prev = words[i - 1];

      var cleanNext;
      var cleanPrev;
      
      var node = this.addDefaultDbRow(cleanWord);

      node.count++;
      node.weight = this.computeWeight(node.count);

      if (next) {
        cleanNext = clean(next);
        node.next[cleanNext] = _.isNumber(node.next[cleanNext]) ? node.next[cleanNext] + 1 : 1;
      }
      else {
        node.next[''] = _.isNumber(node.next['']) ? node.next[''] + 1 : 1;
      }

      if (prev) {
        cleanPrev = clean(prev);
        node.prev[cleanPrev] = _.isNumber(node.prev[cleanPrev]) ? node.prev[cleanPrev] + 1 : 1;
      }
      else {
        node.prev[''] = _.isNumber(node.prev['']) ? node.prev[''] + 1 : 1;
      }
    }
  }
};

Markov.prototype.computeWeight = function(count) {
  return Math.log(count) + 1;
};

Markov.prototype.search = function(text) {
  var words = text.split(/\s+/);
  
  //find a starting point...
  var start = null;
  var groups = {};
  var cleanWord;

  for (var i = 0; i < words.length; i++) {
    cleanWord = clean(words[i]);

    if (this.db[cleanWord] !== undefined) {
      groups[cleanWord] = this.db[cleanWord].weight;
    }
  }
  
  return deck.pick(groups);
};

Markov.prototype.pick = function() {
  return deck.pick(Object.keys(this.db))
};

Markov.prototype.next = function(word) {
  if (!word || !this.db[word]) {
    return undefined;
  }
  
  return deck.pick(this.db[word].next);
};

Markov.prototype.prev = function(word) {
  if (!word || !this.db[word]) {
    return undefined;
  }
  
  return deck.pick(this.db[word].prev);
};

Markov.prototype.fill = function(word, limit) {
  var response = [deck.pick(this.db[word].words)];

  if (!response[0]) {
    return [];
  }

  if (limit && response.length >= limit) {
    return response;
  }
  
  var previousWord = word;
  var nextWord = word;
  
  while (previousWord || nextWord) {
    if (previousWord) {
      previousWord = this.prev(previousWord);

      if (previousWord) {
        response.unshift(previousWord);

        if (limit && response.length >= limit) {
          break;
        }
      }
    }
    
    if (nextWord) {
      nextWord = this.next(nextWord);

      if (nextWord) {
        response.push(nextWord);

        if (limit && response.length >= limit) {
          break;
        }
      }
    }
  }
  
  //TODO punctuation?
  return response.join(' ');
};

Markov.prototype.respond = function(text, limit) {
  var word = this.search(text) || this.pick();
  return this.fill(word, limit);
};

Markov.prototype.export = function() {
  return JSON.stringify(_.pick(this, ['db', 'minimumWords']));
}

Markov.prototype.import = function(json) {
  var data = JSON.parse(json);
  _.extend(this, _.pick(data, ['db', 'minimumWords']));
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
