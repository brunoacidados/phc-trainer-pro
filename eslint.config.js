// ESLint flat config — monorepo PHC Trainer Pro
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      // app legado (raiz) — mantido apenas para GitHub Pages até à migração completa
      "index.html",
      "sw.js",
      "worker/**",
      "scripts/**",
      // app Next.js autónoma (edição TDAH) — tem o seu próprio ESLint/tsconfig
      "apps-next/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // scripts utilitários em JS puro (ex.: apps/api/scripts/dev-mongo.mjs)
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2022 },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
