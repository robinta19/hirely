'use client';

import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QuestionEditorProps {
  questions: string[];
  onChange: (questions: string[]) => void;
}

const PRESET_TEMPLATES: Record<string, string[]> = {
  'Frontend Developer': [
    'Tell me about yourself and your frontend development journey.',
    'What is your experience with React, TypeScript, and state management?',
    'Describe how you optimize web performance and handle core web vitals.',
    'Tell me about a complex UI component or feature you built recently.',
    'How do you approach writing clean, testable frontend code?'
  ],
  'Backend Developer': [
    'Walk me through your background in backend engineering and API design.',
    'How do you design scalable databases and optimize query performance?',
    'Describe a difficult production bug or system outage you resolved.',
    'How do you handle authentication, security, and rate limiting?',
    'What is your experience with microservices and cloud architecture?'
  ],
  'Product Manager': [
    'Tell me about your product management experience and key metrics you owned.',
    'How do you prioritize competing feature requests from stakeholders?',
    'Describe a product launch that didn\'t go as planned and what you learned.',
    'How do you work with engineering teams to scope technical trade-offs?',
    'Why are you interested in joining our company?'
  ]
};

export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const handleAddQuestion = () => {
    onChange([...questions, '']);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateQuestion = (index: number, text: string) => {
    const updated = [...questions];
    updated[index] = text;
    onChange(updated);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const handleApplyTemplate = (templateName: string) => {
    if (PRESET_TEMPLATES[templateName]) {
      onChange(PRESET_TEMPLATES[templateName]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Template Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5">
        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1 mr-1">
          Load Template:
        </span>
        {Object.keys(PRESET_TEMPLATES).map((templateName) => (
          <button
            key={templateName}
            type="button"
            onClick={() => handleApplyTemplate(templateName)}
            className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/50 transition-colors"
          >
            {templateName}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((questionText, index) => (
          <div
            key={index}
            className="group flex items-start gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 focus-within:border-indigo-500/60 transition-all"
          >
            <div className="flex items-center gap-1 text-zinc-500 pt-2 shrink-0">
              <GripVertical className="w-4 h-4 cursor-grab" />
              <span className="text-xs font-mono font-bold w-5 text-zinc-400">
                0{index + 1}
              </span>
            </div>

            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => handleUpdateQuestion(index, e.target.value)}
              placeholder={`Question ${index + 1}...`}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none"
            />

            <div className="flex items-center gap-1 shrink-0 pt-1">
              <button
                type="button"
                onClick={() => handleMoveQuestion(index, 'up')}
                disabled={index === 0}
                aria-label="Move question up"
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30 transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveQuestion(index, 'down')}
                disabled={index === questions.length - 1}
                aria-label="Move question down"
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30 transition-colors"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveQuestion(index)}
                disabled={questions.length <= 1}
                aria-label="Remove question"
                className="p-1 rounded text-zinc-500 hover:text-rose-400 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddQuestion}
        className="w-full border-dashed border-zinc-700 hover:border-indigo-500/50 text-zinc-300 py-2.5"
        leftIcon={<Plus className="w-4 h-4 text-indigo-400" />}
      >
        Add Another Question
      </Button>
    </div>
  );
}
