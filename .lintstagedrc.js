const path = require("path");

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

module.exports = {
  "*.{js,jsx,ts,tsx}": [buildEslintCommand],
  "**/*": "prettier --write --ignore-unknown",
  // Solution from: https://github.com/lint-staged/lint-staged/issues/825#issuecomment-620018284
  "*.{ts,tsx}": () => "tsc --skipLibCheck --noEmit",
};
