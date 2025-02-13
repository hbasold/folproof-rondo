import parser from "../folproof-parser.js";
import { Verifier } from "../src/verifier.mjs";
import { render } from "../folproof-web.mjs";

import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  rectangularSelection,
  lineNumbers,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  indentWithTab,
  history,
  historyKeymap,
  defaultKeymap,
} from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";
import { createPopper } from "@popperjs/core";
import bootstrap from "bootstrap";

let proofInput = new EditorView({
  parent: document.getElementById("proof-input"),
  extensions: [
    history(),
    drawSelection(),
    dropCursor(),
    highlightActiveLine(),
    EditorState.allowMultipleSelections.of(true),
    rectangularSelection(),
    bracketMatching(),
    closeBrackets(),
    lineNumbers(),
    highlightActiveLineGutter(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        updateOutputSection();
      }
    }),
    keymap.of([indentWithTab, ...historyKeymap, ...defaultKeymap]),
  ],
});

const parentheses = document.getElementById("parentheses");
const resultBox = document.getElementById("result-box");
const resultElement = document.getElementById("result");
const renderPanel = document.getElementById("render-panel");

/**
 * Update the output section based on the current proof content and settings.
 */
function updateOutputSection() {
  let AST;
  try {
    parser.trace = (...args) => {
      console.log(args);
    };

    AST = parser.parse(proofInput.state.doc.toString());
    const result = Verifier.verifyFromAST(AST);
    const result_HTML = document.createElement("p");
    result_HTML.textContent = result.message;

    if (!result.valid) {
      const location = document.createElement("p");
      location.textContent = `Step: ${result.errorStep}`;
      if (result.errorSrcLine) {
        location.textContent += `, Src Line: ${result.errorSrcLoc.first_line}`;
      }
      result_HTML.appendChild(location);
      resultBox.className = resultBox.className.replace(
        /alert-\w*/,
        "alert-warning",
      );
    } else {
      resultBox.className = resultBox.className.replace(
        /alert-\w*/,
        "alert-success",
      );
    }
    const sorries = document.createElement("p");
    sorries.textContent = `Remaining sorries: ${result.remainingSorries}`;
    result_HTML.appendChild(sorries);

    resultElement.innerHTML = "";
    resultElement.appendChild(result_HTML);
  } catch (ex) {
    resultElement.innerHTML = ex;
    resultBox.className = resultBox.className.replace(
      /alert-\w*/,
      "alert-danger",
    );
  }

  const HTML = render(AST, { parentheses: parentheses.value });
  renderPanel.innerHTML = "";
  renderPanel.appendChild(HTML);
}

parentheses.addEventListener("change", updateOutputSection);

const exampleButtons = document.querySelectorAll("button.example");
exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    proofInput.dispatch({
      changes: {
        from: 0,
        to: proofInput.state.doc.length,
        insert: examples.examples[button.value].join("\n"),
      },
    });
  });
});

const clearButton = document.getElementById("clear-input");
clearButton.addEventListener("click", () => {
  proofInput.dispatch({
    changes: {
      from: 0,
      to: proofInput.state.doc.length,
      insert: "",
    },
  });
});

/*!
 * Based on toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */
const getStoredTheme = () => localStorage.getItem("theme");
const setStoredTheme = (theme) => localStorage.setItem("theme", theme);

