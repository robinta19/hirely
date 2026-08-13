'use client';

import React, { useState } from 'react';
import { QuestionAnalysis } from '@/types/interview';
import { ChevronDown, ChevronUp, MessageSquareText, Award } from 'lucide-react';
import { clsx } from 'clsx';

interface QuestionAccordionProps {
  questions: QuestionAnalysis[];
}

export function QuestionAccordion({ questions }: QuestionAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
    if (score >= 6) return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
    return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
  };

  return (
    <div className="space-y-2.5">
      {questions.map((item, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div
            key={item.questionId || idx}
            className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleOpen(idx)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition-colors gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded shrink-0">
                  Q{idx + 1}
                </span>
                <span className="text-sm font-medium text-white tracking-tight line-clamp-1">
                  {item.question}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={clsx(
                    'text-xs font-medium font-mono px-2 py-0.5 rounded border',
                    getScoreBadgeColor(item.score)
                  )}
                >
                  Skor: {item.score}/10
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </button>

            {/* Accordion Expanded Content */}
            {isOpen && (
              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-zinc-800 text-xs">
                {/* Candidate Transcript */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <MessageSquareText className="w-3.5 h-3.5 text-zinc-400" />
                    Transkrip Jawaban Kandidat
                  </span>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 leading-relaxed font-sans">
                    {item.candidateAnswer || '(Tidak ada jawaban terekam)'}
                  </div>
                </div>

                {/* AI Summary */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-zinc-400" />
                    Ringkasan Evaluasi & Alasan Skor
                  </span>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 space-y-1.5">
                    <p className="font-medium text-white">{item.aiSummary}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.reasoning}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
