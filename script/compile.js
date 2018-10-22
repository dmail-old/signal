const {
  compileFileStructure,
  createCorePluginMap,
} = require("@dmail/project-structure-compile-babel")
const path = require("path")

const pluginMap = createCorePluginMap({
  "proposal-json-strings": {},
  "proposal-object-rest-spread": {},
  "proposal-optional-catch-binding": {},
  "transform-arrow-functions": {},
  "transform-block-scoped-functions": {},
  "transform-block-scoping": {},
  "transform-classes": {},
  "transform-computed-properties": {},
  "transform-destructuring": {},
  "transform-dotall-regex": {},
  "transform-duplicate-keys": {},
  "transform-exponentiation-operator": {},
  "transform-function-name": {},
  "transform-literals": {},
  "transform-modules-commonjs": {},
  "transform-parameters": {},
  "transform-shorthand-properties": {},
  "transform-spread": {},
  "transform-sticky-regex": {},
  "transform-template-literals": {},
  "transform-typeof-symbol": {},
  "transform-unicode-regex": {},
})

compileFileStructure({
  root: path.resolve(__dirname, "../"),
  config: "structure.config.js",
  predicate: ({ compile }) => compile,
  into: "dist",
  platformName: "node",
  platformVersion: "8.0",
  pluginMap,
})
