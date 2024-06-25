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
  u.debug("isContradiction", s);
  // return (s[0] === 'id' && (s[1] === '_|_' || s[1] === 'contradiction'));
  return s[0] === "bot";
}

var quantifiers = ["forall", "exists"];
var unaryConnectives = ["not"];
var binaryConnectives = ["<->", "->", "and", "or", "="];
var opOrder = { "not": 4, "=": 4, "forall": 1, "exists": 1, "and" : 3, "or" : 3, "->" : 2, "<->" : 2 };
var opPrint = {
  "not": "~", "=": "=", "forall": "A", "exists": "E", "and" : "&", "or" : "v", "->": "->" , "<->" : "<->"
};


function isQuantifier(expr) {
  console.assert(Array.isArray(expr) && expr.length > 0, "Expected expression but got %o", expr);
  return quantifiers.indexOf(expr[0]) >= 0;
}

function isUnaryConnective(expr) {
  console.assert(Array.isArray(expr) && expr.length > 0, "Expected expression but got %o", expr);
  return unaryConnectives.indexOf(expr[0]) >= 0;
}

function isBinaryConnective(expr) {
  console.assert(Array.isArray(expr) && expr.length > 0, "Expected expression but got %o", expr);
  return binaryConnectives.indexOf(expr[0]) >= 0;
}

function isId(expr) {
  console.assert(Array.isArray(expr) && expr.length > 0, "Expected expression but got %o", expr);
  return expr[0] === "id";
}

function isAtom(expr) {
  console.assert(Array.isArray(expr) && expr.length > 0, "Expected expression but got %o", expr);
  return expr[0] === "id" || expr[0] === "=";
}

function printPrec(i, j, doc) {
  if (j < i) {
    return "(" + doc + ")";
  } else {
    return doc;
  }
}

function prettyArgs(args) {
  var first = true;
  var prt = "";
  for (a of args) {
    if(!first){
      prt += ", ";
    }
    first = false;
    prt += prettyTerm(a);
  }
  return prt;
}

function prettyTerm(expr) {
  // u.debug("prettyTerm", expr);
  var h = expr[1];
  var a = "";
  if(expr.length == 3){
    a = "(" + prettyArgs(expr[2]) + ")";
  }
  return h + a;
}

function prettyPrec(i, expr) {
  u.debug("prettyPrec", i, expr);
  if(isQuantifier(expr)) {
    var q = expr[0];
    var x = expr[1];
    var prec = opOrder[q];
    var r = prettyPrec(prec, expr[2]);
    var doc = opPrint[expr[0]] + x +  "." + r;
    return printPrec(i, prec, doc);
  }
  else if(isBinaryConnective(expr)) {
    var prec = opOrder[expr[0]];
    var l = prettyPrec(prec + 1, expr[1]);
    var r = prettyPrec(prec, expr[2]);
    var doc = l + " " + opPrint[expr[0]] + " " + r;
    return printPrec(i, prec, doc);
  }
  else if(isUnaryConnective(expr)) {
    var prec = opOrder[expr[0]];
    var r = prettyPrec(prec, expr[1]);
    var doc = opPrint[expr[0]] + r;
    return printPrec(i, prec, doc);
  }
  else if(isId(expr)) {
    return prettyTerm(expr);
  }
  else {
    console.assert(false, "Expr.pretty: Case not covered for %o", expr);
  }
}

function pretty(expr) {
  return prettyPrec(0, expr);
}

function prettySubst(subst) {
  var doc = "";
  var first = true;
  for(s of subst) {
    if(!first) {
      doc += ";"
    }
    first = false;
    doc += s[0] + "/" + pretty(s[1]);
  }
  return doc;
}

module.exports.substitute = substitute;
module.exports.equal = equal;
module.exports.isContradiction = isContradiction;
module.exports.isAtom = isAtom;
module.exports.pretty = pretty;
module.exports.prettySubst = prettySubst;
