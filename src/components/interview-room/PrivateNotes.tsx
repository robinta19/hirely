'use client';

import React, { useState } from 'react';
import { InterviewNote } from '@/types/interview';
import { Button } from '@/components/ui/Button';
import { Lock, FileText, Plus } from 'lucide-react';

interface PrivateNotesProps {
  notes: InterviewNote[];
  onAddNote: (noteText: string) => void;
}

export function PrivateNotes({ notes, onAddNote }: PrivateNotesProps) {
  const [noteInput, setNoteInput] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddNote(noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Private HR Notes
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
          <Lock className="w-3 h-3 text-zinc-500" />
          <span>Private</span>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[160px] pr-1">
        {notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>{note.timestamp}</span>
              </div>
              <p className="text-zinc-200">{note.text}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-zinc-500 py-3 text-center">
            No private notes added yet.
          </p>
        )}
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Ketik catatan rahasia interviewer..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!noteInput.trim()}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Tambah
        </Button>
      </form>
    </div>
  );
}
