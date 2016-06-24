var chai = require('chai');
var Markov = require('../');

var expect = chai.expect;

var message = 'HELLO, Hello';
var responses = ['Hello', 'HELLO, Hello'];
var badResponses = ['hello', 'hello, hello'];

describe('case sensitivity', function() {
  var m = new Markov(1, true);
  m.train(message);

  it('should not alter case', function() {
    expect(responses).to.contain(m.respond('hello'));
    expect(badResponses).not.to.contain(m.respond('hello'));
  });
});

describe('case insensitivity', function() {
  var m = new Markov(1);
  m.train(message);

  it('should lower case', function() {
    expect(badResponses).to.contain(m.respond('hello'));
    expect(responses).not.to.contain(m.respond('hello'));
  });
});
