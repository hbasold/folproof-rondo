#!/usr/bin/env node

import parser from "./folproof-parser.js";
import { Verifier } from "./src/verifier.mjs";
import { debugMessage } from "./src/util.mjs";
import { setDebugMode, successColour, errorColour } from "./src/config.mjs";

import { Command } from "commander";

import fs from "node:fs";
import path from "node:path";

const packageJSON = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const program = new Command();
program
  .name(packageJSON.name)
  .description(
    "Logic Rondo\nA JavaScript First-Order Logic (FOL) proof verifier.",
  )
  .option("-d, --debug, --verbose", "extra verbose output")
  .version(packageJSON.version)
  .argument("<file>", ".folproof source file")
  .showHelpAfterError("(add --help for additional information)");

program.parse(process.argv);
const file_path = program.args[0];
const options = program.opts();

setDebugMode(options.debug);
debugMessage("Debug mode is enabled!");

try {
  const content = fs.readFileSync(path.normalize(file_path), "utf8");
  debugMessage("File has been read.");
  let ast = parser.parse(content);
  debugMessage("File content has been parsed.");
  let result = Verifier.verifyFromAST(ast);
  debugMessage("AST has been verified, with as result:");
  console.log(successColour(JSON.stringify(result, null, 2)));
} catch (ex) {
  console.log(errorColour("ERROR: ", ex.toString()));
}
