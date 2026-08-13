'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { InterviewRoom, ParticipantRole, InterviewQuestion } from '@/types/interview';
import { VideoStage } from '@/components/interview-room/VideoStage';
import { QuestionSidebar } from '@/components/interview-room/QuestionSidebar';
import { CurrentQuestionCard } from '@/components/interview-room/CurrentQuestionCard';
import { TranscriptPanel } from '@/components/interview-room/TranscriptPanel';
import { PrivateNotes } from '@/components/interview-room/PrivateNotes';
import { CandidateView } from '@/components/interview-room/CandidateView';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Video, PhoneOff, Share2, Copy, Check, Sparkles } from 'lucide-react';

export default function InterviewRoomPage({
  params
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [room, setRoom] = useState<InterviewRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedCandidate, setCopiedCandidate] = useState(false);
  const [copiedInterviewer, setCopiedInterviewer] = useState(false);
  const [origin, setOrigin] = useState('');
  const [isHostVerified, setIsHostVerified] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Room state sync polling & host key verification
  useEffect(() => {
    let isMounted = true;

    async function syncRoomState() {
      if (!roomId) return;
      try {
        const res = await fetch(`/api/room/${roomId}`);
        const data = await res.json();
        if (res.ok && data.room && isMounted) {
          setRoom(data.room);

          // Verify Host Authorization via secret hostKey
          const keyParam = searchParams.get('key');
          const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem(`hirely_host_${roomId}`) : null;
          const isHost = Boolean(
            (keyParam && data.room.hostKey && keyParam === data.room.hostKey) ||
            (savedKey && data.room.hostKey && savedKey === data.room.hostKey)
          );
          setIsHostVerified(isHost);

          if (keyParam && data.room.hostKey && keyParam === data.room.hostKey && typeof window !== 'undefined') {
            sessionStorage.setItem(`hirely_host_${roomId}`, keyParam);
          }

          const currentRole: ParticipantRole = isHost ? 'interviewer' : 'candidate';

          // If room completed by HR, redirect candidate to result page automatically
          if (data.room.status === 'completed' || data.room.status === 'processing') {
            if (currentRole === 'candidate' && data.room.status === 'completed') {
              router.push(`/result/${roomId}`);
            }
          }
        }
      } catch (err) {
        console.error('Error syncing room state:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    syncRoomState();
    const interval = setInterval(syncRoomState, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, searchParams, router]);

  const role: ParticipantRole = isHostVerified ? 'interviewer' : 'candidate';
  const name = searchParams.get('name') || (role === 'interviewer' ? (room?.interviewerName || 'Robi') : 'Candidate');

  // Actions
  const candidateLink = origin ? `${origin}/room/${roomId}/join` : `/room/${roomId}/join`;
  const interviewerLink = origin && room?.hostKey
    ? `${origin}/room/${roomId}/join?key=${room.hostKey}`
    : `/room/${roomId}/join`;

  const handleCopyCandidateLink = () => {
    navigator.clipboard.writeText(candidateLink);
    setCopiedCandidate(true);
    setTimeout(() => setCopiedCandidate(false), 2500);
  };

  const handleCopyInterviewerLink = () => {
    navigator.clipboard.writeText(interviewerLink);
    setCopiedInterviewer(true);
    setTimeout(() => setCopiedInterviewer(false), 2500);
  };

  const handleSelectQuestion = async (questionId: string) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_CURRENT_QUESTION',
          payload: { questionId }
        })
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } catch (e) {
      console.error('Error setting current question:', e);
    }
  };

  const handleToggleShowCandidate = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_SHOW_QUESTION_TO_CANDIDATE',
          payload: { show: !room.showQuestionToCandidate }
        })
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } catch (e) {
      console.error('Error toggling question visibility:', e);
    }
  };

  const handleUpdateTranscript = async (questionId: string, transcript: string, interim?: string) => {
    if (!room) return;
    // Update local state immediately for responsive feel
    setRoom(prev => {
      if (!prev) return null;
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: {
            questionId,
            questionText: prev.questions.find(q => q.id === questionId)?.text || '',
            transcript,
            interimTranscript: interim || ''
          }
        }
      };
    });

    try {
      await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_TRANSCRIPT',
          payload: { questionId, transcript, interimTranscript: interim }
        })
      });
    } catch (e) {
      console.error('Error saving transcript:', e);
    }
  };

  const handleAddNote = async (noteText: string) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_NOTE',
          payload: { text: noteText }
        })
      });
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } catch (e) {
      console.error('Error adding note:', e);
    }
  };

  const handleConfirmEndInterview = async () => {
    setIsEndModalOpen(false);
    setIsEnding(true);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/result/${roomId}`);
      } else {
        throw new Error(data.error || 'Failed to process AI evaluation');
      }
    } catch (err) {
      console.error('Error triggering AI analysis:', err);
      // Even if AI call fails, redirect to result page where fallback calculation kicks in
      router.push(`/result/${roomId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400 gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-200"></div>
        <span className="text-sm font-medium">Memasuki Ruang Wawancara...</span>
      </div>
    );
  }

  if (isEnding) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-center p-6 text-zinc-100">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center mb-3">
          <Video className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Wawancara Selesai</h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-md">
          Groq AI sedang menganalisis transkrip jawaban dan catatan wawancara...
        </p>
        <div className="mt-5 w-40 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-100 animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  const questions = room?.questions || [];
  const currentQuestionIndex = questions.findIndex(q => q.id === room?.currentQuestionId);
  const currentQuestion = questions[currentQuestionIndex >= 0 ? currentQuestionIndex : 0];

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      handleSelectQuestion(questions[currentQuestionIndex + 1].id);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      handleSelectQuestion(questions[currentQuestionIndex - 1].id);
    }
  };

  // Render Candidate Simple View
  if (role === 'candidate') {
    return (
      <div className="h-screen min-h-[100dvh] bg-[#09090b] text-zinc-100 flex flex-col selection:bg-zinc-800 overflow-hidden">
        <header className="border-b border-zinc-800 bg-[#09090b]/90 h-12 sm:h-14 px-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold">
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="font-semibold text-white text-sm">Intervia</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              className="text-xs px-2.5 sm:px-3 h-8"
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Bagikan
            </Button>
            <span className="text-xs text-zinc-400 truncate max-w-[140px] sm:max-w-xs">
              {room?.title || 'Wawancara Kerja'} &bull; Candidate
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden">
          <CandidateView
            roomId={roomId}
            candidateName={name}
            interviewerName={room?.interviewerName}
            currentQuestion={currentQuestion}
            showQuestionToCandidate={room?.showQuestionToCandidate}
            onLeave={() => router.push('/')}
          />
        </main>

        <Modal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title="Bagikan Ruang Wawancara"
          description="Salin link di bawah ini untuk membagikan ruang wawancara ini."
        >
          <div className="space-y-4 mt-3">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Kode Ruangan (Room ID)</span>
                <span className="font-mono text-sm font-semibold text-white">{roomId}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Link Ruang Wawancara
              </label>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <input
                  type="text"
                  readOnly
                  value={candidateLink}
                  className="bg-transparent text-zinc-300 flex-1 focus:outline-none font-mono text-xs truncate"
                />
                <Button
                  variant={copiedCandidate ? 'success' : 'secondary'}
                  size="sm"
                  onClick={handleCopyCandidateLink}
                  className="shrink-0 text-xs"
                  leftIcon={copiedCandidate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedCandidate ? 'Tersalin!' : 'Salin Link'}
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsShareModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Render Interviewer (HR) Desktop & Mobile View
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-zinc-800 lg:h-screen lg:overflow-hidden overflow-y-auto">
      {/* Header Bar */}
      <header className="h-12 border-b border-zinc-800 bg-[#09090b]/90 px-3 sm:px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white tracking-tight text-sm">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold">
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="hidden sm:inline">Intervia</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[130px] sm:max-w-xs">
              {room?.title || 'Wawancara Kerja'}
            </h2>
            <span className="text-[10px] uppercase font-medium text-zinc-400 bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded border border-zinc-700/50 hidden sm:inline">
              HR Room
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            className="text-xs px-2.5 sm:px-3 h-8"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Bagikan Ruangan</span>
            <span className="inline sm:hidden">Bagikan</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsEndModalOpen(true)}
            className="text-xs px-2.5 sm:px-3 h-8"
            leftIcon={<PhoneOff className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">End Interview</span>
            <span className="inline sm:hidden">End</span>
          </Button>
        </div>
      </header>

      {/* Main Grid Viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 p-2 sm:p-2.5 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* Left Video Column (7 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-2.5 h-auto lg:h-full shrink-0 lg:shrink min-h-0 overflow-hidden">
          {/* Active Question Banner */}
          <CurrentQuestionCard
            question={currentQuestion}
            currentIndex={currentQuestionIndex >= 0 ? currentQuestionIndex : 0}
            totalQuestions={questions.length}
            showToCandidate={Boolean(room?.showQuestionToCandidate)}
            onNext={handleNextQuestion}
            onPrevious={handlePreviousQuestion}
            onToggleShowCandidate={handleToggleShowCandidate}
          />

          {/* Main Video Viewport */}
          <div className="w-full h-[360px] sm:h-[450px] lg:h-full lg:flex-1 min-h-0 overflow-hidden">
            <VideoStage
              roomId={roomId}
              role="interviewer"
              participantName={name}
              candidateName={room?.candidateName}
              interviewerName={room?.interviewerName || name}
              onLeave={() => router.push('/')}
              onEndInterview={() => setIsEndModalOpen(true)}
            />
          </div>
        </div>

        {/* Right Sidebar Column (5 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-2.5 h-auto lg:h-full min-h-0 overflow-hidden">
          {/* Questions Sidebar (Upper half) */}
          <div className="h-auto lg:h-[40%] min-h-[160px] max-h-[220px] shrink-0 overflow-hidden">
            <QuestionSidebar
              questions={questions}
              currentQuestionId={currentQuestion?.id}
              answers={room?.answers || {}}
              onSelectQuestion={handleSelectQuestion}
            />
          </div>

          {/* Bottom Split: Live Transcript & Private HR Notes */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-h-0 overflow-hidden">
            <TranscriptPanel
              currentQuestionId={currentQuestion?.id}
              initialTranscript={room?.answers[currentQuestion?.id || '']?.transcript || ''}
              onUpdateTranscript={handleUpdateTranscript}
            />
            <PrivateNotes
              notes={room?.notes || []}
              onAddNote={handleAddNote}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Bagikan Ruang Wawancara"
        description="Kirimkan link ini kepada kandidat atau sesama interviewer untuk bergabung ke sesi video ini."
      >
        <div className="space-y-4 mt-3">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-zinc-500 block">Kode Ruangan (Room ID)</span>
              <span className="font-mono text-sm font-semibold text-white">{roomId}</span>
            </div>
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/60 font-mono">
              Aktif
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Link Undangan Kandidat
            </label>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
              <input
                type="text"
                readOnly
                value={candidateLink}
                className="bg-transparent text-zinc-300 flex-1 focus:outline-none font-mono text-xs truncate"
              />
              <Button
                variant={copiedCandidate ? 'success' : 'secondary'}
                size="sm"
                onClick={handleCopyCandidateLink}
                className="shrink-0 text-xs"
                leftIcon={copiedCandidate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedCandidate ? 'Tersalin!' : 'Salin Link'}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Link Sesama Interviewer (HR / Tim)
            </label>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
              <input
                type="text"
                readOnly
                value={interviewerLink}
                className="bg-transparent text-zinc-300 flex-1 focus:outline-none font-mono text-xs truncate"
              />
              <Button
                variant={copiedInterviewer ? 'success' : 'secondary'}
                size="sm"
                onClick={handleCopyInterviewerLink}
                className="shrink-0 text-xs"
                leftIcon={copiedInterviewer ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedInterviewer ? 'Tersalin!' : 'Salin Link'}
              </Button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsShareModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* End Interview Confirmation Modal */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="Akhiri sesi wawancara?"
        description="Ini akan mengonfirmasi seluruh transkrip jawaban kandidat dan melakukan analisis evaluasi AI secara otomatis."
      >
        <div className="space-y-4 mt-2">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-1">
            <span className="font-medium text-white block">Ringkasan Jawaban Terkumpul:</span>
            <p>
              • Pertanyaan Tertranskrip: {Object.values(room?.answers || {}).filter(a => a.transcript.trim().length > 0).length} dari {questions.length}
            </p>
            <p>• Catatan Rahasia HR: {room?.notes.length || 0}</p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setIsEndModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmEndInterview}
            >
              Akhiri & Analisis
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
