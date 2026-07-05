const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const colorString = require('color-string');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());


// Konfigurasi penyimpanan memori untuk Multer (aman untuk Docker)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batasi maksimal ukuran gambar 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb('Error: Hanya file gambar (JPG, PNG, WEBP) yang diizinkan!');
    }
});

// --- ROUTE BARU: ANALISIS GAMBAR UNTUK SEO ---
app.post('/api/analyze-image', upload.single('seo_image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Silakan unggah satu file gambar terlebih dahulu.' });
    }

    try {
        const file = req.file;
        const originalName = file.originalname;
        const fileSizeKB = (file.buffer.length / 1024).toFixed(2);
        const extension = path.extname(originalName).toLowerCase().replace('.', '');

        // --- VALIDASI PARAMETER SEO GAMBAR ---
        let imageScore = 100;
        let recommendations = [];

        // 1. Validasi Ukuran File (Disarankan < 200KB untuk web cepat)
        if (fileSizeKB > 200) {
            imageScore -= 30;
            recommendations.push('Kompres gambar di bawah 200KB. Ukuran saat ini terlalu besar dan berpotensi memperlambat LCP (Largest Contentful Paint).');
        }

        // 2. Validasi Penamaan File (Harus deskriptif, tidak boleh spasi, disarankan pakai tanda hubung -)
        const hasSpaces = /\s/g.test(originalName);
        const isGenericName = /^(image|img|photo|screenshot|dsc|untitled)/i.test(originalName);
        
        if (hasSpaces || isGenericName) {
            imageScore -= 30;
            recommendations.push('Ubah nama file menjadi deskriptif menggunakan huruf kecil dan tanda hubung (Contoh: "sepatu-lari-pria.png"). Hindari spasi atau nama bawaan kamera.');
        }

        // 3. Validasi Format Kontemporer (Disarankan WebP)
        if (extension !== 'webp') {
            imageScore -= 20;
            recommendations.push('Konversi format gambar ke WebP atau AVIF untuk menghemat bandwidth server dan mempercepat pemuatan halaman.');
        }

        // Sugesti Teks Alternatif Otomatis Berdasarkan Nama File
        const suggestedAlt = originalName
            .replace(path.extname(originalName), '')
            .replace(/[-_]/g, ' ')
            .trim();

        return res.json({
            fileName: originalName,
            fileSize: `${fileSizeKB} KB`,
            format: extension.toUpperCase(),
            score: Math.max(0, imageScore),
            suggestedAltText: suggestedAlt || 'deskripsi-gambar',
            recommendations: recommendations.length > 0 ? recommendations : ['✓ Selamat! Aset gambar Anda telah dioptimasi dengan sempurna untuk SEO.']
        });

    } catch (error) {
        console.error('[IMAGE ERROR]:', error);
        return res.status(500).json({ error: 'Gagal menganalisis berkas gambar.' });
    }
});

// --- PERBAIKAN FUNGSI MATEMATIKA UNTUK RASIO KONTRAS (WCAG 2.0) ---
function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function calculateContrast(color1, color2) {
    try {
        // PERBAIKAN: Gunakan metode penguraian .get.rgb() yang valid
        const c1 = colorString.get.rgb(color1);
        const c2 = colorString.get.rgb(color2);

        // Pengaman jika format warna CSS web target tidak standar atau gagal urai
        if (!c1 || !c2) return 5.0; 

        const lum1 = getLuminance(c1[0], c1[1], c1[2]);
        const lum2 = getLuminance(c2[0], c2[1], c2[2]);

        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
    } catch (e) {
        // Fallback aman agar jika terjadi error, skrip crawling tidak mandek
        return 5.0; 
    }
}


