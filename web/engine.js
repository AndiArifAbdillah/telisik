// Telisik verification rules. Pure functions with no I/O, so the same code runs in Node
// (the verifier that writes attestations) and in the browser (the dashboard playground).

export const RULES = {
  version: "rules-v1",
  explainAbove: 2, // price above 2x the market median needs an explanation
  freezeAbove: 5, // price above 5x the market median always freezes
  newVendorDays: 30, // vendors younger than this are flagged
  minJevConfidence: 0.8, // below this, a human decides
};

/** Normalize a product name so "Botol Merk-A 600ml" and "bottle brand a 600 ml" can meet. */
export function productKey(text) {
  return String(text)
    .toLowerCase()
    .replace(/(\d)\s*(ml|l|g|kg|pcs)\b/g, "$1$2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Find the reference price for a line item: by explicit sku first, then by normalized name. */
export function matchPrice(item, prices) {
  if (item.sku && prices[item.sku]) return { sku: item.sku, ...prices[item.sku] };
  const k = productKey(item.name);
  for (const [sku, ref] of Object.entries(prices)) {
    if ((ref.aliases ?? []).some((a) => productKey(a) === k) || productKey(ref.name) === k) return { sku, ...ref };
  }
  return null;
}

export function level(ratio) {
  if (ratio > RULES.freezeAbove) return "freeze";
  if (ratio > RULES.explainAbove) return "explain";
  return "fair";
}

/**
 * Check a spending report against market prices and vendor data.
 * Returns findings and a rules-only decision: "pass", "ask_gp" or "freeze".
 */
export function checkReport(report, prices) {
  const findings = [];
  let gapRp = 0;
  let totalRp = 0;
  const items = report.items.map((item) => {
    const ref = matchPrice(item, prices);
    const lineTotal = item.unitPriceRp * item.qty;
    totalRp += lineTotal;
    if (!ref) {
      findings.push({ kind: "no_reference", item: item.name, text: `No market reference for "${item.name}"` });
      return { ...item, medianRp: null, ratio: null, level: "unknown" };
    }
    const ratio = item.unitPriceRp / ref.medianRp;
    const lv = level(ratio);
    gapRp += Math.max(0, item.unitPriceRp - ref.medianRp) * item.qty;
    if (lv !== "fair") {
      findings.push({
        kind: "price",
        level: lv,
        item: item.name,
        unitPriceRp: item.unitPriceRp,
        medianRp: ref.medianRp,
        ratio: Math.round(ratio * 100) / 100,
        explanation: item.explanation ?? null,
        source: ref.source,
      });
    }
    return { ...item, sku: ref.sku, medianRp: ref.medianRp, lowRp: ref.lowRp, highRp: ref.highRp, ratio: Math.round(ratio * 100) / 100, level: lv };
  });

  const vendorDays = report.vendor?.registeredDaysAgo;
  const newVendor = typeof vendorDays === "number" && vendorDays < RULES.newVendorDays;
  if (newVendor) findings.push({ kind: "vendor", vendor: report.vendor.name, registeredDaysAgo: vendorDays });

  const anyFreeze = items.some((i) => i.level === "freeze");
  const anyExplain = items.some((i) => i.level === "explain");
  const anyUnknown = items.some((i) => i.level === "unknown");
  const decision = anyFreeze ? "freeze" : anyExplain || newVendor || anyUnknown ? "ask_gp" : "pass";
  const riskScore = anyFreeze ? (newVendor ? 4 : 3) : anyExplain || newVendor ? 2 : anyUnknown ? 1 : 0;

  return { items, findings, newVendor, gapRp, totalRp, ruleDecision: decision, ruleRiskScore: riskScore };
}

/**
 * Combine the rules with an optional Jev recommendation. Rules always win where they are strict:
 * a freeze stays a freeze, and Jev can never turn a flagged report into a pass.
 */
export function applyGuardrails(check, jev) {
  if (check.ruleDecision === "freeze") return { decision: "freeze", riskScore: Math.max(check.ruleRiskScore, jev?.riskScore ?? 0), reason: "price far above market" };
  if (!jev) return { decision: check.ruleDecision, riskScore: check.ruleRiskScore, reason: "rules only" };
  if (jev.confidence < RULES.minJevConfidence) return { decision: check.ruleDecision === "pass" ? "ask_gp" : check.ruleDecision, riskScore: Math.max(check.ruleRiskScore, jev.riskScore), reason: "Jev unsure, a human decides" };
  if (check.ruleDecision === "ask_gp" && jev.action === "pass") return { decision: "ask_gp", riskScore: check.ruleRiskScore, reason: "flags need a human" };
  const order = { pass: 0, ask_gp: 1, freeze: 2 };
  const decision = order[jev.action] > order[check.ruleDecision] ? jev.action : check.ruleDecision;
  return { decision, riskScore: Math.max(check.ruleRiskScore, jev.riskScore), reason: "rules + Jev" };
}

/** Stable JSON (sorted keys) so the same report always hashes the same way. */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
