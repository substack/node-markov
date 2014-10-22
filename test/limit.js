var test = require('tape');
var Markov = require('../');
var fs = require('fs');

test('limit', function(t) {
  var to = setTimeout(function() {
    t.fail('never finished');
  }, 5000);

  var m = new Markov(1);

  var these = 'the THE tHe ThE thE The the THE The tHE the the';
  m.seed(these).then(function() {
    clearTimeout(to);

    var counts = {};
    for (var i = 0; i < 100; i++) {
      var lim = Math.ceil(Math.random() * 10);
      var res = m.respond('the', lim);
      t.ok(res.length <= lim);

      res.forEach(function(r) {
        t.ok(these.split(' ').indexOf(r) >= 0);
        counts[r] = (counts[r] || 0) + 1;
      });
    }

    t.end();
  }, t.fail.bind(t));
});
