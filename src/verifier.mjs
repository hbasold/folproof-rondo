import { debugMessage } from "./util.mjs";
import { rules } from "./rules.mjs";
import { foldForm } from "./expr.mjs";

class Statement {
  constructor(sentenceAST, justificationAST, scope, loc, isFirst, isLast) {
    this.isFirst = isFirst;
    this.isLast = isLast;
    this.sentenceAST = sentenceAST;
    this.scope = scope;
    this.justificationAST = justificationAST;
    this.loc = loc;
  }

  isFirstStmt() {
    return this.isFirst;
  }

  isLastStmt() {
    return this.isLast;
  }

  getSentence() {
    return this.sentenceAST;
  }

  getScope() {
    return this.scope;
  }

  getJustification() {
    return this.justificationAST;
  }

  getMeta() {
    return this.loc;
  }
}

class Verifier {
  static verifyFromAST(
    ast,
    restrictPropositional = null,
    restrictSignature = null,
  ) {
    return Verifier.verify(
      Verifier.preprocess(ast),
      restrictPropositional,
      restrictSignature,
    );
  }

  static verify(proof, restrictPropositional = null, restrictSignature = null) {
    let result = {
      message: "Proof is valid.",
      valid: true,
      premiseAllowed: true,
      remainingSorries: 0,
    };

    let parsedSignature = null;
    if (restrictSignature) {
      parsedSignature = restrictSignature.split(/\s+/).reduce((acc, entry) => {
        const parts = entry.split("/");
        if (parts.length !== 2) {
          result.valid = false;
          result.message = `Invalid signature format, was '${entry}', expected
          ID/arity.`;
          result.errorStep = "Preprocessing";
          return result;
        }

        const [id, arity] = parts;
        const parsedArity = parseInt(arity);
        if (isNaN(parsedArity)) {
          result.valid = false;
          result.message = `Invalid signature arity, was '${arity}', expected a
          number.`;
          result.errorStep = "Preprocessing";
          return result;
        }

        if (!acc[id]) {
          acc[id] = parsedArity;
        } else {
          result.valid = false;
          result.message = `Duplicated arity declaration in signature arity for '${id}'.`;
          result.errorStep = "Preprocessing";
          return result;
        }
        return acc;
      }, {});

      debugMessage("Parsed signature", parsedSignature);
      if (!result.valid) {
        return result;
      }
    }

    for (let step = 0; step < proof.steps.length; ++step) {
      Verifier.validateStatement(
        result,
        proof,
        step,
        restrictPropositional,
        parsedSignature,
      );
      if (!result.valid) {
        break;
      }
    }
    return result;
  }

  static validateStatement(
    result,
    proof,
    step,
    restrictPropositional,
    restrictSignature,
  ) {
    let statement = proof.steps[step];
    if (
      statement[0] === "error" ||
      JSON.stringify(statement.sentenceAST).includes("error")
    ) {
      result.valid = false;
      result.message = "Proof invalid due to syntax errors.";
      result.errorStep = step + 1;
      return;
    }

    debugMessage("statement", statement);
    if (restrictPropositional || restrictSignature) {
      Verifier.checkRestrictions(
        result,
        statement.getSentence(),
        restrictPropositional,
        restrictSignature,
      );
      if (!result.valid) {
        result.errorStep = step + 1;
        return;
      }
    }

    let why = statement.getJustification();
    debugMessage("why", why);
    if (why[0] === "premise") {
      if (!result.premiseAllowed) {
        result.valid = false;
        result.message =
          "Introducing premises is only allowed at the start of a proof.";
        result.errorStep = step + 1;
        return;
      }
    } else {
      result.premiseAllowed = false;
    }
    if (why[0] === "sorry") {
      result.remainingSorries += 1;
    }
    const validator = Verifier.lookupValidator(why);
    if (typeof validator === "function") {
      const part = why[2];
      const lines = why[3];
      const subst = why[4];
      const isValid = validator(proof, step, part, lines, subst);
      if (isValid === true) {
        result.valid = true;
      } else {
        result.valid = false;
        result.message = isValid;
        result.errorStep = step + 1;
        result.errorSrcLoc = statement.getMeta();
      }
      return;
    } else if (typeof validator === "string") {
      result.valid = false;
      result.message = validator;
      result.errorStep = step + 1;
      result.errorSrcLoc = statement.getMeta();
    }
    result.valid = false;
  }

