# 04 Sumber data

Nilai Telisik bergantung pada data yang tidak bisa diubah startup. Kalau AI hanya membaca PDF dari startup, AI juga bisa tertipu, seperti investor eFishery. Treasury onchain dan harga pasar paling mudah diakses, jadi keduanya masuk MVP.

| Sumber | Yang dibuktikan | Cara akses | Fase |
| --- | --- | --- | --- |
| Treasury onchain startup (Monad/EVM) | Saldo dan arus kas kripto | RPC atau indexer (mis. Envio) | MVP |
| Harga pasar | Rentang harga wajar per item | API marketplace resmi atau dataset harga, e-katalog INAPROC | MVP |
| Data pengadaan publik | Belanja instansi per item | Data terbuka LKPP (SiRUP, e-katalog, LPSE) | MVP (demo) |
| Mutasi rekening bank | Pendapatan dan pengeluaran nyata | Agregator open banking (mis. Brick, Ayoconnect), akses read-only | Pilot |
| Payment gateway | Penjualan nyata | API read-only Xendit, Midtrans, Stripe | Pilot |
| Software akuntansi | Angka yang dilaporkan | API Jurnal, Accurate, Xero | Pilot |
| Faktur pajak | Omzet yang dilaporkan ke pajak | Ekspor dari sistem pajak, diunggah startup | Lanjutan |

## Aturan pengambilan data

- **Read-only:** Telisik tidak pernah meminta akses yang bisa memindahkan uang di rekening startup.
- **Minimal dua sumber independen** untuk angka penting, misalnya pendapatan dicek ke bank dan payment gateway.
- **Harga marketplace** lewat API resmi atau dataset berlisensi, bukan scraping yang melanggar syarat layanan.
- **Data mentah tetap offchain dan terenkripsi.** Yang masuk ke chain hanya hash dan ringkasan hasil.
- **Untuk demo hanya pakai data fiktif.** Data portofolio sungguhan baru dipakai setelah ada perjanjian dengan mitra pilot.
