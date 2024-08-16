import { debugMessage } from "./util.mjs";
import { Rule } from "./rule.mjs";
import { Justifier } from "./justifier.mjs";
import * as Expr from "./expr.mjs";

const rules = {
  premise: new Rule({
    name: "Premise",
    type: "simple",
    verifier: new Justifier(null, function (proof, step) {
      return true;
    }),
  }),
  sorry: new Rule({
    name: "Sorry",
    type: "simple",
    verifier: new Justifier(null, function (proof, step) {
      return true;
    }),
  }),
  assumption: new Rule({
    name: "Assumption",
    type: "simple",
    verifier: new Justifier(null, function (proof, step) {
      if (proof.steps[step].isFirstStmt()) return true;
      return "Assumptions can only be made at the start of an assumption box.";
    }),
  }),
  lem: new Rule({
    name: "LEM",
    type: "derived",
    verifier: new Justifier(null, function (proof, step) {
      var s = proof.steps[step].getSentence();
      if (s[0] !== "or") return "LEM: must be phi or not phi.";
      var left = s[1],
        right = s[2];
      if (right[0] !== "not" || !Expr.equal(left, right[1]))
        return "LEM: right side must be negation of left.";

      return true;
    }),
  }),
  copy: new Rule({
    name: "COPY",
    type: "derived",
    verifier: new Justifier({ stepRefs: ["num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var curStep = proof.steps[step].getSentence();
      var refStep = proof.steps[steps[0]].getSentence();
      if (!Expr.equal(curStep, refStep))
        return "Copy: Current step is not semantically equal to the referenced step.";
      return true;
    }),
  }),
  mt: new Rule({
    name: "MT",
    type: "derived",
    verifier: new Justifier({ stepRefs: ["num", "num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var impStep = proof.steps[steps[0]].getSentence();
      if (impStep[0] !== "->")
        return "MT: 1st referenced step must be implication.";
      var left = impStep[1],
        right = impStep[2];
      var negStep = proof.steps[steps[1]].getSentence();
      if (negStep[0] !== "not" || !Expr.equal(negStep[1], right))
        return "MT: 2nd ref step must be negation of right side of 1st ref step.";

      var s = proof.steps[step].getSentence();
      if (s[0] !== "not" || !Expr.equal(left, s[1]))
        return "MT: current step must be negation of left side of ref step.";

      return true;
    }),
  }),
  contra: new Rule({
    name: "Contra",
    type: "derived",
    verifier: new Justifier(
      { hasPart: false, stepRefs: ["range"], subst: false },
      function (proof, step, part, steps) {
        var assumptionExpr = proof.steps[steps[0][0]].getSentence();
        var contraExpr = proof.steps[steps[0][1]].getSentence();
        if (!Expr.isContradiction(contraExpr)) {
          return "Contra: Final step in range must be a contradiction.";
        }

        if (assumptionExpr[0] !== "not")
          return "Contra: Assumption is not a negation. Might you be thinking of not-introduction?";

        var semEq = Expr.equal(
          assumptionExpr[1],
          proof.steps[step].getSentence(),
        );
        if (semEq) return true;

        return "Contra: Negation of assumption doesn't match current step.";
      },
    ),
  }),
  bot: new Rule({
    name: "Absurdity",
    type: "normal",
    elimination: new Justifier(
      { hasPart: false, stepRefs: ["num"], subst: false },
      function (proof, step, part, steps) {
        var refStep = proof.steps[steps[0]].getSentence();
        if (!Expr.isContradiction(refStep)) {
          // if (refStep[0] != 'id' || (refStep[1] != 'contradiction' && refStep[1] != '_|_'))
          return (
            "Bot-elim: Referenced step is not absurdity, but got " +
            Expr.pretty(refStep) +
            " instead."
          );
        }
        return true;
      },
    ),
  }),
  notnot: new Rule({
    name: "Double-negation",
    type: "normal",
    elimination: new Justifier(
      { hasPart: false, stepRefs: ["num"], subst: false },
      function (proof, step, part, steps) {
        var curStep = proof.steps[step].getSentence();
        var refStep = proof.steps[steps[0]].getSentence();
        if (refStep[0] !== "not" || refStep[1][0] !== "not")
          return (
            "Notnot-elim: Referenced step is not a double-negation, but got " +
            Expr.pretty(refStep) +
            " instead."
          );

        if (!Expr.equal(refStep[1][1], curStep))
          return "Notnot-elim: Does not result in current step.";

        return true;
      },
    ),
  }),
  "->": new Rule({
    name: "Implication",
    type: "normal",
    introduction: new Justifier(
      { hasPart: false, stepRefs: ["range"], subst: false },
      function (proof, step, part, steps) {
        var truth = proof.steps[steps[0][0]].getSentence();
        var result = proof.steps[steps[0][1]].getSentence();
        var implies = proof.steps[step].getSentence();
        if (implies[0] != "->")
          return (
            "Implies-Intro: Current step is not an implication, but got " +
            Expr.pretty(implies) +
            " instead."
          );

        var truthSemEq = Expr.equal(implies[1], truth);
        if (!truthSemEq)
          return "Implies-Intro: The left side does not match the assumption.";

        var resultSemEq = Expr.equal(implies[2], result);
        if (!resultSemEq)
          return "Implies-Intro: The result does not match the right side.";

        return true;
      },
    ),
    elimination: new Justifier(
      { hasPart: false, stepRefs: ["num", "num"], subst: false },
      function (proof, step, part, steps) {
        var truthStep = steps[1],
          impliesStep = steps[0];
        if (truthStep >= step || impliesStep >= step)
          return "Implies-Elim: Referenced proof steps must precede current step.";

        var truth = proof.steps[truthStep].getSentence();
        var implies = proof.steps[impliesStep].getSentence();
        if (implies[0] != "->")
          return (
            "Implies-Elim: Step " + (steps[0] + 1) + " is not an implication"
          );
        var truthSemEq = Expr.equal(implies[1], truth);
        var resultSemEq = Expr.equal(
          implies[2],
          proof.steps[step].getSentence(),
        );
        if (truthSemEq) {
          if (resultSemEq) {
            return true;
          } else {
            return "Implies-Elim: The left side does not imply this result.";
          }
        }

        return "Implies-Elim: The implication's left side does not match the referenced step.";
      },
    ),
  }),
  and: new Rule({
    name: "And",
    type: "normal",
    introduction: new Justifier({ stepRefs: ["num", "num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var s = proof.steps[step].getSentence();
      if (s[0] !== "and")
        return (
          "And-Intro: Current step is not an 'and'-expression." +
          proof.steps[step].getSentence()
        );

      if (Expr.equal(s[1], proof.steps[steps[0]].getSentence())) {
        if (Expr.equal(s[2], proof.steps[steps[1]].getSentence())) {
          return true;
        } else {
          return "And-Intro: Right side doesn't match referenced step.";
        }
      }

      return "And-Intro: Left side doesn't match referenced step.";
    }),
    elimination: new Justifier({ hasPart: true, stepRefs: ["num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var andExp = proof.steps[steps[0]].getSentence();
      if (andExp[0] != "and")
        return "And-Elim: Referenced step is not an 'and' expression.";

      var semEq = Expr.equal(andExp[part], proof.steps[step].getSentence());

      if (semEq) return true;

      return (
        "And-Elim: In referenced line, side " +
        part +
        " does not match current step."
      );
    }),
  }),
  or: new Rule({
    name: "Or",
    type: "normal",
    introduction: new Justifier({ hasPart: true, stepRefs: ["num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var s = proof.steps[step].getSentence();
      if (s[0] !== "or")
        return "Or-Intro: Current step is not an 'or'-expression.";

      if (Expr.equal(s[part], proof.steps[steps[0]].getSentence())) return true;

      return "Or-Intro: Side " + part + " doesn't match referenced step.";
    }),
    elimination: new Justifier(
      { stepRefs: ["num", "range", "range"] },
      function (proof, step, part, steps) {
        var currStepExpr = proof.steps[step].getSentence();
        var orStepExpr = proof.steps[steps[0]].getSentence();
        var a1p1Expr = proof.steps[steps[1][0]].getSentence();
        var a1p2Expr = proof.steps[steps[1][1]].getSentence();
        var a2p1Expr = proof.steps[steps[2][0]].getSentence();
        var a2p2Expr = proof.steps[steps[2][1]].getSentence();

        // and through the gauntlet...
        if (orStepExpr[0] !== "or")
          return "Or-Elim: First referenced step is not an 'or'-expression.";
        if (!Expr.equal(orStepExpr[1], a1p1Expr))
          return "Or-Elim: First range intro doesn't match left side of 'or'.";
        if (!Expr.equal(orStepExpr[2], a2p1Expr))
          return "Or-Elim: Second range range intro doesn't match right side of 'or'.";
        if (!Expr.equal(a1p2Expr, a2p2Expr))
          return "Or-Elim: Step range conclusions don't match.";
        if (!Expr.equal(a1p2Expr, currStepExpr))
          return "Or-Elim: Current step doesn't match step range conclusions.";

        return true;
      },
    ),
  }),
  neg: new Rule({
    name: "Neg",
    type: "normal",
    introduction: new Justifier({ stepRefs: ["range"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var assumptionExpr = proof.steps[steps[0][0]].getSentence();
      var contraExpr = proof.steps[steps[0][1]].getSentence();
      if (!Expr.isContradiction(contraExpr)) {
        return "Neg-Intro: Final step in range must be absurdity.";
      }
      var curStep = proof.steps[step].getSentence();
      if (curStep[0] !== "not") {
        return "Neg-Intro: Current step is not a negation. Might you be thinking of Contra?";
      } else {
        var semEq = Expr.equal(assumptionExpr, curStep[1]);
        if (semEq) return true;

        return "Neg-Intro: Negation of assumption doesn't match current step.";
      }
    }),
    elimination: new Justifier({ stepRefs: ["num", "num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var s = proof.steps[step].getSentence();

      var step1expr = proof.steps[steps[0]].getSentence();
      var step2expr = proof.steps[steps[1]].getSentence();
      var semEq;
      if (step1expr[0] === "not") {
        semEq = Expr.equal(step1expr[1], step2expr);
      } else if (step2expr[0] === "not") {
        semEq = Expr.equal(step2expr[1], step1expr);
      } else {
        return "Neg-Elim: Neither referenced proof step is a 'not' expression.";
      }

      if (semEq) return true;

      return "Neg-Elim: Subexpression in not-expr does not match other expr.";
    }),
  }),
  "<->": new Rule({
    name: "Bi-implication",
    type: "normal",
    introduction: new Justifier({ stepRefs: ["num", "num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var s = proof.steps[step].getSentence();
      if (s[0] !== "<->")
        return (
          "Bi-Implication-Intro: Current step is not an '<->'-expression." +
          proof.steps[step].getSentence()
        );

      var l = ["->"].concat(s.slice(1, 3));
      var r = ["->"];
      r.push(s[2]);
      r.push(s[1]);
      if (Expr.equal(l, proof.steps[steps[0]].getSentence())) {
        if (Expr.equal(r, proof.steps[steps[1]].getSentence())) {
          return true;
        } else {
          return (
            "Bi-Implication-Intro: Right side doesn't match referenced step: " +
            Expr.pretty(r) +
            " != " +
            Expr.pretty(proof.steps[steps[1]].getSentence())
          );
        }
      }

      return (
        "Bi-Implication: Left side doesn't match referenced step: " +
        Expr.pretty(l) +
        " != " +
        Expr.pretty(proof.steps[steps[0]].getSentence())
      );
    }),
    elimination: new Justifier({ hasPart: true, stepRefs: ["num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var s = proof.steps[steps[0]].getSentence();
      if (s[0] != "<->") {
        return (
          "Bi-Implication-Elim: Referenced step is not an '<->' expression, got " +
          Expr.pretty(andExp)
        );
      }

      var semEq = false;
      if (part == 1) {
        var l = ["->"].concat(s.slice(1, 3));
        semEq = Expr.equal(l, proof.steps[step].getSentence());
      } else {
        var r = ["->"];
        r.push(s[2]);
        r.push(s[1]);
        semEq = Expr.equal(r, proof.steps[step].getSentence());
      }

      if (semEq) return true;

      return (
        "Bi-Implication-Elim: In referenced line, side " +
        part +
        " does not match current step."
      );
    }),
  }),
  a: new Rule({
    name: "ForAll",
    type: "normal",
    introduction: new Justifier({ stepRefs: ["range"], subst: true }, function (
      proof,
      step,
      part,
      steps,
      subst,
    ) {
      var currStep = proof.steps[step];
      var currExpr = currStep.getSentence();
      var startStep = proof.steps[steps[0][0]];
      var startExpr = startStep.getSentence();
      var scope = startStep.getScope(); // ex: [['x0','x'], ['y0', 'y'], ...], LIFO
      var endExpr = proof.steps[steps[0][1]].getSentence();
      debugMessage(
        "all-intro",
        "startExpr",
        startExpr,
        "endExpr",
        endExpr,
        "currExpr",
        currExpr,
        "scope",
        scope,
        "subst",
        subst,
      );
      if (currExpr[0] !== "forall")
        return "All-x-Intro: Current step is notf a 'for-all' expression.";
      if (scope.length == 0 || scope[scope.length - 1] == null)
        return (
          "All-x-Intro: The provided range does not have a scoping assumption (e.g., an x0 box started by 'with') in step " +
          (steps[0][0] + 1) +
          "."
        );
      if (subst.length > 1)
        return "All-x-intro: Introducing more than one quantifier at the same time is currently not supported";

      // check if any substitutions from our scope match refExpr
      var scopeVar = scope[scope.length - 1];
      var found = scope
        .slice()
        .reverse()
        .reduce(function (a, e) {
          return a || e == null || e == subst[1];
        }, true);
      if (!found)
        return (
          "All-x-intro: Substitution " +
          Expr.prettySubst(subst) +
          " doesn't match scope: " +
          scope
            .filter(function (e) {
              if (e != null) return e;
            })
            .join(", ")
        );

      var currExprSub = Expr.substitute(currExpr[2], subst);
      if (Expr.equal(endExpr, currExprSub)) return true;
      return (
        "All-x-Intro: Last step in range doesn't match current step after " +
        Expr.prettySubst(subst) +
        ": " +
        Expr.pretty(endExpr) +
        " != " +
        Expr.pretty(currExprSub) +
        "."
      );
    }),
    elimination: new Justifier({ stepRefs: ["num"], subst: true }, function (
      proof,
      step,
      part,
      steps,
      subst,
    ) {
      var currStep = proof.steps[step];
      var currExpr = currStep.getSentence();
      var refExpr = proof.steps[steps[0]].getSentence();
      debugMessage(
        "all-elim",
        "refExpr",
        refExpr,
        "currExpr",
        currExpr,
        "subst",
        subst,
      );
      if (refExpr[0] !== "forall")
        return "All-x-Elim: Referenced step is not a for-all expression.";
      if (subst.length > 1)
        return "All-x-elim: Eliminating more than one quantifier at the same time is currently not supported";

      var refExprSub = Expr.substitute(refExpr[2], subst);
      if (Expr.equal(refExprSub, currExpr)) return true;

      return (
        "All-x-Elim: Referenced step " +
        (steps[0] + 1) +
        " did not match current step after " +
        Expr.prettySubst(subst) +
        ": " +
        Expr.pretty(refExprSub) +
        " != " +
        Expr.pretty(currExpr) +
        "."
      );
    }),
  }),
  e: new Rule({
    name: "Exists",
    type: "normal",
    introduction: new Justifier({ stepRefs: ["num"], subst: true }, function (
      proof,
      step,
      part,
      steps,
      subst,
    ) {
      var currStep = proof.steps[step];
      var currExpr = currStep.getSentence();
      var refExpr = proof.steps[steps[0]].getSentence();
      debugMessage(
        "ex-intro",
        "refExpr",
        refExpr,
        "currExpr",
        currExpr,
        "subst",
        subst,
      );
      if (currExpr[0] !== "exists")
        return "Exists-x-Intro: Current step is not an 'exists' expression.";
      if (subst.length > 1)
        return "Exists-x-Intro: Introducing more than one quantifier at the same time is currently not supported";

      var currExprSub = Expr.substitute(currExpr[2], subst);
      if (Expr.equal(refExpr, currExprSub)) return true;

      return (
        "Exists-x-Intro: Referenced step " +
        (steps[0] + 1) +
        " did not match current step after " +
        Expr.prettySubst(subst) +
        " substitution: " +
        Expr.pretty(refExpr) +
        " != " +
        Expr.pretty(currExprSub) +
        "."
      );
    }),
    elimination: new Justifier(
      { stepRefs: ["num", "range"], subst: true },
      function (proof, step, part, steps, subst) {
        var currStep = proof.steps[step];
        var currExpr = currStep.getSentence();
        var refExpr = proof.steps[steps[0]].getSentence();
        var startStep = proof.steps[steps[1][0]];
        var startExpr = startStep.getSentence();
        var scope = startStep.getScope(); // ex: [['x0','x'], ['y0', 'y'], ...], LIFO
        var endExpr = proof.steps[steps[1][1]].getSentence();
        if (refExpr[0] !== "exists")
          return "Exists-x-Elim: Referenced step is not an 'exists' expression.";
        if (scope.length == 0 || scope[scope.length - 1] == null)
          return "Exists-x-Elim: Range must be within an assumption scope (e.g., an x0 box).";
        if (subst.length > 1)
          return "Exists-x-Elim: Eliminating more than one quantifier at the same time is currently not supported";

        // check whether substition matches ref line with current line
        var scopeVars = scope[scope.length - 1];
        var refExprSub = Expr.substitute(refExpr[2], subst);
        if (Expr.equal(refExprSub, startExpr)) {
          if (Expr.equal(endExpr, currExpr)) return true;
          return (
            "Exists-x-Elim: assumption ending step " +
            (steps[1][1] + 1) +
            " does not match current step: " +
            Expr.pretty(endExpr) +
            " != " +
            Expr.pretty(currExpr) +
            "."
          );
        }
        return (
          "Exists-x-Elim: assumption beginning step doesn't match ref step for " +
          scopeVars[0] +
          "."
        );
      },
    ),
  }),
  b: new Rule({
    name: "Backchaining",
    type: "derived",
    verifier: new Justifier(
      { stepRefs: ["num", "nums"], subst: true },
      function (proof, step, part, steps, subst) {
        var currStep = proof.steps[step];
        var currExpr = currStep.getSentence();
        var refExpr = steps.map((k) => proof.steps[k].getSentence());
        debugMessage(
          "backchaining",
          "steps",
          steps,
          "refExpr",
          refExpr,
          "currExpr",
          currExpr,
          "subst",
          subst,
        );
        var clause = openHornClause(refExpr[0]);
        if (typeof clause === "string") return "Backchaining: " + clause;

        var vars = clause[0];
        var head = clause[1];
        if (head.length != steps.length - 1) {
          return (
            "Backchaining: " +
            (steps.length - 1) +
            " proof steps provided, but " +
            head.length +
            " required to match the head of the Horn clause " +
            Expr.pretty(refExpr[0])
          );
        }
        var headSub = head.map((c) => Expr.substitute(c, subst));
        var tailSub = Expr.substitute(clause[2], subst);
        debugMessage("backchaining", "headSub", headSub, "tailSub", tailSub);
        if (Expr.equal(tailSub, currExpr)) {
          for (let i = 0; i < headSub.length; i++) {
            if (!Expr.equal(headSub[i], refExpr[i + 1])) {
              return (
                "Backchaining: Head formula " +
                (i + 1) +
                " of Horn clause in step " +
                (steps[0] + 1) +
                " does not match step " +
                (steps[i + 1] + 1) +
                ": " +
                Expr.pretty(headSub[i]) +
                " != " +
                Expr.pretty(refExpr[i + 1]) +
                "."
              );
            }
          }
          return true;
        } else {
          return (
            "Backchaining: Tail of Horn clause in step " +
            (steps[0] + 1) +
            " does not match current step: " +
            Expr.pretty(tailSub) +
            " != " +
            Expr.pretty(currExpr)
          );
        }
      },
    ),
  }),
  "=": new Rule({
    name: "Equality",
    type: "normal",
    introduction: new Justifier(
      {
        /* no params required */
      },
      function (proof, step, part, steps) {
        var s = proof.steps[step].getSentence();
        if (s[0] !== "=")
          return (
            "Equality-Intro: Current step is not an equality." +
            proof.steps[step].getSentence()
          );

        if (Expr.equal(s[1], s[2])) return true;

        return "Equality-Intro: Left and right sides do not match.";
      },
    ),
    elimination: new Justifier({ stepRefs: ["num", "num"] }, function (
      proof,
      step,
      part,
      steps,
    ) {
      var equalityExpr = proof.steps[steps[0]].getSentence();
      var elimExpr = proof.steps[steps[1]].getSentence();
      var proposedResult = proof.steps[step].getSentence();
      if (equalityExpr[0] !== "=")
        return "Equality-Elim: First referenced step is not an equality.";

      if (
        !Expr.equal(elimExpr, proposedResult, equalityExpr[1], equalityExpr[2])
      ) {
        return (
          "Equality-Elim: Substituting in step " +
          (steps[1] + 1) +
          " does not result in current step: " +
          " formula " +
          Expr.pretty(elimExpr) +
          " != " +
          Expr.pretty(proposedResult) +
          " when replacing " +
          Expr.pretty(equalityExpr[1]) +
          " by " +
          Expr.pretty(equalityExpr[2])
        );
      }

      return true;
    }),
  }),
};

function splitHead(form) {
  if (Expr.isAtom(form)) {
    return [form];
  } else if (form[0] == "and") {
    var l = splitHead(form[1]);
    var r = splitHead(form[2]);
    if (l && r) {
      return l.concat(r);
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function openHornClause(form, vars = Array(0)) {
  debugMessage("openHornClause", form, vars);
  if (form[0] == "forall") {
    return openHornClause(form[2], vars.concat([form[1]]));
  } else if (form[0] == "->") {
    var h = splitHead(form[1]);
    if (h) {
      return [vars, h, form[2]];
    } else {
      return "Not a valid head in Horn clause";
    }
  } else if (Expr.isAtom(form)) {
    return [vars, [], form];
  } else {
    return "Not a valid Horn clause with top-level connective " + form[0];
  }
}

export { rules };
