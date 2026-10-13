# 02 Solution and how it works

[Bahasa Indonesia](../id/02-solusi-dan-cara-kerja.md) · **English**

Telisik has four modules. The first two can be sold without the escrow, for example for due diligence.

1. **Report verification:** numbers in the startup's report are matched against data the startup cannot edit (bank statements, payment gateway, onchain treasury).
2. **Price verification:** every line item is compared with the market price range. Example output: "Socks Rp100k, market median Rp33k, +200%, needs clarification."
3. **Tranche escrow on Monad:** investor funds are locked in a smart contract and released per tranche only if verification passes and the GP approves.
4. **Onchain audit trail:** report hashes and verification results are recorded on Monad, so they cannot be deleted or quietly changed.

## Design principles

- **AI checks, it never edits.** The AI never adjusts a report to make it fit. It only flags gaps with their evidence.
- **Humans decide on big money.** The AI gives a score and reasons, hard rules block what is clearly wrong, and the GP gives final approval through a multisig.
- **Raw data offchain, proof onchain.** Reports and bank statements are never written to the chain. Only hashes and result summaries are recorded.
- **Neutral language.** Output is a gap and a request for clarification, never an accusation of "corruption" or "fraud".

## Example walkthrough: AquaTech

Names and numbers below are fictional. The sequence diagram is in [03 Architecture](03-architecture.md#sequence-diagram-aquatech-example).

VC **Nusantara Ventures** invests **US$300,000** in startup **AquaTech**, split into 3 tranches of US$100,000.

1. **Funds locked.** The VC deposits US$300,000 in USDC into TelisikEscrow. Nobody can withdraw it quietly.
2. **Tranche 1 released.** US$100,000 reaches AquaTech's wallet after the agreement is signed.
3. **Report and data access.** AquaTech connects its bank statements, payment gateway and treasury wallet. Each month it uploads a report, for example "revenue Rp2B, bought 500 pairs of boots at Rp450k". The report hash is recorded on Monad.
4. **AI checks.** The bank only shows Rp420M, so the report is 4.8x higher. The market median for boots is Rp150k, so they were bought at 3x. The vendor was registered 2 weeks ago.
5. **Decision.** Red score. The GP is alerted and the findings are recorded in AttestationRegistry.
6. **Freeze.** Tranches 2 and 3 are frozen. US$200,000 stays safe in escrow.
7. **Transparency.** The GP and LP dashboard shows every finding and the flow of funds.

If the score is green, the GP approves and tranche 2 is released to AquaTech.

## Who does what

| Party | Job | Cannot |
| --- | --- | --- |
| AI (LLM + Jev) | Read documents, give a score and recommendation | Release money |
| Rule code (guardrails) | Compute gaps, block what is clearly wrong | Be overridden by the AI |
| Smart contract | Lock funds, release them by the rules | Be changed quietly |
| GP (multisig) | Final approval | Ignore verification results without a recorded reason |
| Startup | Submit reports, grant data access | Release funds to itself |
