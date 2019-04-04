module.exports = {
  root: true,
  env: {
    node: true
  },
  plugins: ["vue", "prettier"],
  extends: [
    "plugin:vue/essential",
    "plugin:prettier/recommended",
    "@vue/prettier",
    "@vue/typescript"
  ],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "comma-dangle": ["error", "never"]
  },
  parserOptions: {
    parser: "@typescript-eslint/parser"
  }
};