  static checkRestrictions(
    result,
    statement,
    restrictPropositional,
    restrictSignature,
  ) {
    const checkBot = function () {
      return true;
    };

    const checkEq = function (l, r) {
      if (restrictPropositional) {
        result.message =
          "Propositional restriction: equality is not allowed in propositional logic.";
        return false;
      } else {
        return l && r;
      }
    };

    const checkId = function (x, args) {
      if (args.length > 0) {
        if (restrictPropositional) {
          result.message = `Propositional restriction: only propositional variables allowed, but ${x} uses ${args.length} arguments.`;
          return false;
        } else if (restrictSignature) {
          const arity = restrictSignature[x];
          if (arity === undefined) {
            result.message = `Signature restriction: '${x}' not in signature.`;
            return false;
          }

          if (arity !== args.length) {
            result.valid = false;
            result.message = `Signature restriction: '${x}' got ${args.length} argument(s), but expected: ${arity}.`;
            return false;
          }
          return true;
        } else {
          return true;
        }
      } else {
        return true;
      }
    };

    const checkUnary = function (t, r) {
      return r;
    };

    const checkBinary = function (t, l, r) {
      return l && r;
    };

    const checkQuantifier = function (t, x, r) {
      if (restrictPropositional) {
        result.message =
          "Propositional restriction: quantifiers are forbidden in propositional logic.";
        return false;
      } else {
        return r;
      }
    };

    const check = foldForm(
      checkBot,
      checkEq,
      checkId,
      checkUnary,
      checkBinary,
      checkQuantifier,
    );

    result.valid = check(statement);
    console.log("checkRestrictions: ", result.valid, result.message);
  }

  static lookupValidator(why) {
    let name = why[0].toLowerCase();
    if (name.split(".").length === 2) {
      name = name.split(".")[0] + ".";
    }
    const rule = rules[name];
    if (!rule) {
      return "Cannot find rule: " + name;
    }
    why[0] = rule.getName();
    if (rule.getType() === "simple" || rule.getType() === "derived") {
      const fn = rule.getSimpleVerifier();
      if (!fn) throw new Error("Not implemented for " + name);
      return fn.exec;
    }

    if (why[1]) {
      const elimOrIntro = why[1].toLowerCase();
      if ("introduction".startsWith(elimOrIntro)) {
        const fn = rule.getIntroVerifier();
        if (!fn) throw new Error("Not implemented for " + name);
        return fn.exec;
      } else if ("elimination".startsWith(elimOrIntro)) {
        const fn = rule.getElimVerifier();
        if (!fn) throw new Error("Not implemented for " + name);
        return fn.exec;
      }
      return "Cannot determine elim/intro rule type from " + elimOrIntro;
    }

    return (
      "Unrecognized rule: " +
      why[0] +
      " " +
      (why[1] ? why[1] : "") +
      (why[2] ? why[2] : "") +
      " " +
      (why[3] ? why[3] : "")
    );
  }

  static preprocess(ast) {
    let proof = { steps: [] };
    Verifier.preprocessBox(proof, ast, 0, []);
    debugMessage("processed proof", proof);
    return proof;
  }

  static preprocessBox(proof, ast, step, scope) {
    debugMessage("ast", ast);
    for (let i = 0; i < ast.length; i++) {
      if (ast[i][0] === "rule") {
        debugMessage(
          "Pre-processing rule: ",
          "step",
          step,
          "scope",
          JSON.stringify(scope),
        );
        proof.steps[step] = new Statement(
          ast[i][1], // sentence
          ast[i][2], // justification
          scope,
          ast[i][3], // loc (parser info)
          i === 0,
          i === ast.length - 1,
        );
        step = step + 1;
      } else if (ast[i][0] === "folbox") {
        let newScope = scope.slice(0);
        newScope.push(ast[i][1][0][1][1]); // adds N from '| with N' to scope
        debugMessage(
          "Pre-processing folbox",
          "step",
          step,
          "scope",
          JSON.stringify(scope),
          "newScope",
          JSON.stringify(newScope),
        );
        // ast[i][1] is the box's content
        step = Verifier.preprocessBox(proof, ast[i][1], step, newScope);
      } else if (ast[i][0] === "box") {
        let newScope = scope.slice(0);
        debugMessage("box", "step", step, "scope", scope, "newScope", newScope);
        // ast[i][1] is the box's content
        step = Verifier.preprocessBox(proof, ast[i][1], step, newScope);
      } else if (ast[i][0] === "error") {
        // Directly add error to proof
        proof.steps[step] = ast[i];
      }
    }
    return step;
  }
}

export { Verifier };
