# 03 Architecture

[Bahasa Indonesia](../id/03-arsitektur.md) · **English**

Funds are released only after verification passes and the GP approves. Raw data stays offchain. Monad stores hashes, verification results and the USDC funds.

## Component diagram

```mermaid
flowchart TD
    subgraph SOURCES["Source data"]
        L["Startup report<br/>financial report, invoices, receipts"]
        B["Bank and gateway<br/>bank statements, sales data"]
        T["Onchain treasury<br/>balance and cash flow on Monad/EVM"]
        H["Market prices<br/>marketplaces, e-catalog, LKPP data"]
    end

    subgraph ENGINE["Telisik verification engine (offchain)"]
        E["1. LLM extraction<br/>documents to structured data"]
        R["2. Reconciliation and price check<br/>report vs source, price vs market median"]
        A["3. Anomaly detection (ML)<br/>related vendors, round-tripping, duplicate evidence"]
        J["4. Jev<br/>risk score 0-4 and recommendation"]
        E --> R --> A --> J
    end

    L --> E
    B --> R
    T --> R
    H --> R

    J --> G{"Code guardrails"}
    G -->|large gap| F["Freeze"]
    G -->|small gap or missing data| Q["Ask GP"]
    G -->|pass| P["GP approval<br/>multisig, override needs a reason"]
    Q --> P

    subgraph MONAD["Monad (onchain)"]
        REG["AttestationRegistry<br/>report hashes and verification results"]
        ESC["TelisikEscrow<br/>USDC locked, released per tranche"]
        WAL["Startup wallet"]
    end

    J -. result recorded .-> REG
    P -->|release| ESC
    F -->|freeze request| ESC
    ESC --> WAL
    REG -. data read .-> D["GP and LP dashboard"]
```

## Components

| Component | Where | Responsibility | Technology (planned) |
| --- | --- | --- | --- |
| Data connectors | Offchain | Pull bank, gateway, chain and price data with read-only access | TypeScript, aggregator APIs, viem |
| Extraction | Offchain | Turn PDFs and images into JSON with a fixed schema | LLM (Qwen or Kimi) |
| Reconciliation and price check | Offchain | Compute ratios and gaps deterministically | TypeScript |
| Anomaly detection | Offchain | Find odd patterns in cash flow and vendors | Python (scikit-learn) |
| Jev | Offchain (API) | Risk score and recommended action with probabilities | `@typesafe-ai/sdk` |
| Guardrails | Offchain | Hard rules that override AI recommendations | TypeScript |
| AttestationRegistry | Monad | Permanent record of verification results | Solidity |
| TelisikEscrow | Monad | Lock and release USDC per tranche | Solidity |
| Dashboard | Web | Tranche status, findings and fund flow for GPs and LPs | Next.js |

## Sequence diagram: AquaTech example

Fictional names and numbers. Each step is explained in [02 Solution and how it works](02-solution-and-how-it-works.md#example-walkthrough-aquatech).

```mermaid
sequenceDiagram
    participant GP as GP (VC)
    participant ESC as TelisikEscrow
    participant ST as AquaTech
    participant AI as Telisik verifier
    participant REG as AttestationRegistry

    GP->>ESC: 1. Deposit US$300k USDC, 3 tranches
    ESC->>ST: 2. Tranche 1 released, US$100k
    ST->>AI: 3. Monthly report, claims Rp2B revenue
    ST->>REG: Report hash recorded
    AI->>AI: 4. Check against source data, bank shows only Rp420M (4.8x), boots at 3x market price
    AI->>REG: 5. Verification result recorded, red score
    AI-->>GP: Alert and findings
    GP->>ESC: 6. Freeze tranches 2 and 3
    Note over ESC: US$200k stays safe
    REG-->>GP: 7. GP and LP dashboard reads the records
```

## Deployment modes

The verification engine (extraction, reconciliation, anomaly detection, Jev, guardrails) does not depend on any chain. Only two components depend on a blockchain, the escrow and the audit log, and both can be swapped without changing the engine.

| Mode | Money held in | Audit log | For |
| --- | --- | --- | --- |
| A. Monad | TelisikEscrow (USDC) | AttestationRegistry | Crypto VCs, Monad ecosystem grants |
| B. Another EVM chain | Same contracts on Ethereum, Base, Arbitrum, etc. | Same contracts | Crypto VCs on other ecosystems |
| C. No blockchain | Escrow account at a custodian bank (rupiah or dollars) | Append-only log, signed with certified electronic signatures and independent timestamps | Traditional VCs, state-owned CVCs, Indonesian market |
| C+. Hybrid | Bank escrow account | As in mode C, plus hashes anchored on a public chain as extra proof | Clients who want public proof without moving money onchain |

```mermaid
flowchart LR
    V["Verification engine<br/>same in every mode"] --> EA{{"EscrowAdapter"}}
    V --> AL{{"AuditLog"}}
    EA --> M["MonadEscrow / EvmEscrow<br/>modes A, B"]
    EA --> BK["BankEscrow<br/>instructions to custodian bank, mode C"]
    AL --> OR["OnchainRegistry<br/>modes A, B"]
    AL --> SL["SignedTimestampLog<br/>mode C, optional hash anchor, mode C+"]
```

### Interfaces

The engine only calls these two interfaces. The mode is chosen in configuration.

```ts
interface EscrowAdapter {
  release(dealId: string, tranche: number): Promise<Receipt>;
  freeze(dealId: string, reason: string): Promise<Receipt>;
  refund(dealId: string): Promise<Receipt>;
  status(dealId: string): Promise<DealStatus>;
}

interface AuditLog {
  record(subject: string, dataHash: string, result: VerificationResult): Promise<Proof>;
  verify(proof: Proof): Promise<boolean>; // anyone can check a record was not changed
}

// Implementations:
//   Modes A/B: MonadEscrow, EvmEscrow (any EVM chain), OnchainRegistry
//   Mode C:    BankEscrow (instructions to a custodian bank), SignedTimestampLog
//   Mode C+:   BankEscrow + SignedTimestampLog that also anchors hashes on a public chain
```

### What changes without a blockchain

- **The escrow needs a licensed intermediary.** A release becomes an instruction to a custodian bank or trustee, with fees and processing measured in days.
- **Trust in the audit log** moves to the electronic signature and timestamp providers instead of a public network.
- **Telisik never holds client money.** In every mode, funds sit in an escrow contract or an escrow account at a licensed institution, never in Telisik's own account.

### Note for the hackathon and grants

The hackathon version uses mode A. Before accepting a grant or residency from the Monad Foundation, check its obligations in the Rules & Guidelines (intellectual property, commitments to build on Monad), and say openly that Telisik is designed to run in several modes.
