# Glosarium

**Bahasa Indonesia** · [English](../en/glossary.md)

| Istilah | Arti singkat | Di Telisik |
| --- | --- | --- |
| **VC (venture capital)** | Perusahaan yang menanam uang ke startup muda dengan imbalan saham | Pelanggan utama |
| **GP (General Partner)** | Pengelola VC yang memilih startup dan mengambil keputusan | Pemberi persetujuan akhir lewat multisig |
| **LP (Limited Partner)** | Pemilik uang yang menitipkan dananya ke VC (dana pensiun, bank, orang kaya) | Bisa melihat dashboard |
| **CVC (Corporate VC)** | VC milik perusahaan besar, mis. MDI Ventures (Telkom) | Segmen lanjutan |
| **Startup** | Perusahaan muda yang menerima investasi | Pengirim laporan, penerima dana |
| **Tranche** | Dana yang dicairkan bertahap, bukan sekaligus | Unit pencairan di escrow |
| **Escrow** | Pihak ketiga yang menahan uang sampai syarat terpenuhi, seperti rekber atau Shopee yang menahan pembayaran sampai barang diterima | TelisikEscrow: "rekber" berupa smart contract yang tidak bisa kabur |
| **Multisig** | Dompet yang butuh tanda tangan beberapa orang ("M dari N", mis. 2 dari 3) sebelum uang bisa dipindahkan | Alamat GP, supaya tidak ada satu orang yang bisa mencairkan sendirian |
| **Smart contract** | Program di blockchain yang berjalan persis sesuai kodenya dan tidak bisa diubah diam-diam | TelisikEscrow dan AttestationRegistry |
| **Atestasi** | Pernyataan tercatat bahwa sesuatu sudah diperiksa, beserta hasilnya | Hasil verifikasi yang dicatat di AttestationRegistry |
| **Hash** | Sidik jari digital sebuah file; file diubah sedikit saja, hash-nya berubah total | Bukti laporan tidak diubah setelah dikirim |
| **Blockchain** | Jaringan komputer yang bersama-sama mencatat transaksi; catatannya tidak bisa dihapus satu pihak | Tempat escrow dan catatan audit |
| **Monad** | Blockchain layer-1 yang kompatibel dengan Ethereum (EVM), hingga 10.000 transaksi per detik, finalitas 0,6 detik, mainnet sejak 24 November 2025 | Chain tempat kontrak Telisik berjalan |
| **EVM** | Mesin yang menjalankan smart contract Ethereum; chain yang kompatibel EVM bisa memakai kode dan wallet yang sama | Kontrak bisa dipindah ke chain EVM lain |
| **MON** | Token asli Monad, dipakai untuk membayar biaya transaksi (gas) | Gas untuk transaksi kontrak |
| **USDC / stablecoin** | Dolar digital yang nilainya dipatok 1:1 dengan dolar AS | Mata uang dana investasi di escrow |
| **Testnet / mainnet** | Jaringan uji coba dengan uang mainan / jaringan sungguhan dengan uang asli | MVP di testnet, produk di mainnet |
| **x402** | Standar pembayaran lewat HTTP: server membalas "402 Payment Required", lalu klien membayar otomatis | Diuji di prototipe warung-agents |
| **Jev** | Model keputusan TypeSafe yang menjawab pertanyaan pilihan, skor, atau ya/tidak beserta probabilitasnya | Skor risiko dan rekomendasi tindakan |
| **Guardrail** | Aturan kode biasa yang menimpa keputusan AI | Mis. rasio > 1,5 selalu dibekukan |
| **Rekonsiliasi** | Mencocokkan dua catatan, mis. laporan pendapatan dengan mutasi bank | Pemeriksaan inti |
| **Mark-up** | Melaporkan harga jauh di atas harga barang sebenarnya | Mis. botol Rp10.000 dilaporkan Rp500.000 |
| **Round-tripping** | Uang yang diputar balik antar-pihak supaya pendapatan terlihat besar | Salah satu pola yang dicari model anomali |
| **Prompt injection** | Teks tersembunyi di dokumen yang mencoba menyuruh AI melakukan sesuatu | Dicegah dengan memperlakukan dokumen sebagai data |
| **LKPP** | Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah, pengelola data pengadaan terbuka | Sumber data demo pengadaan publik |
| **MBG** | Program Makan Bergizi Gratis | Contoh kasus harga janggal (kaus kaki) |
| **UU PDP** | UU 27/2022 tentang Pelindungan Data Pribadi | Batasan pengiriman data ke pihak ketiga |
