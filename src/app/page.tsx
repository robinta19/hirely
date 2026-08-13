'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { JoinModal } from '@/components/landing/JoinModal';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !interviewerName.trim()) return;

    // Navigate to /create with pre-filled Title and HR Interviewer Name so HR can compose questions
    router.push(
      `/create?title=${encodeURIComponent(title.trim())}&interviewerName=${encodeURIComponent(interviewerName.trim())}`
    );
  };

  const faqItems = [
    {
      q: 'Bagaimana sistem keamanan Host Key melindungi role pewawancara?',
      a: 'Setiap ruangan wawancara memiliki Host Key rahasia yang otomatis disimpan di browser HR. Kandidat yang mengakses tanpa kunci rahasia secara otomatis dikunci pada Candidate View dan tidak dapat memanipulasi role via URL.'
    },
    {
      q: 'Apakah kandidat harus membuat akun atau menginstal aplikasi?',
      a: 'Sama sekali tidak. Kandidat cukup mengeklik link yang dibagikan oleh HR dan langsung dapat bergabung melalui browser HP atau komputer tanpa perlu mengunduh aplikasi.'
    },
    {
      q: 'Bagaimana transkrip Speech-to-Text bekerja selama wawancara?',
      a: 'Sistem menangkap audio ucapan kandidat secara otomatis dan mengonversinya menjadi teks transkrip real-time yang langsung terasosiasi dengan pertanyaan aktif.'
    },
    {
      q: 'Apakah hasil unduhan PDF dapat dicetak secara bersih tanpa potongan?',
      a: 'Ya, hasil ekspor PDF dirancang menggunakan mesin pemotong elemen pintar sehingga kartu pertanyaan, skor AI, dan ringkasan tidak akan pernah terpotong di tengah kalimat.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col justify-between selection:bg-white selection:text-black font-inter antialiased relative overflow-hidden">
      
      {/* Background Technical Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Solid Non-Translucent Navigation Header */}
      <header className="relative z-50 border-b border-white/10 bg-[#050507] sticky top-0 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="font-geist font-extrabold text-lg sm:text-xl tracking-wider text-white">
              Hirely
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-inter font-medium tracking-wide text-zinc-400">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            <a href="#metriks" className="hover:text-white transition-colors">Metriks</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-zinc-800 bg-zinc-900 text-[11px] sm:text-xs font-inter tracking-wide text-zinc-300 hover:border-zinc-600 hover:text-white transition-all whitespace-nowrap shrink-0"
            >
              Gabung Kode
            </button>
            <Link href="/create" className="shrink-0">
              <button className="px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full bg-white text-black text-[11px] sm:text-xs font-inter font-bold tracking-wide hover:bg-zinc-200 transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-white/10 whitespace-nowrap shrink-0">
                <span>Buat Wawancara</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 space-y-24 pb-24">
        
        {/* Main Hero Header with Right Background Image & Smooth Gradient Fade */}
        <section className="max-w-7xl mx-auto px-6 pt-16 sm:pt-28 relative">
          
          {/* Smooth Right Background 3D Metallic Image Accent */}
          <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full pointer-events-none z-0 overflow-hidden">
            <Image
              src="/images/chrome_hero_shape.jpg"
              alt="Hirely 3D Engine Background"
              fill
              priority
              className="object-cover object-center opacity-45 mix-blend-screen"
            />
            {/* Smooth Radial & Linear Gradient Fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-[#050507]/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/80 via-transparent to-[#050507]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl text-left space-y-8"
          >
            {/* Bold High-Impact Geist Headline */}
            <h1 className="font-geist text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.02]">
              Boost Your <br />
              <span className="text-zinc-400 font-light italic">
                Hiring Accuracy
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-inter text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
              Platform wawancara kerja terstruktur bertenaga AI dengan transkripsi speech-to-text otomatis real-time, evaluasi kompetensi AI instan, dan otentikasi kunci rahasia host.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById('instant-builder-card');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-black text-xs font-inter font-bold tracking-wide hover:bg-zinc-200 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-white/10"
              >
                <span>Mulai Ruangan Wawancara</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-zinc-800 bg-zinc-950/80 text-xs font-inter tracking-wide text-zinc-300 hover:border-zinc-600 hover:text-white transition-all flex items-center justify-center gap-2 backdrop-blur-md whitespace-nowrap shrink-0"
              >
                <span>Masuk Kode Ruangan</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 text-left">
              <div>
                <span className="font-geist text-xl sm:text-2xl font-bold text-white block">100%</span>
                <span className="font-inter text-[10px] text-zinc-400 tracking-wide">Host Key Secure</span>
              </div>
              <div>
                <span className="font-geist text-xl sm:text-2xl font-bold text-white block">&lt; 200ms</span>
                <span className="font-inter text-[10px] text-zinc-400 tracking-wide">Live WebRTC Latency</span>
              </div>
              <div>
                <span className="font-geist text-xl sm:text-2xl font-bold text-white block">A4 PDF</span>
                <span className="font-inter text-[10px] text-zinc-400 tracking-wide">Executive Report</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Instant Room Builder Utility Card */}
        <section id="instant-builder-card" className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-zinc-950/90 backdrop-blur-xl border border-white/10 p-6 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <h2 className="font-geist text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Buat Ruangan Wawancara Instan
                </h2>
              </div>
              <span className="font-inter text-[11px] text-zinc-400">
                Kunci Rahasia Host Otomatis
              </span>
            </div>

            <form onSubmit={handleQuickCreate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-inter font-medium tracking-wide text-zinc-400 mb-2">
                    Judul Wawancara / Posisi Pekerjaan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Developer Interview"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white text-sm transition-all font-inter"
                  />
                </div>

                <div>
                  <label className="block text-xs font-inter font-medium tracking-wide text-zinc-400 mb-2">
                    Nama Pewawancara (HR)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nata"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white text-sm transition-all font-inter"
                  />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
                <p className="text-xs text-zinc-400 font-inter max-w-sm shrink">
                  Klik Mulai Ruangan untuk menyusun daftar pertanyaan dan mengaktifkan ruangan wawancara.
                </p>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(true)}
                    className="px-5 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-inter text-zinc-300 hover:border-zinc-600 hover:text-white transition-all whitespace-nowrap shrink-0"
                  >
                    Gabung Kode
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim() || !interviewerName.trim()}
                    className="px-6 py-3 rounded-xl bg-white text-black text-xs font-inter font-bold tracking-wide hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-white/10 shrink-0 whitespace-nowrap"
                  >
                    <span>Lanjutkan &amp; Susun Pertanyaan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </section>

        {/* High-Impact Metrics Section */}
        <section id="metriks" className="border-y border-white/10 bg-zinc-950/60 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-left"
          >
            <div className="border-l-2 border-white/20 pl-4 space-y-1">
              <span className="font-geist text-3xl sm:text-5xl font-extrabold text-white tracking-tight">100%</span>
              <p className="font-inter text-xs text-zinc-400 tracking-wide">Host Key Tamper-Proof</p>
            </div>

            <div className="border-l-2 border-white/20 pl-4 space-y-1">
              <span className="font-geist text-3xl sm:text-5xl font-extrabold text-white tracking-tight">&lt; 200ms</span>
              <p className="font-inter text-xs text-zinc-400 tracking-wide">WebRTC Video Latency</p>
            </div>

            <div className="border-l-2 border-white/20 pl-4 space-y-1">
              <span className="font-geist text-3xl sm:text-5xl font-extrabold text-white tracking-tight">98%</span>
              <p className="font-inter text-xs text-zinc-400 tracking-wide">Speech-to-Text Accuracy</p>
            </div>

            <div className="border-l-2 border-white/20 pl-4 space-y-1">
              <span className="font-geist text-3xl sm:text-5xl font-extrabold text-white tracking-tight">0 Detik</span>
              <p className="font-inter text-xs text-zinc-400 tracking-wide">Instant Setup No Login</p>
            </div>
          </motion.div>
        </section>

        {/* Bento Grid Feature Showcase */}
        <section id="fitur" className="max-w-7xl mx-auto px-6 space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-left space-y-2"
          >
            <h2 className="font-geist text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Alat Seleksi Rekrutmen Berstandar Tinggi
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Bento Card 1 (8 cols): Live Video & Speech Transcript */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-6 hover:border-zinc-700 transition-all text-left"
            >
              <h3 className="font-geist text-base font-bold text-white tracking-wide">
                WebRTC Video Call &amp; Live Speech-to-Text
              </h3>

              <p className="font-inter text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                Video call real-time berkualits HD berbasis WebRTC dengan transkripsi ucapan kandidat otomatis yang langsung terasosiasi per pertanyaan wawancara.
              </p>

              {/* Simulated UI Mockup */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-inter border-b border-zinc-800 pb-2">
                  <span>Q1: Ceritakan latar belakang Anda?</span>
                  <span className="text-emerald-400 font-bold">Live STT Active</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs italic text-zinc-300 font-inter">
                  &quot;Saya berpengalaman 4 tahun mengoperasikan aplikasi web berbasis Next.js dan TypeScript...&quot;
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2 (4 cols): Automated AI Scorecard */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-6 hover:border-zinc-700 transition-all text-left flex flex-col justify-between"
            >
              <div className="space-y-4">
                <h3 className="font-geist text-base font-bold text-white tracking-wide">
                  Evaluasi AI Instan
                </h3>

                <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                  Sintesis otomatis Groq AI yang menganalisis kesesuaian jawaban, memberikan skor 1-100, serta merangkum kelebihan utama.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-xs text-zinc-400">Skor Kompetensi</span>
                  <span className="font-geist text-lg font-extrabold text-emerald-400">88 / 100</span>
                </div>
                <span className="font-inter text-[10px] text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded block text-center">
                  Direkomendasikan (Recommended)
                </span>
              </div>
            </motion.div>

            {/* Bento Card 3 (4 cols): Host Key Protection */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-zinc-700 transition-all text-left"
            >
              <h3 className="font-geist text-base font-bold text-white tracking-wide">
                Host Key Authorization
              </h3>
              <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                Pembuat ruangan dilindungi oleh kunci rahasia host (`hk_...`). Kandidat tidak dapat memanipulasi URL untuk membuka role HR.
              </p>
            </motion.div>

            {/* Bento Card 4 (4 cols): Executive PDF Report */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-zinc-700 transition-all text-left"
            >
              <h3 className="font-geist text-base font-bold text-white tracking-wide">
                Executive A4 PDF Report
              </h3>
              <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                Ekspor laporan resmi berformat PDF lengkap dengan margin 24px rapi dan pemotong elemen pintar tanpa teks terpotong kasar.
              </p>
            </motion.div>

            {/* Bento Card 5 (4 cols): Zero Account Friction */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-zinc-700 transition-all text-left"
            >
              <h3 className="font-geist text-base font-bold text-white tracking-wide">
                No-Registration Setup
              </h3>
              <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                Langsung buat ruangan wawancara dalam hitungan detik tanpa perlu mengisikan formulir pendaftaran akun yang rumit.
              </p>
            </motion.div>

          </div>
        </section>

        {/* Technical Workflow Section */}
        <section id="workflow" className="max-w-7xl mx-auto px-6 space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-left space-y-2"
          >
            <h2 className="font-geist text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Alur Kerja Rekrutmen
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3 relative"
            >
              <h3 className="font-geist text-sm font-bold text-white tracking-wide">Susun Pertanyaan</h3>
              <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                Input judul posisi pekerjaan dan tentukan daftar pertanyaan kompetensi untuk kandidat.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3 relative"
            >
              <h3 className="font-geist text-sm font-bold text-white tracking-wide">Bagikan Link Bersih</h3>
              <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                Salin link gabung bersih (`/room/[id]/join`) dan kirimkan langsung kepada kandidat.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3 relative"
            >
              <h3 className="font-geist text-sm font-bold text-white tracking-wide">Video Call &amp; STT</h3>
              <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                Jalankan sesi video call HD. Sistem merekam transkrip jawaban kandidat secara otomatis.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3 relative"
            >
              <h3 className="font-geist text-sm font-bold text-white tracking-wide">Terima Hasil &amp; PDF</h3>
              <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                Dapatkan skor rekomendasi AI seketika dan ekspor laporan PDF resmi untuk hiring manager.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Interactive FAQ Section */}
        <section id="faq" className="max-w-5xl mx-auto px-6 space-y-8 text-left relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-left space-y-2"
          >
            <h2 className="font-geist text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Pertanyaan Umum
            </h2>
          </motion.div>

          <div className="space-y-3 font-inter">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className="rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-zinc-300 transition-colors tracking-wide font-geist"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900 pt-3 font-inter"
                      >
                        {item.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* High Conversion Dark Luxe CTA Box */}
        <section className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden"
          >
            <h2 className="font-geist text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Siap Melakukan Wawancara Pertama Anda?
            </h2>

            <p className="font-inter max-w-xl mx-auto text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Mulai buat ruangan wawancara terstruktur dan rasakan kemudahan seleksi kandidat bertenaga AI hari ini.
            </p>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => {
                  const el = document.getElementById('instant-builder-card');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 rounded-full bg-white text-black text-xs font-inter font-bold tracking-wide hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-2xl shadow-white/20"
              >
                <span>Buat Ruangan Wawancara Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </section>

      </main>

      {/* Tech Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-zinc-500 bg-[#050507] relative z-10 font-inter">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-geist font-bold text-white tracking-wide">Hirely Engine</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
            <span>Next.js 16</span>
            <span>&bull;</span>
            <span>LiveKit WebRTC</span>
            <span>&bull;</span>
            <span>Groq AI Synthesis</span>
          </div>

          <div>
            <span>&copy; {new Date().getFullYear()} Hirely. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Join Modal */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
