var _ = require('underscore');

function Markov(minimumWords) {
  this.minimumWords = minimumWords || 1;
  this.db = {};
}
  
//TODO comments
Markov.prototype.train = function(str) {
  var text = (Buffer.isBuffer(str) ? str.toString() : str)
  var words = this.wordsFromText(text);

  var word;
  var next;
  var prev;
  var node;

  if (words.length >= this.minimumWords) {
    for (var i = 0; i < words.length; i++) {
      word = words[i];
      next = words[i + 1];
      prev = words[i - 1];

      node = this.addDefaultDbRow(word);

      this.incrementCount(node);

      //TODO somehow combine generic language dataset with user dataset. e.g. start with generic dataset, then give user data larger weights...
      if (next) {
        node.next[next] = this.incrementCount(node.next[next]);
      }
      else {
        node.next[''] = this.incrementCount(node.next['']);
      }

      if (prev) {
        node.prev[prev] = this.incrementCount(node.prev[prev]);
      }
      else {
        node.prev[''] = this.incrementCount(node.prev['']);
      }
    }
  }
};

Markov.prototype.computeWeight = function(count) {
  return Math.log(count) + 1;
};

Markov.prototype.wordsFromText = function(text) {
  return _.map(text.toString().split(/\s+/), clean);
};

Markov.prototype.search = function(text) {
  return this.pickWord(this.db, this.wordsFromText(text));
};
  
Markov.prototype.pickWord = function(nodes, words) {
  if (words) {
    words = _.intersection(_.keys(nodes), words)
  }
  else {
    words = [];
  }

  var wordsTable = mapObject(words, _.constant(true));

  var maxSample = 0;
  var sample;

  return _.reduce(_.keys(nodes), function(memo, word) {
    //TODO tweak
    sample = Math.random() * nodes[word].weight * (wordsTable[word] ? 2 : 1);

    if (sample > maxSample) {
      memo = word;
      maxSample = sample;
    }

    return memo;
  }, null);
};

Markov.prototype.next = function(word) {
  if (!word || !this.db[word]) {
    return undefined;
  }
  
  return this.pickWord(this.db[word].next);
};

Markov.prototype.prev = function(word) {
  if (!word || !this.db[word]) {
    return undefined;
  }
  
  return this.pickWord(this.db[word].prev);
};

Markov.prototype.fill = function(word, limit) {
  var response = [word];

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
  limit = limit || 25;
  return this.fill(this.search(text), limit);
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

Markov.prototype.incrementCount = function(obj) {
  obj = _.isObject(obj) ? obj : {count: 0, weight: 0};

  obj.count++;
  obj.weight = this.computeWeight(obj.count);

  return obj;
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
    next: {},
    prev: {}
  };
}

function mapObject(obj, fn) {
  var ret = {};

  _.each(obj, function(val, key) {
    ret[key] = fn(val, key);
  });

  return ret;
}

module.exports = Markov;
