# 02 Solusi dan cara kerja

**Bahasa Indonesia** · [English](../en/02-solution-and-how-it-works.md)

Telisik terdiri dari empat modul. Dua modul pertama bisa dijual tanpa escrow, misalnya untuk due diligence.

1. **Verifikasi laporan:** angka di laporan startup dicocokkan dengan data yang tidak bisa mereka ubah (mutasi bank, payment gateway, treasury onchain).
2. **Verifikasi harga:** setiap item belanja dibandingkan dengan rentang harga pasar. Contoh keluaran: "Kaus kaki Rp100rb, median pasar Rp33rb, +200%, perlu klarifikasi."
3. **Escrow bertahap di Monad:** dana investasi dikunci di smart contract dan cair per tranche hanya kalau verifikasi lolos dan GP menyetujui.
4. **Jejak audit onchain:** hash laporan dan hasil verifikasi dicatat di Monad, jadi tidak bisa dihapus atau diubah diam-diam.

## Prinsip desain

- **AI memeriksa, tidak mengubah.** AI tidak pernah menyesuaikan laporan agar cocok. Ia hanya menandai selisih beserta buktinya.
- **Manusia memutuskan uang besar.** AI memberi skor dan alasan, aturan keras memblokir yang jelas salah, dan GP memberi persetujuan akhir lewat multisig.
- **Data asli offchain, bukti onchain.** Laporan dan mutasi bank tidak pernah ditulis ke chain. Yang dicatat hanya hash dan ringkasan hasil.
- **Bahasa netral.** Keluaran berupa selisih dan permintaan klarifikasi, bukan tuduhan "korupsi" atau "fraud".

## Contoh skenario: AquaTech

Nama dan angka di bawah ini fiktif. Diagram urutannya ada di [03 Arsitektur](03-arsitektur.md#diagram-urutan-contoh-aquatech).

VC **Nusantara Ventures** berinvestasi **US$300.000** ke startup **AquaTech**, dibagi 3 tranche masing-masing US$100.000.

1. **Dana dikunci.** VC menyetor US$300.000 USDC ke TelisikEscrow. Tidak ada pihak yang bisa menariknya diam-diam.
2. **Tranche 1 cair.** US$100.000 masuk ke wallet AquaTech setelah perjanjian ditandatangani.
3. **Laporan dan akses data.** AquaTech menghubungkan mutasi bank, payment gateway, dan wallet treasury. Setiap bulan AquaTech mengunggah laporan, misalnya "pendapatan Rp2 miliar, beli 500 pasang sepatu boots @Rp450 ribu". Hash laporan dicatat di Monad.
4. **AI memeriksa.** Bank hanya mencatat Rp420 juta, jadi laporan 4,8x lebih besar. Median harga sepatu boots di pasar Rp150 ribu, jadi dibeli 3x lipat. Vendornya baru terdaftar 2 minggu.
5. **Keputusan.** Skor merah. GP diperingatkan dan temuannya dicatat di AttestationRegistry.
6. **Pembekuan.** Tranche 2 dan 3 dibekukan. US$200.000 tetap aman di escrow.
7. **Transparansi.** Dashboard GP dan LP menampilkan semua temuan dan aliran dana.

Kalau skornya hijau, GP menyetujui dan tranche 2 cair ke AquaTech.

## Siapa mengerjakan apa

| Pihak | Tugas | Tidak boleh |
| --- | --- | --- |
| AI (LLM + Jev) | Membaca dokumen, memberi skor dan rekomendasi | Mencairkan uang |
| Kode aturan (guardrail) | Menghitung selisih, memblokir yang jelas salah | Diabaikan oleh AI |
| Smart contract | Mengunci dana, mencairkan sesuai aturan | Diubah diam-diam |
| GP (multisig) | Persetujuan akhir | Mengabaikan hasil verifikasi tanpa alasan tercatat |
| Startup | Mengirim laporan, memberi akses data | Mencairkan dana sendiri |
