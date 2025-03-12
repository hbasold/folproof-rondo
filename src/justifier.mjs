import { debugMessage } from "./util.mjs";
import p from "../folproof-parser.js";

/**
 * The Justifier class is used to define the format and function for a
 * particular justification.
 *
 * The implementation below parses and checks the parameters according to the
 * provided format. The function is then called with the parsed parameters.
 *
 * This function is defined as part of a rule in rules.mjs.
 */
class Justifier {
  /**
   * Create a new justifier with the given format and function.
   *
   * format = {
   *  hasPart : (true/false),
   *  stepRefs : ("num" | "range")*,
   *  subst : (true/false) };
   *
   * @param format {Object} how should the parameters be formatted
   * @param fn {Function} represents the justification of a specific rule
   */
  constructor(format, fn) {
    this.format = format;
    this.fn = fn;
  }

  /**
   * Check the parameters according to the format and then
   * call the function with the parsed parameters.
   *
   * @param proof the proof object
   * @param step the current step number (~ line number)
   * @param part the part number (1 or 2), e.g. on "and e2"
   * @param steps the step references
   * @param subst the substitution
   * @returns {*|string} string on error, otherwise the result of the function
   */
  exec = (proof, step, part, steps, subst) => {
    debugMessage("Justifier", step, part, steps, subst);
    let checked = this.checkParams(proof, step, part, steps, subst);
    if (typeof checked === "string") return checked;
    debugMessage("Calling justifier on checked", checked);
    return this.fn(proof, step, checked[0], checked[1], checked[2]);
  };

  /**
   * Check the step references.
   *
   * @param proof the proof object
   * @param curStep the current step number
   * @param steps the step references
   * @param refNums parsed step references
   * @returns {string} string on error, otherwise null
   */
  checkParamsStepRefs(proof, curStep, steps, refNums) {
    if (steps == null) {
      return "Step reference required.";
    }

    let refStepFormat;
    if (
      this.format.stepRefs.length > 0 &&
      this.format.stepRefs[this.format.stepRefs.length - 1] === "nums"
    ) {
      refStepFormat = this.format.stepRefs.slice(0, -1);
      const extraSteps = steps.length - refStepFormat.length;
      if (extraSteps > 0) {
        refStepFormat = refStepFormat.concat(Array(extraSteps).fill("num"));
      }
    } else {
      refStepFormat = this.format.stepRefs;
    }

    if (steps.length !== refStepFormat.length) {
      let f = refStepFormat.map((e) => {
        return e === "num" ? "n" : "n-m";
      });
      return `Step reference mismatch; required format: ${f.join(", ")}.`;
    }

    for (let i = 0; i < steps.length; i++) {
      if (refStepFormat[i] === "num") {
        let n = parseInt(steps[i]) - 1;
        if (!(n >= 0 && n < curStep)) {
          return `Step reference #${i + 1} (${n + 1}) must be in 
            [1-${curStep}].`;
        }
        refNums.push(n);
      } else {
        const errorMsg = `Range reference #${i + 1} (${steps[i]}) must 
          be a range a-b with 1 <= a <= b <= ${curStep}.`;

        let ab = steps[i].split("-");
        if (ab.length !== 2) {
          return errorMsg;
        }

        ab = [parseInt(ab[0]), parseInt(ab[1])];
        if (
          isNaN(ab[0]) ||
          isNaN(ab[1]) ||
          ab[0] < 1 ||
          ab[1] < 1 ||
          ab[0] > ab[1] ||
          ab[1] > curStep
        ) {
          return errorMsg;
        }

        if (
          !(
            proof.steps[ab[0] - 1].isFirstStmt() &&
            proof.steps[ab[1] - 1].isLastStmt()
          )
        ) {
          return `Range reference #${i + 1} (${steps[i]}) must be to the 
          opening and closing of a flag.`;
        }

        refNums.push([ab[0] - 1, ab[1] - 1]);
      }
    }
  }

  /**
   * Check the parameters according to the format.
   *
   * @param proof the proof object
   * @param curStep the current step number
   * @param part the part number
   * @param steps the step references
   * @param subst the substitution
   * @returns {[number | null, array, array | null]|string} string on error
   */
  checkParams(proof, curStep, part, steps, subst) {
    if (
      (this.format === null && part != null) ||
      (this.format != null && !this.format.hasPart && part != null)
    ) {
      return "Step part (e.g., 2 in 'and e2') is not applicable here.";
    }

    if (
      (this.format === null && steps != null) ||
      (this.format != null && !this.format.stepRefs && steps != null)
    ) {
      return "Step references are not applicable here.";
    }

    if (
      (this.format === null && subst != null) ||
      (this.format != null && !this.format.subst && subst != null)
    ) {
      return "Substitution is not applicable here.";
    }

    if (this.format == null) {
      return [];
    }

    let partNum = null;
    if (this.format.hasPart) {
      partNum = parseInt(part);
      if (isNaN(partNum)) {
        return "Part number (1 for left, 2 for right) is missing or not a number.";
      } else if (!(partNum === 1 || partNum === 2)) {
        return "Part number must be 1 (for left) or 2 (for right).";
      }
    }

    let refNums = [];
    if (this.format.stepRefs) {
      const error = this.checkParamsStepRefs(proof, curStep, steps, refNums);
      if (typeof error === "string") {
        return error;
      }
    }

    let parsedSubst = null;
    if (this.format.subst) {
      if (!subst) {
        return "Substitution specification required (e.g., A.x/x0 intro n-m).";
      }

      parsedSubst = subst.map(this.parseSubst);
      const error = parsedSubst.find((x) => typeof x == "string");
      if (error) {
        return error;
      }

      debugMessage("subst", subst, "parsedSubst", parsedSubst);
    }

    return [partNum, refNums, parsedSubst];
  }

  parseSubst(subst) {
    if (subst.length !== 2) {
      return "Substitution must consist of a variable and a term (e.g., x/f(c)).";
    }

    const idRegex = /^[A-Za-z_]\w*$/;
    if (!idRegex.test(subst[0])) {
      return `Substitution must substitute for a variable, but got ${subst[0]}.`;
    }

    const substAst = p.parser.parse(subst[1]);
    if (typeof substAst === "string") {
      return substAst;
    } else {
      // AST will be of form [["rule", term, ...]], as top-level parser is "proof"
      const term = substAst[0][1];
      // The term cannot be a formula, hence it must have an identifier at the root
      if (term[0] === "id") {
        return [subst[0], term];
      } else {
        return `Substitution does not have a valid term, should be of the form 
      x/f(c), but got ${subst[1]}.`;
      }
    }
  }
}

export { Justifier };
