// Compiles contracts/*.sol with solc-js and writes ABI + bytecode to build/contracts.json.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const solc = require("solc");

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const contractsDir = path.join(root, "contracts");

const sources = {};
for (const file of fs.readdirSync(contractsDir).filter((f) => f.endsWith(".sol"))) {
  sources[`contracts/${file}`] = { content: fs.readFileSync(path.join(contractsDir, file), "utf8") };
}

function findImports(importPath) {
  const candidates = [path.join(root, "node_modules", importPath), path.join(root, importPath)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, "utf8") };
  }
  return { error: `Import not found: ${importPath}` };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    evmVersion: "paris",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors ?? []).filter((e) => e.severity === "error");
for (const e of output.errors ?? []) console.log(`${e.severity}: ${e.formattedMessage}`);
if (errors.length) process.exit(1);

const artifacts = {};
for (const [file, contracts] of Object.entries(output.contracts)) {
  if (!file.startsWith("contracts/")) continue;
  for (const [name, c] of Object.entries(contracts)) {
    artifacts[name] = { abi: c.abi, bytecode: `0x${c.evm.bytecode.object}` };
  }
}
fs.mkdirSync(path.join(root, "build"), { recursive: true });
fs.writeFileSync(path.join(root, "build", "contracts.json"), JSON.stringify(artifacts, null, 2));
console.log(`Compiled: ${Object.keys(artifacts).join(", ")}`);
