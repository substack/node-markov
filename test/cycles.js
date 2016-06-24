var chai = require('chai');
var Markov = require('../');

var expect = chai.expect;

describe('cycles', function(t) {
  var m = new Markov();
  var these = 'the THE tHe ThE thE The';
  m.train(these);

  it('should not loop infinitely', function() {
    expect(m.respond('the')).to.exist;
  });
});
