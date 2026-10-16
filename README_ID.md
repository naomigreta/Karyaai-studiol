# KaryaAI Studio v1.2 — Paket Netlify siap deploy

KaryaAI Studio adalah aplikasi web responsif/PWA untuk menyusun draf storyboard, menjaga profil karakter, dan membuat klip video melalui model `wan-video/wan-2.2-5b-fast` di Replicate.

> **Penting:** paket ini siap dideploy, tetapi tidak bisa menghasilkan video sampai Anda menambahkan token API milik Anda sendiri. Render memakai layanan berbayar/kuota Replicate; tidak ada cara untuk menjamin pembuatan video gratis tanpa batas.

## Kemampuan v1.2

- Antarmuka Bahasa Indonesia yang cocok untuk browser HP/Android.
- Generator satu klip video per permintaan, target sekitar 5–24 detik, landscape 16:9 atau vertikal 9:16.
- Pilihan gaya sinematik realistis atau animasi 3D berbasis prompt.
- Profil serial: nama serial, nomor episode, nama tokoh, ciri fisik, kostum/properti khas.
- Unggah gambar referensi tokoh di browser. Gambar diperkecil dan dikompres di perangkat, lalu dikirim sebagai gambar awal (image-to-video) ke model Wan 2.2.
- Draft kolom proyek disimpan otomatis pada browser/perangkat yang sama.
- ID pekerjaan aktif disimpan agar pemeriksaan render dapat dilanjutkan setelah halaman dimuat ulang.
- Polling status mencoba lagi saat jaringan terganggu, dengan tombol untuk melanjutkan pemeriksaan.
- Player hasil dan tautan untuk membuka/menyimpan MP4.
- Backend Netlify Functions memegang token API; token tidak dikirim ke frontend.
- Validasi input dan kode akses pribadi.

## Batasan yang belum didukung

- Storyboard saat ini berbasis template, bukan hasil dari model penulis naskah AI.
- Satu permintaan render menghasilkan **satu klip**. Aplikasi belum membuat semua adegan secara massal, belum menggabungkan beberapa klip menjadi satu episode, dan belum mengekspor film panjang otomatis.
- Audio, musik, TTS, subtitle otomatis, dan lip-sync belum disediakan.
- Gambar referensi membantu menjaga tokoh, tetapi bukan jaminan wajah akan identik pada setiap hasil. Pilih referensi yang sama pada setiap render. Gambar referensi tidak disimpan di backend atau draft lokal; unggah ulang setelah tab/halaman dimuat ulang.
- Draft dan ID pekerjaan disimpan lokal di browser, bukan sinkronisasi cloud antarperangkat.
- Link MP4 berasal dari Replicate dan bisa kedaluwarsa. Unduh/simpan video segera setelah hasil selesai.

## Prasyarat

1. Akun Netlify.
2. Akun Replicate yang dapat memakai model Wan 2.2, serta token API dan billing/kuota yang aktif.
3. Browser modern. Untuk pengembangan/pengujian lokal, Node.js 20 atau lebih baru.

## Deployment disarankan: GitHub → Netlify

**Jangan deploy folder ini sebagai unggahan statis Netlify Drop.** Frontend statis mungkin tampil, tetapi Netlify Functions yang menghubungi Replicate tidak akan berjalan sebagaimana mestinya. Gunakan integrasi GitHub atau Netlify CLI.

1. Unduh dan ekstrak ZIP ini. Pastikan `netlify.toml`, `package.json`, folder `site/`, dan folder `netlify/functions/` berada di root repository.
2. Buat repository baru di GitHub dan unggah **isi folder hasil ekstrak**, bukan folder pembungkus tambahan.
3. Di Netlify, pilih **Add new site → Import an existing project**, lalu hubungkan repository tersebut.
4. Biarkan build command kosong. `netlify.toml` menetapkan direktori publish `site` dan folder Functions `netlify/functions`.
5. Di pengaturan environment variables Netlify, buat dua variabel berikut:
   - `REPLICATE_API_TOKEN` = token rahasia yang dibuat pada akun Replicate.
   - `KARYAAI_ACCESS_CODE` = kode akses panjang yang Anda buat sendiri untuk melindungi fungsi video.