const getPreferredTheme = () => {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const setTheme = (theme) => {
  if (theme === "auto") {
    document.documentElement.setAttribute(
      "data-bs-theme",
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  } else {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }
};

setTheme(getPreferredTheme());

const showActiveTheme = (theme) => {
  const themeSwitcher = document.querySelector("#bd-theme");
  const themeSwitcherText = document.querySelector("#bd-theme-text");
  const btnToActive = document.querySelector(
    `[data-bs-theme-value="${theme}"]`,
  );

  document.querySelectorAll("[data-bs-theme-value]").forEach((element) => {
    element.classList.remove("active");
    element.setAttribute("aria-pressed", "false");
  });

  btnToActive.classList.add("active");
  btnToActive.setAttribute("aria-pressed", "true");
  const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`;
  themeSwitcher.setAttribute("aria-label", themeSwitcherLabel);
};

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    const storedTheme = getStoredTheme();
    if (storedTheme !== "light" && storedTheme !== "dark") {
      setTheme(getPreferredTheme());
    }
  });

window.addEventListener("DOMContentLoaded", () => {
  showActiveTheme(getPreferredTheme());

  document.querySelectorAll("[data-bs-theme-value]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const theme = toggle.getAttribute("data-bs-theme-value");
      setStoredTheme(theme);
      setTheme(theme);
      showActiveTheme(theme);
    });
  });
});

const examples = {
  examples: {
    0: [
      "1 Ax.P(c, x)   : premise",
      "| with x0",
      "2 | P(c,x0)    : A.x/x0 e 1",
      "3 | Ey.P(y,x0) : E.y/c i 2",
      "4 Ax.Ey.P(y,x) : A.x/x0 i 2-3",
    ],
    1: [
      "1 r and u -> w : premise",
      "2 u and ~w     : premise",
      "3 | r",
      "4 | u          : and e1 2",
      "5 | r and u    : and i 3,4",
      "6 | w          : -> e 1, 5",
      "7 | ~w         : and e2 2",
      "8 | _|_        : neg e 6,7",
      "9 ~r           : neg i 3-8",
    ],
    2: [
      "# To use lemmas and previous results, you can include them as extra premises",
      "",
      "~(Ex.~P(x)) -> Ax.~~P(x) : premise example",
      "~(Ax.P(x))",
      "| ~(Ex.~P(x))",
      "| Ax.~~P(x)              : -> e 1,3",
      "|| with x0",
      "|| ~~P(x0)               : A.x/x0 e 4",
      "||| ~P(x0)",
      "||| _|_                  : neg e 5,6",
      "|| P(x0)                 : contra 6-7",
      "| Ax.P(x)                : A.x/x0 i 5-8",
      "| _|_                    : neg e 2,9",
      "Ex.~P(x)                 : contra 3-10",
    ],
    3: [
      "~(Ax.P(x) -> D(x)) -> (Ex. P(x) & ~D(x))",
      "Ex.P(x)",
      "(Ax.P(x) -> D(x)) ∨ ~(Ax.P(x) -> D(x))     : lem",
      "| Ax.P(x) -> D(x)",
      "|| with x0",
      "|| P(x0)",
      "||| P(x0) & D(x0)",
      "||| Ax.P(x) -> D(x)                        : copy 4",
      "|| (P(x0) & D(x0) -> (Ax.P(x) -> D(x)))    : -> i 6-7",
      "|| (Ey. P(y) & D(y) -> (Ax.P(x) -> D(x)))  : E.y/x0 i 8",
      "| (Ey. P(y) & D(y) -> (Ax.P(x) -> D(x)))   : E.x/x0 e 2, 5-9",
      "------",
      "| ~(Ax.P(x) -> D(x))",
      "| (Ex. P(x) & ~D(x))                       : -> e 1, 11",
      "|| with x0",
      "|| P(x0) & ~D(x0)",
      "||| P(x0) & D(x0)",
      "||| ~D(x0)                                 : and e2 13",
      "||| D(x0)                                  : and e2 14",
      "||| _|_                                    : neg e 15,16",
      "||| Ax.P(x) -> D(x)                        : bot e 17",
      "|| (P(x0) & D(x0) -> (Ax.P(x) -> D(x)))    : -> i 14-18",
      "|| (Ey. P(y) & D(y) -> (Ax.P(x) -> D(x)))  : E.y/x0 i 19",
      "| (Ey. P(y) & D(y) -> (Ax.P(x) -> D(x)))   : E.x/x0 e 12, 13-20",
      "------",
      "(Ey. P(y) & D(y) -> (Ax.P(x) -> D(x)))     : or e 3, 4-10, 11-21",
    ],
    4: [
      "An. L(n,n)",
      "An.Am. L(n,m) -> L(n, s(m))",
      "L(z,z)                       : B.n/z 1",
      "L(z,s(z))                    : B.n/z;m/z 2,3",
      "Em. L(z, m)                  : E.m/s(z) i 4",
    ],
    5: [
      "# We write o for 1, and p(x,y) for x + y.",
      "# We also leave of the quantifier range to not overload the proof, as we do not have definitions available here.",
      "",
      "| with x0",
      "|| Ey. x0 = p(y,y)",
      "||| with y0",
      "||| x0 = p(y0,y0)",
      "||| p(x0, o) = p(x0, o)                              : = i",
      "||| p(x0, o) = p(p(y0,y0), o)                        : = e 2,3",
      "||| Ey. p(x0, o) = p(p(y,y), o)                      : E.y/y0 i 4",
      "|| Ey. p(x0, o) = p(p(y,y), o)                       : E.y/y0 e 1,2-5",
      "| (Ey. x0 = p(y,y)) -> Ey. p(x0, o) = p(p(y,y), o)   : -> i 1-6",
      "Ax. (Ey. x = p(y,y)) -> (Ey. p(x, o) = p(p(y,y), o)) : A.x/x0 i 1-7",
    ],
    6: [
      "# This is a possible solution to the exam question that asks for a proof of a formula from",
      "# the given formulas, here in lines 1 - 3.",
      "",
      "1  (Ex0. Ax1. x0 = i(g(x0), i(x1 , i(x0 , x1)))) & (Ax2. x2 = x2)",
      "2  (Ex3. O(i(i(g(x3), d(x3 , x3 , x3)), x3), x3 , x3) & T(x3)) & (Ax4. x4 = x4)",
      "3  Ex5. (Ax6. x6 = g(g(d(x5 , x6 , x5)))) v x5 = x5",
      "4  Ex0. Ax1. x0 = i(g(x0), i(x1 , i(x0 , x1))) : and e1 1",
      "   | with y0",
      "5  | Ax1. y0 = i(g(y0), i(x1 , i(y0 , x1)))",
      "6  | y0 = i(g(y0), i(y0 , i(y0 , y0)))         : A.x1/y0 e 5",
      "7  || T(y0)",
      "8  || T(i(g(y0), i(y0 , i(y0 , y0))))          : = e 6,7",
      "9  | T(y0) -> T(i(g(y0), i(y0 , i(y0 , y0))))  : -> i 7-8",
      "10 | Ey. T(y) -> T(i(g(y), i(y , i(y , y))))   : E.y/y0 i 9",
      "11 Ey. T(y) -> T(i(g(y), i(y , i(y , y))))     : E.x0/y0 e 4, 5-10",
    ],
    7: [
      "# Horn theory exam exercise",
      "# We use the following interpretation:",
      "# d(x, y, z) : assigns to the colour combination of hair, paints and shows a person with that colour combination",
      "# g(x)       : maps x to the next colour",
      "# i(p, x)    : maps (p,x) to next person after p with pants colour x",
      "# O(p, q, x) : person p sees person q with pants colour x",
      "# T(x)       : x is a colour",
      "# Q()        : someone has a yellow backpack",
      "# We introduce one extra constant c for the base colour",
      "",
      "Ap. O(p, p, c)",
      "Ap. Aq. Ax. O(p, q, x) & T(x) -> O(p, i(q, x), g(x))",
      "Ax. T(x) -> T(g(x))",
      "T(c)",
      "# ----------------------",
      "O(d(c,c,c), d(c,c,c), c)                                                   : B.p/d(c,c,c) 1",
      "O(d(c,c,c), i(d(c,c,c), c), g(c))                                          : B.p/d(c,c,c); q/d(c,c,c); x/c 2,5,4",
      "T(g(c))                                                                    : B.x/c 3,4",
      "O(d(c,c,c), i(i(d(c,c,c), c), g(c)), g(g(c)))                              : B.p/d(c,c,c); q/i(d(c,c,c), c); x/g(c) 2,6,7",
      "T(g(g(c)))                                                                 : B.x/g(c) 3,7",
      "O(d(c,c,c), i(i(i(d(c,c,c), c), g(c)), g(g(c))), g(g(g(c))))               : B.p/d(c,c,c); q/i(i(d(c,c,c), c), g(c)); x/g(g(c)) 2,8,9",
      "T(g(g(c))) & O(d(c,c,c), i(i(i(d(c,c,c), c), g(c)), g(g(c))), g(g(g(c))))  : and i 9,10",
      "Eq. T(g(g(c))) & O(d(c,c,c), q, g(g(g(c))))                                : E.q/i(i(i(d(c,c,c),c),g(c)),g(g(c))) i 11",
      "Ex. Eq. T(x) & O(d(c,c,c), q, g(x))                                        : E.x/g(g(c)) i 12",
      "Ep. Ex. Eq. T(x) & O(p, q, g(x))                                           : E.p/d(c,c,c) i 13",
    ],
    8: [
      "# You may use the admissible rules for symmetry and transitivity as follows.",
      "# First turn these rules into Horn clauses like so:",
      "Ax. Ay. x = y -> y = x : premise # (Sym) proven in theorem 9.10",
      "Ax. Ay. Az. x = y & y = z -> x = z : premise # (Trans) proven in theorem 9.10",
      "# Then you can use these Horn clauses easily with the backchaining rule in proofs:",
      "a = b",
      "b = c",
      "a = c : B.x/a;y/b;z/c 2,3,4",
    ],
    9: [
      "1 A x.(P(x) -> ~Q(x))",
      "2 | E x.(P(x) and Q(x))    : assumption",
      "  || with x0",
      "3 || P(x0) and Q(x0)       : assumption",
      "4 || P(x0)                 : and elim1 3",
      "5 || P(x0) -> ~Q(x0)       : A.x/x0 elim 1",
      "6 || ~Q(x0)                : -> e 5,4",
      "7 || Q(x0)                 : and elim2 3",
      "8 || _|_                   : neg elim 6,7",
      "   ---",
      "9 | _|_                    : E.x/x0 elim 2,3-8",
      "  ---",
      "10 ~(E x. (P(x) and Q(x))) : neg introduction 2-9",
    ],
    10: [
      "# One can use Proof Rondo to just check the syntactic correctness of formulas.",
      "# For instance, the following is the failure model for a train crossing from the first lecture.",
      "",
      "TrainArrives → ClosingSignal",
      "¬CommunicationFailure ∧ ClosingSignal → BarrierClosed",
      "¬TrainStops ∧ TrainArrives → TrainOnCrossing",
      "¬BarrierClosed ∧ TrainArrives → TrainBrakes",
      "¬BrakeFailure ∧ TrainBrakes → TrainStops",
      "TrainOnCrossing ∧ BarrierOpen → Unsafe",
    ],
  },
};

// Set the input field to the default proof and have it verified
proofInput.dispatch({
  changes: {
    from: 0,
    to: proofInput.state.doc.length,
    insert: examples.examples[10].join("\n"),
  },
});
