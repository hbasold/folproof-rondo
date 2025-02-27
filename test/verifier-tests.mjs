import { Verifier as v } from "../src/verifier.mjs";
import p from "../folproof-parser.js";
import { strict as assert } from "node:assert";

describe("Verifier Tests", function () {
  it("Sets first/last statements", function () {
    let proofAST = [
      ["rule", null, null, null],
      ["box", [["rule"], ["rule"], ["rule"]], null],
    ];
    let proof = v.preprocess(proofAST);

    assert.ok(
      proof.steps[0].isFirstStmt(),
      "First step of proof should be marked first.",
    );
    assert.ok(!proof.steps[0].isLastStmt(), "First step of proof is not last.");
    assert.ok(
      proof.steps[1].isFirstStmt(),
      "Second step of proof should, again, be marked first.",
    );
    assert.ok(
      !(proof.steps[2].isFirstStmt() || proof.steps[2].isLastStmt()),
      "Third step is neither first nor last.",
    );
    assert.ok(proof.steps[3].isLastStmt(), "Fourth step is last.");
    assert.ok(!proof.steps[3].isFirstStmt(), "Fourth step is not first.");

    proofAST = [
      ["rule", null, null, null],
      ["box", [["rule"]], null],
    ];
    proof = v.preprocess(proofAST);

    assert.ok(
      proof.steps[1].isFirstStmt() && proof.steps[1].isLastStmt(),
      "Second step is both the first and last step of the assumption.",
    );
  });

  it("Syntax errors result in invalid proofs", function () {
    const proofAST = [
      ["rule", ["id", "a"], ["premise"], null],
      ["box", [["rule", ["id", "b"], ["hypothesis"], null], ["error"]], null],
    ];
    const result = v.verifyFromAST(proofAST);
    assert.ok(
      !result.valid,
      "Proof should be invalid when syntax errors exist.",
    );
  });

  it("Proofs can be valid", function () {
    const proofAST = [
      ["rule", ["id", "a"], ["premise"], null],
      ["box", [["rule", ["id", "b"], ["hypothesis"], null]], null],
    ];
    const result = v.verifyFromAST(proofAST);
    assert.ok(
      result.valid,
      "A proof with only premises and assumptions should be valid.",
    );
  });

  it("References to ranges should be to a box", () => {
      const src =
        "p \n" +
        "p \n" +
        "p -> p : -> i 1-2 \n";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
  });

  it("Should invalidate references to a closed flag (simple)", () => {
    const src =
      "| p\n" +
      "p : copy 1\n";
    const ast = p.parse(src);
    const result = v.verifyFromAST(ast);
    assert.ok(!result.valid, result.message);
  });

  it("References into a closed flag should be invalid", () => {
      const src =
        "| p \n" +
        "| p : assum 1\n" +
        "p -> p : -> i 1-2 \n" +
        "p : assum 2 \n";
      const ast = p.parse(src);
      const result = v.verifyFromAST(ast);
      assert.ok(!result.valid, result.message);
  });

  it("Should check whether a variable is quantified when substituting", () => {
    const src =
      "V(a)\n" +
      "∃x.V(y) : E.y/a i 1\n";
    const ast = p.parse(src);
    const result = v.verifyFromAST(ast);
    assert.ok(!result.valid, result.message);
  });

});
