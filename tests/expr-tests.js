var E = require("../src/expr.js");
var P = require("../folproof-parser.js");

exports["Printing identifiers."] = function(test) {
	var src = "a";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing and connective."] = function(test) {
	var src = "a & b";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a & b";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing or connective."] = function(test) {
	var src = "a v b";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a v b";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing implication."] = function(test) {
	var src = "a -> b";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a -> b";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing bi-implication."] = function(test) {
	var src = "a <-> b";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a <-> b";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing equality."] = function(test) {
	var src = "a = b";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a = b";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing negation."] = function(test) {
	var src = "~a";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "~a";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing disjunction right-associative."] = function(test) {
	var src = "a v b v c";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a v b v c";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing disjunction with parentheses to left."] = function(test) {
	var src = "(a v b) v c";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "(a v b) v c";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing implication right-associative."] = function(test) {
	var src = "a -> b -> c";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a -> b -> c";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing implication with parentheses to left."] = function(test) {
	var src = "(a -> b) -> c";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "(a -> b) -> c";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing mixed conjunction-implication."] = function(test) {
	var src = "a & b -> c";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a & b -> c";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing mixed disjunction-implication."] = function(test) {
	var src = "a v b -> c";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a v b -> c";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing mixed disjunction-conjunction."] = function(test) {
	var src = "a v b & c";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a v b & c";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing mixed disjunction-conjunction-implication."] = function(test) {
	var src = "a v b -> c & d";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "a v b -> c & d";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing double negation."] = function(test) {
	var src = "~~a";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "~~a";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing negation-equality."] = function(test) {
	var src = "~a = b";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "~a = b";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing negation-equality with parentheses."] = function(test) {
	var src = "~(a = b)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "~a = b";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing negation-conjunction."] = function(test) {
	var src = "~(a & b)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "~(a & b)";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing conjunction with negation on left."] = function(test) {
	var src = "(~a) & b";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "~a & b";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing application term."] = function(test) {
	var src = "P(x)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "P(x)";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing complex term."] = function(test) {
	var src = "P(f(x, c), g(d))";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = src;
	test.deepEqual(prt, expected, null);
	test.done();
}


exports["Printing forall."] = function(test) {
	var src = "Ax.P(x)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = "Ax.P(x)";
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing exists."] = function(test) {
	var src = "Ex.P(x)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = src;
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing forall-exists."] = function(test) {
	var src = "Ax.Ey.P(x, y)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = src;
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing forall-conjunction."] = function(test) {
	var src = "Ax.P(x) & Q(x)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = src;
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing forall-implication."] = function(test) {
	var src = "Ax.P(x) -> Q(x)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = src;
	test.deepEqual(prt, expected, null);
	test.done();
}

exports["Printing forall left of implication."] = function(test) {
	var src = "(Ax.P(x)) -> Q(x)";
	var e = P.parse(src)[0][1];
  var prt = E.pretty(e)
	var expected = src;
	test.deepEqual(prt, expected, null);
	test.done();
}
