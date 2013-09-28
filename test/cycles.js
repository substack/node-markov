var test = require('tape');
var markov = require('../');
var fs = require('fs');

test('cycles', function (t) {
    var to = setTimeout(function () {
        t.fail('never finished');
    }, 5000);

    var m = markov(1);

    var these = 'the THE tHe ThE thE The';
    m.seed(these, function () {
        clearTimeout(to);

        var counts = {};
        for (var i = 0; i < 100; i++) {
            var res = m.respond('the', 100);
            t.ok(res.length < 100);

            res.forEach(function (r) {
                t.ok(these.split(' ').indexOf(r) >= 0);
                counts[r] = (counts[r] || 0) + 1;
            });
        }

        t.deepEqual(
            Object.keys(counts).sort(),
            these.split(' ').sort()
        );

        t.end();
    });
});