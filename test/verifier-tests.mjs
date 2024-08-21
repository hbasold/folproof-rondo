import { Verifier as v } from "../src/verifier.mjs";
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
      ["box", [["rule", ["id", "b"], ["assumption"], null], ["error"]], null],
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
      ["box", [["rule", ["id", "b"], ["assumption"], null]], null],
    ];
    const result = v.verifyFromAST(proofAST);
    assert.ok(
      result.valid,
      "A proof with only premises and assumptions should be valid.",
    );
  });
});
