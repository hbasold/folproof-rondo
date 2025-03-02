import parser from "../folproof-parser.js";
import { strict as assert } from "node:assert";
import p from "../folproof-parser.js";
import { Verifier as v } from "../src/verifier.mjs";

describe("Parser Tests", function () {
  it("should parse implications as right-associative", function () {
    const src = "a -> b -> c"; // a -> (b -> c)
    let result = parser.parse(src)[0][1];
    assert.equal(result[1][0], "id");
    assert.equal(result[1][1], "a");
    assert.equal(result[2][0], "->");
    assert.equal(result[2][1][1], "b");
    assert.equal(result[2][2][1], "c");
  });

  it("should parse mixing implication and bi-implication as right-associative", function () {
    const src = "a <-> b -> c <-> d"; // a <-> (b -> (c <-> d))
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "<->");
    assert.equal(result[1][0], "id");
    assert.equal(result[1][1], "a");
    assert.equal(result[2][0], "->");
    assert.equal(result[2][1][1], "b");
    assert.equal(result[2][2][0], "<->");
    assert.equal(result[2][2][1][1], "c");
  });

  it("should parse 'and' as right to left", function () {
    const src = "a and b and c"; // a and (b and c)
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "and");
    assert.equal(result[1][1], "a");
    assert.equal(result[2][0], "and");
    assert.equal(result[2][1][1], "b");
    assert.equal(result[2][2][1], "c");
  });

  it("should parse 'or' as left to right", function () {
    const src = "a or b or c"; // a or (b or c)
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "or");
    assert.equal(result[1][1], "a");
    assert.equal(result[2][0], "or");
    assert.equal(result[2][1][1], "b");
    assert.equal(result[2][2][1], "c");
  });

  it("should give 'not' precedence over 'and'", function () {
    const src = "not a and b"; // (not a) and b
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "and");
    assert.equal(result[1][0], "not");
    assert.equal(result[1][1][1], "a");
    assert.equal(result[2][1], "b");
  });

  it("should give 'and' precedence over 'or'", function () {
    const src = "a or b and c"; // a or (b and c)
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "or");
    assert.equal(result[1][1], "a");
    assert.equal(result[2][0], "and");
    assert.equal(result[2][1][1], "b");
    assert.equal(result[2][2][1], "c");
  });

  it("should bind forall in parentheses stronger than implication", function () {
    const src = "(A x. x) -> y";
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "->");
    assert.equal(result[1][0], "forall");
    assert.equal(result[1][2][1], "x");
    assert.equal(result[2][1], "y");
  });

  it("should bind forall as far as possible", function () {
    const src = "A x. x -> y";
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "forall");
    assert.equal(result[1], "x");
    assert.equal(result[2][0], "->");
    assert.equal(result[2][1][1], "x");
    assert.equal(result[2][2][1], "y");
  });

  it("should bind forall and exists as far as possible", function () {
    const src = "A x. E y. x -> y";
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "forall");
    assert.equal(result[1], "x");
    result = result[2];
    assert.equal(result[0], "exists");
    assert.equal(result[1], "y");
    assert.equal(result[2][0], "->");
    assert.equal(result[2][1][1], "x");
    assert.equal(result[2][2][1], "y");
  });

  it("should handle forall on right of implication", function () {
    const src = "y -> A x. x";
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "->");
    assert.equal(result[1][1], "y");
    assert.equal(result[2][0], "forall");
    assert.equal(result[2][1], "x");
    assert.equal(result[2][2][1], "x");
  });

  it("should handle complex terms under forall", function () {
    const src = "1 A x. P(f(c), x) : premise";
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "forall");
    assert.equal(result[1], "x");
    const p = result[2];
    assert.equal(p[1], "P");
    const ts = p[2];
    assert.equal(ts[0][1], "f");
    assert.equal(ts[0][2][0][1], "c");
    assert.equal(ts[1][1], "x");
  });

  it("should parse atomic predicate", function () {
    const src = "P(f)";
    let result = parser.parse(src)[0][1];
    assert.equal(result[1], "P");
    assert.equal(result[2][0][1], "f");
  });

  it("should parse atomic absurdity", function () {
    const src = "_|_";
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "bot");
  });

  it("should parse atomic equality", function () {
    const src = "a = b";
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "=");
    assert.equal(result[1][1], "a");
    assert.equal(result[2][1], "b");
  });

  it("should parse predicate in formula", function () {
    const src = "A x. P(x) -> Q() & R(x, y)";
    let result = parser.parse(src)[0][1];
    assert.equal(result[0], "forall");
    assert.equal(result[1], "x");
    result = result[2];
    assert.equal(result[0], "->");
    assert.equal(result[1][1], "P");
    assert.equal(result[1][2][0][1], "x");
    result = result[2];
    assert.equal(result[0], "and");
    assert.equal(result[1][1], "Q");
    assert.equal(result[1][2].length, 0);
    assert.equal(result[2][1], "R");
    assert.equal(result[2][2][0][1], "x");
    assert.equal(result[2][2][1][1], "y");
  });

  it("Should parse quantifiers on the right of a connective", () => {
    const src = "p v Ex. x";
    const ast = p.parse(src);
    const result = v.verifyFromAST(ast);
    assert.ok(result.valid, result.message);
  });
});
