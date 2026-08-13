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

export function FormalInterviewReport({
  room,
  analysis,
  isPrintOnly = false,
  id = "formal-interview-report"
}: FormalInterviewReportProps) {
  const getRecommendationDetails = (rec: string) => {
    switch (rec) {
      case 'recommended':
        return {
          label: 'DIREKOMENDASIKAN (RECOMMENDED)',
          bgColor: '#ecfdf5',
          borderColor: '#6ee7b7',
          textColor: '#065f46',
          badgeBg: '#059669',
          badgeText: '#ffffff',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        };
      case 'not_recommended':
        return {
          label: 'TIDAK DIREKOMENDASIKAN (NOT RECOMMENDED)',
          bgColor: '#fff1f2',
          borderColor: '#fca5a5',
          textColor: '#9f1239',
          badgeBg: '#e11d48',
          badgeText: '#ffffff',
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
        };
      default:
        return {
          label: 'PERLU PERTIMBANGAN LANJUTAN (CONSIDERATION)',
          bgColor: '#fffbeb',
          borderColor: '#fcd34d',
          textColor: '#92400e',
          badgeBg: '#d97706',
          badgeText: '#ffffff',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
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
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '32px',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        boxSizing: 'border-box'
      }}
      className={`bg-white text-slate-900 font-sans p-8 sm:p-10 rounded-xl border border-slate-200 w-full max-w-4xl mx-auto ${isPrintOnly ? 'print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full' : 'shadow-xl'
        }`}
    >
      {/* Embedded Print CSS for perfect native A4 page breaks */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, nav, .print-hidden {
            display: none !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* 1. Header Document */}
      <div
        className="print-avoid-break"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #0f172a',
          paddingBottom: '16px',
          marginBottom: '24px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}
          >
            <Video className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              LAPORAN HASIL EVALUASI WAWANCARA
            </h1>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', fontWeight: 500 }}>
              Hirely AI Recruitment Assessment System &bull; Laporan Resmi Executive
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              border: '1px solid #cbd5e1'
            }}
          >
            {docId}
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>
            Tanggal: {formattedDate}
          </p>
        </div>
      </div>

      {/* 2. Metadata Grid */}
      <div
        className="print-avoid-break"
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px',
          marginBottom: '24px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        <h2
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#475569',
            marginBottom: '12px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FileText className="w-4 h-4 text-slate-700 inline" />
          Informasi Wawancara & Kandidat
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Nama Kandidat:</span>
            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{room?.candidateName || 'Kandidat'}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Judul / Posisi Wawancara:</span>
            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{room?.title || 'Wawancara Kerja'}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Pewawancara (HR):</span>
            <span style={{ fontWeight: 500, color: '#1e293b' }}>{room?.interviewerName || 'Nata'}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Total Pertanyaan Evaluasi:</span>
            <span style={{ fontWeight: 500, color: '#1e293b' }}>{analysis.questions.length} Pertanyaan</span>
          </div>
        </div>
      </div>

      {/* 3. Executive Score & Recommendation Banner */}
      <div
        className="print-avoid-break"
        style={{
          display: 'grid',
          gridTemplateColumns: '4fr 8fr',
          gap: '16px',
          alignItems: 'stretch',
          marginBottom: '24px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        {/* Score Box */}
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
            Skor Evaluasi AI
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
            <span style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{analysis.overallScore}</span>
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>/ 100</span>
          </div>
          <span
            style={{
              fontSize: '11px',
              color: '#6ee7b7',
              fontWeight: 600,
              backgroundColor: '#064e3b',
              border: '1px solid #047857',
              padding: '2px 10px',
              borderRadius: '9999px',
              marginTop: '4px'
            }}
          >
            {analysis.overallScore >= 80 ? 'Sangat Baik' : analysis.overallScore >= 65 ? 'Cukup Baik' : 'Perlu Evaluasi'}
          </span>
        </div>

        {/* Recommendation Box */}
        <div
          style={{
            backgroundColor: recDetails.bgColor,
            border: `1px solid ${recDetails.borderColor}`,
            color: recDetails.textColor,
            padding: '18px 20px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', display: 'block', marginBottom: '4px' }}>
              Rekomendasi Keputusan Assessment
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {recDetails.icon}
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{recDetails.label}</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Ringkasan Eksekutif:</span>
            <p style={{ fontSize: '11px', color: '#1e293b', lineHeight: 1.5, margin: 0, fontWeight: 400 }}>{analysis.summary}</p>
          </div>
        </div>
      </div>

      {/* 4. Strengths & Concerns Matrix */}
      <div
        className="print-avoid-break"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        {/* Strengths */}
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '18px'
          }}
        >
          <h3
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid #bbf7d0',
              paddingBottom: '8px',
              marginTop: 0,
              marginBottom: '10px'
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
            Kelebihan Utama (Key Strengths)
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#1e293b' }}>
            {analysis.strengths.map((str, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
                <span style={{ color: '#059669', fontWeight: 'bold' }}>✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '18px'
          }}
        >
          <h3
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid #fde68a',
              paddingBottom: '8px',
              marginTop: 0,
              marginBottom: '10px'
            }}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 inline" />
            Catatan & Area Pertimbangan (Risk & Focus)
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#1e293b' }}>
            {analysis.concerns.map((con, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
                <span style={{ color: '#d97706', fontWeight: 'bold' }}>!</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Question-by-Question Detailed Breakdown */}
      <div style={{ marginBottom: '24px' }}>
        <div
          className="print-avoid-break"
          style={{
            borderBottom: '2px solid #0f172a',
            paddingBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            breakInside: 'avoid',
            pageBreakInside: 'avoid'
          }}
        >
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award className="w-4 h-4 text-slate-700 inline" />
            Rincian Evaluasi & Transkrip Per Pertanyaan ({analysis.questions.length} Pertanyaan)
          </h2>
          <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
            {analysis.questions.filter(q => q.candidateAnswer && !q.candidateAnswer.toLowerCase().includes('belum dijawab')).length} / {analysis.questions.length} Dijawab
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {analysis.questions.map((q, idx) => {
            const isUnanswered = !q.candidateAnswer || q.candidateAnswer.toLowerCase().includes('belum dijawab') || q.candidateAnswer.toLowerCase().includes('tidak ada jawaban');

            return (
              <div
                key={q.questionId || idx}
                className="print-avoid-break mb-5"
                style={{
                  border: isUnanswered ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                  backgroundColor: isUnanswered ? '#f1f5f9' : '#f8fafc',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid'
                }}
              >
                {/* Question Title Bar */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        flexShrink: 0
                      }}
                    >
                      Q{idx + 1}
                    </span>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', margin: 0, lineHeight: 1.4 }}>{q.question}</p>
                  </div>
                  <div style={{ flexShrink: 0, fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}>
                    {isUnanswered ? (
                      <span style={{ backgroundColor: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px' }}>
                        Belum Dijawab
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          color: q.score >= 8 ? '#047857' : q.score >= 6 ? '#b45309' : '#be123c'
                        }}
                      >
                        Skor: {q.score} / 10
                      </span>
                    )}
                  </div>
                </div>

                {/* Transkrip Jawaban */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                    Transkrip Jawaban Kandidat:
                  </span>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                      backgroundColor: isUnanswered ? '#e2e8f0' : '#ffffff',
                      border: isUnanswered ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                      color: isUnanswered ? '#64748b' : '#1e293b'
                    }}
                  >
                    {isUnanswered
                      ? '(Pertanyaan ini belum dijawab oleh kandidat selama sesi wawancara)'
                      : `"${q.candidateAnswer}"`}
                  </div>
                </div>

                {/* AI Summary & Reasoning */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '11px',
                    backgroundColor: '#f1f5f9',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                      Ringkasan Jawaban:
                    </span>
                    <p style={{ color: '#0f172a', fontWeight: 500, lineHeight: 1.4, margin: 0 }}>{q.aiSummary}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                      Alasan Penilaian Skor:
                    </span>
                    <p style={{ color: '#334155', lineHeight: 1.4, margin: 0 }}>{q.reasoning}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Footer Disclaimer Only */}
      <div
        className="print-avoid-break"
        style={{
          backgroundColor: '#f1f5f9',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '10px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginTop: '24px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
          <span>
            Dokumen ini disintesis secara otomatis oleh sistem Hirely AI. Kerahasiaan data kandidat dilindungi.
          </span>
        </div>
      </div>
    </div>
  );
}
