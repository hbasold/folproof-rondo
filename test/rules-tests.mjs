import { Verifier as v } from "../src/verifier.mjs";
import p from "../folproof-parser.js";
import { strict as assert } from "node:assert";

describe("Rules Tests", () => {
  describe("Substitution (= elim) Tests", () => {
    it("should substitute unbound vars", () => {
      const src =
        "a -> A a.(a -> c) -> b\n" +
        "a = x\n" +
        "x -> A a.(a -> c) -> b : = e 2,1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail to substitute bound vars", () => {
      const src =
        "a -> A a.(a -> c) -> b\n" +
        "a = x\n" +
        "x -> A a.(x -> c) -> b : = e 2,1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should substitute any number of unbound vars", () => {
      const src =
        "a -> (A a.a -> c) -> b or a and a \n" +
        "a = x\n" +
        "x -> (A a.a -> c) -> b or a and x : = e 2,1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });
  });

  describe("_|_ Elimination Tests", () => {
    it("should fail when reference line is not contradiction", () => {
      const src = "c\na -> b : contra e 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should succeed when reference line is contradiction", () => {
      const src = "_|_\na -> b : bot e 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });
  });

  describe("Double Negation Elimination Tests", () => {
    it("should fail when reference line is not a double-negation", () => {
      const src = "~c\nc : notnot e 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should succeed when reference line is a double-negation", () => {
      const src = "~~c\nc : notnot e 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });
  });

  describe("Law of Excluded Middle (LEM) Tests", () => {
    it("should succeed", () => {
      const src = "(a -> b) or not (a -> b) : LEM";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when not in form: phi or not phi", () => {
      const src = "(a -> b) or (a -> b) : LEM";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Modus Tollens (MT) Tests", () => {
    it("should succeed", () => {
      const src = "a -> b\n~b\n~a : MT 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when ref 1 is not an implication", () => {
      const src = "a and b\n~b\n~a : MT 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when ref 2 is not negation of right side of ref 1", () => {
      const src = "a -> b\nb\n~a : MT 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when current line is not negation of left side of ref 1", () => {
      const src = "a -> b\n~b\na : MT 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("And Introduction Tests", () => {
    it("should fail when reference is not a tautology", () => {
      const src = "a\n~b\na and b : and i 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should succeed when references are tautologies", () => {
      const src = "a\nb\na and b : and i 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });
  });

  describe("And Elimination Tests", () => {
    it("should fail when reference side doesn't match current step", () => {
      const src = "a and b\nb : and e1 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should succeed when reference side matches current step", () => {
      const src = "a and b\na : and e1 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });
  });

  describe("Or Elimination Tests", () => {
    it("should succeed when assumptions produce same result", () => {
      const src =
        "a or b\n~a\n~b\n| a : hypothesis\n| _|_ : neg e 2,4\n---\n" +
        "| b : hypothesis\n| _|_ : neg e 3,6\n_|_ : or e 1,4-5,6-7";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when assumptions don't begin with or side", () => {
      const src =
        "a or b\n~a\n~b\n| c : hypothesis\n---\n" +
        "| c : hypothesis\nc : or e 1,4-4,5-5";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when assumptions don't produce same result", () => {
      const src =
        "a or b\n~a\n~b\n| a : hypothesis\n| _|_ : neg e 2,4\n---\n" +
        "| b : hypothesis\n| _|_ : neg e 3,6\n| c : contra e 6\n_|_ : or e 1,4-5,6-8";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Or Introduction Tests", () => {
    it("should succeed when side matches reference", () => {
      const src = "a\na or b : or i1 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when side does not match reference", () => {
      const src = "~a\na or b : or i1 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Negation Introduction Tests", () => {
    it("should succeed when reference is contradiction", () => {
      const src = "a\n| ~a : hypothesis\n| _|_ : neg e 1,2\n~~a : neg i 2-3";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when reference is not contradiction", () => {
      const src = "a\n| ~a : hypothesis\n~~a : neg i 2-2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Negation Elimination Tests", () => {
    it("should succeed when reference is negation of current step", () => {
      const src = "a\n~a\n_|_ : neg e 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should succeed when reference is negation of current step", () => {
      const src = "a\n~a\nb : neg e 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when reference is not a negation of current step", () => {
      const src = "a\n~b\n_|_ : neg e 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Implication Introduction Tests", () => {
    it("should succeed when left and right side match first and last step of assumption", () => {
      const src =
        "|a : hypothesis\n|a or b : or i1 1\na -> (a or b) : -> i 1-2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when left or right side don't match beginning or end of assumption", () => {
      const src =
        "|a : hypothesis\n|a or b : or i1 1\nb -> (a or b) : -> i 1-2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when left or right side don't match beginning or end of assumption", () => {
      const src =
        "|a : hypothesis\n|a or c : or i1 1\na -> (a or b) : -> i 1-2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Implication Elimination Tests", () => {
    it("should succeed when left side matches 2nd ref step, and right side matches current step", () => {
      const src = "a -> b\na\nb : -> e 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when left side doesn't match 2nd ref step", () => {
      const src = "a -> b\nc\nb : -> e 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when right side doesn't match current step", () => {
      const src = "a -> b\na\nc : -> e 1,2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Forall Elimination Tests", () => {
    it("should succeed when referenced step matches after substition", () => {
      const src = "A x. P(x)\nP(a) : A.x/a elim 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when referenced step doesn't match", () => {
      const src = "A x. P(x)\nQ(a) : A.x/a elim 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail with more than one substituted variables", () => {
      const src = "A x. P(x)\nP(a) : A.x/a,y/b elim 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should work with complex term in substition", () => {
      const src = "A x. P(x)\nP(f(a)) : A.x/f(a) elim 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });
  });

  describe("Forall Introduction Tests", () => {
    it("should succeed when ref is assumption and final step matches current step, under subst", () => {
      const src = "| with x0\n| P(x0) : hypothesis\nA x. P(x) : A.x/x0 i 1-2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when reference range is not an assumption", () => {
      const src = "P(x) : premise\nA x. P(x) : A.x/x i 1-1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when reference range is not a scoping assumption", () => {
      const src = "| P(x) : hypothesis\nA x. P(x) : A.x/x i 1-1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when reference range ending step doesn't match current step under subst", () => {
      const src = "| with x0\n| P(x0) : hypothesis\nA x. Q(x) : A.x/x0 i 1-1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail with more than one substituted variable", () => {
      const src =
        "| with x0\n| P(x0) : hypothesis\nA x. P(x) : A.x/x0,y/y0 i 1-1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should succeed when nested inside implication introduction", () => {
      const src =
        "∀x.P(c, x)      : premise \n" +
        "| r \n" +
        "|| with x0 \n" +
        "|| P(c,x0)      : A.x/x0 e 1 \n" +
        "| ∀x.P(c,x)     : A.x/x0 i 3-4 \n" +
        "r -> ∀x.P(c,x)  : -> i 2-5";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should succeed when nested", () => {
      const src =
        "∀x.Ay.P(x, y)     : premise \n" +
        "| with x0 \n" +
        "|| with y0 \n" +
        "|| Ay.P(x0, y)    : A.x/x0 e 1 \n" +
        "|| P(x0,y0)       : A.y/y0 e 4 \n" +
        "| ∀y.P(x0,y)      : A.y/y0 i 3-5 \n" +
        "∀x.Ay.P(x, y)     : A.x/x0 i 2-6";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should succeed with nested flags: forall introduction followed by implication introduction", () => {
      const src =
        "| with x0\n" +
        "||P(x0)\n" +
        "||P(x0)        : copy 2\n" +
        "|P(x0) → P(x0) : -> i 2-3\n" +
        "∀y.P(y) → P(y) : A.y/x0 i 1-4";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });
  });

  describe("Exists Introduction Tests", () => {
    it("should succeed when referenced step matches after substitution", () => {
      const src = "P(a)\nE x. P(x) : E.x/a intro 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when referenced step doesn't match after substitution", () => {
      const src = "P(a)\nE x. Q(x) : E.x/a intro 1";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Exists Elimination Tests", () => {
    it("should succeed when referenced step range is assumption & concl. matches current step", () => {
      const src =
        "E a. P(a)\n" +
        "| with x0\n" +
        "| P(x0)\n" +
        "| P(x0) or Q(x0)     : or i1 3\n" +
        "| E a.(P(a) or Q(a)) : E.a/x0 i 4\n" +
        "E a.(P(a) or Q(a))   : E.a/x0 elim 1,2-5";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when referenced step range is not assumption", () => {
      const src =
        "E a. P(a)\nE a. P(a) or Q(a)\n : or i1 2\nE a. P(a) or Q(a) : E.x/a elim 1,2-2";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when referenced step range is not scoping assumption", () => {
      const src =
        "E a. P(a)\n| P(x0) : hypothesis\n| P(x0) or Q(x0)\n : or i1 2\n| E a.(P(a) or Q(a)) : E.a/x0 i 3\nE a.(P(a) or Q(a)) : E.a/x0 elim 1,2-4";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when assumption conclusion doesn't match current step", () => {
      const src =
        "E a. P(a)\n| with x0\n| P(x0) : hypothesis\n| P(x0) or Q(x0) : or i1 2\nE a.(P(a) or Q(a)) : E.a/x0 elim 1,2-3";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should fail when assumption start doesn't match first exists ref step", () => {
      const src =
        "E a. Q(a)\n" +
        "| with x0\n" +
        "| P(x0) : hypothesis\n" +
        "| P(x0) or Q(x0) : or i1 2\n" +
        "E a.(P(a) or Q(a)) : E.a/x0 elim 1,2-3";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Copy Tests", () => {
    it("should succeed when reference line is exact match", () => {
      const src = "a\n|~b : hypothesis\n|a : copy 1\n~b -> a : -> i 2-3";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail when reference line is not exact match", () => {
      const src = "a\n|~a : hypothesis\n|b : copy 1\n~a -> a : -> i 2-3";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });
  });

  describe("Backchaining Tests", () => {
    it("should succeed with parallel substitution", () => {
      const src =
        "An.Am. L(n,m) -> L(n, s(m))\n" +
        "L(z,z)\n" +
        "L(z,s(z))                     : B.n/z;m/z 1,2\n";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should succeed with larger head", () => {
      const src =
        "An. L(n,n)\n" +
        "An.Am. L(n,m) & L(n,m) -> L(n, s(m))\n" +
        "L(z,z)                        : B.n/z elim 1\n" +
        "L(z,s(z))                     : B.n/z;m/z 2,3,3\n" +
        "Em. L(z, m)                   : E.m/s(z) intro 4";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });

    it("should fail with insufficient substitution", () => {
      const src =
        "An. L(n,n)\n" +
        "An.Am. L(n,m) & L(n,m) -> L(n, s(m))\n" +
        "L(z,z)                        : B.n/z elim 1\n" +
        "L(z,s(z))                     : B.n/z 2,3,3\n" +
        "Em. L(z, m)                   : E.m/s(z) intro 4";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
    });

    it("should succeed with equality", () => {
      const src =
        "Ax. Ay. Az. x = y & y = z -> x = z \n" +
        "a = b\n" +
        "b = c\n" +
        "a = c : B.x/a;y/b;z/c 1,2,3";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(result.valid, result.message);
    });
  });
});
