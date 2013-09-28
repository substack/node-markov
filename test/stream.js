var test = require('tape');
var markov = require('../');
var EventEmitter = require('events').EventEmitter;

test('stream', function (t) {
    t.plan(3);

    var m = markov(1);
    var to = setTimeout(function () {
        t.fail('never finished');
    }, 5000);

    var em = new EventEmitter;
    m.seed(em, function () {
        clearTimeout(to);

        var counts = {};
        for (var i = 0; i < 100; i++) {
            var w = m.next('the');
            counts[w.key] = (counts[w.key] || 0) + 1;
        }

        t.deepEqual(Object.keys(counts).sort(), [ 'cat', 'cow' ]);
        t.ok(40 <= counts.cat && counts.cat <= 60);
        t.ok(40 <= counts.cow && counts.cow <= 60);
    });

    setTimeout(function () {
        em.emit('data', 'The cow says');
    }, 100);

    setTimeout(function () {
        em.emit('data', 'moo.\nThe ');
    }, 150);

    setTimeout(function () {
        em.emit('data', 'cat says meow.\n');
        em.emit('end');
    }, 200);
});