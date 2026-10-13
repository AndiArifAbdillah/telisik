// Optional Jev scoring through the TypeSafe SDK. Returns null when no key is configured or the
// call fails, so the verifier falls back to rules only. Jev never sees raw documents: it gets the
// numbers the rules already computed.
import { TypeSafeClient, choice, score } from "@typesafe-ai/sdk";

const apiKey = process.env.OPENCODE_API_KEY?.trim();
const client = apiKey
  ? new TypeSafeClient({
      apiKey,
      baseURL: process.env.JEV_BASE_URL ?? "https://opencode.ai/zen",
      defaultModel: process.env.JEV_MODEL ?? "jev-1.13-free",
    })
  : null;

export const jevModel = process.env.JEV_MODEL ?? "jev-1.13-free";

export async function askJev(check) {
  if (!client) return null;
  const state = {
    items: check.items.map((i) => ({ item: i.name, qty: i.qty, unitPriceRp: i.unitPriceRp, marketMedianRp: i.medianRp, ratio: i.ratio, explanation: i.explanation ?? null })),
    newVendor: check.newVendor,
    totalAboveMarketRp: check.gapRp,
    reportTotalRp: check.totalRp,
  };
  try {
    const { answers } = await client.systemOne({
      state,
      questions: {
        risk: score("How likely is it that this spending report hides marked-up prices?", [
          "All prices are close to the market median",
          "Small, explainable differences (shipping, taxes, small quantities)",
          "Some prices need a clear explanation",
          "A large markup on at least one item",
          "Large markups plus a new or related vendor",
        ]),
        action: choice("What should happen to the next tranche?", {
          pass: "Every price is close to the market median and the vendor looks normal.",
          ask_gp: "Some prices are above market or the vendor is new; a human should review the explanation.",
          freeze: "At least one price is far above market; funds should stay locked until explained.",
        }),
      },
    });
    return {
      action: answers.action.choice,
      confidence: answers.action.confidence,
      probabilities: answers.action.probabilities,
      riskScore: Math.max(0, Math.min(4, Math.round(answers.risk.score))),
      model: jevModel,
    };
  } catch (error) {
    console.log(`  ! Jev unavailable (${error.message.split("\n")[0]}), using rules only`);
    return null;
  }
}
