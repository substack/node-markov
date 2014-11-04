var chai = require('chai');
var Markov = require('../');

var expect = chai.expect;

var message = 'HELLO,';

describe('include punctuation', function() {
  var m = new Markov(1, true, false);
  m.train(message);

  it('should keep punctuation', function() {
    expect(m.respond('hello')).to.equal('HELLO,');
  });
});

describe('strip punctuation', function() {
  var m = new Markov(1, true, true);
  m.train(message);

  it('should not keep punctuation', function() {
    expect(m.respond('hello')).to.equal('HELLO');
  });
});
