import * as E from "../src/expr.mjs";
import * as P from "../folproof-parser.js";
import { strict as assert } from "node:assert";

describe("Expression Printer Tests", function () {
  it("Printing identifiers", function () {
    const src = "a";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a";
    assert.deepEqual(prt, expected);
  });

  it("Printing and connective", function () {
    const src = "a & b";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a & b";
    assert.deepEqual(prt, expected);
  });

  it("Printing or connective", function () {
    const src = "a v b";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a v b";
    assert.deepEqual(prt, expected);
  });

  it("Printing implication", function () {
    const src = "a -> b";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a -> b";
    assert.deepEqual(prt, expected);
  });

  it("Printing bi-implication", function () {
    const src = "a <-> b";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a <-> b";
    assert.deepEqual(prt, expected);
  });

  it("Printing equality", function () {
    const src = "a = b";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a = b";
    assert.deepEqual(prt, expected);
  });

  it("Printing negation", function () {
    const src = "~a";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "~a";
    assert.deepEqual(prt, expected);
  });

  it("Printing disjunction right-associative", function () {
    const src = "a v b v c";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a v b v c";
    assert.deepEqual(prt, expected);
  });

  it("Printing disjunction with parentheses to left", function () {
    const src = "(a v b) v c";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "(a v b) v c";
    assert.deepEqual(prt, expected);
  });

  it("Printing implication right-associative", function () {
    const src = "a -> b -> c";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a -> b -> c";
    assert.deepEqual(prt, expected);
  });

  it("Printing implication with parentheses to left", function () {
    const src = "(a -> b) -> c";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "(a -> b) -> c";
    assert.deepEqual(prt, expected);
  });

  it("Printing mixed conjunction-implication", function () {
    const src = "a & b -> c";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a & b -> c";
    assert.deepEqual(prt, expected);
  });

  it("Printing mixed disjunction-implication", function () {
    const src = "a v b -> c";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a v b -> c";
    assert.deepEqual(prt, expected);
  });

  it("Printing mixed disjunction-conjunction", function () {
    const src = "a v b & c";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a v b & c";
    assert.deepEqual(prt, expected);
  });

  it("Printing mixed disjunction-conjunction-implication", function () {
    const src = "a v b -> c & d";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "a v b -> c & d";
    assert.deepEqual(prt, expected);
  });

  it("Printing double negation", function () {
    const src = "~~a";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "~~a";
    assert.deepEqual(prt, expected);
  });

  it("Printing negation-equality", function () {
    const src = "~a = b";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "~a = b";
    assert.deepEqual(prt, expected);
  });

  it("Printing negation-equality without parentheses", function () {
    const src = "~(a = b)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "~a = b";
    assert.deepEqual(prt, expected);
  });

  it("Printing negation-conjunction", function () {
    const src = "~(a & b)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "~(a & b)";
    assert.deepEqual(prt, expected);
  });

  it("Printing conjunction with negation on left", function () {
    const src = "(~a) & b";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "~a & b";
    assert.deepEqual(prt, expected);
  });

  it("Printing application term", function () {
    const src = "P(x)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = "P(x)";
    assert.deepEqual(prt, expected);
  });

  it("Printing complex term", function () {
    const src = "P(f(x, c), g(d))";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = src;
    assert.deepEqual(prt, expected);
  });

  it("Printing forall", function () {
    const src = "Ax.P(x)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = src;
    assert.deepEqual(prt, expected);
  });

  it("Printing exists", function () {
    const src = "Ex.P(x)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = src;
    assert.deepEqual(prt, expected);
  });

  it("Printing forall-exists", function () {
    const src = "Ax.Ey.P(x, y)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = src;
    assert.deepEqual(prt, expected);
  });

  it("Printing forall-conjunction", function () {
    const src = "Ax.P(x) & Q(x)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = src;
    assert.deepEqual(prt, expected);
  });

  it("Printing forall-implication", function () {
    const src = "Ax.P(x) -> Q(x)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = src;
    assert.deepEqual(prt, expected);
  });

  it("Printing forall left of implication", function () {
    const src = "(Ax.P(x)) -> Q(x)";
    const e = P.parse(src)[0][1];
    const prt = E.pretty(e);
    const expected = src;
    assert.deepEqual(prt, expected);
  });

  it("Substitute bottom", function () {
    const src = "_|_";
    const t = P.parse("f(x)")[0][1];
    const e = P.parse(src)[0][1];
    const r = E.substitute(e, ["y", t]);
    const expected = e; // Since _|_ should remain unchanged
    assert.deepEqual(r, expected);
  });

  it("Formula folding", function () {
    const src = "Ax. P(x, y) & ~y = z v ⊥";
    const e = P.parse(src)[0][1];
    const cr = function () {
      return ["bot"];
    }
    const ec = function (l, r) {
      return ["=", l, r];
    }
    const ic = function (x, args) {
      if(args.length > 0){
        return ["id", x, args];
      } else {
        return ["id", x];
      }
    }
    const uc = function (t, r) {
      return [t, r];
    }
    const bc = function (t, l, r) {
      return [t, l, r];
    }
    const qc = function (t, x, r) {
      return [t, x, r];
    }
    const f = E.foldForm(cr, ec, ic, uc, bc, qc);
    const r = f(e);
    assert.deepEqual(r, e);
  });

  it("Formula folding with state", function () {
    const src = "Ax. P(x, y) & ~y = z v ⊥";
    const e = P.parse(src)[0][1];
    const s = [];
    const cr = function (acc) {
      return ["bot"];
    }
    const ec = function (l, r, acc) {
      return ["=", l(s), r(s)];
    }
    const ic = function (x, argCont, acc) {
      const args = argCont(s);
      if(args.length > 0){
        return ["id", x, args];
      } else {
        return ["id", x];
      }
    }
    const uc = function (t, r, acc) {
      return [t, r(s)];
    }
    const bc = function (t, l, r, acc) {
      return [t, l(s), r(s)];
    }
    const qc = function (t, x, r, acc) {
      return [t, x, r(s)];
    }
    const f = E.foldFormState(cr, ec, ic, uc, bc, qc);
    const r = f(e)(s);
    assert.deepEqual(r, e);
  });

});
