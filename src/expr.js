var u = require("./util");

function arrayContains(arr, el) {
  for (var i=0; i<arr.length; i++) {
    if (arr[i] === el) return true;
  }
  return false;
}

function clone(obj) {
  var newo = {};
  for(var k in Object.keys(obj)) {
    newo[k] = obj[k];
  }
  return newo;
}

// Substitutes in parallel in expr by all the variables that are mapped in subst
function substitute(expr, subst, bound) {
  u.debug("substitute", expr, subst);
  bound = bound ? bound : [];
  var binOps = ["->", "and", "or", "<->", "="];
  var unOps = ["not", "forall", "exists"];

  // remove parens, which are basically stylistic no-ops
  while (expr[0] === 'paren') expr = expr[1];

  if (arrayContains(binOps, expr[0])) {
    var leftSide = substitute(expr[1], subst);
    var rightSide = substitute(expr[2], subst);
    return [expr[0], leftSide, rightSide];
  } else if (arrayContains(unOps, expr[0])) {
    if (expr[0] === "forall" || expr[0] === "exists") {
      bound = bound.slice(0);
      bound.push(expr[1]);
      return [expr[0], expr[1],
        substitute(expr[2], subst, bound)];
    }
    return [expr[0], substitute(expr[1], subst, bound)];
  } else if (expr[0] === 'id') {
    if (expr.length === 2) {
      if (! arrayContains(bound, expr[1])) {
        var s = subst.find((s) => s[0] === expr[1]);
        if (s)
          return s[1]; // [expr[0], b];
      }
      return expr;
    }
    if (expr.length === 3) {
      var newTerms = [];
      for (var i=0; i<expr[2].length; i++) {
        newTerms.push(substitute(expr[2][i], subst, bound));
      }
      return [expr[0], expr[1], newTerms];
    }
    throw Error("Unexpected AST format.");
  }
}

/**
 * Determines whether two expressions are semantically equivalent
 * under the given (and optional) substitution.
 * a, b - abstract syntax trees of the expressions to be compared.
 * suba, subb (optional) - does comparison after substituting suba in a with subb.
 */
function equal(A, B, suba, subb) {
  u.debug("Expr.equal", A, B);
  var bound = {}, sub;
  if (suba) {
    sub = true;
    return _rec(A, B, {});
  } else {
    sub = false;
    return _rec(A, B);
  }

  function _rec(a, b, bound) {
    var binOps = ["->", "and", "or", "<->", "="];
    var unOps = ["not"];

    // if eq w/substitution, return true, otherwise continue
    if (sub && equal(a, suba)) {
        if ((a[0] !== 'id' || !bound[a[1]]) && _rec(subb, b, bound)) return true;
    }

    if (arrayContains(binOps, a[0]) && a[0] === b[0]) {
      if (_rec(a[1], b[1], bound) && _rec(a[2], b[2], bound)) {
        return true;
      }
      return false;
    } else if (arrayContains(unOps, a[0]) && a[0] === b[0]) {
      if (_rec(a[1], b[1], bound)) {
        return true;
      }
      return false;
    } else if (a[0] === 'exists' || a[0] === 'forall' && a[0] === b[0]) {
      var newb;
      if (sub) {
        newb = clone(bound);
        newb[a[1]] = true;
      }
      if (_rec(a[2], b[2], newb)) {
        return true;
      }
      return false;
    } else if (a[0] === "bot"){
      return b[0] === "bot";
    } else if (a[0] === "id") {
      if (b && a[1] !== b[1]) return false;
      if (a.length == 2 && b.length == 2) {
        return true;
      }

      if (a.length == 3 && b.length == 3) {
        if (a[2].length != b[2].length) {
          return false;
        }
        for (var i=0; i<a[2].length; i++) {
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
    // return (s[0] === 'id' && (s[1] === '_|_' || s[1] === 'contradiction'));
    return s[0] == 'bot';
}

module.exports.substitute = substitute;
module.exports.equal = equal;
module.exports.isContradiction = isContradiction;
