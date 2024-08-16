import { debugMessage } from "./src/util.mjs";
import { default_render_options } from "./src/config.mjs";

// Top-level AST will be returned as an array of rules and boxes in a DOM tree.
function render(AST, options) {
  const render_options = Object.assign(default_render_options, options);
  let DOM = document.createElement("div");
  if (!AST) {
    return DOM;
  }
  renderRules(DOM, AST, 1, render_options);
  return DOM;
}

function renderRules(DOM, AST, line, options) {
  for (let i = 0; i < AST.length; i++) {
    debugMessage(AST[i]);
    if (AST[i][0] === "rule") {
      line = renderRule(DOM, AST[i], line, options);
    } else if (AST[i][0] === "box") {
      line = renderBox(DOM, AST[i], line, options, "simple");
    } else if (AST[i][0] === "folbox") {
      line = renderBox(DOM, AST[i], line, options, "FOL");
    } else if (AST[i][0] === "error") {
      line = renderSyntaxError(DOM, AST[i], line);
    }
  }
  return line;
}

function renderRule(DOM, AST, line, options) {
  let nest = document.createElement("div");
  nest.className = "rule";

  let line_number_span = document.createElement("span");
  line_number_span.className = "lineno";
  line_number_span.textContent = line;
  nest.appendChild(line_number_span);

  nest.appendChild(renderClause(AST[1], options));
  nest.appendChild(renderJustification(AST[2]));

  DOM.appendChild(nest);
  return line + 1;
}

function renderSyntaxError(DOM, AST, line) {
  let nest = document.createElement("div");
  nest.className = "text-danger font-weight-bold";

  let line_number_span = document.createElement("span");
  line_number_span.className = "lineno";
  line_number_span.textContent = line;
  nest.appendChild(line_number_span);
  nest.append("Syntax error: ", AST[1]);

  DOM.appendChild(nest);
  return line + 1;
}

function renderClause(AST, options) {
  let op_text;
  switch (AST[0]) {
    case "forall":
      op_text = "&forall;";
      break;
    case "exists":
      op_text = "&exist;";
  }
  if (op_text) {
    let wrapper = document.createElement("span");
    wrapper.className = "folproof-quantifier";

    wrapper.insertAdjacentHTML("beforeend", op_text);

    wrapper.appendChild(renderTerm(AST[1], options));
    wrapper.append(". ");

    const clause = renderClause(AST[2], options);
    wrapper.appendChild(clause); // TODO: why this append?
    if (requireParens(AST[0], AST[2], true, options)) {
      wrapper.append("(");
      wrapper.appendChild(clause);
      wrapper.append(")");
    } else {
      wrapper.appendChild(clause);
    }

    return wrapper;
  }

  switch (AST[0]) {
    case "<->":
      op_text = "&harr;";
      break;
    case "->":
      op_text = "&rarr;";
      break;
    case "and":
      op_text = "&and;";
      break;
    case "or":
      op_text = "&or;";
      break;
    case "=":
      op_text = "=";
  }
  if (op_text) {
    debugMessage(AST[1], AST[2]);

    let left = renderClause(AST[1], options);
    if (requireParens(AST[0], AST[1], true, options)) {
      left.prepend("(");
      left.append(")");
    }

    left.append(" ");
    left.insertAdjacentHTML("beforeend", op_text);
    left.append(" ");

    let right = renderClause(AST[2], options);
    if (requireParens(AST[0], AST[2], false, options)) {
      right.prepend("(");
      right.append(")");
    }
    left.appendChild(right);

    return left;
  }

  if (AST[0] === "id") {
    return renderTerm(AST, options);
  } else if (AST[0] === "not") {
    let left = renderClause(AST[1], options);
    if (requireParens(AST[0], AST[1], true, options)) {
      left.prepend("(");
      left.append(")");
    }
    left.insertAdjacentHTML("afterbegin", "&not;");
    return left;
  }
  return renderTerm(AST);
}

