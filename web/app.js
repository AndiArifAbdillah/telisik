import { createPublicClient, http, formatUnits, defineChain } from "https://cdn.jsdelivr.net/npm/viem@2.21.55/+esm";
import { checkReport, applyGuardrails } from "./engine.js";

const STATES = ["Locked", "Reported", "Released", "Frozen", "Refunded"];
const DECISION = {
  pass: { cls: "good", text: "Pass" },
  ask_gp: { cls: "warn", text: "Ask GP" },
  freeze: { cls: "bad", text: "Freeze" },
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rp = (n) => (n == null ? "–" : "Rp" + Number(n).toLocaleString("id-ID"));
const short = (h) => (h ? `${h.slice(0, 8)}…${h.slice(-6)}` : "–");

const [config, abi, prices, runsIndex] = await Promise.all([
  fetch("config.json").then((r) => r.json()),
  fetch("abi.json").then((r) => r.json()),
  fetch("data/market-prices.json").then((r) => r.json()),
  fetch("runs/index.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
]);

const monad = defineChain({
  id: config.chainId,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [config.rpc] } },
});
const client = createPublicClient({ chain: monad, transport: http(config.rpc) });
const escrow = { address: config.contracts.TelisikEscrow, abi: abi.TelisikEscrow };
const registry = { address: config.contracts.AttestationRegistry, abi: abi.AttestationRegistry };
const X = config.explorer;

$("links").innerHTML = [
  ["TelisikEscrow", config.contracts.TelisikEscrow],
  ["AttestationRegistry", config.contracts.AttestationRegistry],
  ["DemoUSDC", config.contracts.DemoUSDC],
].map(([n, a]) => `<a href="${X}/address/${a}" target="_blank" rel="noopener">${n} ↗</a>`).join("");

const runs = new Map();
await Promise.all(runsIndex.map(async (r) => {
  try { runs.set(r.dealId, await fetch(`runs/${r.file}`).then((x) => x.json())); } catch { /* run details are optional */ }
}));

async function loadDeal(id) {
  const [deal, subject] = await Promise.all([
    client.readContract({ ...escrow, functionName: "deals", args: [BigInt(id)] }),
    client.readContract({ ...escrow, functionName: "subjectOf", args: [BigInt(id), 2n] }),
  ]);
  const count = Number(deal[6]);
  const tranches = await Promise.all(Array.from({ length: count }, (_, i) =>
    client.readContract({ ...escrow, functionName: "tranches", args: [BigInt(id), BigInt(i + 1)] })));
  const [found, att] = await client.readContract({ ...registry, functionName: "latestForSubject", args: [subject] });
  return { id, deal, tranches, attestation: found ? att : null };
}

function dealCard({ id, deal, tranches, attestation }) {
  const run = runs.get(id);
  const decision = run ? DECISION[run.decision] : null;
  const frozen = deal[5];
  const head = `<div class="deal-head">
      <h3>Deal #${id}${run ? ` · ${esc(run.report.startup)}` : ""}</h3>
      ${decision ? `<span class="chip ${decision.cls}">${decision.text}</span>` : ""}
      ${frozen ? `<span class="chip bad">Deal frozen</span>` : ""}
      ${run?.txs?.override ? `<span class="chip muted">Released by GP override</span>` : ""}
      <span class="label">${run ? esc(run.scenario) + " report" : ""}</span>
    </div>`;
  const trs = tranches.map((t, i) => {
    const state = STATES[Number(t[2])];
    return `<div class="tr ${state}"><div class="t">Tranche ${i + 1}</div><div class="s">${state}</div><div class="a">${Number(formatUnits(t[0], 6)).toLocaleString("en-US")} dUSDC</div></div>`;
  }).join("");
  const att = attestation
    ? `<dl class="kv">
        <dt>Attestation</dt><dd>${attestation.passed ? "passed" : "not passed"} · risk ${attestation.riskScore}/4</dd>
        <dt>Model</dt><dd>${esc(attestation.model)}</dd>
        <dt>Report hash</dt><dd>${short(attestation.dataHash)}</dd>
        <dt>Result hash</dt><dd>${short(attestation.resultHash)}</dd>
        <dt>Recorded</dt><dd>${new Date(Number(attestation.timestamp) * 1000).toLocaleString()}</dd>
      </dl>`
    : `<p class="note">No attestation yet for tranche 2.</p>`;
  const left = `<div>
      <div class="tranches">${trs}</div>
      <dl class="kv">
        <dt>Deposited</dt><dd>${Number(formatUnits(deal[3], 6)).toLocaleString("en-US")} dUSDC</dd>
        <dt>Released</dt><dd>${Number(formatUnits(deal[4], 6)).toLocaleString("en-US")} dUSDC</dd>
      </dl>
      ${att}
      ${run?.txs ? Object.entries(run.txs).map(([k, h]) => `<p class="note"><a href="${X}/tx/${h}" target="_blank" rel="noopener">${esc(k)} transaction ↗</a></p>`).join("") : ""}
    </div>`;
  const items = run?.check?.items ?? [];
  const right = items.length
    ? `<div><div class="scroll"><table>
        <thead><tr><th>Line item (tranche 2 report)</th><th class="num">Reported</th><th class="num">Median</th><th class="num">Ratio</th></tr></thead>
        <tbody>${items.map((i) => `<tr class="${i.level}"><td>${esc(i.name)}${i.explanation ? `<div class="note" style="margin:2px 0 0">${esc(i.explanation)}</div>` : ""}</td><td class="num">${rp(i.unitPriceRp)}</td><td class="num">${rp(i.medianRp)}</td><td class="num r-${i.level}">${i.ratio}×</td></tr>`).join("")}</tbody>
      </table></div>
      ${run.report.vendor ? `<p class="note">Vendor ${esc(run.report.vendor.name)}, registered ${run.report.vendor.registeredDaysAgo} days ago${run.check.newVendor ? " (flagged)" : ""}.</p>` : ""}
      <p class="note">${esc(run.reason)}${run.jev ? ` · Jev: ${esc(run.jev.action)} (${run.jev.confidence.toFixed(2)})` : ""}</p></div>`
    : `<div class="note">Line-item details for this deal are not published.</div>`;
  return `<article class="deal">${head}${left}${right}</article>`;
}

