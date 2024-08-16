import chalk from "chalk";

let debugMode = false;

function setDebugMode(value) {
  debugMode = value;
}

function getDebugMode() {
  return debugMode;
}

const successColour = chalk.green;
const errorColour = chalk.red;
const warningColour = chalk.hex("#FFA500");
const noticeColour = chalk.blue;

const default_render_options = {
  parentheses: "user",
};

export {
  setDebugMode,
  getDebugMode,
  successColour,
  errorColour,
  warningColour,
  noticeColour,
  default_render_options,
};
