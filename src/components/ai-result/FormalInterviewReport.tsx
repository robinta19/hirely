'use client';

import React from 'react';
import { InterviewRoom, InterviewAnalysis } from '@/types/interview';
import { Video, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Award, FileText } from 'lucide-react';

interface FormalInterviewReportProps {
  room: InterviewRoom | null;
  analysis: InterviewAnalysis;
  isPrintOnly?: boolean;
  id?: string;
}

export function FormalInterviewReport({ room, analysis, isPrintOnly = false, id = "formal-interview-report" }: FormalInterviewReportProps) {
  const getRecommendationDetails = (rec: string) => {
    switch (rec) {
      case 'recommended':
        return {
          label: 'DIREKOMENDASIKAN (RECOMMENDED)',
          bgColor: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          badgeColor: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        };
      case 'not_recommended':
        return {
          label: 'TIDAK DIREKOMENDASIKAN (NOT RECOMMENDED)',
          bgColor: 'bg-rose-50 border-rose-300 text-rose-900',
          badgeColor: 'bg-rose-600 text-white',
          icon: <XCircle className="w-5 h-5 text-rose-600" />
        };
      default:
        return {
          label: 'PERLU PERTIMBANGAN LANJUTAN (CONSIDERATION)',
          bgColor: 'bg-amber-50 border-amber-300 text-amber-900',
          badgeColor: 'bg-amber-600 text-white',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
        };
    }
  };

  const recDetails = getRecommendationDetails(analysis.recommendation);
  const formattedDate = new Date(room?.createdAt || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const docId = `INV-${(room?.id || 'ROOM').slice(0, 8).toUpperCase()}`;

  return (
    <div
      id={id}
      className={`bg-white text-slate-900 font-sans p-8 sm:p-10 rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl mx-auto space-y-8 ${
        isPrintOnly ? 'print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full' : ''
      }`}
    >
      {/* 1. Header Document */}
      <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
            <Video className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
              LAPORAN HASIL EVALUASI WAWANCARA
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Intervia AI Recruitment Assessment System &bull; Laporan Resmi Executive
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-slate-200 pl-3 sm:pl-0">
          <div className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono font-semibold border border-slate-300">
            {docId}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Tanggal: {formattedDate}</p>
        </div>
      </div>

      {/* 2. Metadata Grid */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 sm:p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-700" />
          Informasi Wawancara & Kandidat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Nama Kandidat:</span>
            <span className="font-semibold text-slate-900 text-sm">{room?.candidateName || 'Kandidat'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Judul / Posisi Wawancara:</span>
            <span className="font-semibold text-slate-900 text-sm">{room?.title || 'Wawancara Kerja'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Pewawancara (HR):</span>
            <span className="font-medium text-slate-800">{room?.interviewerName || 'Robi'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Total Pertanyaan Evaluasi:</span>
            <span className="font-medium text-slate-800">{analysis.questions.length} Pertanyaan</span>
          </div>
        </div>
      </div>

      {/* 3. Executive Score & Recommendation Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
        {/* Score Box */}
        <div className="sm:col-span-4 bg-slate-900 text-white p-5 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Skor Evaluasi AI
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold tracking-tight text-white">{analysis.overallScore}</span>
            <span className="text-slate-400 font-medium text-sm">/ 100</span>
          </div>
          <span className="text-[11px] text-emerald-300 font-medium bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
            {analysis.overallScore >= 80 ? 'Sangat Baik' : analysis.overallScore >= 65 ? 'Cukup Baik' : 'Perlu Evaluasi'}
          </span>
        </div>

        {/* Recommendation Box */}
        <div className={`sm:col-span-8 p-5 rounded-xl border flex flex-col justify-between space-y-3 ${recDetails.bgColor}`}>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
              Rekomendasi Keputusan Assessment
            </span>
            <div className="flex items-center gap-2">
              {recDetails.icon}
              <span className="font-bold text-sm text-slate-900">{recDetails.label}</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Ringkasan Eksekutif:</span>
            <p className="text-xs text-slate-800 leading-relaxed font-normal">{analysis.summary}</p>
          </div>
        </div>
      </div>

      {/* 4. Strengths & Concerns Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 break-inside-avoid">
        {/* Strengths */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2 border-b border-emerald-200 pb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Kelebihan Utama (Key Strengths)
          </h3>
          <ul className="space-y-2 text-xs text-slate-800">
            {analysis.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2 border-b border-amber-200 pb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Catatan & Area Pertimbangan (Risk & Focus)
          </h3>
          <ul className="space-y-2 text-xs text-slate-800">
            {analysis.concerns.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-amber-600 font-bold shrink-0 mt-0.5">!</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Question-by-Question Detailed Breakdown */}
      <div className="space-y-4 pt-2">
        <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-700" />
            Rincian Evaluasi & Transkrip Per Pertanyaan ({analysis.questions.length} Pertanyaan)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {analysis.questions.filter(q => q.candidateAnswer && !q.candidateAnswer.toLowerCase().includes('belum dijawab')).length} / {analysis.questions.length} Dijawab
          </span>
        </div>

        <div className="space-y-4">
          {analysis.questions.map((q, idx) => {
            const isUnanswered = !q.candidateAnswer || q.candidateAnswer.toLowerCase().includes('belum dijawab') || q.candidateAnswer.toLowerCase().includes('tidak ada jawaban');

            return (
              <div
                key={q.questionId || idx}
                className={`border rounded-lg p-4 space-y-3 break-inside-avoid ${
                  isUnanswered ? 'border-slate-300 bg-slate-100/60' : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                {/* Question Title Bar */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2">
                  <div className="flex items-start gap-2">
                    <span className="bg-slate-900 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded shrink-0">
                      Q{idx + 1}
                    </span>
                    <p className="text-xs font-bold text-slate-900 leading-snug">{q.question}</p>
                  </div>
                  <div className="shrink-0 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded border">
                    {isUnanswered ? (
                      <span className="bg-slate-200 text-slate-700 border-slate-300 px-2 py-0.5 rounded">
                        Belum Dijawab
                      </span>
                    ) : (
                      <span className={`bg-white border px-2.5 py-0.5 rounded ${q.score >= 8 ? 'text-emerald-700 border-emerald-200' : q.score >= 6 ? 'text-amber-700 border-amber-200' : 'text-rose-700 border-rose-200'}`}>
                        Skor: {q.score} / 10
                      </span>
                    )}
                  </div>
                </div>

                {/* Transkrip Jawaban */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Transkrip Jawaban Kandidat:
                  </span>
                  <div className={`p-3 border rounded text-xs leading-relaxed font-sans ${
                    isUnanswered
                      ? 'bg-slate-100 border-slate-300 text-slate-500 italic'
                      : 'bg-white border-slate-200 text-slate-800 italic'
                  }`}>
                    {isUnanswered
                      ? '(Pertanyaan ini belum dijawab oleh kandidat selama sesi wawancara)'
                      : `"${q.candidateAnswer}"`}
                  </div>
                </div>

                {/* AI Summary & Reasoning */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-100/70 p-3 rounded border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Ringkasan Jawaban:
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">{q.aiSummary}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Alasan Penilaian Skor:
                    </span>
                    <p className="text-slate-700 leading-relaxed">{q.reasoning}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Signatures & Verification Block */}
      <div className="pt-6 border-t-2 border-slate-900 break-inside-avoid space-y-6">
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-12">
            <p className="font-semibold text-slate-600">Disiapkan Oleh (Pewawancara / HR):</p>
            <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">
              <span className="font-bold text-slate-900">{room?.interviewerName || 'Robi'}</span>
            </div>
            <p className="text-[10px] text-slate-400">Tanda Tangan & Tanggal</p>
          </div>

          <div className="space-y-12">
            <p className="font-semibold text-slate-600">Disetujui Oleh (Hiring Manager):</p>
            <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">
              <span className="text-slate-400 italic">( Tanda Tangan )</span>
            </div>
            <p className="text-[10px] text-slate-400">Tanda Tangan & Tanggal</p>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
            <span>
              Dokumen ini disintesis secara otomatis oleh sistem Intervia AI. Kerahasiaan data kandidat dilindungi.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

