import { debugMessage } from "./util.mjs";
import { rules } from "./rules.mjs";

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
  static verifyFromAST(ast) {
    return Verifier.verify(Verifier.preprocess(ast));
  }

  static verify(proof) {
    let result = {
      message: "Proof is valid.",
      valid: true,
      premiseAllowed: true,
      remainingSorries: 0,
    };

    for (let step = 0; step < proof.steps.length; ++step) {
      Verifier.validateStatement(result, proof, step);
      if (!result.valid) {
        break;
      }
    }
    return result;
  }

  static validateStatement(result, proof, step) {
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

  static lookupValidator(why) {
    let name = why[0].toLowerCase();
    if (name.split(".").length === 2) {
      name = name.split(".")[0] + ".";
    }
    const rule = rules[name];
    if (!rule) {
      return "Cannot find rule: " + name;
    }
    if (rule.getType() === "simple" || rule.getType() === "derived") {
      const fn = rule.getSimpleVerifier();
      if (!fn) throw new Error("Not implemented for " + name);
      return fn.exec;
    }

    if (why[1]) {
      const elimOrIntro = why[1].toLowerCase();
      if ("introduction".indexOf(elimOrIntro) === 0) {
        const fn = rule.getIntroVerifier();
        if (!fn) throw new Error("Not implemented for " + name);
        return fn.exec;
      } else if ("elimination".indexOf(elimOrIntro) === 0) {
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
        proof.steps[step] = new Statement(
          ast[i][1],
          ast[i][2],
          scope,
          ast[i][3],
          i === 0,
          i === ast.length - 1,
        );
        step = step + 1;
      } else if (ast[i][0] === "folbox") {
        let newScope = scope.slice(0);
        newScope.push(ast[i][2][1]);
        debugMessage(
          "folbox",
          "step",
          step,
          "scope",
          scope,
          "newScope",
          newScope,
        );
        step = Verifier.preprocessBox(proof, ast[i][1], step, newScope);
      } else if (ast[i][0] === "box") {
        let newScope = scope.slice(0);
        debugMessage("box", "step", step, "scope", scope, "newScope", newScope);
        step = Verifier.preprocessBox(proof, ast[i][1], step, newScope);
      } else if (ast[i][0] === "error") {
        proof.steps[step] = ast[i];
      }
    }
    return step;
  }
}

export { Verifier };
