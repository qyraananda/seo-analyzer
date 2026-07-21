import React, { useState, useEffect } from 'react';

function App() {
  // --- STATE SYSTEM ---
  const [activeTab, setActiveTab] = useState('domain'); // 'domain' atau 'image'
  const [error, setError] = useState('');
  
  // Domain Analyzer State
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Image Analyzer State
  const [imageFile, setImageFile] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // --- ENGINE LIFECYCLE ---
  useEffect(() => {
    const savedHistory = localStorage.getItem('cause_seo_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // --- LOGIC: DOMAIN AUDIT ---
  const handleAnalyze = async (e, targetUrl = null, targetKeyword = null) => {
    if (e) e.preventDefault();
    const finalUrl = (targetUrl || url).trim();
    const finalKeyword = targetKeyword !== null ? targetKeyword : keyword;

    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    if (!urlPattern.test(finalUrl)) {
      setError('Format URL tidak valid. Pastikan memasukkan nama domain dengan benar.');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, keyword: finalKeyword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Terjadi kesalahan sistem');
      setData(result);

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

  // --- LOGIC: IMAGE AUDIT ---
  const handleImageAnalyze = async (e) => {
    e.preventDefault();
    if (!imageFile) return;

    setImageLoading(true);
    setError('');
    setImageData(null);

    const formData = new FormData();
    formData.append('seo_image', imageFile);

    try {
      const res = await fetch('http://localhost:5000/api/analyze-image', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menganalisis gambar');
      setImageData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteHistory = (e, urlToDelete) => {
    if (e) e.stopPropagation();
    setHistory((prevHistory) => {
      const updated = prevHistory.filter(item => item.url.toLowerCase() !== urlToDelete.toLowerCase());
      localStorage.setItem('cause_seo_history', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#111111] font-sans flex flex-col antialiased selection:bg-black selection:text-white">
      
      {/* ================= HEADER MENU ================= */}
      <header className="sticky top-0 z-50 bg-[#87e64b] text-black border-b-2 border-black px-4 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tighter uppercase border-2 border-black px-2 py-0.5 bg-black text-[#87e64b]">
            SEO
          </span>
          <span className="font-extrabold text-lg tracking-tight uppercase hidden sm:inline text-black">
            SEO Engine
          </span>
        </div>
        
        <nav className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-bold uppercase tracking-wider">
          {/* TAB 1: DOMAIN ANALYZER */}
          <div className="relative group px-4 py-2">
            <div className={`absolute inset-0 bg-white transition-opacity duration-150 z-0 ${activeTab === 'domain' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ clipPath: 'polygon(15% 0%, 100% 20%, 85% 100%, 0% 100%)' }} />
            <button 
              onClick={() => { setActiveTab('domain'); setError(''); }}
              className="relative z-10 text-black font-black uppercase tracking-wider cursor-pointer bg-transparent border-none p-0"
            >
              Domain Analyzer
            </button>
          </div>

          {/* TAB 2: IMAGE ANALYZER */}
          <div className="relative group px-4 py-2">
            <div className={`absolute inset-0 bg-white transition-opacity duration-150 z-0 ${activeTab === 'image' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <button 
              onClick={() => { setActiveTab('image'); setError(''); }}
              className="relative z-10 text-black font-black uppercase tracking-wider cursor-pointer bg-transparent border-none p-0"
            >
              Image Analyzer
            </button>
          </div>

          
          <button 
            onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-gray-800 hover:text-black font-black uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 hidden md:inline ml-2"
          >
            Features
          </button>
          
          <button 
            onClick={() => { document.getElementById('main-workspace')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="bg-black text-[#87e64b] px-7 py-2 font-black uppercase tracking-widest text-xs md:text-sm transition-all hover:bg-white hover:text-black cursor-pointer border-none ml-2"
            style={{ clipPath: 'polygon(15% 0%, 100% 20%, 85% 100%, 0% 100%)' }}
          >
            Run App
          </button>
        </nav>
      </header>

      {/* ================= MAIN WORKSPACE ================= */}
      <main id="main-workspace" className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-16">
        
        {/* HERO TITLE */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest bg-black text-[#F4F1EA] px-2 py-1">
            System Infrastructure v1.3
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
            {activeTab === 'domain' ? 'Wired for organic growth.' : 'Asset Media Optimization.'}
          </h1>
          <p className="text-sm md:text-base font-medium text-gray-700 leading-relaxed">
            {activeTab === 'domain' 
              ? 'Audit infrastruktur on-page, optimasi meta tag, dan kerapatan kata kunci web Anda dalam satu sistem terintegrasi.' 
              : 'Unggah file gambar konten Anda untuk memverifikasi rasio kompresi, kepatuhan ekstensi, dan struktur teks alternatif (Alt Text) SEO.'}
          </p>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="bg-[#FFD2D2] border-2 border-black p-4 font-bold text-xs uppercase tracking-wider shadow-[4px_4px_0px_#111111]">
            [!] Execution Error: {error}
          </div>
        )}

        {/* ================= VIEW 1: DOMAIN ANALYZER WORKSPACE ================= */}
        {activeTab === 'domain' && (
          <div className="space-y-12">
            <div className="bg-white border-2 border-black p-6 md:p-8 shadow-[6px_6px_0px_#111111]">
              <form onSubmit={handleAnalyze} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider">Target Domain / URL</label>
                    <input type="text" placeholder="example.com" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-[#F4F1EA] text-black p-3 border-2 border-black font-semibold text-sm focus:outline-none focus:bg-white" required />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider">Core Keyword target</label>
                    <input type="text" placeholder="digital marketing" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="w-full bg-[#F4F1EA] text-black p-3 border-2 border-black font-semibold text-sm focus:outline-none focus:bg-white" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-black text-[#87e64b] py-3.5 font-black uppercase tracking-widest text-xs md:text-sm border-2 border-black hover:bg-[#F4F1EA] hover:text-black transition-colors cursor-pointer">
                  {loading ? 'Processing Infrastructure...' : 'Launch Core Analysis'}
                </button>
              </form>

                           {/* HISTORY LIST */}
              {history.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">Recent Infrastructure Audits:</span>
                  <div className="flex flex-wrap gap-2">
                    {history.map((item, index) => (
                      <div key={index} className="inline-flex items-center bg-[#F4F1EA] border border-black">
                        <button type="button" onClick={() => { setUrl(item.url); setKeyword(item.keyword); handleAnalyze(null, item.url, item.keyword); }} className="hover:bg-black hover:text-[#87e64b] text-xs font-bold px-2 py-1 transition-colors cursor-pointer text-left border-r border-black">{item.url.replace(/^https?:\/\//i, '')} {item.keyword ? `(${item.keyword})` : ''}</button>
                        <button type="button" onClick={(e) => handleDeleteHistory(e, item.url)} className="text-xs font-black px-2 py-1 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

                       {/* DOMAIN REPORT OUTPUT */}
            {data && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-black text-[#87e64b] p-6 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.15)] flex flex-col justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">SEO Score Index</span>
                    <div className="my-4"><span className="text-5xl md:text-6xl font-black tracking-tighter">{data.score}</span><span className="text-xl text-gray-400">/100</span></div>
                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">✓ Diagnostics Complete</span>
                  </div>
                  <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Metadata Health</span>
                    <div className="my-2 space-y-1"><p className="text-sm font-extrabold truncate">Title: &apos;{data.title}&apos;</p><p className="text-xs text-gray-600">Length: {data.titleLength} Chars</p></div>
                    <span className="text-[10px] font-bold bg-[#F4F1EA] px-2 py-0.5 border border-black uppercase inline-block self-start">On-Page</span>
                  </div>
                  <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Keyword Density</span>
                    <div className="my-2 space-y-1"><p className="text-sm font-extrabold">Frequency: {data.keywordAnalysis?.countInBody || 0} Match(es)</p><p className="text-xs text-gray-600">In Title: {data.keywordAnalysis?.inTitle || 'NO'}</p></div>
                    <span className="text-[10px] font-bold bg-[#F4F1EA] px-2 py-0.5 border border-black uppercase inline-block self-start">Relevancy</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111] space-y-6">
                  <h3 className="text-lg font-black uppercase tracking-tight border-b-2 border-black pb-2">Technical Report Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider">Meta Description</h4>
                      <p className="font-medium text-gray-800 mt-1">&quot;{data.description}&quot;</p>
                      <p className="text-xs text-gray-500 mt-0.5">Length: {data.descriptionLength} Chars</p>
                    </div>
                    <div>
                      <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider">Asset Media Optimization</h4>
                      <p className="font-medium text-gray-800 mt-1">Total Images: {data.images.total} | Missing Alt: <span className="text-red-600 font-bold">{data.images.missingAlt}</span></p>
                    </div>
                    <div>
                      <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider">Visual Contrast Optimization</h4>
                      <p className="font-medium text-gray-800 mt-1">Ratio Contrast: {data.colorContrast?.ratio || '1.0'}:1</p>
                      <p className={`font-bold ${data.colorContrast?.accessible === 'LOLOS (BAGUS)' ? 'text-green-600' : 'text-red-600'}`}>WCAG Status: {data.colorContrast?.accessible}</p>
                    </div>
                  </div>

                  {/* NAV TREES */}
                  <div className="border-t-2 border-dashed border-black pt-4 mt-2">
                    <h4 className="font-extrabold uppercase text-xs text-gray-500 tracking-wider mb-2">Header Navigation Hierarchy</h4>
                    {data.navigation?.tree && data.navigation.tree.length > 0 ? (
                      <div className="bg-[#F4F1EA] p-3 border border-black space-y-2 font-mono text-xs">
                        {data.navigation.tree.map((nav, nIdx) => (
                          <div key={nIdx}>
                            <p className="font-bold">[M] {nav.menu} ({nav.href})</p>
                            {nav.submenus?.map((sub, sIdx) => (
                              <p key={sIdx} className="pl-4 text-gray-600">↳ [S] {sub.text}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-gray-500">Flat Navigation / No submenus</p>}
                  </div>

                  {/* RECOMMENDATIONS */}
                  {data.score < 90 && (
                    <div className="border-t-2 border-black pt-4 space-y-2 bg-[#FFFDF9] p-3 border-2 border-black">
                      <p className="text-xs font-black uppercase text-amber-700">⚠️ Optimization Roadmap Required</p>
                      <ul className="text-xs space-y-1 pl-4 list-disc">
                        {data.images.missingAlt > 0 && <li>Tambahkan atribut ALT pada {data.images.missingAlt} media gambar.</li>}
                        {data.headings.h1.length !== 1 && <li>Sesuaikan halaman agar memiliki tepat 1 tag H1.</li>}
                        {data.titleLength > 60 && <li>Koreksi judul halaman di bawah 60 karakter.</li>}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const blob = new Blob([`CAUSE_SEO REPORT\nURL: ${data.url}\nSCORE: ${data.score}/100`], { type: 'text/plain' });
                      const element = document.createElement('a');
                      element.href = URL.createObjectURL(blob);
                      element.download = "seo_report.txt";
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="w-full bg-black text-[#87e64b] py-3 font-bold uppercase text-xs border-2 border-black hover:bg-transparent hover:text-black transition-colors"
                  >
                    📥 Export System Report Log (.txt)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

               {/* ================= VIEW 2: IMAGE ANALYZER WORKSPACE ================= */}
        {activeTab === 'image' && (
          <div className="space-y-12" id="image-analyzer">
            <div className="bg-white border-2 border-black p-6 md:p-8 shadow-[6px_6px_0px_#111111]">
              <form onSubmit={handleImageAnalyze} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider">Upload Asset Image</label>
                  <div className="border-2 border-dashed border-black bg-[#F4F1EA] p-8 text-center relative hover:bg-white transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setImageFile(e.target.files[0]); // Ambil file objek pertama langsung
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      required 
                    />
                    <p className="text-sm font-bold uppercase tracking-tight">
                      {imageFile ? `✓ BERKAS SIAP: ${imageFile.name}` : 'Klik atau Tarik File Gambar ke Sini'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 font-semibold">Mendukung format JPG, PNG, WEBP hingga maksimal 5MB</p>
                  </div>
                </div>
                <button type="submit" disabled={imageLoading} className="w-full bg-black text-[#87e64b] py-3.5 font-black uppercase tracking-widest text-xs md:text-sm border-2 border-black hover:bg-[#F4F1EA] hover:text-black transition-colors cursor-pointer">
                  {imageLoading ? 'Analyzing Image Data...' : 'Analyze Image SEO Profile'}
                </button>
              </form>
            </div>

            {/* IMAGE REPORT OUTPUT */}
            {imageData && (
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111] space-y-6">
                <div className="flex justify-between items-center border-b-2 border-black pb-3">
                  <h3 className="text-lg font-black uppercase tracking-tight">Asset Media SEO Analysis</h3>
                  <div className="bg-black text-[#87e64b] px-3 py-1 font-black text-sm border border-black">
                    SCORE: {imageData.score}/100
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm font-semibold">
                  <div className="space-y-2 bg-[#F4F1EA] p-4 border border-black">
                    <p className="text-gray-500 uppercase text-[10px] font-black">Spesifikasi File</p>
                    <p className="text-gray-800">Nama File: <span className="font-mono text-black font-black">{imageData.fileName}</span></p>
                    <p className="text-gray-800">Ukuran Disk: <span className="text-black">{imageData.fileSize}</span></p>
                    <p className="text-gray-800">Format Gambar: <span className="bg-black text-white px-1.5 py-0.5 font-mono text-xs">{imageData.format}</span></p>
                  </div>

                  <div className="space-y-2 bg-yellow-50 p-4 border border-black">
                    <p className="text-amber-700 uppercase text-[10px] font-black">Rekomendasi Alt Text Otomatis</p>
                    <div className="bg-white p-2 border border-black font-mono text-xs text-black select-all">
                      alt=&quot;{imageData.suggestedAltText}&quot;
                    </div>
                  </div>
                </div>

                <div className="border-t border-black pt-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Action Items for Improvement:</h4>
                  <ul className="space-y-2">
                    {imageData.recommendations?.map((rec, idx) => (
                      <li key={idx} className="bg-white p-2 border border-black text-xs font-medium text-gray-800 flex gap-2">
                        <span className={imageData.score === 100 ? 'text-green-600' : 'text-red-600'}>⚡</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= FEATURES SECTION ================= */}
        <section id="features" className="pt-12 border-t-2 border-black space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-black text-[#F4F1EA] px-2 py-0.5">Core Capabilities</span>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Engine Specifications.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111]">
              <div className="w-8 h-8 bg-black text-[#87e64b] flex items-center justify-center font-black text-sm mb-4 border border-black">01</div>
              <h3 className="font-extrabold uppercase text-sm tracking-tight mb-2">Semantic Crawler</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Membedah susunan hierarki tag heading H1-H2 untuk memastikan struktur konten ramah bot.</p>
            </div>
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111]">
              <div className="w-8 h-8 bg-black text-[#87e64b] flex items-center justify-center font-black text-sm mb-4 border border-black">02</div>
              <h3 className="font-extrabold uppercase text-sm tracking-tight mb-2">Image Auditor</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Mengevaluasi nama berkas gambar, ukuran kompresi KB, dan memformulasikan penulisan tag alternatif secara otomatis.</p>
            </div>
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#111111]">
              <div className="w-8 h-8 bg-black text-[#87e64b] flex items-center justify-center font-black text-sm mb-4 border border-black">03</div>
              <h3 className="font-extrabold uppercase text-sm tracking-tight mb-2">Contrast Checker</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Mengukur rasio kepatuhan kontras warna berbasis standar WCAG 2.0 demi kenyamanan pembaca.</p>
            </div>
          </div>
        </section>
        
      </main>

      {/* ================= FOOTER MENU ================= */}
      <footer className="bg-[#87e64b] text-black border-t-2 border-black px-6 md:px-12 py-12 mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div className="space-y-3">
            <p className="font-black text-lg tracking-tighter uppercase bg-black text-[#87e64b] inline-block px-2 py-0.5 border-2 border-black">SEO</p>
            <p className="text-xs text-gray-800 max-w-xs leading-relaxed font-medium">Sebuah platform digital audit terintegrasi yang menyatukan performa data, struktur semantik, dan kejelasan arsitektur web.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-xs uppercase tracking-widest text-black border-b border-black pb-0.5 inline-block">Core Services</h4>
            <ul className="space-y-1 text-xs text-gray-900 font-bold">
              <li><button onClick={() => { setActiveTab('domain'); }} className="hover:underline bg-transparent border-none p-0 cursor-pointer font-bold text-xs">On-Page Domain Spider</button></li>
              <li><button onClick={() => { setActiveTab('image'); }} className="hover:underline bg-transparent border-none p-0 cursor-pointer font-bold text-xs">Image SEO File Auditor</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-black mt-8 pt-6 text-[11px] text-gray-900 font-bold">
          <p>&copy;{new Date().getFullYear()}  SEO Engine. All rights reserved. Built for mission-driven web optimization.</p>
        </div>
        
      </footer>
    </div>
  );
}

export default App;

           