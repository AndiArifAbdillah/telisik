# 08 Risks

[Bahasa Indonesia](../id/08-risiko.md) · **English**

The biggest risks are commercial, not technical: VCs are slow to adopt new tools, and bank data is hard to access. That is why the market starts with crypto VCs.

| Risk | Type | Mitigation |
| --- | --- | --- |
| VCs are slow to trust and buy | Business | Free pilots with accelerators or crypto VCs, starting in read-only mode without escrow |
| Startups refuse to share data | Business | Data access as a term sheet condition; read-only access through aggregators |
| The Indonesian VC market is small right now (US$213M startup funding in 2025) | Business | Start with global crypto VCs, not only local VCs |
| AI misreads or hallucinates | Technical | The LLM only extracts, code calculates, the GP decides; every finding carries evidence |
| Jev is unsure or wrong | Technical | Confidence < 0.8 always goes to the GP; guardrails override recommendations; model and probabilities are recorded |
| Prompt injection through documents | Technical | Documents are treated as data, extraction to a fixed schema, AI has no access to the release function |
| Source data is also faked | Technical | Cross-check at least two independent sources (bank + gateway + chain) |
| Portfolio data leaks | Legal / technical | Raw data offchain and encrypted, only hashes onchain, role-based access; comply with UU PDP (Law 27/2022) |
| Data sent to third-party APIs (Jev, LLM) | Legal / technical | Demos with fictional data only; production on enterprise agreements or self-hosted models |
| Defamation claims | Legal | Neutral language (gaps and requests for clarification), no naming of individuals, legal review before any public version |
| Domestic payments must be in rupiah | Legal | USDC escrow for crypto VCs and cross-border deals; for the Indonesian market, money moves through banks and Monad is only the audit log |
| Smart contract hack | Technical | Small, simple contracts, audit before mainnet, value cap per deal during the pilot |
| Monad's ecosystem is young (mainnet November 2025) | Technical / business | Standard EVM contracts that can move to another EVM chain |
