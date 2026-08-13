'use client';

import React, { useState } from 'react';
import { InterviewQuestion, InterviewAnswer } from '@/types/interview';
import { CheckCircle2, Circle, PlayCircle, Plus, Check, X } from 'lucide-react';
import { clsx } from 'clsx';

interface QuestionSidebarProps {
  questions: InterviewQuestion[];
  currentQuestionId?: string;
  answers: Record<string, InterviewAnswer>;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion?: (text: string) => void;
  isHost?: boolean;
}

export function QuestionSidebar({
  questions,
  currentQuestionId,
  answers,
  onSelectQuestion,
  onAddQuestion,
  isHost = true
}: QuestionSidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');

  const getQuestionStatus = (questionId: string) => {
    if (questionId === currentQuestionId) return 'current';
    const answer = answers[questionId];
    if (answer && answer.transcript.trim().length > 0) return 'completed';
    return 'upcoming';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !onAddQuestion) return;
    onAddQuestion(newQuestionText.trim());
    setNewQuestionText('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Questions ({questions.length})
        </h3>
        {isHost && onAddQuestion && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded border border-zinc-700 transition-all flex items-center gap-1"
          >
            {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3 text-emerald-400" />}
            <span>{isAdding ? 'Batal' : 'Pertanyaan'}</span>
          </button>
        )}
      </div>

      {/* Inline Form to Add New Question */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="space-y-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0">
          <label className="block text-[10px] uppercase font-mono text-zinc-400">
            Tambah Pertanyaan Baru (Live):
          </label>
          <input
            type="text"
            required
            autoFocus
            placeholder="Ketik pertanyaan wawancara..."
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!newQuestionText.trim()}
              className="text-[11px] font-bold text-black bg-white hover:bg-zinc-200 px-3 py-1 rounded transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
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
