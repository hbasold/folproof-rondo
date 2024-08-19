import { debugMessage } from "./util.mjs";
import {
  quantifiers,
  unary_connectives,
  binary_connectives,
  operator_precedence,
  operator_ascii,
} from "./config.mjs";

// Substitutes in parallel in expr by all the variables that are mapped in subst
function substitute(expr, subst, bound) {
  debugMessage("substitute", expr, subst);
  bound = bound ? bound : [];

  // remove parens, which are basically stylistic no-ops
  while (expr[0] === "paren") expr = expr[1];

  if (binary_connectives.includes(expr[0])) {
    const left = substitute(expr[1], subst);
    const right = substitute(expr[2], subst);
    return [expr[0], left, right];
  } else if (
    unary_connectives.includes(expr[0]) ||
    quantifiers.includes(expr[0])
  ) {
    if (expr[0] === "forall" || expr[0] === "exists") {
      bound = bound.slice(0);
      bound.push(expr[1]);
      return [expr[0], expr[1], substitute(expr[2], subst, bound)];
    }
    return [expr[0], substitute(expr[1], subst, bound)];
  } else if (expr[0] === "id") {
    if (expr.length === 2) {
      if (!bound.includes(expr[1])) {
        const s = subst.find((s) => s[0] === expr[1]);
        if (s) {
          return s[1];
        } // [expr[0], b];
      }
      return expr;
    }
    if (expr.length === 3) {
      let newTerms = [];
      for (let i = 0; i < expr[2].length; i++) {
        newTerms.push(substitute(expr[2][i], subst, bound));
      }
      return [expr[0], expr[1], newTerms];
    }
    throw Error("Unexpected AST format.");
  } else {
    return expr;
  }
}

/**
 * Determines whether two expressions are semantically equivalent
 * under the given (and optional) substitution.
 * a, b - abstract syntax trees of the expressions to be compared.
 * suba, subb (optional) - does comparison after substituting suba in a with subb.
 */
function equal(A, B, suba, subb) {
  debugMessage("Expr.equal", A, B);
  let sub;
  if (suba) {
    sub = true;
    return _rec(A, B, {});
  } else {
    sub = false;
    return _rec(A, B);
  }

  function _rec(a, b, bound) {
    // if eq w/substitution, return true, otherwise continue
    if (sub && equal(a, suba)) {
      if ((a[0] !== "id" || !bound[a[1]]) && _rec(subb, b, bound)) return true;
    }

    if (binary_connectives.includes(a[0]) && a[0] === b[0]) {
      return _rec(a[1], b[1], bound) && _rec(a[2], b[2], bound);
    } else if (unary_connectives.includes(a[0]) && a[0] === b[0]) {
      return _rec(a[1], b[1], bound);
    } else if (a[0] === "exists" || (a[0] === "forall" && a[0] === b[0])) {
      let newb;
      if (sub) {
        newb = structuredClone(bound);
        newb[a[1]] = true;
      }
      return _rec(a[2], b[2], newb);
    } else if (a[0] === "bot") {
      return b[0] === "bot";
    } else if (a[0] === "id") {
      if (b && a[1] !== b[1]) return false;
      if (a.length === 2 && b.length === 2) {
        return true;
      }

      if (a.length === 3 && b.length === 3) {
        if (a[2].length !== b[2].length) {
          return false;
        }
        for (let i = 0; i < a[2].length; i++) {
          if (!_rec(a[2][i], b[2][i], bound)) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  }
}

function isContradiction(s) {
  debugMessage("isContradiction", s);
  return s[0] === "bot";
}

function isQuantifier(expr) {
  console.assert(
    Array.isArray(expr) && expr.length > 0,
    "Expected expression but got %o",
    expr,
  );
  return quantifiers.indexOf(expr[0]) >= 0;
}

function isUnaryConnective(expr) {
  console.assert(
    Array.isArray(expr) && expr.length > 0,
    "Expected expression but got %o",
    expr,
  );
  return unary_connectives.indexOf(expr[0]) >= 0;
}

function isBinaryConnective(expr) {
  console.assert(
    Array.isArray(expr) && expr.length > 0,
    "Expected expression but got %o",
    expr,
  );
  return binary_connectives.indexOf(expr[0]) >= 0;
}

function isId(expr) {
  console.assert(
    Array.isArray(expr) && expr.length > 0,
    "Expected expression but got %o",
    expr,
  );
  return expr[0] === "id";
}

function isAtom(expr) {
  console.assert(
    Array.isArray(expr) && expr.length > 0,
    "Expected expression but got %o",
    expr,
  );
  return expr[0] === "id" || expr[0] === "=";
}

function prettyParentheses(i, j, doc) {
  if (j < i) {
    return "(" + doc + ")";
  } else {
    return doc;
  }
}

function prettyArgs(args) {
  let pretty_args = "";
  for (const arg of args) {
    if (!(pretty_args.length === 0)) {
      pretty_args += ", ";
    }
    pretty_args += prettyTerm(arg);
  }
  return pretty_args;
}

function prettyTerm(expr) {
  debugMessage("prettyTerm", expr);
  const name = expr[1]; // Propositional variable or FOL symbol
  let pretty_output = "";
  if (expr.length === 3) {
    // If true, name is a FOL symbol, so we must pretty print its arguments
    pretty_output = "(" + prettyArgs(expr[2]) + ")";
  }
  return name + pretty_output;
}

function prettyRec(i, expr) {
  debugMessage("prettyRec", i, expr);
  if (isId(expr)) {
    return prettyTerm(expr);
  } else if (
    isQuantifier(expr) ||
    isBinaryConnective(expr) ||
    isUnaryConnective(expr)
  ) {
    const precedence = operator_precedence[expr[0]];

    let pretty_out;
    if (isQuantifier(expr)) {
      const quantified_variable = expr[1];
      const right = prettyRec(precedence, expr[2]);
      pretty_out = operator_ascii[expr[0]] + quantified_variable + "." + right;
    } else if (isBinaryConnective(expr)) {
      const left = prettyRec(precedence + 1, expr[1]);
      const right = prettyRec(precedence, expr[2]);
      pretty_out = left + " " + operator_ascii[expr[0]] + " " + right;
    } else if (isUnaryConnective(expr)) {
      const right = prettyRec(precedence, expr[1]);
      pretty_out = operator_ascii[expr[0]] + right;
    }

    return prettyParentheses(i, precedence, pretty_out);
  } else {
    console.assert(false, `Expr.pretty: Case not covered for ${expr}`);
  }
}

function pretty(expr) {
  return prettyRec(0, expr);
}

function prettySubst(subst) {
  let doc = "";
  for (const s of subst) {
    if (!(doc.length === 0)) {
      doc += ";";
    }
    doc += s[0] + "/" + pretty(s[1]);
  }
  return doc;
}

export { substitute, equal, isContradiction, isAtom, pretty, prettySubst };
