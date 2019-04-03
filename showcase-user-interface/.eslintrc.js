module.exports = {
  root: true,

  parserOptions: {
    sourceType: "module",
    parser: "@typescript-eslint/parser"
  },

  env: {
    browser: true,
    node: true
  },

  plugins: ["vue", "prettier"],

  rules: {
    "prettier/prettier": "error",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off"
  },

  extends: [
    "prettier",
    "prettier/standard",
    "plugin:vue/recommended",
    "plugin:vue/essential",
    "@vue/prettier",
    "@vue/typescript"
  ]
};
