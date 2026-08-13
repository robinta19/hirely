'use client';

import React from 'react';
import { InterviewQuestion } from '@/types/interview';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface CurrentQuestionCardProps {
  question?: InterviewQuestion;
  currentIndex: number;
  totalQuestions: number;
  showToCandidate: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShowCandidate: () => void;
}

export function CurrentQuestionCard({
  question,
  currentIndex,
  totalQuestions,
  showToCandidate,
  onNext,
  onPrevious,
  onToggleShowCandidate
}: CurrentQuestionCardProps) {
  if (!question) {
    return (
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-zinc-500 text-xs">
        No active question selected.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-zinc-400">
            Question {question.order} / {totalQuestions}
          </span>
        </div>

        {/* Toggle Candidate Visibility */}
        <button
          type="button"
          onClick={onToggleShowCandidate}
          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border transition-colors ${
            showToCandidate
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'
              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:text-zinc-200'
          }`}
        >
          {showToCandidate ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showToCandidate ? 'Visible to candidate' : 'Hidden from candidate'}</span>
        </button>
      </div>

      {/* Question Text */}
      <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
        {question.text}
      </p>

      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentIndex <= 0}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="text-xs"
        >
          Previous
        </Button>

        <span className="text-xs text-zinc-500 font-mono">
          {currentIndex + 1} of {totalQuestions}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={currentIndex >= totalQuestions - 1}
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="text-xs"
        >
          Next Question
        </Button>
      </div>
    </div>
  );
}
