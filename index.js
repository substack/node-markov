var _ = require('underscore');

function Markov(minimumWords, caseSensitive, stripPunctuation) {
  this.minimumWords = minimumWords || 1;
  this.caseSensitive = !!caseSensitive;
  this.stripPunctuation = !!stripPunctuation;
  this.model = {};
}
  
//update the model using the supplied string
Markov.prototype.train = function(str) {
  var text = (Buffer.isBuffer(str) ? str.toString() : str)
  var words = this.wordsFromText(text);

  var word;
  var next;
  var prev;
  var node;

  //ignore text with fewer than `minimumWords` words
  if (words.length >= this.minimumWords) {
    for (var i = 0; i < words.length; i++) {
      word = words[i];
      next = words[i + 1];
      prev = words[i - 1];

      node = this.addDefaultModelNode(word);

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

  return this;
};

//compute a node's weight using its count. uses ln(count) to prevent some nodes from being highly favored
Markov.prototype.computeWeight = function(count) {
  return Math.log(count) + 1;
};

//break a string into words, and remove punctuation, etc.
Markov.prototype.wordsFromText = function(text) {
  text = text.toString();

  if (!this.caseSensitive) {
    text = text.toLowerCase();
  }

  if (this.stripPunctuation) {
    text = clean(text);
  }

  return text.split(/\s+/);
};

//pick a word from the model, favoring words that appear in `text`
Markov.prototype.search = function(text) {
  return this.pickWord(this.model, this.wordsFromText(text));
};
  
//pick a word from `nodes`, optionally favoring words in `words`
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

//pick a word to follow `word`
Markov.prototype.next = function(word) {
  if (!word || !this.model[word]) {
    return undefined;
  }
  
  return this.pickWord(this.model[word].next);
};

//pick a word to precede `word`
Markov.prototype.prev = function(word) {
  if (!word || !this.model[word]) {
    return undefined;
  }
  
  return this.pickWord(this.model[word].prev);
};

//construct a sentence starting from `word`, with at most `limit` words
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

//construct a response to `text` with at most `limit` words
Markov.prototype.respond = function(text, limit) {
  limit = limit || 25;
  return this.fill(this.search(text), limit);
};

//export the current model as an object
Markov.prototype.export = function() {
  return _.pick(this, ['model', 'minimumWords']);
}

//import model from an object
Markov.prototype.import = function(json) {
  _.extend(this, _.pick(json, ['model', 'minimumWords']));
  return this;
};

//create a default node in the model
Markov.prototype.addDefaultModelNode = function(word) {
  if (!_.isObject(this.model[word])) {
    this.model[word] = {};
  }
  _.defaults(this.model[word], defaultModelNode());

  return this.model[word];
};

//increment a node's count and re-compute its weight
Markov.prototype.incrementCount = function(obj) {
  obj = _.isObject(obj) ? obj : {count: 0, weight: 0};

  obj.count++;
  obj.weight = this.computeWeight(obj.count);

  return obj;
};

//clean a string
function clean(s) {
  return s.replace(/[^a-z\d ]+/ig, '')
}

//default node
function defaultModelNode() {
  return {
    count: 0,
    next: {},
    prev: {}
  };
}

//map a list to an object, using list values as keys
function mapObject(list, fn) {
  var ret = {};

  _.each(list, function(val, idx) {
    ret[val] = fn(val, idx);
  });

  return ret;
}

module.exports = Markov;
