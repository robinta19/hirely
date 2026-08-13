'use client';

import React from 'react';
import { InterviewQuestion, InterviewAnswer } from '@/types/interview';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface QuestionSidebarProps {
  questions: InterviewQuestion[];
  currentQuestionId?: string;
  answers: Record<string, InterviewAnswer>;
  onSelectQuestion: (questionId: string) => void;
}

export function QuestionSidebar({
  questions,
  currentQuestionId,
  answers,
  onSelectQuestion
}: QuestionSidebarProps) {
  const getQuestionStatus = (questionId: string) => {
    if (questionId === currentQuestionId) return 'current';
    const answer = answers[questionId];
    if (answer && answer.transcript.trim().length > 0) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Questions ({questions.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {questions.map((q) => {
          const status = getQuestionStatus(q.id);
          const hasTranscript = Boolean(answers[q.id]?.transcript?.trim());

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(q.id)}
              className={clsx(
                'w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-2.5 group',
                status === 'current'
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : status === 'completed'
                  ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                  : 'bg-zinc-950/40 border-zinc-800/50 hover:border-zinc-700 text-zinc-400'
              )}
            >
              {/* Status Icon */}
              <div className="shrink-0 pt-0.5">
                {status === 'current' ? (
                  <PlayCircle className="w-4 h-4 text-zinc-200" />
                ) : status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                )}
              </div>

              {/* Question Text */}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-zinc-400">
                    Q{q.order}
                  </span>

                  {status === 'current' && (
                    <span className="text-[10px] uppercase font-medium text-zinc-300 bg-zinc-700 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium leading-snug line-clamp-2">
                  {q.text}
                </p>

                {hasTranscript && status !== 'current' && (
                  <span className="text-[10px] text-emerald-400 block">
                    ✓ Transcribed
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
