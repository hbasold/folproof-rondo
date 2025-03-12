import chalk from "chalk";

let debugMode = false;

export function setDebugMode(value) {
  debugMode = value;
}

export function getDebugMode() {
  return debugMode;
}

export const successColour = chalk.green;
export const errorColour = chalk.red;
export const warningColour = chalk.hex("#FFA500");
export const noticeColour = chalk.blue;

export const quantifiers = ["forall", "exists"];
export const unary_connectives = ["not"];
export const binary_connectives = ["<->", "->", "and", "or", "="];
export const propositional = ["<->", "->", "and", "or", "not", "bot", "id"]
export const operator_precedence = {
  not: 4,
  "=": 4,
  forall: 1,
  exists: 1,
  and: 3,
  or: 3,
  "->": 2,
  "<->": 2,
};
export const operator_ascii = {
  not: "~",
  "=": "=",
  forall: "A",
  exists: "E",
  and: "&",
  or: "v",
  "->": "->",
  "<->": "<->",
};

export const default_render_options = {
  parentheses: "user",
};
