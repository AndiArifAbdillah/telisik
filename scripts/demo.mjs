// End-to-end demo on Monad testnet:
//   node scripts/demo.mjs <honest|explained|markup>
// GP locks 300,000 dUSDC in 3 tranches, tranche 1 is released on signing, the startup submits
// its tranche-2 spending report, the verifier checks it and writes an attestation, and the GP acts.
import fs from "node:fs";
import path from "node:path";
import { keccak256, parseUnits, stringToHex, formatUnits } from "viem";
import { ROOT, EXPLORER, artifacts, deployment, publicClient, roles, send } from "../shared/chain.mjs";
import { applyGuardrails, canonicalJson, checkReport } from "../verifier/engine.mjs";
import { askJev } from "../verifier/jev.mjs";

const scenario = process.argv[2] ?? "markup";
const reportFile = path.join(ROOT, "data", "reports", `${scenario}.json`);
if (!fs.existsSync(reportFile)) {
  console.error(`Unknown scenario "${scenario}". Use honest, explained or markup.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
const prices = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "market-prices.json"), "utf8"));
const dep = deployment();
const a = artifacts();
const gp = roles.gp();
const startup = roles.startup();
const verifier = roles.verifier();

const escrow = { address: dep.contracts.TelisikEscrow, abi: a.TelisikEscrow.abi };
const registry = { address: dep.contracts.AttestationRegistry, abi: a.AttestationRegistry.abi };
const token = { address: dep.contracts.DemoUSDC, abi: a.DemoUSDC.abi };

const TRANCHE = parseUnits("100000", 6);
const TOTAL = TRANCHE * 3n;

console.log(`\nTelisik demo · scenario: ${scenario}`);
console.log("1. GP locks 300,000 dUSDC in TelisikEscrow (3 tranches)");
const have = await publicClient.readContract({ ...token, functionName: "balanceOf", args: [gp.account.address] });
if (have < TOTAL) await send(gp, { ...token, functionName: "mint", args: [gp.account.address, TOTAL - have] });
await send(gp, { ...token, functionName: "approve", args: [escrow.address, TOTAL] });
const created = await send(gp, { ...escrow, functionName: "createDeal", args: [startup.account.address, token.address, [TRANCHE, TRANCHE, TRANCHE]] });
const dealId = await publicClient.readContract({ ...escrow, functionName: "dealCount" });
console.log(`  deal #${dealId} (block ${created.blockNumber})`);
await send(gp, { ...escrow, functionName: "deposit", args: [dealId, TOTAL] });

console.log("2. Tranche 1 released on signing");
await send(gp, { ...escrow, functionName: "releaseOnSigning", args: [dealId] });

console.log("3. AquaTech submits its tranche-2 spending report");
const dataHash = keccak256(stringToHex(canonicalJson(report)));
await send(startup, { ...escrow, functionName: "submitReport", args: [dealId, 2n, dataHash] });

console.log("4. Telisik checks every line item against the market");
const check = checkReport(report, prices);
for (const i of check.items) {
  console.log(`  ${i.name.padEnd(22)} Rp${i.unitPriceRp.toLocaleString("id-ID").padStart(9)} vs median Rp${String(i.medianRp?.toLocaleString("id-ID")).padStart(7)}  ${String(i.ratio).padStart(5)}x  ${i.level}`);
}
if (check.newVendor) console.log(`  vendor ${report.vendor.name}: registered ${report.vendor.registeredDaysAgo} days ago`);
const jev = await askJev(check);
if (jev) console.log(`  Jev: ${jev.action} (confidence ${jev.confidence.toFixed(2)}), risk ${jev.riskScore}/4`);
const final = applyGuardrails(check, jev);
const model = jev ? `${dep.rulesVersion ?? "rules-v1"}+${jev.model}` : "rules-v1";
console.log(`  Decision: ${final.decision.toUpperCase()} · risk ${final.riskScore}/4 · ${final.reason}`);

const result = { scenario, dealId: Number(dealId), tranche: 2, dataHash, decision: final.decision, riskScore: final.riskScore, reason: final.reason, model, jev, check, report, at: new Date().toISOString() };
const resultHash = keccak256(stringToHex(canonicalJson({ ...result, at: undefined })));
const subject = await publicClient.readContract({ ...escrow, functionName: "subjectOf", args: [dealId, 2n] });

console.log("5. Verifier writes the attestation to AttestationRegistry");
await send(verifier, { ...registry, functionName: "record", args: [subject, dataHash, resultHash, final.riskScore, final.decision === "pass", model] });

console.log("6. GP acts on the result");
const txs = {};
if (final.decision === "pass") {
  txs.release = (await send(gp, { ...escrow, functionName: "release", args: [dealId, 2n] })).transactionHash;
} else if (final.decision === "freeze") {
  const why = `Price far above market: ${check.findings.filter((f) => f.kind === "price").map((f) => `${f.item} ${f.ratio}x`).join(", ")}`;
  await send(verifier, { ...escrow, functionName: "proposeFreeze", args: [dealId, why] });
  txs.freeze = (await send(gp, { ...escrow, functionName: "freeze", args: [dealId, why] })).transactionHash;
} else {
  const explanation = check.items.find((i) => i.explanation)?.explanation;
  if (explanation) {
    const why = `GP reviewed the explanation: ${explanation}`;
    txs.override = (await send(gp, { ...escrow, functionName: "overrideRelease", args: [dealId, 2n, why] })).transactionHash;
  } else {
    console.log("  Waiting for the GP: no explanation submitted yet.");
  }
}

const deal = await publicClient.readContract({ ...escrow, functionName: "deals", args: [dealId] });
const escrowBalance = await publicClient.readContract({ ...token, functionName: "balanceOf", args: [escrow.address] });
console.log(`\nDeal #${dealId}: released ${formatUnits(deal[4], 6)} dUSDC, frozen=${deal[5]}, held in escrow ${formatUnits(escrowBalance, 6)} dUSDC (all deals)`);
console.log(`Escrow: ${EXPLORER}/address/${escrow.address}`);

const runsDir = path.join(ROOT, "web", "runs");
fs.mkdirSync(runsDir, { recursive: true });
fs.writeFileSync(path.join(runsDir, `deal-${dealId}.json`), JSON.stringify({ ...result, resultHash, subject, txs }, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
const indexFile = path.join(runsDir, "index.json");
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, "utf8")) : [];
index.push({ dealId: Number(dealId), scenario, decision: final.decision, file: `deal-${dealId}.json` });
fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
