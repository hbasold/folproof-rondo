import { Justifier } from "../src/justifier.mjs";
import { strict as assert } from "node:assert";

function dummyFn() {}

describe("Justifier Tests", function () {
  it("should reject unexpected params", function () {
    let j = new Justifier(
      { hasPart: false, stepRefs: null, subst: false },
      dummyFn,
    );
    let msg = j.checkParams(1, null, null, null);
    assert.deepEqual(
      msg,
      [null, [], null],
      "Should return empty params when params were expected empty.",
    );

    msg = j.checkParams(1, "1", null, null);
    assert.equal(
      typeof msg,
      "string",
      "Should return error when part given but unexpected.",
    );

    msg = j.checkParams(1, null, ["1"], null);
    assert.equal(
      typeof msg,
      "string",
      "Should return error when steps given but unexpected.",
    );

    msg = j.checkParams(1, null, null, "a/x");
    assert.equal(
      typeof msg,
      "string",
      "Should return error when substitution given but unexpected.",
    );

    j = new Justifier({}, dummyFn);
    msg = j.checkParams(1, null, null, null);
    assert.deepEqual(
      msg,
      [null, [], null],
      "Omitted options should be treated like null expectations.",
    );
  });

  it("should reject non-numbers", function () {
    const j = new Justifier(
      { hasPart: false, stepRefs: ["num"], subst: false },
      dummyFn,
    );
    const msg = j.checkParams(1, null, ["a"], null);
    assert.equal(typeof msg, "string", msg);
  });

  it("should accept numbers and number ranges", function () {
    const j = new Justifier(
      {
        hasPart: false,
        stepRefs: ["num", "range", "range", "num"],
        subst: false,
      },
      dummyFn,
    );
    const msg = j.checkParams(5, null, ["1", "2-3", "2-3", "4"], null);
    assert.deepEqual(msg, [null, [0, [1, 2], [1, 2], 3], null]);
    assert.equal(typeof msg, "object", msg);
  });

  it("should reject out-of-range numbers", function () {
    const j = new Justifier(
      { hasPart: false, stepRefs: ["num", "range"], subst: false },
      dummyFn,
    );
    let msg = j.checkParams(1, null, ["1", "1-1"], null);
    assert.deepEqual(msg, [null, [0, [0, 0]], null]);

    msg = j.checkParams(1, null, ["2", "1-1"], null);
    assert.equal(
      typeof msg,
      "string",
      "Should reject single step ref >= current step.",
    );

    msg = j.checkParams(1, null, ["1", "2-2"], null);
    assert.equal(typeof msg, "string", "Should reject ranges >= current step.");

    msg = j.checkParams(1, null, ["1", "3-2"], null);
    assert.equal(typeof msg, "string", "Should reject ranges, a-b, when a>b.");
  });

  it("should reject parts != 1 or 2", function () {
    const j = new Justifier(
      { hasPart: true, stepRefs: null, subst: false },
      dummyFn,
    );
    let msg = j.checkParams(1, "1", null, null);
    assert.deepEqual(msg, [1, [], null]);

    msg = j.checkParams(1, "2", null, null);
    assert.deepEqual(msg, [2, [], null]);

    msg = j.checkParams(1, "3", null, null);
    assert.equal(typeof msg, "string", "Should reject part != 1 or 2");

    msg = j.checkParams(1, "0", null, null);
    assert.equal(typeof msg, "string", "Should reject part != 1 or 2");

    msg = j.checkParams(1, "a", null, null);
    assert.equal(typeof msg, "string", "Should reject part != 1 or 2");
  });

  it("should accept proper substitution format when expected", function () {
    const j = new Justifier(
      { hasPart: false, stepRefs: null, subst: true },
      dummyFn,
    );
    let msg = j.checkParams(1, null, null, null);
    assert.equal(
      typeof msg,
      "string",
      "Should return error when substitution expected but not provided.",
    );

    msg = j.checkParams(1, null, null, ["2gamma", "0x"]);
    assert.equal(
      typeof msg,
      "string",
      "Should return error when substitution ids not valid ids.",
    );

    msg = j.checkParams(1, null, null, [["gamma2", "x0"]]);
    assert.deepEqual(msg, [null, [], [["gamma2", ["id", "x0"]]]]);
  });
});
