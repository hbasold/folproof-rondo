import parser from "../folproof-parser.js";
import { Verifier } from "../src/verifier.mjs";
import fs from "node:fs";
import path from "node:path";
import { strict as assert } from 'node:assert';

const case_studies_folder = "test/case-studies";
const folder_content = fs.readdirSync(case_studies_folder);

describe("Case studies", function () {
  folder_content.forEach((file_name) => {
    it(`File ${file_name} parses and validates`, function () {
      const filepath = path.join(case_studies_folder, file_name);
      const case_study_content = fs.readFileSync(filepath, "utf8");
      const AST = parser.parse(case_study_content);
      assert.ok(AST, "Case study should be parsable");
      const result = Verifier.verifyFromAST(AST);
      assert.ok(result.valid, "Parsed case study should be a valid proof");
    });
  });
});
