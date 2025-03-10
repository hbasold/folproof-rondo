import parser from "../../folproof-parser.js";
import { Verifier } from "../../src/verifier.mjs";
import { render } from "../../folproof-web.mjs";

import { folLanguage } from "./fol-syntax.mjs";

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
  insertTab,
  indentLess,
  history,
  historyKeymap,
  defaultKeymap,
} from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";

/**
 * Register service worker for offline support.
 *
 * @returns {Promise<void>} resolves when the service worker is registered
 */
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("service-worker.js", {
        scope: "./",
      });
    } catch (error) {
      console.error(`Service worker registration failed with: ${error}`);
    }
  }
}

void registerServiceWorker();

class LineNumberFormatter {
  constructor() {
    this.skippedLineCount = 0;
  }

  skipLines(lineNo, state) {
    if (lineNo >= 1 && lineNo <= state.doc.lines) {
      const line = state.doc.line(lineNo);
      // Skip comments, closing lines, and empty lines
      if (/^\s*(#.*|-+)?$/.test(line.text)) {
        this.skippedLineCount++;
        return "";
      }
    }

    return String(lineNo - this.skippedLineCount);
  }

  reset() {
    this.skippedLineCount = 0;
  }
}

const lineNumberFormatter = new LineNumberFormatter();

/**
 * The editor view for the proof input.
 *
 * @type {EditorView} the editor view
 */
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
    folLanguage(),
    lineNumbers({
      formatNumber: (lineNo, state) =>
        lineNumberFormatter.skipLines(lineNo, state),
    }),
    EditorView.updateListener.of((update) => {
      lineNumberFormatter.reset();
      if (update.docChanged) {
        updateOutputSection();
      }
    }),
    keymap.of([
      ...historyKeymap,
      ...defaultKeymap,
      { key: "Tab", run: insertTab },
      { key: "Shift-Tab", run: indentLess },
    ]),
  ],
});

const resultBox = document.getElementById("result-box");
const resultElement = document.getElementById("result");
const renderPanel = document.getElementById("render-panel");

const parentheses = document.getElementById("parentheses-setting");
const restrictPropositional = document.getElementById("propositional-setting");
restrictPropositional.addEventListener("change", updateOutputSection);

const signatureFunction = document.getElementById("signature-function-input");
signatureFunction.addEventListener("input", updateOutputSection);
const signatureRelation = document.getElementById("signature-relation-input");
signatureRelation.addEventListener("input", updateOutputSection);

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
    const result = Verifier.verifyFromAST(
      AST,
      restrictPropositional.checked,
      (signatureFunction.value + " " + signatureRelation.value).trim(),
    );
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

const layoutSetting = document.getElementById("layout-setting");

/**
 * Update the layout based on the current setting(s).
 */
function updateLayout() {
  const inputContainer = document.getElementById("proof-input-col");
  const layoutChoice = localStorage.getItem("layoutChoice") || "side";
  layoutSetting.value = layoutChoice;

  if (layoutChoice === "side") {
    inputContainer.classList.add("col-lg-7");
  } else {
    inputContainer.classList.remove("col-lg-7");
  }
}

layoutSetting.addEventListener("change", (event) => {
  localStorage.setItem("layoutChoice", event.target.value);
  updateLayout();
});

updateLayout();

/*!
 * Based on toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011- The Bootstrap Authors
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

/**
 * Load examples from the examples.json file and populate display elements.
 *
 * @returns {Promise<void>} resolves when examples are loaded
 */
async function loadExamples() {
  try {
    const response = await fetch("assets/examples.json");
    const data = await response.json();

    const proofs = data.proofs;
    createExampleDropdown(proofs);
    createExampleNavbar(proofs);

    const defaultID = data.default;
    if (defaultID in proofs) {
      proofInput.dispatch({
        changes: {
          from: 0,
          to: proofInput.state.doc.length,
          insert: proofs[defaultID].proof.join("\n"),
        },
      });
    }
  } catch (error) {
    console.error(`Failed to load examples: ${error}`);
  }
}

/**
 * Create a dropdown menu of example proofs.
 *
 * Used on small screens.
 *
 * @param proofs {Object} the example proofs
 */
function createExampleDropdown(proofs) {
  const dropdownMenu = document.getElementById("example-dropdown");

  for (const key in proofs) {
    const listItem = document.createElement("li");
    const button = createExampleButton(proofs[key], true);
    listItem.appendChild(button);
    dropdownMenu.appendChild(listItem);
  }
}

/**
 * Create a set of buttons for example proofs.
 *
 * Used on larger screens.
 *
 * @param proofs {Object} the example proofs
 */
function createExampleNavbar(proofs) {
  const container = document.getElementById("example-buttons");

  const categories = new Map();
  for (const key in proofs) {
    const proofObject = proofs[key];
    const category = proofObject.category || proofObject.name;

    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category).push({
      name: proofObject.name,
      proof: proofObject.proof,
    });
  }

  categories.forEach((examples, category) => {
    if (examples.length === 1) {
      const button = createExampleButton(examples[0]);
      container.appendChild(button);
    } else {
      const fieldset = document.createElement("fieldset");
      fieldset.className = "btn-group";

      const dropdownBtn = document.createElement("button");
      dropdownBtn.type = "button";
      dropdownBtn.className = "btn btn-primary dropdown-toggle";
      dropdownBtn.setAttribute("data-bs-toggle", "dropdown");
      dropdownBtn.setAttribute("aria-expanded", "false");
      dropdownBtn.textContent = category;

      const dropdownMenu = document.createElement("ul");
      dropdownMenu.className = "dropdown-menu";

      examples.forEach((example) => {
        const listItem = document.createElement("li");
        const button = createExampleButton(example, true);
        listItem.appendChild(button);
        dropdownMenu.appendChild(listItem);
      });

      fieldset.appendChild(dropdownBtn);
      fieldset.appendChild(dropdownMenu);
      container.appendChild(fieldset);
    }
  });
}

/**
 * Create a button for an example proof.
 *
 * @param example {Object} the example proof
 * @param isDropdown {boolean} whether the button is for a dropdown menu
 * @returns {HTMLButtonElement} the button element
 */
function createExampleButton(example, isDropdown = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = isDropdown ? "dropdown-item" : "btn btn-primary";
  button.textContent = example.name;

  button.addEventListener("click", () => {
    proofInput.dispatch({
      changes: {
        from: 0,
        to: proofInput.state.doc.length,
        insert: example.proof.join("\n"),
      },
    });
  });

  return button;
}

document.addEventListener("DOMContentLoaded", loadExamples);
