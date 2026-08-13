'use client';

import React, { useEffect, useState, useRef } from 'react';
import { defaultSpeechProvider } from '@/lib/speech/browser';
import { SpeechResult } from '@/lib/speech/provider';
import { Button } from '@/components/ui/Button';
import { Mic, MessageSquareText, Send, AlertCircle, Edit3, Check } from 'lucide-react';

interface TranscriptPanelProps {
  currentQuestionId?: string;
  initialTranscript?: string;
  onUpdateTranscript: (questionId: string, transcript: string, interim?: string) => void;
}

export function TranscriptPanel({
  currentQuestionId,
  initialTranscript = '',
  onUpdateTranscript
}: TranscriptPanelProps) {
  const [isListening, setIsListening] = useState(false);
  const [finalText, setFinalText] = useState(initialTranscript);
  const [interimText, setInterimText] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'id-ID' | 'en-US'>('id-ID');
  const [sttError, setSttError] = useState<string | null>(null);

  const [simulatedInput, setSimulatedInput] = useState('');
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [isEditingDirectly, setIsEditingDirectly] = useState(false);
  const [editableText, setEditableText] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync state when question changes
  useEffect(() => {
    setFinalText(initialTranscript || '');
    setInterimText('');
    setEditableText(initialTranscript || '');
    setSttError(null);
    defaultSpeechProvider.setInitialTranscript(initialTranscript || '');
  }, [currentQuestionId, initialTranscript]);

  // Check Web Speech API support on mount
  useEffect(() => {
    const supported = defaultSpeechProvider.isSupported();
    setSttSupported(supported);
    if (!supported) {
      setSttError('Browser ini tidak mendukung Web Speech API otomatis. Silakan gunakan Google Chrome atau MS Edge, atau ketik teks secara manual.');
    }
  }, []);

  // Auto-scroll transcript container to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [finalText, interimText]);

  const handleLanguageChange = (lang: 'id-ID' | 'en-US') => {
    setSelectedLang(lang);
    defaultSpeechProvider.setLanguage(lang);
    if (isListening) {
      stopListening().then(() => {
        startListening(lang);
      });
    }
  };

  const startListening = async (langToUse = selectedLang) => {
    if (!currentQuestionId) return;
    setSttError(null);

    try {
      defaultSpeechProvider.setInitialTranscript(finalText);
      await defaultSpeechProvider.start(
        (result: SpeechResult) => {
          setFinalText(result.finalTranscript);
          setInterimText(result.interimTranscript);
          setEditableText(result.finalTranscript);
          onUpdateTranscript(currentQuestionId, result.finalTranscript, result.interimTranscript);
        },
        (errorMsg: string) => {
          console.warn('STT Error:', errorMsg);
          setSttError(errorMsg);
          setIsListening(false);
        },
        langToUse
      );
      setIsListening(true);
    } catch (e: any) {
      console.warn('Failed to start STT:', e);
      setSttError(e.message || 'Gagal mengaktifkan mikrofon transkrip.');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    await defaultSpeechProvider.stop();
    setIsListening(false);
    if (currentQuestionId && (finalText || interimText)) {
      const combined = (finalText + ' ' + interimText).trim();
      setFinalText(combined);
      setInterimText('');
      setEditableText(combined);
      onUpdateTranscript(currentQuestionId, combined, '');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClearTranscript = () => {
    setFinalText('');
    setInterimText('');
    setEditableText('');
    setSttError(null);
    defaultSpeechProvider.setInitialTranscript('');
    if (currentQuestionId) {
      onUpdateTranscript(currentQuestionId, '', '');
    }
  };

  const handleAddManualText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedInput.trim() || !currentQuestionId) return;

    const newFinal = (finalText ? finalText + ' ' : '') + simulatedInput.trim();
    setFinalText(newFinal);
    setEditableText(newFinal);
    setSimulatedInput('');
    defaultSpeechProvider.setInitialTranscript(newFinal);
    onUpdateTranscript(currentQuestionId, newFinal, interimText);
  };

  const handleSaveDirectEdit = () => {
    if (!currentQuestionId) return;
    setFinalText(editableText);
    defaultSpeechProvider.setInitialTranscript(editableText);
    onUpdateTranscript(currentQuestionId, editableText, interimText);
    setIsEditingDirectly(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Auto Transkrip
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded p-0.5 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => handleLanguageChange('id-ID')}
              className={`px-2 py-0.5 rounded ${
                selectedLang === 'id-ID'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en-US')}
              className={`px-2 py-0.5 rounded ${
                selectedLang === 'en-US'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              EN
            </button>
          </div>

          {/* STT Toggle Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              isListening
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                : 'bg-zinc-800 text-zinc-200 border-zinc-700/60 hover:bg-zinc-700'
            }`}
          >
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Stop Transkrip</span>
              </>
            ) : (
              <>
                <Mic className="w-3 h-3 text-zinc-400" />
                <span>Mulai Transkrip</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {sttError && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <span>{sttError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSttError(null)}
            className="text-rose-400 hover:text-white text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Transcript Display / Direct Edit Area */}
      {isEditingDirectly ? (
        <div className="flex-1 flex flex-col space-y-2">
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            placeholder="Edit atau ketik transkrip kandidat..."
            className="flex-1 w-full bg-zinc-950 p-3 rounded-lg border border-zinc-700 text-white text-xs focus:outline-none resize-none min-h-[140px]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingDirectly(false)}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
            >
              Batal
            </button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveDirectEdit}
              className="text-xs"
              leftIcon={<Check className="w-3 h-3" />}
            >
              Simpan Edit
            </Button>
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-zinc-950/70 p-3.5 rounded-lg border border-zinc-800 space-y-2 text-xs min-h-[140px] relative group"
        >
          {finalText || interimText ? (
            <div className="space-y-1.5 leading-relaxed">
              {finalText && (
                <p className="text-zinc-100 font-normal whitespace-pre-wrap">
                  {finalText}
                </p>
              )}
              {interimText && (
                <p className="text-zinc-400 italic">
                  {interimText} ...
                </p>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-6">
              <p className="text-xs max-w-xs">
                {isListening
                  ? `Mendengarkan ucapan kandidat (${selectedLang === 'id-ID' ? 'Bahasa Indonesia' : 'English'})...`
                  : 'Klik "Mulai Transkrip" atau ketik jawaban kandidat.'}
              </p>
            </div>
          )}

          {/* Quick Edit Action Button */}
          {finalText && !isListening && (
            <button
              type="button"
              onClick={() => {
                setEditableText(finalText);
                setIsEditingDirectly(true);
              }}
              className="absolute top-2 right-2 p-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit transkrip"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Footer Controls & Manual Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
            <span>
              {sttSupported
                ? `Mode Otomatis (${selectedLang === 'id-ID' ? 'ID' : 'EN'})`
                : 'Mode Manual'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {finalText && !isEditingDirectly && (
              <button
                type="button"
                onClick={() => {
                  setEditableText(finalText);
                  setIsEditingDirectly(true);
                }}
                className="text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsManualInputOpen(!isManualInputOpen)}
              className="text-zinc-400 hover:text-white"
            >
              {isManualInputOpen ? 'Sembunyikan' : '+ Input Manual'}
            </button>
            <button
              type="button"
              onClick={handleClearTranscript}
              className="text-zinc-500 hover:text-rose-400"
            >
              Hapus
            </button>
          </div>
        </div>

        {isManualInputOpen && (
          <form onSubmit={handleAddManualText} className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik atau tambahkan ucapan kandidat..."
              value={simulatedInput}
              onChange={(e) => setSimulatedInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
            <Button type="submit" variant="secondary" size="sm" className="text-xs">
              <Send className="w-3 h-3" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

