# 07 Pasar dan bisnis

**Bahasa Indonesia** · [English](../en/07-market-and-business.md)

Mulai dari VC kripto, karena dana mereka sudah dalam USDC dan treasury startupnya ada di chain. Mereka bisa diverifikasi tanpa integrasi bank, dan tidak terbentur aturan bahwa pembayaran domestik di Indonesia wajib rupiah.

## Segmen

| Urutan | Segmen | Kebutuhan utama | Yang membayar |
| --- | --- | --- | --- |
| 1 | VC kripto dan akselerator ekosistem blockchain | Pencairan bertahap yang terverifikasi, laporan ke LP | GP / pengelola dana |
| 2 | Program hibah ekosistem dan DAO | Bukti dana hibah dipakai sesuai milestone | Foundation / DAO |
| 3 | VC dan PE tradisional | Pemantauan portofolio terverifikasi, deteksi dini | GP |
| 4 | CVC BUMN (MDI Ventures, BRI Ventures, Mandiri Capital, BNI Ventures) | Bukti verifikasi yang melindungi pengelola dana dari risiko hukum | Pengelola dana |
| 5 | Investment bank, auditor, due diligence | Verifikasi cepat sebelum M&A atau IPO (hanya modul verifikasi) | Per proyek |
| 6 | Pengadaan publik (watchdog, jurnalis, DPR/DPRD) | Deteksi harga janggal dari data terbuka | Hibah civic-tech; versi publik gratis |

## Model bisnis (hipotesis, belum divalidasi)

- Langganan per dana: US$500–2.000 per bulan, tergantung jumlah portofolio.
- Biaya escrow: 0,1–0,25% dari tiap tranche yang dicairkan.
- Due diligence untuk IB dan auditor: harga per proyek.

Angka ini harus diuji lewat wawancara dengan GP di fase validasi.

## Kompetitor

Alat yang ada mengumpulkan angka atau memindahkan dana, tapi belum ada yang mengikat pencairan dana pada verifikasi terhadap data sumber.

| Pemain | Yang dilakukan | Celah yang diisi Telisik |
| --- | --- | --- |
| Standard Metrics, Visible | Pemantauan portofolio VC: mengumpulkan metrik dari startup, sebagian lewat software akuntansi | Angka masih dari pembukuan startup sendiri, tidak dicek ke bank atau chain, tidak mengunci dana |
| Carta | Cap table dan administrasi dana | Tidak memeriksa kebenaran laporan keuangan |
| Sablier, Superfluid | Streaming dan vesting token berdasarkan waktu | Dana cair karena waktu berjalan, bukan karena kinerja terverifikasi |
| Auditor dan due diligence manual | Pemeriksaan mendalam, tahunan atau per transaksi | Lambat dan mahal, tidak berjalan terus-menerus |
| opentender (ICW) dan analisis pengadaan manual | Analisis data pengadaan publik | Tidak otomatis membandingkan harga per item dengan pasar |

Deskripsi pemain di atas berdasarkan pengetahuan umum dan perlu dicek ulang sebelum dipakai di pitch.

## Catatan: Danantara

Danantara (mengelola aset sekitar US$900 miliar) **bukan target saat ini**:

1. Penjualan ke lembaga negara sebesar itu butuh badan hukum, rekam jejak, sertifikasi, data di Indonesia, dan siklus bertahun-tahun.
2. Insentifnya terbalik: alat transparansi dibeli pengawas, bukan pihak yang diawasi.
3. Dana negara tidak akan disimpan dalam USDC di chain publik, sehingga bagian Monad hilang.
4. Risiko politik dan ketergantungan pada satu pembeli.

Pintu masuk yang lebih realistis adalah **CVC BUMN** (segmen 4), setelah punya 2–3 pelanggan swasta. Kasus TaniHub menunjukkan pengelola dana BUMN bisa dipidana secara pribadi, jadi bukti verifikasi yang permanen punya nilai langsung bagi mereka. Arsitektur perlu disiapkan dari awal supaya bisa berjalan dalam "mode tradisional": dana lewat bank dalam rupiah, data di Indonesia, dan pencatatan onchain bisa dimatikan.

## Sumber

- [IDN Financials: Danantara kelola Rp14,6 kuadriliun](https://idnfinancials.com/news/52472/prabowo-danantara-manage-idr-quadrillion-investments)
- [Indonesia Business Post: MDI Ventures, Danantara, dan kasus TaniHub](https://indonesiabusinesspost.com/7051/corporate-affairs/telkommetra-weighs-mdi-ventures-divestment-amid-danantara-overhaul)
- [Trend Asia: Koalisi Danantara Monitor](https://trendasia.org/koalisi-danantara-monitor-ajukan-permohonan-informasi-kepada-danantara-dan-bpk-dorong-transparansi-pengelolaan-aset-negara/)
- [VNN: audit BPK atas Danantara dimulai](https://www.vnn.co.id/2026/09/audit-danantara-dimulai-publik-menanti.html)
