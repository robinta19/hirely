'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { QuestionEditor } from '@/components/create-room/QuestionEditor';
import { Video, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_QUESTIONS = [
  'Ceritakan tentang diri Anda dan latar belakang Anda.',
  'Apa pengalaman kerja atau proyek paling relevan yang pernah Anda kerjakan?',
  'Apa keahlian teknikal utama yang Anda kuasai?',
  'Ceritakan tantangan terbesar yang pernah Anda selesaikan.',
  'Mengapa Anda tertarik untuk bergabung di posisi ini?'
];

export default function CreateRoomPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Frontend Developer Interview');
  const [interviewerName, setInterviewerName] = useState('Robi');
  const [questions, setQuestions] = useState<string[]>(DEFAULT_QUESTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Masukkan judul wawancara');
      return;
    }
    if (!interviewerName.trim()) {
      setError('Masukkan nama Anda sebagai interviewer');
      return;
    }

    const validQuestions = questions.filter(q => q.trim().length > 0);
    if (validQuestions.length === 0) {
      setError('Masukkan minimal satu pertanyaan wawancara');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          interviewerName: interviewerName.trim(),
          questions: validQuestions
        })
      });

      const data = await response.json();

      if (!response.ok || !data.room?.id) {
        throw new Error(data.error || 'Gagal membuat ruang wawancara');
      }

      router.push(`/room/created/${data.room.id}`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat ruangan');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-zinc-800">
      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold">
              <Video className="w-4 h-4" />
            </div>
            <span className="font-semibold text-white tracking-tight text-sm">Intervia</span>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-10 w-full my-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-900 p-6 sm:p-8 rounded-xl border border-zinc-800 space-y-6"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Buat Ruang Wawancara
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Atur detail ruangan dan daftarkan daftar pertanyaan wawancara Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Judul Wawancara
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Wawancara Frontend Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nama Interviewer (HR)
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Robi"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-xs transition-colors"
                />
              </div>
            </div>

            <hr className="border-zinc-800" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Daftar Pertanyaan ({questions.length})
                </label>
              </div>

              <QuestionEditor
                questions={questions}
                onChange={setQuestions}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Buat Ruangan
              </Button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center text-xs text-zinc-500 border-t border-zinc-800/80">
        Sesi tersimpan secara temporer selama wawancara aktif.
      </footer>
    </div>
  );
}
