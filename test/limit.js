var test = require('tape');
var markov = require('../');
var fs = require('fs');

test('limit', function (t) {
    var to = setTimeout(function () {
        t.fail('never finished');
    }, 5000);

    var m = markov(1);

    var these = 'the THE tHe ThE thE The the THE The tHE the the';
    m.seed(these, function () {
        clearTimeout(to);

        var counts = {};
        for (var i = 0; i < 100; i++) {
            var lim = Math.ceil(Math.random() * 10);
            var res = m.respond('the', lim);
            t.ok(res.length <= lim);

            res.forEach(function (r) {
                t.ok(these.split(' ').indexOf(r) >= 0);
                counts[r] = (counts[r] || 0) + 1;
            });
        }

        t.end();
    });
});