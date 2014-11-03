var util = require('util');
var fs = require('fs');

var Markov = require('markov');
var m = new Markov();

var s = fs.readSync(__dirname + '/qwantz.txt');
m.train(s);

var stdin = process.openStdin();
util.print('> ');

stdin.on('data', function (line) {
  var res = m.respond(line.toString());
  console.log(res);
  util.print('> ');
});
