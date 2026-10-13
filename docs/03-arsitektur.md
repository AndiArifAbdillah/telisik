# 03 Arsitektur

Dana hanya cair setelah verifikasi lolos dan GP menyetujui. Data asli tetap offchain. Monad menyimpan hash, hasil verifikasi, dan dana USDC.

## Diagram komponen

```mermaid
flowchart TD
    subgraph SUMBER["Data sumber"]
        L["Laporan startup<br/>laporan keuangan, invoice, struk"]
        B["Bank dan gateway<br/>mutasi rekening, data penjualan"]
        T["Treasury onchain<br/>saldo dan arus kas di Monad/EVM"]
        H["Harga pasar<br/>marketplace, e-katalog, data LKPP"]
    end

    subgraph MESIN["Mesin verifikasi Telisik (offchain)"]
        E["1. Ekstraksi LLM<br/>dokumen jadi data terstruktur"]
        R["2. Rekonsiliasi dan cek harga<br/>laporan vs sumber, harga vs median pasar"]
        A["3. Deteksi anomali (ML)<br/>vendor terafiliasi, round-tripping, bukti ganda"]
        J["4. Jev<br/>skor risiko 0-4 dan rekomendasi"]
        E --> R --> A --> J
    end

    L --> E
    B --> R
    T --> R
    H --> R

    J --> G{"Guardrail kode"}
    G -->|selisih besar| F["Bekukan"]
    G -->|selisih kecil atau data kurang| Q["Tanya GP"]
    G -->|lolos| P["Persetujuan GP<br/>multisig, override wajib beri alasan"]
    Q --> P

    subgraph MONAD["Monad (onchain)"]
        REG["AttestationRegistry<br/>hash laporan dan hasil verifikasi"]
        ESC["TelisikEscrow<br/>USDC dikunci, cair per tranche"]
        WAL["Wallet startup"]
    end

    J -. hasil dicatat .-> REG
    P -->|cairkan| ESC
    F -->|usulan bekukan| ESC
    ESC --> WAL
    REG -. data dibaca .-> D["Dashboard GP dan LP"]
```

## Komponen

| Komponen | Lokasi | Tanggung jawab | Teknologi (rencana) |
| --- | --- | --- | --- |
| Konektor data | Offchain | Menarik data bank, gateway, chain, dan harga dengan akses read-only | TypeScript, API agregator, viem |
| Ekstraksi | Offchain | Mengubah PDF dan gambar jadi JSON dengan skema tetap | LLM (Qwen atau Kimi) |
| Rekonsiliasi dan cek harga | Offchain | Menghitung rasio dan selisih secara deterministik | TypeScript |
| Deteksi anomali | Offchain | Mencari pola janggal di arus kas dan vendor | Python (scikit-learn) |
| Jev | Offchain (API) | Skor risiko dan rekomendasi tindakan beserta probabilitas | `@typesafe-ai/sdk` |
| Guardrail | Offchain | Aturan keras yang menimpa rekomendasi AI | TypeScript |
| AttestationRegistry | Monad | Catatan permanen hasil verifikasi | Solidity |
| TelisikEscrow | Monad | Mengunci dan mencairkan USDC per tranche | Solidity |
| Dashboard | Web | Status tranche, temuan, dan aliran dana untuk GP dan LP | Next.js |

## Diagram urutan: contoh AquaTech

Nama dan angka fiktif. Penjelasan tiap langkahnya ada di [02 Solusi dan cara kerja](02-solusi-dan-cara-kerja.md#contoh-skenario-aquatech).

```mermaid
sequenceDiagram
    participant GP as GP (VC)
    participant ESC as TelisikEscrow
    participant ST as AquaTech
    participant AI as Verifier Telisik
    participant REG as AttestationRegistry

    GP->>ESC: 1. Setor US$300rb USDC, 3 tranche
    ESC->>ST: 2. Tranche 1 cair, US$100rb
    ST->>AI: 3. Laporan bulanan, klaim pendapatan Rp2 miliar
    ST->>REG: Hash laporan dicatat
    AI->>AI: 4. Cek ke data sumber, bank cuma Rp420 juta (4,8x), boots 3x harga pasar
    AI->>REG: 5. Hasil verifikasi dicatat, skor merah
    AI-->>GP: Peringatan dan temuan
    GP->>ESC: 6. Bekukan tranche 2 dan 3
    Note over ESC: US$200rb tetap aman
    REG-->>GP: 7. Dashboard GP dan LP membaca catatan
```
