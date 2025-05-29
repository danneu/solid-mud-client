import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import solid from "eslint-plugin-solid";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      solid,
      "unused-imports": unusedImports,
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],

      // SolidJS rules
      "solid/reactivity": "warn",
      "solid/no-destructure": "warn",
      "solid/jsx-no-undef": "error",
      "solid/prefer-for": "warn",

      // General rules
      "no-console": ["warn", { allow: ["warn", "error", "log"] }], // Allow console.log for now
      "no-debugger": "warn",
      "no-unused-vars": "off", // Using TypeScript's version instead
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["warn", "always", { null: "ignore" }],
      "no-control-regex": "off", // Allow control characters in regex for ANSI parsing
    },
  },
  {
    // Ignore patterns
    ignores: [
      "dist/",
      "node_modules/",
      "telnet-proxy/",
      "*.config.js",
      "*.config.ts",
      "public/",
    ],
  },
];
