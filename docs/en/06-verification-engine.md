# 06 Verification engine

[Bahasa Indonesia](../id/06-mesin-verifikasi.md) · **English**

Each component has a fixed job. The LLM extracts numbers from documents. Code computes the gaps. An ML model looks for odd patterns. Jev gives a score and a recommendation. Money decisions are made by the guardrails and the GP, not by the AI.

## Flow

1. **Extraction:** an LLM turns PDFs and images into JSON with a fixed schema. Use Qwen or Kimi, which also targets their Metropolis bounties.
2. **Compute:** code computes the report-to-bank ratio, price gaps and vendor flags.
3. **Anomalies:** an ML model (e.g. isolation forest) looks for odd patterns in cash flow.
4. **Jev:** answers a risk score from 0 to 4 and an action (pass, ask_gp, freeze), with the probability of each answer.
5. **Guardrails:** code rules override Jev when needed.
6. **GP:** decides. Jev's model name, version and probabilities are recorded in AttestationRegistry.

## Checks

| Check | Method | Red flag (initial threshold) |
| --- | --- | --- |
| Revenue vs bank / gateway | Monthly reconciliation, ratio of report to source | Ratio > 1.10 |
| Cash balance vs onchain treasury | Match the period-end balance | Gap > 5% |
| Item price vs market | Market median and range per item | Price > 2x median |
| Vendors | New vendors, duplicate vendors, address or account shared with management | Large payments to new or related vendors |
| Transaction patterns | Anomaly detection on cash flow | Round-tripping, spikes at period end |
| Duplicate evidence | Hash every invoice and receipt | The same document used twice |

These thresholds are hypotheses and must be calibrated with pilot data.

## Decisions

| Result | Condition | What happens |
| --- | --- | --- |
| Pass | All checks under threshold, data complete | Tranche can be released after GP approval |
| Ask GP | Small gap or incomplete data | GP reviews the findings and decides |
| Freeze | Large gap, e.g. revenue 4.8x bank deposits, or a price 50x the market | A freeze is requested automatically |

## Jev's role

Jev (TypeSafe's decision model, via `@typesafe-ai/sdk`) is the judging layer. It receives numbers already computed by code, then returns a risk score and a recommended action with probabilities. Jev does not read documents, does not calculate, and does not release funds.

| Type | Question to Jev | Output |
| --- | --- | --- |
| `score` | How likely is it that this report does not match reality? (rubric 0–4) | Score and the probability of each level |
| `choice` | What action for the next tranche? | pass / ask_gp / freeze, plus confidence |
| `noul` | Is this vendor likely related to management? | Probability of yes |

Example `state` sent to Jev (fictional numbers, AquaTech example):

```json
{
  "period": "2026-09",
  "reportedRevenueRp": 2000000000,
  "bankRevenueRp": 420000000,
  "reportToBankRatio": 4.76,
  "markedUpItems": [
    { "item": "Boots", "quantity": 500, "unitPriceRp": 450000, "marketMedianRp": 150000, "ratio": 3.0 }
  ],
  "newVendors": [
    { "name": "PT Contoh Sepatu", "ageDays": 14, "amountRp": 225000000 }
  ],
  "dataComplete": true
}
```

Example call:

```ts
import { choice, score } from "@typesafe-ai/sdk";

const { answers } = await jev.systemOne({
  state,
  questions: {
    risk: score("How likely is it that this report does not match reality?", [
      "All figures match the source data",
      "Small, explainable gaps (rounding, timing)",
      "Gaps that need clarification",
      "A large gap in one area",
      "Large, patterned gaps across several areas",
    ]),
    action: choice("What action for the next tranche?", {
      pass: "All checks are under threshold and data is complete.",
      ask_gp: "There is a small gap or data is incomplete.",
      freeze: "There is a large gap between the report and the source data.",
    }),
  },
});
```

## Guardrails

Guardrails are plain code rules that run after Jev and cannot be overridden by the AI. The thresholds below are initial.

```ts
function applyGuardrails(state: State, recommendation: Action, confidence: number): Action {
  if (state.reportToBankRatio > 1.5) return "freeze";  // large gaps are always frozen
  if (!state.dataComplete) return "ask_gp";             // missing data always goes to the GP
  if (confidence < 0.8) return "ask_gp";                // Jev is unsure, a human decides
  return recommendation;
}
```

## Jev's limits

- **No text explanations.** Reasons shown to the GP are built from rule findings and their evidence, not from Jev.
- **Data confidentiality.** The free `jev-1.13-free` model via OpenCode Zen is for demos with fictional data only. A real product needs an enterprise agreement or a self-hosted model, because portfolio data is confidential and may fall under Indonesia's personal data protection law (UU PDP).
- **Maturity.** The SDK is still 0.x, so Jev is called through a `decide(state)` interface and can be swapped without rewriting the system.

## Prompt injection defenses

- All documents are treated as data, never as instructions.
- Extraction always targets a fixed JSON schema. Free text from documents is never passed on as instructions.
- AI components have no access to the release function.
