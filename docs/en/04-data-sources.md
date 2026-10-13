# 04 Data sources

[Bahasa Indonesia](../id/04-sumber-data.md) · **English**

Telisik is only as good as data the startup cannot edit. If the AI only reads PDFs from the startup, it can be fooled just like eFishery's investors. Onchain treasury and market prices are the easiest to access, so both are in the MVP.

| Source | What it proves | How it is accessed | Phase |
| --- | --- | --- | --- |
| Startup's onchain treasury (Monad/EVM) | Crypto balance and cash flow | RPC or indexer (e.g. Envio) | MVP |
| Market prices | Fair price range per item | Official marketplace APIs or price datasets, INAPROC e-catalog | MVP |
| Public procurement data | Agency spending per item | LKPP open data (SiRUP, e-catalog, LPSE) | MVP (demo) |
| Bank statements | Real income and spending | Open banking aggregators (e.g. Brick, Ayoconnect), read-only | Pilot |
| Payment gateway | Real sales | Read-only APIs from Xendit, Midtrans, Stripe | Pilot |
| Accounting software | Reported figures | Jurnal, Accurate, Xero APIs | Pilot |
| Tax invoices | Turnover reported to the tax office | Export from the tax system, uploaded by the startup | Later |

## Data rules

- **Read-only:** Telisik never asks for access that can move money in the startup's accounts.
- **At least two independent sources** for important figures, for example revenue checked against both bank and payment gateway.
- **Marketplace prices** through official APIs or licensed datasets, never scraping that breaks terms of service.
- **Raw data stays offchain and encrypted.** Only hashes and result summaries go onchain.
- **Demos use fictional data only.** Real portfolio data is used only after an agreement with a pilot partner.
