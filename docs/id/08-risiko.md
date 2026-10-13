# 08 Risiko

**Bahasa Indonesia** · [English](../en/08-risks.md)

Risiko terbesar ada di bisnis, bukan di teknis: VC lambat mengadopsi alat baru, dan data bank sulit diakses. Karena itu urutan pasar dimulai dari VC kripto.

| Risiko | Jenis | Mitigasi |
| --- | --- | --- |
| VC lambat percaya dan membeli | Bisnis | Pilot gratis dengan akselerator atau VC kripto, mulai dari mode baca saja tanpa escrow |
| Startup menolak memberi akses data | Bisnis | Akses data jadi syarat dalam term sheet; akses read-only lewat agregator |
| Pasar VC Indonesia sedang kecil (pendanaan startup US$213 juta pada 2025) | Bisnis | Mulai dari VC kripto global, bukan hanya VC lokal |
| AI salah membaca atau berhalusinasi | Teknis | LLM hanya mengekstrak, kode yang menghitung, GP yang memutuskan; setiap temuan disertai bukti |
| Jev ragu atau salah menilai | Teknis | Keyakinan < 0,8 selalu ke GP; guardrail menimpa rekomendasi; model dan probabilitas dicatat |
| Prompt injection lewat dokumen | Teknis | Dokumen diperlakukan sebagai data, ekstraksi ke skema tetap, AI tidak punya akses ke fungsi pencairan |
| Data sumber ikut dipalsukan | Teknis | Silang-cek minimal dua sumber independen (bank + gateway + chain) |
| Kebocoran data portofolio | Hukum / teknis | Data asli offchain dan terenkripsi, hanya hash di chain, akses berbasis peran; patuhi UU PDP (UU 27/2022) |
| Data dikirim ke API pihak ketiga (Jev, LLM) | Hukum / teknis | Demo hanya dengan data fiktif; produk pakai perjanjian enterprise atau model self-host |
| Tuduhan pencemaran nama baik | Hukum | Bahasa netral (selisih dan permintaan klarifikasi), tidak menyebut orang, tinjauan hukum sebelum versi publik |
| Pembayaran domestik wajib rupiah | Hukum | Escrow USDC untuk VC kripto dan transaksi lintas negara; untuk pasar Indonesia, dana bergerak lewat bank dan Monad hanya menjadi catatan audit |
| Smart contract diretas | Teknis | Kontrak kecil dan sederhana, audit sebelum mainnet, batas nilai per deal selama pilot |
| Ekosistem Monad masih muda (mainnet November 2025) | Teknis / bisnis | Kontrak EVM standar sehingga bisa dipindah ke chain EVM lain |
