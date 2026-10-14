// Runs the whole flow on a throwaway local chain (ganache, chain id 10143) before touching
// Monad testnet: deploy, then the honest, explained and markup scenarios, then checks the
// final onchain state of each deal and the contract guards.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import ganache from "ganache";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, ".env")));
const keyOf = (name) => env[`${name}_PRIVATE_KEY`].trim().split(/\s+/)[0];

const PORT = 8546;
const server = ganache.server({
  chain: { chainId: 10143, hardfork: "shanghai" },
  wallet: { accounts: ["DEPLOYER", "VERIFIER", "STARTUP"].map((n) => ({ secretKey: keyOf(n), balance: "0x56BC75E2D63100000" })) },
  logging: { quiet: true },
  miner: { instamine: "eager" },
});
await server.listen(PORT);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "telisik-local-"));
const childEnv = {
  ...process.env,
  MONAD_RPC_URL: `http://127.0.0.1:${PORT}`,
  TELISIK_DEPLOYMENT_FILE: path.join(tmp, "deployment.json"),
  TELISIK_RUNS_DIR: path.join(tmp, "runs"),
};
// Children run asynchronously: the ganache server lives in this process and must keep answering.
const run = (script, ...args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [path.join(ROOT, "scripts", script), ...args], { env: childEnv, stdio: "inherit" });
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${script} ${args.join(" ")} exited with ${code}`))));
});

let failed = false;
try {
  await run("deploy.mjs");
  for (const s of ["honest", "explained", "markup"]) await run("demo.mjs", s);

  // Check final states straight from the chain.
  process.env.MONAD_RPC_URL = childEnv.MONAD_RPC_URL;
  process.env.TELISIK_DEPLOYMENT_FILE = childEnv.TELISIK_DEPLOYMENT_FILE;
  const { publicClient, artifacts, deployment, roles } = await import("../shared/chain.mjs");
  const dep = deployment();
  const a = artifacts();
  const escrow = { address: dep.contracts.TelisikEscrow, abi: a.TelisikEscrow.abi };
  const STATES = ["Locked", "Reported", "Released", "Frozen", "Refunded"];
  const expected = {
    1: { released: 200000, frozen: false, states: ["Released", "Released", "Locked"] }, // honest
    2: { released: 200000, frozen: false, states: ["Released", "Released", "Locked"] }, // explained, GP override
    3: { released: 100000, frozen: true, states: ["Released", "Frozen", "Frozen"] }, // markup
  };
  console.log("\nChecking final state:");
  for (const [id, want] of Object.entries(expected)) {
    const d = await publicClient.readContract({ ...escrow, functionName: "deals", args: [BigInt(id)] });
    const states = [];
    for (let t = 1; t <= 3; t++) {
      const tr = await publicClient.readContract({ ...escrow, functionName: "tranches", args: [BigInt(id), BigInt(t)] });
      states.push(STATES[Number(tr[2])]);
    }
    const released = Number(d[4]) / 1e6;
    const ok = released === want.released && d[5] === want.frozen && states.join() === want.states.join();
    if (!ok) failed = true;
    console.log(`  ${ok ? "PASS" : "FAIL"} deal #${id}: released ${released}, frozen ${d[5]}, tranches ${states.join(" / ")}`);
  }

  // Guards: nobody but the GP releases, and a frozen deal stays frozen.
  const expectRevert = async (label, fn) => {
    try { await fn(); failed = true; console.log(`  FAIL ${label}: did not revert`); }
    catch { console.log(`  PASS ${label}: reverted`); }
  };
  await expectRevert("startup cannot release", () => publicClient.simulateContract({ ...escrow, functionName: "release", args: [1n, 3n], account: roles.startup().account }));
  await expectRevert("verifier cannot release", () => publicClient.simulateContract({ ...escrow, functionName: "overrideRelease", args: [1n, 3n, "x"], account: roles.verifier().account }));
  await expectRevert("frozen deal cannot release", () => publicClient.simulateContract({ ...escrow, functionName: "overrideRelease", args: [3n, 2n, "x"], account: roles.gp().account }));
  await expectRevert("unreported tranche cannot release", () => publicClient.simulateContract({ ...escrow, functionName: "release", args: [1n, 3n], account: roles.gp().account }));
} catch (error) {
  failed = true;
  console.error(error.message);
} finally {
  await server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(failed ? "\nLOCAL TEST FAILED" : "\nLOCAL TEST PASSED");
process.exit(failed ? 1 : 0);
