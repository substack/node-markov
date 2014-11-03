var chai = require('chai');
var Markov = require('../');

var expect = chai.expect;

var m = new Markov();
m.train('This is a test.');

describe('search', function() {
  it('should eventually pick common word', function() {
    var found = false;
    for (var i = 0; i < 100; i++) {
      found = found || m.search('What IS your problem?') === 'is';
    }

    expect(found).to.be.true;
  });

  it('should not find other words', function() {
    expect(m.search('foo')).not.to.equal('foo');
  });
});

describe('order', function(t) {
  var wrongOrder = /is this/ig;

  it('should not respond with words in wrong order', function() {
    for (var i = 0; i < 100; i++) {
      expect(wrongOrder.test(m.respond('is'))).to.be.false;
    }
  });
});
