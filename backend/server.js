const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

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

        // PERBAIKAN 1: Gunakan User-Agent Chrome asli agar tidak dicurigai sebagai bot jahat
        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 6000 // Batas waktu tunggu maksimal 6 detik
        }).catch(err => {
            // PERBAIKAN 2: Lempar string pesan error kustom, bukan objek Error mentah
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

        // --- FITUR BARU: PELACAKAN NAVIGASI HEADER & SUB-MENU ---
        let navigationLinks = [];
        let hasSubmenus = false;

        // Cari elemen navigasi utama di dalam header, nav, atau ul kelas menu
        $('header nav, nav, ul[class*="menu"], ul[class*="nav"]').first().each((_, navElement) => {
            // Cari semua item daftar (list item) tingkat pertama
            $(navElement).find('> ul > li, > li, flex > a').each((_, liElement) => {
                const mainAnchor = $(liElement).find('> a').first();
                const mainText = mainAnchor.text().trim() || $(liElement).text().trim().split('\n')[0];
                const mainHref = mainAnchor.attr('href') || '#';

                if (mainText) {
                    let subItems = [];
                    // Cari apakah ada list bertingkat di dalamnya (Indikator Sub-Menu Dropdown)
                    $(liElement).find('ul li a, div a, ol li a').each((_, subAnchor) => {
                        const subText = $(subAnchor).text().trim();
                        const subHref = $(subAnchor).attr('href') || '#';
                        if (subText && subText !== mainText) {
                            subItems.push({ text: subItems.length + 1 + '. ' + subText, href: subHref });
                            hasSubmenus = true;
                        }
                    });

                    navigationLinks.push({
                        menu: mainText,
                        href: mainHref,
                        submenus: subItems
                    });
                }
            });
        });

        // Jika pencarian nav structural pertama kosong, ambil semua link dari header sebagai fallback
        if (navigationLinks.length === 0) {
            $('header a').each((_, el) => {
                const txt = $(el).text().trim();
                const link = $(el).attr('href');
                if (txt && navigationLinks.length < 6) { // Batasi 6 menu teratas
                    navigationLinks.push({ menu: txt, href: link || '#', submenus: [] });
                }
            });
        }

        // --- AKHIR FITUR NAVIGASI ---

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

        let score = 100;
        if (title === '❌ Tidak ditemukan' || title.length > 60) score -= 20;
        if (description === '❌ Tidak ditemukan' || description.length > 160) score -= 20;
        if (headings.h1.length !== 1) score -= 20;
        if (missingAlt > 0) score -= 20;
        if (navigationLinks.length === 0) score -= 10; // Penalti jika tidak terdeteksi menu navigasi

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
            keywordAnalysis: {
                inTitle: keywordFoundInTitle ? 'YA (BAGUS)' : 'TIDAK',
                inDesc: keywordFoundInDesc ? 'YA (BAGUS)' : 'TIDAK',
                countInBody: keywordCountInBody
            }
        });

    } catch (error) {
        // PERBAIKAN 3: Pastikan jika ada error, server WAJIB merespons JSON agar frontend berhenti loading
        console.error('[SYSTEM ERROR]:', error);
        return res.status(500).json({ 
            error: typeof error === 'string' ? error : 'Gagal memproses data server target.' 
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`[SYS] Backend berjalan di port ${PORT}`));