app.post('/api/analyze', async (req, res) => {
    const { url, keyword } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL harus diisi' });
    }

    try {
        let targetUrl = url.trim();
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            timeout: 6000
        }).catch(err => {
            if (err.code === 'ENOTFOUND') throw 'Domain tidak ditemukan atau alamat DNS tidak valid.';
            if (err.code === 'ECONNABORTED') throw 'Waktu koneksi habis. Server target memproses terlalu lambat.';
            throw 'Akses ditolak atau gagal memuat data dari server target.';
        });

        const $ = cheerio.load(response.data);
        
        const title = $('title').text().trim() || '❌ Tidak ditemukan';
        const description = $('meta[name="description"]').attr('content')?.trim() || '❌ Tidak ditemukan';
        
        const headings = {
            h1: $('h1').map((i, el) => $(el).text().trim()).get(),
            h2: $('h2').map((i, el) => $(el).text().trim()).get()
        };

        let totalImages = 0;
        let missingAlt = 0;
        $('img').each((i, el) => {
            totalImages++;
            if (!$(el).attr('alt')) missingAlt++;
        });

        // --- TRACKING HEADER NAVIGATION ---
        let navigationLinks = [];
        let hasSubmenus = false;
        $('header nav, nav, ul[class*="menu"], ul[class*="nav"]').first().each((_, navElement) => {
            $(navElement).find('> ul > li, > li, flex > a').each((_, liElement) => {
                const mainAnchor = $(liElement).find('> a').first();
                const mainText = mainAnchor.text().trim();
                const mainHref = mainAnchor.attr('href') || '#';

                if (mainText) {
                    let subItems = [];
                    $(liElement).find('ul li a, div a, ol li a').each((_, subAnchor) => {
                        const subText = $(subAnchor).text().trim();
                        const subHref = $(subAnchor).attr('href') || '#';
                        if (subText && subText !== mainText) {
                            subItems.push({ text: subItems.length + 1 + '. ' + subText, href: subHref });
                            hasSubmenus = true;
                        }
                    });

                    navigationLinks.push({ menu: mainText, href: mainHref, submenus: subItems });
                }
            });
        });

        if (navigationLinks.length === 0) {
            $('header a').each((_, el) => {
                const txt = $(el).text().trim();
                const link = $(el).attr('href');
                if (txt && navigationLinks.length < 6) {
                    navigationLinks.push({ menu: txt, href: link || '#', submenus: [] });
                }
            });
        }

        // --- FITUR BARU: DETEKSI WARNA & KONTRAS CSS ---
        // Membaca inline style warna dari elemen body/main sebagai sampel data
        const bodyStyle = $('body').attr('style') || '';
        let bgColor = '#ffffff'; // default
        let textColor = '#000000'; // default

        const bgMatch = bodyStyle.match(/background-color:\s*([^;]+)/i);
        const textMatch = bodyStyle.match(/[^a-z]color:\s*([^;]+)/i);

        if (bgMatch) bgColor = bgMatch[1].trim();
        if (textMatch) textColor = textMatch[1].trim();

        // Hitung rasio kontras menggunakan rumus WCAG 2.0
        const contrastRatio = calculateContrast(bgColor, textColor);
        const isContrastAccessible = contrastRatio >= 4.5;

        // --- KEYWORD DENSITY ---
        let keywordFoundInTitle = false;
        let keywordFoundInDesc = false;
        let keywordCountInBody = 0;

        if (keyword) {
            const cleanKeyword = keyword.toLowerCase().trim();
            keywordFoundInTitle = title.toLowerCase().includes(cleanKeyword);
            keywordFoundInDesc = description.toLowerCase().includes(cleanKeyword);
            
            const bodyText = $('body').text().toLowerCase();
            const matches = bodyText.match(new RegExp(cleanKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'));
            keywordCountInBody = matches ? matches.length : 0;
        }

        // --- KALKULASI SKOR AKHIR ---
        let score = 100;
        if (title === '❌ Tidak ditemukan' || title.length > 60) score -= 20;
        if (description === '❌ Tidak ditemukan' || description.length > 160) score -= 20;
        if (headings.h1.length !== 1) score -= 20;
        if (missingAlt > 0) score -= 20;
        if (!isContrastAccessible) score -= 10; // Penalti 10 poin jika kontras warna buruk untuk UX/SEO

        return res.json({
            url: targetUrl,
            keyword: keyword || 'TIDAK_ADA',
            score: Math.max(0, score),
            title,
            titleLength: title.length,
            description,
            descriptionLength: description.length,
            headings,
            images: { total: totalImages, missingAlt },
            navigation: {
                totalMenus: navigationLinks.length,
                hasDropdowns: hasSubmenus ? 'YA (TERDETEKSI)' : 'TIDAK / FLAT NAV',
                tree: navigationLinks
            },
            colorContrast: {
                background: bgColor,
                text: textColor,
                ratio: contrastRatio.toFixed(2),
                accessible: isContrastAccessible ? 'LOLOS (BAGUS)' : 'GAGAL (BURUK)'
            },
            keywordAnalysis: {
                inTitle: keywordFoundInTitle ? 'YA (BAGUS)' : 'TIDAK',
                inDesc: keywordFoundInDesc ? 'YA (BAGUS)' : 'TIDAK',
                countInBody: keywordCountInBody
            }
        });

    } catch (error) {
        console.error('[SYSTEM ERROR]:', error);
        return res.status(500).json({ 
            error: typeof error === 'string' ? error : 'Gagal memproses data server target.' 
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`[SYS] Backend berjalan di port ${PORT}`));
