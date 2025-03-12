import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.mocha },
    },
  },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
];
