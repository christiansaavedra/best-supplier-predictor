import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules", "**/.next", "**/dist", "apps/api/drizzle", "apps/web/next-env.d.ts"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // Express error handlers need all four arguments, even unused ones.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Allows augmenting library types (e.g. adding req.user to Express).
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
    },
  },
  {
    files: ["apps/api/**/*.ts", "packages/**/*.ts", "*.mjs"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin, "react-hooks": reactHooks },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    settings: { next: { rootDir: "apps/web" } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
);
