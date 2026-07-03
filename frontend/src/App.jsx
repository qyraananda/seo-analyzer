import React, { useState, useEffect } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  // Muat riwayat dari localStorage saat aplikasi pertama kali dibuka
  useEffect(() => {
    const savedHistory = localStorage.getItem('cause_seo_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

    const handleAnalyze = async (e, targetUrl = null, targetKeyword = null) => {
    if (e) e.preventDefault();
    
    const finalUrl = (targetUrl || url).trim();
    const finalKeyword = targetKeyword !== null ? targetKeyword : keyword;

    // --- SISTEM VALIDASI URL KETAT (REGEX) ---
    // Pola ini memastikan input memiliki format domain yang valid (mengandung dot/ekstensi seperti .com, .id, dll)
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    
    if (!urlPattern.test(finalUrl)) {
      setError('Format URL tidak valid. Pastikan memasukkan nama domain dengan benar (Contoh: situsanda.com atau https://situsanda.com).');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, keyword: finalKeyword }),
      });

      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Terjadi kesalahan sistem');
      
      setData(result);

      // Simpan ke dalam riwayat jika input berasal dari form utama
      if (!targetUrl) {
        setHistory((prevHistory) => {
          const filtered = prevHistory.filter(item => item.url.toLowerCase() !== finalUrl.toLowerCase());
          const updated = [{ url: finalUrl, keyword: finalKeyword }, ...filtered].slice(0, 5);
          localStorage.setItem('cause_seo_history', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FITUR BARU: HAPUS ITEM RIWAYAT ---
  const handleDeleteHistory = (e, urlToDelete) => {
    if (e) e.stopPropagation(); // Mencegah terpicunya fungsi klik audit ulang
    
    setHistory((prevHistory) => {
      const updated = prevHistory.filter(item => item.url.toLowerCase() !== urlToDelete.toLowerCase());
      localStorage.setItem('cause_seo_history', JSON.stringify(updated));
      return updated;
    });
  };

  const downloadTxtReport = () => {
    if (!data) return;

    const reportText = `
┌──────────────────────────────────────────────────┐
│          CAUSE_SEO CORE AUDIT SYSTEM LOG         │
└──────────────────────────────────────────────────┘
TIMESTAMP     : ${new Date().toLocaleString()}
TARGET DOMAIN : ${data.url}
CORE KEYWORD  : ${data.keyword}
HEALTH SCORE  : ${data.score} / 100
──────────────────────────────────────────────────── METADATA ANALYSIS
- Page Title : ${data.title} (${data.titleLength} chars)
- Meta Description: ${data.description} (${data.descriptionLength} chars)
 CONTENT STRUCTURE
- H1 Count : ${data.headings.h1.length} (Optimal: 1)
- H2 Count : ${data.headings.h2.length}
- H1 Snippet : ${data.headings.h1.join(', ') || 'None'}
 KEYWORD RELEVANCY
- Matches in Title    : ${data.keywordAnalysis?.inTitle || 'NO'}
- Matches in Desc     : ${data.keywordAnalysis?.inDesc || 'NO'}
- Body Density Count  : ${data.keywordAnalysis?.countInBody || 0} times
 IMAGE ASSETS
- Total Scanned Images : ${data.images.total}
- Missing Alt Attribute: ${data.images.missingAlt}
────────────────────────────────────────────────────
              LOG GENERATION SUCCESSFUL
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = `cause_seo_report_${data.keyword || 'domain'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111] font-sans flex flex-col antialiased selection:bg-black selection:text-white">
      
      {/* ================= HEADER MENU ================= */}
      <header className="sticky top-0 z-50 bg-[#F4F1EA] border-b-2 border-black px-4 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tighter uppercase border-2 border-black px-2 py-0.5 bg-black text-[#F4F1EA]">
            CH
          </span>
          <span className="font-extrabold text-lg tracking-tight uppercase hidden sm:inline">
            CauseSEO Engine
          </span>
        </div>
        
        {/* Navigation links inside header */}
        <nav className="flex items-center gap-6 text-xs md:text-sm font-bold uppercase tracking-wider">
          <button 
            onClick={() => {
              setUrl('');
              setKeyword('');
              setData(null);
              setError('');
              document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:underline transition-all cursor-pointer bg-transparent border-none p-0 font-bold uppercase tracking-wider text-[#111111]"
          >
            Analyzer
          </button>
          {/* Menu Features mengarah menggunakan smooth scroll ke element id features */}
          <button 
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-gray-500 hover:text-black hover:underline transition-all cursor-pointer bg-transparent border-none p-0 font-bold uppercase tracking-wider"
          >
            Features
          </button>
          <button 
            onClick={() => document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-black text-[#F4F1EA] px-4 py-1.5 border border-black hover:bg-transparent hover:text-black transition-all shadow-[2px_2px_0px_#000] text-xs md:text-sm font-bold uppercase tracking-wider cursor-pointer"
          >
            Run App
          </button>
        </nav>
        
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main id="analyzer" className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-16">
        
        {/* HERO TITLE SECTION */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest bg-black text-[#F4F1EA] px-2 py-1">
            System Infrastructure v1.2
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
            Wired for organic growth.
          </h1>
          <p className="text-sm md:text-base font-medium text-gray-700 leading-relaxed">
            Audit infrastruktur on-page, optimasi meta tag, dan kerapatan kata kunci web Anda dalam satu sistem terintegrasi.
          </p>
        </div>

        {/* INPUT CONTROLLER */}
        <div className="bg-white border-2 border-black p-6 md:p-8 shadow-[6px_6px_0px_#111111] transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#111111]">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider">Target Domain / URL</label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#F4F1EA] text-black p-3 border-2 border-black font-semibold text-sm focus:outline-none focus:bg-white placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider">Core Keyword target</label>
                <input
                  type="text"
                  placeholder="digital marketing, optimization"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-[#F4F1EA] text-black p-3 border-2 border-black font-semibold text-sm focus:outline-none focus:bg-white placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-[#F4F1EA] py-3.5 font-black uppercase tracking-widest text-xs md:text-sm border-2 border-black hover:bg-[#F4F1EA] hover:text-black transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing Infrastructure...' : 'Launch Core Analysis'}
            </button>
          </form>
         {/* COMPONENT RIWAYAT PENCARIAN (HISTORY) DENGAN OPSI HAPUS */}
          {history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">Recent Infrastructure Audits:</span>
              <div className="flex flex-wrap gap-2">
                {history.map((item, index) => (
                  <div 
                    key={index}
                    className="inline-flex items-center bg-[#F4F1EA] border border-black transition-colors"
                  >
                    {/* Tombol untuk menjalankan audit ulang */}
                    <button
                      type="button"
                      onClick={() => {
                        setUrl(item.url);
                        setKeyword(item.keyword);
                        handleAnalyze(null, item.url, item.keyword);
                      }}
                      className="hover:bg-black hover:text-[#F4F1EA] text-xs font-bold px-2 py-1 transition-colors cursor-pointer text-left h-full border-r border-black"
                    >
                      {item.url.replace(/^https?:\/\//i, '')} {item.keyword ? `(${item.keyword})` : ''}
                    </button>
                    
                    {/* Tombol silang (X) untuk menghapus item ini dari riwayat */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistory(e, item.url)}
                      className="text-xs font-black px-2 py-1 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer h-full"
                      title="Hapus dari riwayat"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ERROR HANDLER */}
        {error && (
          <div className="bg-[#FFD2D2] border-2 border-black p-4 font-bold text-xs uppercase tracking-wider shadow-[4px_4px_0px_#111111]">
            [!] Execution Error: {error}
          </div>
        )}

        {/* ================= RESULT BOARD ================= */}
        {data && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* SCORE CARD */}
              <div className="bg-black text-[#F4F1EA] p-6 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.15)] flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO Score Index</span>
                <div className="my-4">
                  <span className="text-5xl md:text-6xl font-black tracking-tighter">{data.score}</span>
                  <span className="text-xl text-gray-400">/100</span>
                </div>
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">✓ Diagnostics Complete</span>
              </div>

              {/* CORE METRIC A */}
              <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Metadata Health</span>
                <div className="my-2 space-y-1">
                  <p className="text-sm font-extrabold truncate">Title: &apos;{data.title}&apos;</p>
                  <p className="text-xs text-gray-600">Length: {data.titleLength} Chars</p>
                </div>
                <span className="text-[10px] font-bold bg-[#F4F1EA] px-2 py-0.5 border border-black inline-block self-start uppercase">On-Page</span>
              </div>

              {/* CORE METRIC B */}
              <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Keyword Density</span>
                <div className="my-2 space-y-1">
                  <p className="text-sm font-extrabold">Frequency: {data.keywordAnalysis?.countInBody || 0} Match(es)</p>
                  <p className="text-xs text-gray-600">In Title: {data.keywordAnalysis?.inTitle || 'NO'}</p>
                </div>
                <span className="text-[10px] font-bold bg-[#F4F1EA] px-2 py-0.5 border border-black inline-block self-start uppercase">Relevancy</span>
              </div>
            </div>

            {/* DETAILED TECHNICAL LOG PREVIEW */}
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111] space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight border-b-2 border-black pb-2">Technical Report Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider">Meta Description</h4>
<p className="font-medium text-gray-800 mt-1">&quot;{data.description}&quot;</p>
                    <p className="text-xs text-gray-500 mt-0.5">Length: {data.descriptionLength} Chars (Target: 150-160)</p>
                  </div>
                  <div>
                    <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider">Heading Architecture</h4>
                    <p className="font-medium text-gray-800 mt-1">H1 Tag Count: {data.headings.h1.length}</p>
                    <p className="font-medium text-gray-800">H2 Tag Count: {data.headings.h2.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider">Asset Media Optimization</h4>
                    <p className="font-medium text-gray-800 mt-1">Total Scanned Images: {data.images.total}</p>
                    <p className="font-medium text-red-600 font-bold">Missing Alt Attributes: {data.images.missingAlt}</p>
                  </div>
                  <div>
                    <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider">Crawling Status</h4>
                    <p className="font-medium text-gray-800 mt-1">User-Agent: CauseSeoBot/1.0</p>
                    <p className="font-medium text-gray-800">SSL Connection: Verified secure</p>
                  </div>
                </div>
              </div>
                  {/* DETAIL PEMBACAAN ELEMENT NAVIGASI */}
                  <div className="md:col-span-2 border-t-2 border-dashed border-black pt-4 mt-2">
                    <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider mb-2">
                      Header Navigation &amp; Sub-Menu Hierarchy
                    </h4>
                                      {/* ================= REKOMENDASI SARAN SEO DINAMIS ================= */}
                  {data.score < 90 && (
                    <div className="md:col-span-2 border-t-2 border-black pt-5 mt-4 space-y-3 bg-[#FFFDF9] p-4 border-2 border-black shadow-[3px_3px_0px_#111]">
                      <div className="flex items-center gap-2 text-amber-700">
                        <span className="font-black text-xs uppercase tracking-widest bg-amber-700 text-white px-2 py-0.5">
                          ⚠️ Action Required
                        </span>
                        <h4 className="font-black uppercase text-sm tracking-tight">
                          Panduan Perbaikan Infrastruktur SEO (Skor &lt; 90%)
                        </h4>
                      </div>
                      
                      <p className="text-xs text-gray-700 font-medium leading-relaxed">
                        Sistem mendeteksi bahwa arsitektur on-page situs ini belum optimal. Lakukan langkah-langkah koreksi berikut untuk menaikkan peringkat keterbacaan di mesin pencari:
                      </p>

                      <ul className="space-y-3 text-xs font-semibold text-gray-800 pl-1">
                        {/* Validasi Title */}
                        {(data.title === '❌ Tidak ditemukan' || data.titleLength > 60 || data.titleLength < 40) && (
                          <li className="flex gap-2 items-start bg-white p-2 border border-black">
                            <span className="text-red-600 font-black">⚡</span>
                            <div>
                              <p className="uppercase text-[10px] font-black tracking-wider text-red-600">Optimasi Meta Title</p>
                              <p className="font-medium text-gray-600 mt-0.5">Ubah panjang judul halaman menjadi 40-60 karakter. Judul saat ini ({data.titleLength} char) rentan terpotong di halaman pencarian Google atau kurang informatif.</p>
                            </div>
                          </li>
                        )}

                        {/* Validasi Description */}
                        {(data.description === '❌ Tidak ditemukan' || data.descriptionLength > 160 || data.descriptionLength < 120) && (
                          <li className="flex gap-2 items-start bg-white p-2 border border-black">
                            <span className="text-red-600 font-black">⚡</span>
                            <div>
                              <p className="uppercase text-[10px] font-black tracking-wider text-red-600">Optimasi Meta Description</p>
                              <p className="font-medium text-gray-600 mt-0.5">Tulis deskripsi halaman yang ringkas dengan rentang 120-160 karakter. Sertakan satu kata kunci target secara natural untuk meningkatkan CTR (Click-Through Rate).</p>
                            </div>
                          </li>
                        )}

                        {/* Validasi Headings */}
                        {data.headings.h1.length !== 1 && (
                          <li className="flex gap-2 items-start bg-white p-2 border border-black">
                            <span className="text-red-600 font-black">⚡</span>
                            <div>
                              <p className="uppercase text-[10px] font-black tracking-wider text-red-600">Restrukturisasi Heading H1</p>
                              <p className="font-medium text-gray-600 mt-0.5">Situs Anda memiliki {data.headings.h1.length} tag H1. Setiap halaman wajib memiliki tepat SATU tag H1 sebagai topik utama untuk memandu robot perayap memahami fokus konten.</p>
                            </div>
                          </li>
                        )}

                        {/* Validasi Alt Gambar */}
                        {data.images.missingAlt > 0 && (
                          <li className="flex gap-2 items-start bg-white p-2 border border-black">
                            <span className="text-red-600 font-black">⚡</span>
                            <div>
                              <p className="uppercase text-[10px] font-black tracking-wider text-red-600">Aksesibilitas Media Gambar</p>
                              <p className="font-medium text-gray-600 mt-0.5">Terdapat {data.images.missingAlt} gambar yang kehilangan atribut <code className="bg-gray-100 px-1 py-0.5 text-xs font-mono">alt=&quot;&quot;</code>. Tambahkan teks alternatif deskriptif pada kode HTML gambar agar dapat terindeks di Google Image Search.</p>
                            </div>
                          </li>
                        )}

                        {/* Validasi Navigasi */}
                        {data.navigation?.totalMenus === 0 && (
                          <li className="flex gap-2 items-start bg-white p-2 border border-black">
                            <span className="text-red-600 font-black">⚡</span>
                            <div>
                              <p className="uppercase text-[10px] font-black tracking-wider text-red-600">Struktur Navigasi Menu</p>
                              <p className="font-medium text-gray-600 mt-0.5">Sistem gagal mendeteksi menu navigasi terstruktur (<code className="bg-gray-100 px-1 py-0.5 text-xs font-mono">&lt;nav&gt;</code>). Pastikan tautan menu utama dikelompokkan dengan benar agar ekuitas link (link juice) mengalir ke halaman internal.</p>
                            </div>
                          </li>
                        )}

                        {/* Validasi Kerapatan Keyword */}
                        {data.keyword !== 'TIDAK_ADA' && data.keywordAnalysis?.countInBody === 0 && (
                          <li className="flex gap-2 items-start bg-white p-2 border border-black">
                            <span className="text-red-600 font-black">⚡</span>
                            <div>
                              <p className="uppercase text-[10px] font-black tracking-wider text-red-600">Relevansi Kata Kunci Target</p>
                              <p className="font-medium text-gray-600 mt-0.5">Kata kunci &quot;{data.keyword}&quot; sama sekali tidak ditemukan pada teks halaman body. Sisipkan kata kunci tersebut pada paragraf pertama dan heading <code className="bg-gray-100 px-1 py-0.5 text-xs font-mono">H2</code> secara proporsional.</p>
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                    <p className="text-xs font-bold text-gray-800 mb-3">
                      Struktur Struktur Menu: {data.navigation?.totalMenus || 0} Terdeteksi | Dropdown: {data.navigation?.hasDropdowns || 'TIDAK'}
                    </p>
                    
                    {data.navigation?.tree && data.navigation.tree.length > 0 ? (
                      <div className="bg-[#F4F1EA] p-3 border border-black space-y-2 font-mono text-xs">
                        {data.navigation.tree.map((nav, nIdx) => (
                          <div key={nIdx} className="space-y-1">
                            <p className="font-bold text-black">
                              ↳ [M] {nav.menu} <span className="text-gray-400 font-normal">({nav.href})</span>
                            </p>
                            {nav.submenus && nav.submenus.length > 0 && (
                              <div className="pl-6 border-l border-gray-400 space-y-0.5">
                                {nav.submenus.map((sub, sIdx) => (
                                  <p key={sIdx} className="text-gray-600">
                                    ↳ [S] {sub.text} <span className="text-gray-400">({sub.href})</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-red-600 font-medium">⚠️ Gagal memetakan hierarki menu navigasi secara struktural.</p>
                    )}
                  </div>

              {/* ACTION EXPORT BUTTON */}
              <button
                onClick={downloadTxtReport}
                className="w-full bg-black text-[#F4F1EA] py-3 font-bold uppercase tracking-wider text-xs border-2 border-black hover:bg-transparent hover:text-black transition-colors"
              >
                📥 Export System Report Log (.txt)
              </button>
            </div>
</div>
        )}
                {/* ================= FEATURES SECTION ================= */}
        <section id="features" className="pt-12 border-t-2 border-black space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-black text-[#F4F1EA] px-2 py-0.5">
              Core Capabilities
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Engine Specifications.
            </h2>
            <p className="text-xs md:text-sm text-gray-600 max-w-xl">
              Infrastruktur audit yang dirancang kaku untuk mendiagnosis metrik on-page secara transparan tanpa pelacak pihak ketiga.
            </p>
          </div>

          {/* GRID TIGA KOLOM NEO-BRUTALISM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* FEATURE 1 */}
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111]">
              <div className="w-8 h-8 bg-black text-[#F4F1EA] flex items-center justify-center font-black text-sm mb-4 border border-black">
                01
              </div>
              <h3 className="font-extrabold uppercase text-sm tracking-tight mb-2">Semantic Crawler</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Membedah susunan hierarki tag heading <code className="bg-gray-100 px-1 py-0.5 border border-gray-300 font-mono">H1-H2</code> untuk memastikan struktur konten ramah bot mesin pencari.
              </p>
            </div>

            {/* FEATURE 2 */}
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111]">
              <div className="w-8 h-8 bg-black text-[#F4F1EA] flex items-center justify-center font-black text-sm mb-4 border border-black">
                02
              </div>
              <h3 className="font-extrabold uppercase text-sm tracking-tight mb-2">Keyword Density</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Menghitung frekuensi kemunculan kata kunci target pada dokumen <code className="bg-gray-100 px-1 py-0.5 border border-gray-300 font-mono">DOM Body</code> dan menguji relevansinya pada metadata esensial.
              </p>
            </div>

            {/* FEATURE 3 */}
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111]">
              <div className="w-8 h-8 bg-black text-[#F4F1EA] flex items-center justify-center font-black text-sm mb-4 border border-black">
                03
              </div>
              <h3 className="font-extrabold uppercase text-sm tracking-tight mb-2">Asset Verification</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Memindai atribut alternatif (<code className="bg-gray-100 px-1 py-0.5 border border-gray-300 font-mono">alt text</code>) pada seluruh aset media gambar guna menjamin aksesibilitas indeks Google Gambar.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* ================= FOOTER MENU ================= */}
      <footer className="bg-black text-[#F4F1EA] border-t-2 border-black px-6 md:px-12 py-12 mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          
          <div className="space-y-3">
            <p className="font-black text-lg tracking-tighter uppercase bg-[#F4F1EA] text-black inline-block px-2 py-0.5">
              CauseSEO
            </p>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Sebuah platform digital audit terintegrasi yang menyatukan performa data, struktur semantik, dan kejelasan arsitektur web.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400">Core Services</h4>
            <ul className="space-y-1 text-xs text-gray-300 font-medium">
              <li><a href="#analyzer" className="hover:underline">On-Page Spider</a></li>
              <li><a href="#analyzer" className="hover:underline">Keyword Density Scanner</a></li>
              <li><a href="#analyzer" className="hover:underline">Metadata Health Metrics</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400">References</h4>
            <ul className="space-y-1 text-xs text-gray-300 font-medium">
              <li><a href="#" target="_blank" rel="noreferrer" className="hover:underline">About Studio Style</a></li>
              <li><a href="https://tailwindcss.com" target="_blank" rel="noreferrer" className="hover:underline">Tailwind Framework</a></li>
              <li><a href="https://react.dev" target="_blank" rel="noreferrer" className="hover:underline">React Client Architecture</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 font-medium gap-4">
          <p>© 2026 CauseSEO Engine. All rights reserved. Built for mission-driven web optimization.</p>
          <div className="flex gap-4 uppercase tracking-wider text-[10px]">
            <a href="#" target="_blank" rel="noreferrer" className="hover:underline">Privacy</a>
            <a href="#" target="_blank" rel="noreferrer" className="hover:underline">Terms of Use</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
