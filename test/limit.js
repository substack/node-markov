var chai = require('chai');
var Markov = require('../');

var expect = chai.expect;

describe('limit', function() {
  var m = new Markov();

  var these = 'the THE tHe ThE thE The the THE The tHE the the';
  m.train(these);

  it('should respect word limit', function() {
    for (var i = 0; i < 100; i++) {
      expect(m.respond('the', 20).split(' ').length).to.be.at.most(20);
    }
  });
});
