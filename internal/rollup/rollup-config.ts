import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const pkg = require("../../package.json");

const LIBRARY_NAME = "react-hooks";

export default {
  external: ["react", "react-dom"],
  globals: {
    react: "React",
    "react-dom": "ReactDOM",
  },
  input: "src/index.ts",
  output: [
    { file: pkg.main, format: "umd", name: LIBRARY_NAME, sourcemap: true },
    { file: pkg.module, format: "es", sourcemap: true },
  ],
  plugins: [json(), typescript({ module: "esnext" }), commonjs(), resolve()],
  watch: { include: "src/**" },
};
