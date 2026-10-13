# Glossary

[Bahasa Indonesia](../id/glosarium.md) · **English**

| Term | Short meaning | In Telisik |
| --- | --- | --- |
| **VC (venture capital)** | A firm that invests in young startups in exchange for equity | Main customer |
| **GP (General Partner)** | The VC's managers who pick startups and make decisions | Final approver through a multisig |
| **LP (Limited Partner)** | Owners of the money entrusted to the VC (pension funds, banks, wealthy individuals) | Can view the dashboard |
| **CVC (Corporate VC)** | A VC owned by a large company, e.g. MDI Ventures (Telkom) | Later segment |
| **Startup** | A young company receiving investment | Submits reports, receives funds |
| **Tranche** | Funding released in stages, not all at once | Release unit in the escrow |
| **Escrow** | A third party that holds money until conditions are met, like a marketplace holding payment until the buyer confirms delivery | TelisikEscrow: an escrow that is a smart contract and cannot run off with the money |
| **Multisig** | A wallet that needs signatures from several people ("M of N", e.g. 2 of 3) before money can move | The GP address, so no single person can release funds alone |
| **Smart contract** | A program on a blockchain that runs exactly as written and cannot be quietly changed | TelisikEscrow and AttestationRegistry |
| **Attestation** | A recorded statement that something was checked, with the result | Verification results recorded in AttestationRegistry |
| **Hash** | A digital fingerprint of a file; change the file slightly and the hash changes completely | Proof that a report was not changed after submission |
| **Blockchain** | A network of computers that jointly records transactions; no single party can delete records | Home of the escrow and the audit log |
| **Monad** | An EVM-compatible layer-1 blockchain, up to 10,000 transactions per second, 0.6s finality, mainnet since 24 November 2025 | The chain Telisik's contracts run on |
| **EVM** | The engine that runs Ethereum smart contracts; EVM-compatible chains can reuse the same code and wallets | Contracts can move to other EVM chains |
| **MON** | Monad's native token, used to pay transaction fees (gas) | Gas for contract transactions |
| **USDC / stablecoin** | A digital dollar pegged 1:1 to the US dollar | Currency of the funds in escrow |
| **Testnet / mainnet** | Test network with play money / real network with real money | MVP on testnet, product on mainnet |
| **x402** | A payment standard over HTTP: the server replies "402 Payment Required" and the client pays automatically | Tested in the warung-agents prototype |
| **Jev** | TypeSafe's decision model that answers choice, score or yes/no questions with probabilities | Risk score and recommended action |
| **Guardrail** | A plain code rule that overrides an AI decision | E.g. a ratio above 1.5 is always frozen |
| **Reconciliation** | Matching two records, e.g. reported revenue against bank statements | Core check |
| **Markup** | Reporting a price far above what the item really costs | E.g. a Rp10,000 bottle reported at Rp500,000 |
| **Round-tripping** | Money cycled between parties to make revenue look bigger | A pattern the anomaly model looks for |
| **Prompt injection** | Hidden text in a document that tries to instruct the AI | Prevented by treating documents as data |
| **LKPP** | Indonesia's National Public Procurement Agency, which publishes open procurement data | Data source for the procurement demo |
| **MBG** | Makan Bergizi Gratis, Indonesia's free nutritious meals program | Example of an abnormal price case (socks) |
| **UU PDP** | Indonesia's Personal Data Protection Law (Law 27/2022) | Limits on sending data to third parties |
