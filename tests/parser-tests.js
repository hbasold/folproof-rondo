// Change parsing framework at some point to ava

var parser = require("../folproof-parser.js").parser;

exports["Implication order is right-associative."] = function (test) {
  var src = "a -> b -> c"; // a -> (b -> c)
  var result = parser.parse(src);
  result = result[0][1];
  // roughly... [['->', ['id', 'a'], ['->', ['id', 'a'], ['id', 'b']], ['id', 'c']]]
  test.equal(result[1][0], "id");
  test.equal(result[1][1], "a");
  test.equal(result[2][0], "->");
  test.equal(result[2][1][1], "b");
  test.equal(result[2][2][1], "c");
  test.done();
};

exports["Mixing implication and bi-implication is right-associative."] =
  function (test) {
    var src = "a <-> b -> c <-> d"; // a <-> (b -> (c <-> d))
    var result = parser.parse(src);
    result = result[0][1];
    test.equal(result[0], "<->");
    test.equal(result[1][0], "id");
    test.equal(result[1][1], "a");
    test.equal(result[2][0], "->");
    test.equal(result[2][1][1], "b");
    test.equal(result[2][2][0], "<->");
    test.equal(result[2][2][1][1], "c");
    test.done();
  };

exports["And order is right to left."] = function (test) {
  var src = "a and b and c"; // a and (b and c)
  var result = parser.parse(src);
  result = result[0][1];
  // roughly... ['and', ['id', 'a'], ['and', ['id', 'b'], ['id', 'c']]]
  test.equal(result[0], "and");
  test.equal(result[1][1], "a");
  test.equal(result[2][0], "and");
  test.equal(result[2][1][1], "b");
  test.equal(result[2][2][1], "c");
  test.done();
};

exports["Or order is left to right."] = function (test) {
  var src = "a or b or c"; // a or (b or c)
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "or");
  test.equal(result[1][1], "a");
  test.equal(result[2][0], "or");
  test.equal(result[2][1][1], "b");
  test.equal(result[2][2][1], "c");
  test.done();
};

exports["Not precedes and."] = function (test) {
  var src = "not a and b"; // (not a) and b
  var result = parser.parse(src);
  result = result[0][1];
  // roughly... ['and', ['not', ['id', 'a']], ['id', 'b']]
  test.equal(result[0], "and");
  test.equal(result[1][0], "not");
  test.equal(result[1][1][1], "a");
  test.equal(result[2][1], "b");
  test.done();
};

exports["And precedes or."] = function (test) {
  var src = "a or b and c"; // a or (b and c)
  var result = parser.parse(src);
  result = result[0][1];
  // roughly... ['or', ['id', 'a'], ['and', ['id', 'b'], ['id', 'c']]]
  test.equal(result[0], "or");
  test.equal(result[1][1], "a");
  test.equal(result[2][0], "and");
  test.equal(result[2][1][1], "b");
  test.equal(result[2][2][1], "c");
  test.done();
};

exports["Forall in parentheses binds stronger than implication."] = function (
  test,
) {
  var src = "(A x. x) -> y";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "->");
  test.equal(result[1][0], "forall");
  test.equal(result[1][2][1], "x");
  test.equal(result[2][1], "y");
  test.done();
};

exports["Forall binds as far as possible."] = function (test) {
  var src = "A x. x -> y";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "forall");
  test.equal(result[1], "x");
  test.equal(result[2][0], "->");
  test.equal(result[2][1][1], "x");
  test.equal(result[2][2][1], "y");
  test.done();
};

// exports["Forall requires space."] = function(test) {
//     var src = "Ax. x";
//     test.expect(1);
// 	  var result = parser.parse(src);
//     console.log(result);
//     test.equal(result[0][0], 'error');
//     // try{
// 	  //     var result = parser.parse(src);
//     //     console.log(result);
//     //     test.ok(false, "Parsing should have failed.");
//     // }
//     // catch(e){
//     //     test.ok(true, "Parsing failed as expected.");
//     // }
//     test.done();
// };

exports["Forall and exists binds as far as possible."] = function (test) {
  var src = "A x. E y. x -> y";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "forall");
  test.equal(result[1], "x");
  result = result[2];
  test.equal(result[0], "exists");
  test.equal(result[1], "y");
  test.equal(result[2][0], "->");
  test.equal(result[2][1][1], "x");
  test.equal(result[2][2][1], "y");
  test.done();
};

exports["Forall on right of implication."] = function (test) {
  var src = "y -> A x. x";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "->");
  test.equal(result[1][1], "y");
  test.equal(result[2][0], "forall");
  test.equal(result[2][1], "x");
  test.equal(result[2][2][1], "x");
  test.done();
};

exports["Complex terms under forall."] = function (test) {
  var src = "1 A x. P(f(c), x) : premise";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "forall");
  test.equal(result[1], "x");
  p = result[2];
  test.equal(p[1], "P");
  ts = p[2];
  test.equal(ts[0][1], "f");
  test.equal(ts[0][2][0][1], "c");
  test.equal(ts[1][1], "x");
  test.done();
};

exports["Atomic predicate."] = function (test) {
  var src = "P(f)";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[1], "P");
  test.equal(result[2][0][1], "f");
  test.done();
};

exports["Atomic Absurdity."] = function (test) {
  var src = "_|_";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "bot");
  test.done();
};

exports["Atomic equality."] = function (test) {
  var src = "a = b";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "=");
  test.equal(result[1][1], "a");
  test.equal(result[2][1], "b");
  test.done();
};

exports["Predicate in formula."] = function (test) {
  var src = "A x. P(x) -> Q() & R(x, y)";
  var result = parser.parse(src);
  result = result[0][1];
  test.equal(result[0], "forall");
  test.equal(result[1], "x");
  result = result[2];
  test.equal(result[0], "->");
  test.equal(result[1][1], "P");
  test.equal(result[1][2][0][1], "x");
  result = result[2];
  test.equal(result[0], "and");
  test.equal(result[1][1], "Q");
  test.equal(result[1][2].length, 0);
  test.equal(result[2][1], "R");
  test.equal(result[2][2][0][1], "x");
  test.equal(result[2][2][1][1], "y");
  test.done();
};