async function refresh() {
  try {
    const count = Number(await client.readContract({ ...escrow, functionName: "dealCount" }));
    const ids = Array.from({ length: count }, (_, i) => count - i);
    const deals = await Promise.all(ids.map(loadDeal));
    $("deals").innerHTML = deals.length ? deals.map(dealCard).join("") : `<div class="empty">No deals yet. Run <code>npm run demo</code> to create one.</div>`;
    const block = await client.getBlockNumber();
    $("live").className = "live ok";
    $("live-text").textContent = `Live · block ${block.toLocaleString("en-US")} · ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    $("live").className = "live err";
    $("live-text").textContent = "Could not reach Monad testnet RPC. Retrying…";
    console.error(error);
  }
}

// ---- playground ----
const samples = {};
for (const s of ["honest", "explained", "markup"]) samples[s] = await fetch(`data/reports/${s}.json`).then((r) => r.json());
let current = structuredClone(samples.markup);

function renderPlay() {
  const check = checkReport(current, prices);
  const final = applyGuardrails(check, null);
  $("play-rows").innerHTML = check.items.map((i, idx) => `<tr class="${i.level}">
      <td>${esc(i.name)}</td><td class="num">${i.qty.toLocaleString("id-ID")}</td>
      <td class="num"><input class="price" id="price-${idx}" data-idx="${idx}" type="number" min="0" step="100" value="${i.unitPriceRp}" aria-label="Reported unit price for ${esc(i.name)}"></td>
      <td class="num">${rp(i.medianRp)}</td><td class="num r-${i.level}">${i.ratio}×</td></tr>`).join("");
  $("play-vendor").textContent = `Vendor ${current.vendor.name}, registered ${current.vendor.registeredDaysAgo} days ago.`;
  const d = DECISION[final.decision];
  const line = final.decision === "freeze" ? "Tranches 2 and 3 stay locked until the startup explains." : final.decision === "ask_gp" ? "The GP reviews the explanation before tranche 2 moves." : "Tranche 2 is released once the GP approves.";
  $("play-decision").innerHTML = `<span class="chip ${d.cls}">${d.text}</span> <span style="margin-left:6px">${line}</span><p class="note">Risk ${final.riskScore}/4 · total above market median ${rp(check.gapRp)}</p>`;
  const f = check.findings.map((x) => x.kind === "price"
    ? `${x.item}: ${rp(x.unitPriceRp)} vs median ${rp(x.medianRp)} (${x.ratio}×)${x.explanation ? `. Explanation: ${x.explanation}` : ""}`
    : x.kind === "vendor" ? `Vendor ${x.vendor} registered ${x.registeredDaysAgo} days ago` : x.text);
  $("play-findings").innerHTML = (f.length ? f : ["Every item is within 2× of the market median."]).map((t) => `<li>${esc(t)}</li>`).join("");
  document.querySelectorAll("input.price").forEach((el) => el.addEventListener("change", () => {
    current.items[Number(el.dataset.idx)].unitPriceRp = Math.max(0, Number(el.value) || 0);
    renderPlay();
    document.getElementById(el.id)?.focus();
  }));
}

document.querySelectorAll("[data-sample]").forEach((b) => b.addEventListener("click", () => {
  current = structuredClone(samples[b.dataset.sample]);
  document.querySelectorAll("[data-sample]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  renderPlay();
}));

renderPlay();
await refresh();
setInterval(refresh, 15000);
