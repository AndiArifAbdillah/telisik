# 07 Market and business

[Bahasa Indonesia](../id/07-pasar-dan-bisnis.md) · **English**

Start with crypto VCs: their funds are already in USDC and their startups' treasuries are onchain. They can be verified without bank integrations, and they avoid the Indonesian rule that domestic payments must be in rupiah.

## Segments

| Order | Segment | Main need | Who pays |
| --- | --- | --- | --- |
| 1 | Crypto VCs and blockchain ecosystem accelerators | Verified tranche releases, reporting to LPs | GP / fund manager |
| 2 | Ecosystem grant programs and DAOs | Proof that grants were spent as promised | Foundation / DAO |
| 3 | Traditional VCs and PE | Verified portfolio monitoring, early warning | GP |
| 4 | State-owned corporate VCs (MDI Ventures, BRI Ventures, Mandiri Capital, BNI Ventures) | Verification evidence that protects fund managers from legal risk | Fund manager |
| 5 | Investment banks, auditors, due diligence | Fast verification before M&A or IPO (verification modules only) | Per project |
| 6 | Public procurement (watchdogs, journalists, legislators) | Spotting abnormal prices in open data | Civic-tech grants; public version free |

## Business model (hypotheses, not validated)

- Subscription per fund: US$500–2,000 per month, depending on portfolio size.
- Escrow fee: 0.1–0.25% of each released tranche.
- Due diligence for investment banks and auditors: priced per project.

These numbers must be tested through GP interviews during the validation phase.

## Competitors

Existing tools collect numbers or move money, but none ties fund releases to verification against source data.

| Player | What it does | Gap Telisik fills |
| --- | --- | --- |
| Standard Metrics, Visible | VC portfolio monitoring: collect metrics from startups, partly through accounting software | Figures still come from the startup's own books, are not checked against bank or chain, and do not lock funds |
| Carta | Cap tables and fund administration | Does not check whether financial reports are true |
| Sablier, Superfluid | Token streaming and vesting over time | Funds release because time passes, not because performance is verified |
| Auditors and manual due diligence | Deep checks, yearly or per transaction | Slow and expensive, not continuous |
| opentender (ICW) and manual procurement analysis | Analysis of public procurement data | Does not automatically compare item prices with the market |

These descriptions are based on general knowledge and must be rechecked before use in a pitch.

## Note: Danantara

Danantara (Indonesia's sovereign wealth fund, about US$900B in assets) is **not a target for now**:

1. Selling to a state institution that large requires a legal entity, a track record, certifications, in-country data and multi-year sales cycles.
2. The incentives are reversed: transparency tools are bought by overseers, not by those being overseen.
3. State money will not sit in USDC on a public chain, so the Monad part disappears.
4. Political risk and dependence on a single buyer.

A more realistic door is **state-owned corporate VCs** (segment 4), after landing 2–3 private customers. The TaniHub case shows state fund managers can face personal criminal liability, so permanent verification evidence has direct value to them. The architecture should support a "traditional mode" from day one: funds through banks in rupiah, data in Indonesia, and onchain recording that can be switched off.

## Sources

- [IDN Financials: Danantara to manage IDR 14.6 quadrillion](https://idnfinancials.com/news/52472/prabowo-danantara-manage-idr-quadrillion-investments)
- [Indonesia Business Post: MDI Ventures, Danantara and the TaniHub case](https://indonesiabusinesspost.com/7051/corporate-affairs/telkommetra-weighs-mdi-ventures-divestment-amid-danantara-overhaul)
- [Trend Asia: Danantara Monitor coalition](https://trendasia.org/koalisi-danantara-monitor-ajukan-permohonan-informasi-kepada-danantara-dan-bpk-dorong-transparansi-pengelolaan-aset-negara/)
- [VNN: BPK audit of Danantara begins](https://www.vnn.co.id/2026/09/audit-danantara-dimulai-publik-menanti.html)
