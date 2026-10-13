# 06 Mesin verifikasi

Setiap komponen punya peran tetap. LLM mengekstrak angka dari dokumen. Kode menghitung selisih. Model ML mencari pola janggal. Jev memberi skor dan rekomendasi. Keputusan uang diambil oleh guardrail dan GP, bukan oleh AI.

## Alur

1. **Ekstraksi:** LLM mengubah PDF dan gambar menjadi JSON dengan skema tetap. Pakai Qwen atau Kimi, sekaligus untuk mengejar bounty mereka di Metropolis.
2. **Hitung:** kode menghitung rasio laporan terhadap bank, selisih harga, dan flag vendor.
3. **Anomali:** model ML (mis. isolation forest) mencari pola janggal di arus kas.
4. **Jev:** menjawab skor risiko 0–4 dan tindakan (lolos, tanya_gp, bekukan), lengkap dengan probabilitas tiap jawaban.
5. **Guardrail:** aturan kode menimpa Jev kalau perlu.
6. **GP:** memutuskan. Nama model, versi, dan probabilitas Jev ikut dicatat di AttestationRegistry.

## Pemeriksaan

| Pemeriksaan | Cara | Tanda bahaya (ambang awal) |
| --- | --- | --- |
| Pendapatan vs mutasi bank / gateway | Rekonsiliasi per bulan, rasio laporan terhadap sumber | Rasio > 1,10 |
| Saldo kas vs treasury onchain | Cocokkan saldo akhir periode | Selisih > 5% |
| Harga item vs pasar | Median dan rentang harga pasar per item | Harga > 2x median |
| Vendor | Vendor baru, vendor duplikat, kesamaan alamat atau rekening dengan pengurus | Pembayaran besar ke vendor baru atau terafiliasi |
| Pola transaksi | Deteksi anomali pada arus kas | Uang berputar balik (round-tripping), lonjakan di akhir periode |
| Bukti ganda | Hash setiap invoice dan struk | Dokumen yang sama dipakai dua kali |

Ambang ini masih hipotesis dan harus dikalibrasi dengan data pilot.

## Keputusan

| Hasil | Kondisi | Yang terjadi |
| --- | --- | --- |
| Lolos | Semua pemeriksaan di bawah ambang, data lengkap | Tranche bisa dicairkan setelah GP menyetujui |
| Tanya GP | Selisih kecil atau data belum lengkap | GP melihat temuan, lalu memutuskan |
| Bekukan | Selisih besar, mis. pendapatan 4,8x di atas mutasi bank | Pembekuan diusulkan otomatis |

## Peran Jev

Jev (model keputusan TypeSafe, lewat `@typesafe-ai/sdk`) adalah lapisan penilai. Ia menerima angka yang sudah dihitung kode, lalu memberi skor risiko dan rekomendasi tindakan beserta probabilitasnya. Jev tidak membaca dokumen, tidak menghitung, dan tidak mencairkan dana.

| Jenis | Pertanyaan ke Jev | Keluaran |
| --- | --- | --- |
| `score` | Seberapa besar risiko laporan tidak sesuai kenyataan? (rubrik 0–4) | Skor dan probabilitas tiap tingkat |
| `choice` | Apa tindakan untuk tranche berikutnya? | lolos / tanya_gp / bekukan, plus tingkat keyakinan |
| `noul` | Apakah vendor ini kemungkinan terafiliasi dengan pengurus? | Probabilitas jawaban ya |

Contoh `state` yang dikirim ke Jev (angka fiktif, contoh AquaTech):

```json
{
  "periode": "2026-09",
  "pendapatanLaporanRp": 2000000000,
  "pendapatanBankRp": 420000000,
  "rasioLaporanBank": 4.76,
  "itemHargaJanggal": [
    { "item": "Sepatu boots", "jumlah": 500, "hargaRp": 450000, "medianPasarRp": 150000, "rasio": 3.0 }
  ],
  "vendorBaru": [
    { "nama": "PT Contoh Sepatu", "umurHari": 14, "nilaiRp": 225000000 }
  ],
  "dataLengkap": true
}
```

Contoh panggilan:

```ts
import { choice, score } from "@typesafe-ai/sdk";

const { answers } = await jev.systemOne({
  state,
  questions: {
    risiko: score("Seberapa besar risiko laporan ini tidak sesuai kenyataan?", [
      "Semua angka cocok dengan data sumber",
      "Selisih kecil yang wajar (pembulatan, waktu pencatatan)",
      "Ada selisih yang perlu klarifikasi",
      "Selisih besar di satu area",
      "Selisih besar dan berpola di beberapa area",
    ]),
    keputusan: choice("Apa tindakan untuk tranche berikutnya?", {
      lolos: "Semua pemeriksaan di bawah ambang dan data lengkap.",
      tanya_gp: "Ada selisih kecil atau data belum lengkap.",
      bekukan: "Ada selisih besar antara laporan dan data sumber.",
    }),
  },
});
```

## Guardrail

Guardrail adalah aturan kode biasa yang berjalan setelah Jev dan tidak bisa dibatalkan oleh AI. Ambang di bawah ini masih awal.

```ts
function applyGuardrails(state: State, rekomendasi: Keputusan, keyakinan: number): Keputusan {
  if (state.rasioLaporanBank > 1.5) return "bekukan";   // selisih besar selalu dibekukan
  if (!state.dataLengkap) return "tanya_gp";            // data kurang selalu ke GP
  if (keyakinan < 0.8) return "tanya_gp";               // Jev ragu, manusia yang memutuskan
  return rekomendasi;
}
```

## Batasan Jev

- **Tanpa penjelasan teks.** Alasan untuk GP disusun dari temuan aturan dan buktinya, bukan dari Jev.
- **Kerahasiaan data.** Model gratis `jev-1.13-free` lewat OpenCode Zen hanya untuk demo dengan data fiktif. Produk sungguhan butuh perjanjian enterprise atau model yang di-host sendiri, karena data portofolio rahasia dan bisa tunduk pada UU PDP.
- **Kematangan.** SDK masih versi 0.x, jadi Jev dipanggil lewat antarmuka `decide(state)` supaya bisa diganti tanpa membongkar sistem.

## Keamanan terhadap prompt injection

- Semua dokumen diperlakukan sebagai data, bukan perintah.
- Ekstraksi selalu ke skema JSON tetap. Teks bebas dari dokumen tidak pernah diteruskan sebagai instruksi.
- Komponen AI tidak punya akses ke fungsi pencairan dana.
