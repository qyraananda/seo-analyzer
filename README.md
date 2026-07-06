# 💾 SEO Engine v1.3

[![Build and Deploy to Docker](https://github.com)](https://github.com)
[![Docker Hub/GHCR](https://shields.io)](https://github.com)

SEO Engine adalah platform audit SEO *On-Page* mandiri (*Fullstack*) yang dirancang menggunakan estetika visual **Premium Neo-Brutalism** yang sepenuhnya responsif. Aplikasi ini memisahkan beban kerja antara engine data (Backend) dan dasboard visual interaktif (Frontend) untuk memberikan analisis instan tanpa pelacak pihak ketiga.

---

## ⚡ Fitur Utama (Core Capabilities)

### 1. Domain Analyzer
* **Semantic Crawler**: Membedah susunan hierarki tag heading (`H1-H3`) untuk memastikan kepatuhan semantik mesin pencari.
* **Keyword Density Scanner**: Menghitung frekuensi kemunculan kata kunci target pada dokumen `DOM Body` serta menguji relevansinya pada elemen metadata esensial (*Title* & *Description*).
* **Visual Contrast Optimization**: Mengukur rasio kontras warna CSS elemen utama berbasis standar internasional **WCAG 2.0** guna menjamin aksesibilitas dan kenyamanan pembaca.
* **Hierarchy Navigation Tracer**: Memetakan bagan taksonomi menu utama (*Header Menu*) beserta sub-menu bertingkat (*Dropdown*).

### 2. Image Analyzer
* **Asset Media Auditor**: Memungkinkan pengguna mengunggah berkas gambar asli (`JPG`, `PNG`, `WEBP`) untuk dievaluasi kelayakan bobot file (KB), kesesuaian format gambar kontemporer, dan pola penamaan file.
* **Auto Alt Text Generator**: Memformulasikan saran penulisan teks alternatif (`alt="..."`) deskriptif secara otomatis yang siap disalin dengan sekali klik.

### 3. Sistem Pendukung
* **Recent Infrastructure Audits**: Menyimpan riwayat 5 pencarian domain terakhir menggunakan `localStorage` dengan opsi penghapusan instan per item (`×`).
* **Saran Perbaikan Dinamis**: Memunculkan kotak *Action Items* taktis secara kondisional jika website target mendapatkan skor di bawah 90%.
* **Export System Log**: Mengunduh rangkuman hasil audit ke dalam file berkas teks murni (`.txt`) bergaya tabel ASCII log jadul.

---

## 🛠️ Spesifikasi Teknologi (Tech Stack)

* **Frontend**: React (Vite), Tailwind CSS v4, HTML5 File API.
* **Backend**: Node.js, Express, Axios (HTTP Client dengan proteksi *timeout*), Cheerio (HTML Parser), Multer (Multipart Upload Handler), Color-String.
* **DevOps & Kontainerisasi**: Docker, Docker Compose, GitHub Actions (CI/CD Pipeline), Nginx Proxy + ACME Companion (Let's Encrypt SSL Otomatis).

---

## 🚀 Panduan Menjalankan di Komputer Lokal (Local Development)

### Prasyarat
* Node.js v20 atau versi yang lebih baru terpasang di komputer Anda.

### 1. Menjalankan Backend
```bash
cd backend
npm install
node server.js
```
*Backend akan aktif mengudara di port `5000` (`http://localhost:5000`).*

### 2. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
*Buka browser Anda dan akses alamat lokal yang diberikan oleh Vite (biasanya `http://localhost:5173`).*

---

## 🐳 Panduan Deployment Menggunakan Docker Compose

Aplikasi ini sudah dilengkapi dengan orkestrasi kontainer terpadu. Untuk menjalankan seluruh ekosistem aplikasi (termasuk *Reverse Proxy* Nginx dan SSL otomatis) di server VPS, Anda cukup mengeksekusi perintah berikut di akar folder proyek:

```bash
# Nyalakan seluruh layanan dalam mode background (detached)
docker compose up -d
```

### Arsitektur Jaringan Kontainer:
* **Port 80 & 443**: Dikuasai oleh `nginx-proxy` untuk menyalurkan traffic masuk.
* **Frontend Container**: Berjalan di port internal `80` di belakang proxy.
* **Backend Container**: Berjalan di port internal `5000` di belakang proxy.
* **ACME Companion**: Otomatis memperbarui sertifikat SSL Let's Encrypt setiap 3 bulan secara mandiri tanpa *downtime*.

---

## 📄 Lisensi

Proyek ini dibangun di bawah lisensi **MIT License**. Anda bebas menyalin, memodifikasi, dan menyebarkan kode ini untuk kepentingan edukasi maupun komersial dengan tetap menyertakan atribusi penulis asli.
