// Copies what the static dashboard needs into web/: contract addresses, ABIs, the rules engine
// and the demo data. Run after `npm run deploy` (and after demo runs, which write web/runs/).
import fs from "node:fs";
import path from "node:path";
import { ROOT, artifacts, deployment } from "../shared/chain.mjs";

const web = path.join(ROOT, "web");
const dep = deployment();
const a = artifacts();

fs.writeFileSync(path.join(web, "config.json"), JSON.stringify({
  chainId: dep.chainId,
  rpc: "https://testnet-rpc.monad.xyz",
  explorer: dep.explorer,
  contracts: dep.contracts,
  roles: dep.roles,
}, null, 2));
fs.writeFileSync(path.join(web, "abi.json"), JSON.stringify({
  TelisikEscrow: a.TelisikEscrow.abi,
  AttestationRegistry: a.AttestationRegistry.abi,
  DemoUSDC: a.DemoUSDC.abi,
}));
fs.copyFileSync(path.join(ROOT, "verifier", "engine.mjs"), path.join(web, "engine.js"));
fs.mkdirSync(path.join(web, "data", "reports"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "data", "market-prices.json"), path.join(web, "data", "market-prices.json"));
for (const f of fs.readdirSync(path.join(ROOT, "data", "reports"))) {
  fs.copyFileSync(path.join(ROOT, "data", "reports", f), path.join(web, "data", "reports", f));
}
if (!fs.existsSync(path.join(web, "runs", "index.json"))) {
  fs.mkdirSync(path.join(web, "runs"), { recursive: true });
  fs.writeFileSync(path.join(web, "runs", "index.json"), "[]");
}
console.log("web/ is ready: config.json, abi.json, engine.js, data/, runs/");
