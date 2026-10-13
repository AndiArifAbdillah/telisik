# Telisik

**Bahasa Indonesia** · [English](README.md)

> Dana hanya cair kalau laporannya terbukti benar.

Telisik (dari kata "menelisik", artinya memeriksa dengan teliti) memeriksa setiap laporan penggunaan dana dan setiap harga belanja terhadap kenyataan. Dana investasi dicairkan bertahap lewat escrow di [Monad](https://monad.xyz), dan hanya cair kalau lolos verifikasi dan disetujui GP. Pasar awalnya VC kripto. Pengadaan publik menjadi demo kedua.

**Status:** perencanaan dan pembangunan MVP selama hackathon Monad Metropolis (Oktober 2026). "Telisik" masih nama kerja.

## Masalah

Startup memakai uang investor lalu melaporkannya kembali, dan tidak ada yang memeriksa laporan itu terhadap kenyataan. Botol merk A seharga Rp10.000 bisa dilaporkan Rp500.000, dan selisihnya hilang lewat vendor titipan.

| Kasus | Yang terjadi | Pemeriksaan yang hilang |
| --- | --- | --- |
| Mark-up belanja (contoh) | Botol Rp10.000 dilaporkan Rp500.000 per buah (50x) | Harga per item vs pasar |
| eFishery (investor swasta) | Pendapatan Jan–Sep 2024 diduga dilaporkan sekitar 4,8x dari catatan internal | Laporan vs data sumber |
| Kaus kaki BGN untuk MBG (anggaran publik) | Pengadaan sekitar Rp6,9 miliar, hingga Rp100 ribu per pasang | Harga vs pasar |

Detail dan sumbernya ada di [docs/id/01-masalah.md](docs/id/01-masalah.md).

## Cara kerja singkat

```mermaid
flowchart LR
    S["Laporan + data sumber<br/>invoice, bank, chain, harga pasar"] --> V["Verifikasi AI<br/>ekstraksi, cek harga, Jev"]
    V --> G{"Guardrail"}
    G -->|lolos| P["Persetujuan GP<br/>multisig"]
    G -->|mark-up besar| F["Bekukan"]
    P --> E["TelisikEscrow<br/>di Monad"]
    F --> E
    E --> W["Wallet startup"]
    V -. dicatat .-> R["AttestationRegistry<br/>di Monad"]
```

Prinsipnya: **AI memeriksa, smart contract menjaga uang, manusia memutuskan, dan blockchain jadi saksi.** Mark-up ditandai, bukan divonis: startup boleh menjelaskan (misalnya cetak logo atau ongkir ke daerah terpencil), dan keputusan GP beserta alasannya dicatat onchain.

## Mode deployment

Mesin verifikasi tidak bergantung pada Monad. Hanya escrow dan catatan audit yang bergantung pada chain, dan keduanya dipasang lewat adapter.

| Mode | Uang | Catatan audit | Untuk |
| --- | --- | --- | --- |
| A. Monad (versi hackathon) | TelisikEscrow, USDC | AttestationRegistry | VC kripto, hibah ekosistem |
| B. Chain EVM lain | Kontrak yang sama | Kontrak yang sama | VC kripto di ekosistem lain |
| C. Tanpa blockchain | Rekening escrow bank kustodian | Log bertanda tangan elektronik + cap waktu | VC tradisional, CVC BUMN, pasar Indonesia |

Detail dan antarmukanya ada di [03 Arsitektur, Mode deployment](docs/id/03-arsitektur.md#mode-deployment).

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [01 Masalah](docs/id/01-masalah.md) | Kasus eFishery, kaus kaki MBG, TaniHub, dan celah pemeriksaannya |
| [02 Solusi dan cara kerja](docs/id/02-solusi-dan-cara-kerja.md) | Empat modul, prinsip desain, contoh skenario AquaTech |
| [03 Arsitektur](docs/id/03-arsitektur.md) | Diagram komponen, diagram urutan, mode deployment (Monad, EVM lain, tanpa blockchain) |
| [04 Sumber data](docs/id/04-sumber-data.md) | Data yang dipakai, cara akses, fase |
| [05 Smart contract](docs/id/05-smart-contract.md) | Spesifikasi TelisikEscrow dan AttestationRegistry |
| [06 Mesin verifikasi](docs/id/06-mesin-verifikasi.md) | Pemeriksaan, ambang, peran Jev, guardrail |
| [07 Pasar dan bisnis](docs/id/07-pasar-dan-bisnis.md) | Segmen, model bisnis, kompetitor, catatan Danantara |
| [08 Risiko](docs/id/08-risiko.md) | Risiko teknis, hukum, bisnis, dan mitigasinya |
| [09 Roadmap](docs/id/09-roadmap.md) | Fase, gerbang keputusan, checklist |
| [10 Pitch deck](docs/id/10-pitch-deck.md) | Susunan slide |
| [Glosarium](docs/id/glosarium.md) | VC, GP, LP, tranche, escrow, multisig, dan istilah lain |

Versi bahasa Inggris ada di [docs/en/](docs/en/).

## Rencana struktur repo

Folder kode belum dibuat. Rencananya:

```
telisik/
├── docs/
│   ├── en/        dokumen bahasa Inggris
│   └── id/        dokumen bahasa Indonesia
├── contracts/     TelisikEscrow dan AttestationRegistry (Solidity, Foundry)
├── verifier/      mesin verifikasi: ekstraksi, cek harga, Jev, guardrail (TypeScript)
├── dashboard/     dashboard GP dan LP
└── demo-data/     data fiktif: laporan jujur, laporan dengan mark-up, data pengadaan
```

## Karya terkait

Pola keputusan Jev + guardrail + pembayaran x402 diuji lebih dulu di prototipe `warung-agents`. Prototipe ini merupakan port ke Monad Testnet dari workshop [cathlynshanice/warung-agents](https://github.com/cathlynshanice/warung-agents).

## Jaringan

| | Monad Testnet | Monad Mainnet |
| --- | --- | --- |
| Chain ID | 10143 | 143 |
| USDC | `0x534b2f3A21130d7a60830c2Df862319e593943A3` | `0x754704Bc059F8C67012fEd69BC8A327a5aafb603` |
| Explorer | [testnet.monadvision.com](https://testnet.monadvision.com) | |

Sumber: [Monad Docs, x402](https://docs.monad.xyz/guides/x402) dan [Monad Docs, testnet](https://docs.monad.xyz/developer-essentials/testnets).