6. Pastikan kedua variabel tersedia untuk Functions pada konteks deploy yang digunakan. Simpan pengaturan dan jalankan deploy ulang.
7. Buka URL HTTPS Netlify. Isi kode akses di bagian generator. Masukkan ide dan profil karakter, pilih durasi/rasio, centang persetujuan biaya, lalu tekan **BUAT KLIP VIDEO**.
8. Untuk menguji image-to-video, unggah gambar karakter sebelum merender. Uji dahulu satu klip singkat, pastikan status `succeeded`, lalu putar dan unduh MP4.

### Deployment melalui Netlify CLI

Jalankan dari root proyek pada komputer dengan Node.js 20+ dan Netlify CLI:

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set REPLICATE_API_TOKEN
netlify env:set KARYAAI_ACCESS_CODE
netlify deploy --build --prod
```

Jika CLI meminta nilai variabel secara tidak aman atau terlihat dalam riwayat terminal, hentikan dan atur rahasia tersebut melalui UI Netlify. Jangan menulis token ke HTML, `netlify.toml`, README, GitHub, atau chat publik.

## Cara memakai

1. Isi **Ide Film**.
2. Isi nama serial dan nomor episode jika proyek berseri.
3. Isi nama tokoh utama, ciri fisik, dan kostum/properti khas. Deskripsi ini akan ditambahkan ke prompt setiap klip.
4. Pilih satu gambar referensi tokoh dengan wajah dan pakaian yang jelas. Gambar diproses di browser dan dikirim ke model sebagai frame awal.
5. Tekan **SUSUN STORYBOARD** untuk membuat draf adegan dari template, pilih adegan yang ingin dibuat, lalu periksa prompt video.
6. Masukkan `KARYAAI_ACCESS_CODE`, pilih gaya dan durasi klip, pilih rasio, lalu centang persetujuan biaya.
7. Tekan **BUAT KLIP VIDEO**. Jangan menutup tab sebelum ID pekerjaan tersimpan; jika halaman tertutup, masukkan kode akses dan tekan tombol melanjutkan pemeriksaan.
8. Saat status berhasil, putar dan simpan MP4 segera. Untuk adegan berikutnya, pilih adegan lain dan render klip lagi. Gunakan gambar referensi tokoh yang sama.

## Biaya dan kualitas

- Hosting Netlify dapat memiliki kuota gratis sesuai paket dan kebijakan saat ini, tetapi render video di Replicate dapat dikenai biaya.
- Pilihan 480p dipakai untuk menekan biaya relatif terhadap resolusi lebih tinggi. Tinjau halaman model/harga Replicate dan saldo akun sebelum membuat video.
- Durasi aktual bersifat perkiraan sesuai jumlah frame dan FPS yang dikirim ke model.
- Batch render atau film panjang dapat menghabiskan banyak kredit; fitur itu tidak otomatis diaktifkan pada versi ini.

## Pengujian lokal

```bash
npm test
```

Tes menggunakan mock, tidak membutuhkan token Replicate dan tidak memicu biaya. Tes tersebut memeriksa validasi, pengiriman gambar referensi, perlindungan kode akses, status pekerjaan, dan elemen UI. Tes lokal **bukan** bukti bahwa akun Replicate Anda dapat merender. Validasi akhir memerlukan satu render nyata setelah deploy.

## Pemecahan masalah

- **Backend belum dikonfigurasi:** pastikan kedua environment variables disimpan dan deploy ulang telah selesai.
- **Kode akses salah:** masukkan `KARYAAI_ACCESS_CODE` yang persis sama.
- **Token tidak valid/tidak punya akses:** buat token yang valid pada akun Replicate.
- **Saldo/kuota kurang:** periksa billing Replicate; paket ini tidak dapat memberi kredit gratis.
- **Fungsi tidak ditemukan:** pastikan deploy dilakukan melalui GitHub integration atau Netlify CLI serta `netlify.toml` berada di root repository.
- **Render masih berjalan setelah jaringan terputus:** buka situs lagi, masukkan kode akses, tekan **Lanjutkan pemeriksaan render terakhir**.
- **Wajah berubah antar-klip:** gunakan gambar referensi yang sama, pertahankan Character Bible, dan ingat bahwa model generatif tidak menjamin konsistensi sempurna.
