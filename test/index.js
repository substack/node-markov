var mocha = require('mocha');
var chai = require('chai');

describe('the tests', function() {
  require('./cycles');
  require('./has');
  require('./limit');
  require('./order');
  require('./case');
});
