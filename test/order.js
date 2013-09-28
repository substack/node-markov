var test = require('tape');
var markov = require('../');

test('order1', function (t) {
    t.plan(5);

    var m = markov(1);
    m.seed('This is a test.');

    t.equal(
        m.search('What IS your problem?'),
        'is'
    );

    t.ok(m.search('foo bar baz zing') === undefined);

    t.ok('this is a test'.split(' ').indexOf(m.pick()) >= 0);

    t.deepEqual(
        m.next('is'),
        { word : 'a', key : 'a' }
    );
    t.deepEqual(
        m.prev('is'),
        { word : 'This', key : 'this' }
    );
});

test('order2', function (t) {
    t.plan(2);

    var m = markov(2);
    m.seed('This is a test.');
    t.deepEqual(
        m.next('this_is'),
        { word : 'a test.', key : 'a_test' }
    );
    t.deepEqual(
        m.prev('a_test'),
        { word : 'This is', key : 'this_is' }
    );
});