var u = require("./util");
var p = require("../folproof-parser");

var Justifier = function Justifier(format, fn) {
	// format = { hasPart : (true/false), stepRefs : ("num" | "range")*, subst : (true/false) };
	var self = this;

	this.exec = function(proof, step, part, steps, subst) {
		u.debug("Justifier", step, part, steps, subst);
		var checked = self.checkParams(step, part, steps, subst);
		if (typeof checked === "string") return checked;
    u.debug("Calling justifier on checked", checked);
		return fn(proof, step, checked[0], checked[1], checked[2]);
	};

	this.checkParams = function checkParams(curStep, part, steps, subst) {
		if (format === null) {
			if (part != null) 
				return "Step part (e.g., 2 in 'and e2') not applicable, in this context.";
			if (steps != null)
				return "Step references not applicable.";
			if (subst != null)
				return "Substitutions not applicable.";
			return [];
		}

		var partNum = null, refNums = [], parsedSubst = null;
		if (format.hasPart) {
			partNum = parseInt(part);
			if (!(partNum == 1 || partNum == 2))
				return "Part number must be 1 or 2";
		} else
			if (part != null)
				return "Step part (e.g., 2 in 'and e2') not applicable, in this context.";
		
		if (format.stepRefs) {
			if (steps.length != format.stepRefs.length) {
				var f = format.stepRefs.map(function(e) { return e == "num" ? "n" : "n-m" });
				return "Step reference mismatch; required format: " + f.join(", ") + ".";
			}
			for (var i=0; i<steps.length; i++) {
				if (format.stepRefs[i] == "num") {
					var n = parseInt(steps[i]) - 1;
					if (!(n >= 0 && n < curStep))
						return "Step reference #" + (i + 1) + " must be 1 <= step < current.";
					refNums.push(n);
				} else {
					var ab = steps[i].split("-");
					if (ab.length != 2)
						return "Step reference # " + (i + 1) + " must be range, a-b, with a <= b.";
					
					ab = [parseInt(ab[0]) - 1, parseInt(ab[1]) - 1];
					if (ab[0] > ab[1] || Math.max(ab[0], ab[1]) >= curStep)
						return "Step reference # " + (i + 1) + " must be range, a-b, with a <= b.";
					refNums.push(ab);
				}
			}
		} else {
			if (steps != null)
				return "Step references not applicable, here.";
		}
		
		if (format.subst) {
			if (!subst)
				return "Substitution specification required (e.g., A.x/x0 intro n-m)";
      var parsedSubst = parseSubst(subst);
      if (typeof parsedSubst === "string")
        return parsedSubst;
			// w = subst.map(function(e) { return e.match("^[A-Za-z_][A-Za-z_0-9]*$"); });
			// var allValidIds = w.reduce(function(a, e) { return a && e && e.length == 1 && e[0] });
			// if (w.length != 2 || !allValidIds)
			// 	return "Substitution format must match (e.g., A.x/x0 intro n-m.)";

			// w = w.map(function(e) { return e[0] });
      u.debug("subst", subst, "parsedSubst", parsedSubst);
		} else {
			if (subst)
				return "Substitution unexpected.";
		}

		return [partNum, refNums, parsedSubst];
	};
};

var parseSubst = function(subst){
  if (subst.length != 2)
		return "Substitution must consist of a variable and a term (e.g., x/f(c))";
  var idRegex = "^[A-Za-z_][A-Za-z_0-9]*$";
  var res = subst[0].match(idRegex);
  if (!res)
    return "Substitution must substitute for a variable, but got " + subst[0] + ".";
  var substAst = p.parser.parse(subst[1]);
  if (typeof substAst === "string"){
    return substAst;
  } else {
    // the AST will be of the form [["rule", term, ...]], as the top-level parser is "proof"
    var term = substAst[0][1];
    // The term cannot be a formula, hence it must have an identifier at the root
    if (term[0] == "id"){
      return [res[0], term];
    } else {
      return "Substitution does not have a valid term, should be of the form x/f(c), but got " + subst[1] + ".";
    }
  }
};

module.exports = Justifier;