const opOrder = {
  not: 1,
  "=": 1,
  forall: 2,
  exists: 2,
  and: 3,
  or: 4,
  "->": 5,
  "<->": 6,
};

function requireParens(parentOp, AST, leftTerm, options) {
  if (AST[0] === "id") {
    return false;
  }

  if (options.parentheses === "user") {
    return AST.userParens;
  }

  if (options.parentheses === "minimal") {
    return !(
      (opOrder[parentOp] == opOrder[AST[0]] && leftTerm) ||
      (opOrder[parentOp] > opOrder[AST[0]] && !leftTerm)
    );
  }

  return true; // explicit mode
}

const infixTerms = ["="];

function renderTerm(AST, options) {
  if (AST instanceof Array) {
    let term = document.createElement("span");
    if (AST.length === 1) {
      term.appendChild(renderSimpleTerm(AST[0]));
      return term;
    } else if (AST.length === 2) {
      term.appendChild(renderSimpleTerm(AST[1]));
      return term;
    } else if (AST.length >= 3) {
      term.className = "term parameterized";
      if (!infixTerms.includes(AST[1])) {
        term.appendChild(renderSimpleTerm(AST[1]));
        term.append("(");
        for (let i = 0; i < AST[2].length; i++) {
          term.appendChild(renderTerm(AST[2][i], options));
          if (i < AST[2].length - 1) {
            term.append(", ");
          }
        }
        term.append(")");
      } else {
        // infix
        term.append(AST[2][0][1], " ", AST[1], " ", AST[2][1][1]);
      }
      return term;
    }
  } else {
    return renderSimpleTerm(AST);
  }
}

function renderSimpleTerm(t) {
  const greek_letters = [
    "alpha",
    "beta",
    "gamma",
    "delta",
    "epsilon",
    "zeta",
    "eta",
    "theta",
    "iota",
    "kappa",
    "lambda",
    "mu",
    "nu",
    "xi",
    "omicron",
    "pi",
    "rho",
    "sigma",
    "tau",
    "upsilon",
    "phi",
    "chi",
    "psi",
    "omega",
  ];

  const others = {
    bot: "&perp;",
    contradiction: "&perp;",
  };
  const parts = t.match(/(.*?)(\d+)?$/);
  let sym = parts[1];
  // &Omega; and &omega; are different. &OmEGa; does not exist, hence the quirkiness
  // to allow users to distinguish between lower and uppercase greek letters.
  if (greek_letters.includes(sym[0].toLowerCase() + sym.substring(1))) {
    sym = "&" + sym + ";";
  } else if (others[sym]) {
    sym = others[sym];
  }
  const output = document.createElement("span");
  output.innerHTML = sym;
  if (parts[2]) {
    output.className = "special-symbol";
    const sub = document.createElement("sub");
    sub.textContent = parts[2];
    output.appendChild(sub);
  } else {
    output.className = "symbol";
  }
  return output;
}

/**
 * Render justification.
 *
 * AST[0] = rule, AST[1] = elim/intro, AST[2] = index (if required), AST[3] = line numbers
 *
 * @param AST
 * @returns {HTMLDivElement}
 */
function renderJustification(AST) {
  let justification = document.createElement("div");
  justification.className = "justification";
  if (AST[0] == "sorry") {
    justification.classList.add("text-warning");
  }
  justification.innerText = AST[0];
  if (AST[1]) {
    justification.append(" ", AST[1]);
  }
  if (AST[2]) {
    justification.append(AST[2]);
  }
  if (AST[3]) {
    justification.append(" ", AST[3].join(", "));
  }
  return justification;
}

function renderBox(DOM, AST, line, options, type) {
  let box = document.createElement("div");
  box.className = type + "-box";
  const lines = renderRules(box, AST[1], line, options);
  DOM.appendChild(box);
  return lines;
}

export { render };
