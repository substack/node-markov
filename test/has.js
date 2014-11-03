var chai = require('chai');
var Markov = require('../');

var expect = chai.expect;

describe('special property names', function() {
  var m = new Markov();

  var these = 'constructor toLocaleString valueOf __defineGetter__';

  it('should train', function() {
    expect(m.train(these)).to.exist;
  });

  it('should respond', function() {
    expect(m.respond('the')).to.exist;
  });
});
