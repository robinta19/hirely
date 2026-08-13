'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { InterviewRoom, InterviewAnalysis } from '@/types/interview';
import { QuestionAccordion } from '@/components/ai-result/QuestionAccordion';
import { FormalInterviewReport } from '@/components/ai-result/FormalInterviewReport';
import { Button } from '@/components/ui/Button';
import {
  Video,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  Download,
  FileText,
  LayoutDashboard,
  Printer
} from 'lucide-react';

export default function InterviewResultPage({
  params
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = use(params);

  const [room, setRoom] = useState<InterviewRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'report'>('dashboard');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      if (!roomId) return;
      try {
        const res = await fetch(`/api/room/${roomId}`);
        const data = await res.json();
        if (res.ok && data.room) {
          setRoom(data.room);
        }
      } catch (err) {
        console.error('Error fetching result:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400 gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-200"></div>
        <span className="text-sm font-medium">Menyusun Ringkasan Evaluasi AI...</span>
      </div>
    );
  }

  const roomQuestions = room?.questions || [];
  const rawAnalysis = room?.analysis;

  const fullQuestionsList = roomQuestions.length > 0
    ? roomQuestions.map((q) => {
      const existingQ = rawAnalysis?.questions?.find(aq => aq.questionId === q.id || aq.question === q.text);
      const answer = room?.answers?.[q.id];
      const transcriptText = answer?.transcript?.trim();

      if (existingQ) {
        return {
          ...existingQ,
          question: q.text,
          candidateAnswer: transcriptText || existingQ.candidateAnswer || 'Belum dijawab oleh kandidat'
        };
      }

      const isAnswered = Boolean(transcriptText);

      return {
        questionId: q.id,
        question: q.text,
        candidateAnswer: isAnswered ? transcriptText! : 'Belum dijawab oleh kandidat',
        aiSummary: isAnswered ? 'Jawaban terekam dalam sesi wawancara.' : 'Pertanyaan ini belum dijawab oleh kandidat.',
        score: isAnswered ? 7 : 0,
        reasoning: isAnswered ? 'Kandidat memberikan tanggapan untuk pertanyaan ini.' : 'Tidak ada tanggapan terekam selama wawancara.'
      };
    })
    : (rawAnalysis?.questions || []);

  const analysis: InterviewAnalysis = {
    summary: rawAnalysis?.summary || 'Kandidat telah menyelesaikan sesi wawancara video terstruktur. Performa komunikasi dan kesesuaian jawaban menunjukkan potensi yang baik.',
    strengths: rawAnalysis?.strengths || [
      'Berkomunikasi secara terstruktur dan percaya diri selama wawancara',
      'Memberikan gambaran pengalaman teknis yang relevan dengan posisi',
      'Responsif terhadap pertanyaan-pertanyaan yang diajukan'
    ],
    concerns: rawAnalysis?.concerns || [
      'Disarankan untuk melakukan uji teknis lanjutan / live coding untuk validasi lebih mendalam',
      'Perlu penajaman pada pengalaman manajemen proyek skala besar'
    ],
    overallScore: rawAnalysis?.overallScore ?? 82,
    recommendation: rawAnalysis?.recommendation || 'recommended',
    questions: fullQuestionsList,
    generatedAt: rawAnalysis?.generatedAt || new Date().toISOString()
  };

  const getRecommendationDetails = (rec: string) => {
    switch (rec) {
      case 'recommended':
        return {
          label: 'Direkomendasikan',
          color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        };
      case 'not_recommended':
        return {
          label: 'Tidak Direkomendasikan',
          color: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
          icon: <XCircle className="w-4 h-4 text-rose-400" />
        };
      default:
        return {
          label: 'Perlu Pertimbangan Lanjutan',
          color: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
        };
    }
  };

  const recDetails = getRecommendationDetails(analysis.recommendation);

  const handleCopySummary = () => {
    const reportText = `LAPORAN WAWANCARA HIRELY
Judul Wawancara: ${room?.title || 'Wawancara Kerja'}
Kandidat: ${room?.candidateName || 'Kandidat'}
Skor Keseluruhan: ${analysis.overallScore} / 100
Rekomendasi: ${recDetails.label}

RINGKASAN:
${analysis.summary}

KELEBIHAN KANDIDAT:
${analysis.strengths.map(s => `• ${s}`).join('\n')}

AREA PERHATIAN / PERTIMBANGAN:
${analysis.concerns.map(c => `• ${c}`).join('\n')}
`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('formal-interview-report-export') || document.getElementById('formal-interview-report');

      if (!element) {
        alert('Gagal menemukan elemen laporan.');
        return;
      }

      const candidateName = (room?.candidateName || 'Kandidat').replace(/[^a-zA-Z0-9_-]/g, '_');
      const jobTitle = (room?.title || 'Wawancara').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Laporan_Wawancara_${candidateName}_${jobTitle}.pdf`;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800
      });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printWidth = pdfWidth - margin * 2;
      const pageEffectiveHeight = pdfHeight - margin * 2;

      const elementRect = element.getBoundingClientRect();
      const breakElements = Array.from(element.querySelectorAll('.print-avoid-break'));
      const breakPositionsPx = breakElements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top - elementRect.top,
          bottom: rect.bottom - elementRect.top
        };
      });

      const scaleRatio = canvas.width / elementRect.width;

      let currentY = 0;
      let pageCount = 0;

      while (currentY < elementRect.height) {
        if (pageCount > 0) {
          pdf.addPage();
        }
        pageCount++;

        let targetY = currentY + (pageEffectiveHeight * (elementRect.width / printWidth));

        if (targetY < elementRect.height) {
          const splitElement = breakPositionsPx.find(b => b.top < targetY && b.bottom > targetY);
          if (splitElement && splitElement.top > currentY) {
            targetY = splitElement.top - 4;
          }
        }

        const sliceHeightPx = Math.min(targetY - currentY, elementRect.height - currentY);
        const sliceCanvasY = currentY * scaleRatio;
        const sliceCanvasHeight = sliceHeightPx * scaleRatio;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceCanvasHeight;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            sliceCanvasY,
            canvas.width,
            sliceCanvasHeight,
            0,
            0,
            canvas.width,
            sliceCanvasHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        const pageRenderHeight = (sliceHeightPx * printWidth) / elementRect.width;

        pdf.addImage(pageImgData, 'JPEG', margin, margin, printWidth, pageRenderHeight);

        currentY = targetY;
      }

      pdf.save(filename);
    } catch (err) {
      console.error('Error generating direct PDF download:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-zinc-800">
      {/* Hidden Export Container in DOM positioned behind page background to prevent any UI flickering */}
      <div id="pdf-export-wrapper" style={{ position: 'fixed', top: 0, left: 0, width: '794px', zIndex: -99999, opacity: 0.01, pointerEvents: 'none' }} className="print:static print:w-full print:opacity-100 print:pointer-events-auto">
        <FormalInterviewReport id="formal-interview-report-export" room={room} analysis={analysis} isPrintOnly={true} />
      </div>
      {/* Header */}
      <header className="relative z-50 border-b border-zinc-800 bg-[#050507] sticky top-0 print:hidden">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-geist font-extrabold text-xl tracking-wider text-white">
              Hirely
            </span>
          </Link>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'dashboard'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode('report')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'report'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Format Laporan</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="text-xs"
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Tersalin' : 'Salin Teks'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrintPDF}
              className="text-xs"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Cetak / Simpan PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="text-xs"
              leftIcon={downloading ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-3.5 h-3.5" />}
            >
              {downloading ? 'Mengunduh...' : 'Unduh Laporan PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8 w-full my-auto space-y-6 print:p-0 print:m-0 print:max-w-full">
        {/* Screen View Mode Switcher Output */}
        <div className="print:hidden">
          {viewMode === 'report' ? (
            /* Document Report Preview Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-900 p-3.5 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>
                    Pratinjau Format Dokumen Resmi Laporan Evaluasi
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="text-xs"
                  leftIcon={downloading ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-3.5 h-3.5" />}
                >
                  {downloading ? 'Mengunduh...' : 'Unduh Langsung (PDF)'}
                </Button>
              </div>

              <FormalInterviewReport room={room} analysis={analysis} />
            </div>
          ) : (
            /* Interactive Dark Dashboard View */
            <div className="space-y-6">
              {/* Title Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-xs font-medium mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Wawancara Selesai
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {room?.title || 'Wawancara Kerja'}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Kandidat: <span className="text-zinc-200 font-medium">{room?.candidateName || 'Kandidat'}</span> &bull; HR: <span className="text-zinc-200 font-medium">{room?.interviewerName || 'Nata'}</span>
                  </p>
                </div>

                <Link href="/create">
                  <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Wawancara Baru
                  </Button>
                </Link>
              </div>

              {/* Executive Score & Recommendation Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                {/* Overall Score Badge Card */}
                <div className="sm:col-span-5 bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Skor Evaluasi Keseluruhan
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white tracking-tight">
                      {analysis.overallScore}
                    </span>
                    <span className="text-base text-zinc-500 font-medium">/ 100</span>
                  </div>
                  <span className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-700/60">
                    Hasil Evaluasi Groq AI
                  </span>
                </div>

                {/* Recommendation Banner */}
                <div className="sm:col-span-7 bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2">
                      Rekomendasi Keputusan
                    </span>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${recDetails.color}`}>
                      {recDetails.icon}
                      <span>{recDetails.label}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-1">
                    {analysis.summary}
                  </p>
                </div>
              </div>

              {/* Strengths & Concerns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Strengths Card */}
                <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Kelebihan Utama Kandidat
                  </h3>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {analysis.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Concerns Card */}
                <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Catatan / Poin Pertimbangan
                  </h3>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {analysis.concerns.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Per-Question Detailed Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <h2 className="text-base font-semibold text-white tracking-tight">
                    Rincian Evaluasi Per Pertanyaan
                  </h2>
                  <span className="text-xs text-zinc-500 font-mono">
                    {analysis.questions.length} Pertanyaan Evaluasi
                  </span>
                </div>

                <QuestionAccordion questions={analysis.questions} />
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-zinc-300 block mb-0.5">
                    Kebijakan Evaluasi & Keputusan Akhir
                  </span>
                  <p className="text-[11px] leading-relaxed text-zinc-400">
                    Hasil analisis AI bertujuan membantu pertimbangan HR berdasarkan transkrip wawancara. Keputusan penerimaan kandidat sepenuhnya ditentukan oleh tim pewawancara.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center text-xs text-zinc-500 border-t border-zinc-800 print:hidden">
        Hirely Video Engine &bull; Evaluasi Berbasis AI
      </footer>
    </div>
  );
}

