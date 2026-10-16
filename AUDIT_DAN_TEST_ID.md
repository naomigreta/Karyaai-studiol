# KaryaAI Studio v1.2 — Catatan audit dan uji

## Pembaruan v1.2
- Ditambahkan Character Bible sederhana: nama serial, nomor episode, nama tokoh, ciri fisik, dan kostum/properti khas.
- Ditambahkan unggah gambar karakter untuk image-to-video. Browser mengompres gambar jadi JPEG kecil (target data URL di bawah 250 KB), backend memvalidasi jenis dan ukuran sebelum meneruskan ke Replicate.
- Prompt kini menyertakan aturan konsistensi karakter dan konteks episode.
- Kolom proyek disimpan otomatis ke localStorage pada perangkat yang sama. Token Replicate tidak pernah disimpan di browser.
- ID render aktif disimpan lokal dan bisa dilanjutkan setelah halaman dimuat ulang. Polling mencoba kembali pada gangguan jaringan sementara.
- Cache Service Worker dinaikkan agar pengguna menerima versi UI yang baru.
- Instruksi deployment menegaskan integrasi GitHub atau Netlify CLI, bukan Netlify Drop statis.

## Yang perlu dipahami
- Pembuatan gambar/video tetap memerlukan `REPLICATE_API_TOKEN` serta billing/kuota Replicate. Tidak ada render nyata yang dilakukan selama pengujian paket ini.
- Tes otomatis menggunakan mock provider dan tidak memicu biaya.
- Paket menghasilkan satu klip per permintaan. Storyboard bersifat template. Penyatuan multi-klip ke satu film panjang, audio, lip-sync, dan penyimpanan cloud belum termasuk.
- Gambar referensi membantu, tetapi tidak menjamin konsistensi identitas sempurna.
- URL output Replicate dapat kedaluwarsa; simpan hasil penting segera.

## Hasil pengujian
Jalankan `npm test` dengan Node.js 20+. Tes menguji validasi prompt/durasi/gaya/rasio, perlindungan kode akses, request API mock, input gambar referensi, status render, dan elemen UI. Tes lulus hanya membuktikan perilaku lokal yang diuji, bukan keberhasilan render live.

## Pemeriksaan akhir setelah deploy
1. Pastikan halaman HTTPS terbuka.
2. Pastikan kedua environment variables tersedia untuk Functions.
3. Jalankan render satu klip dengan prompt sederhana.
4. Pastikan status mencapai `succeeded`, output dapat diputar, dan file bisa disimpan.
5. Jalankan satu render dengan gambar referensi.
