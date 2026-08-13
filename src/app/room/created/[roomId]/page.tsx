'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Copy, Check, Video, ArrowRight, ShieldCheck, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { InterviewRoom } from '@/types/interview';

export default function RoomCreatedPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const [room, setRoom] = useState<InterviewRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    async function fetchRoom() {
      if (!roomId) return;
      try {
        const res = await fetch(`/api/room/${roomId}`);
        const data = await res.json();
        if (res.ok && data.room) {
          setRoom(data.room);
        }
      } catch (e) {
        console.error('Error loading created room:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [roomId]);

  const candidateLink = origin ? `${origin}/room/${roomId}/join?role=candidate` : `/room/${roomId}/join?role=candidate`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(candidateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Background Decorative Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-600/10 via-indigo-600/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#090a0f]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-white tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span>Intervia</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-xl mx-auto px-6 py-12 w-full my-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6"
        >
          {/* Success Badge */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <Check className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Interview Room Created
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
              {room?.title || 'Job Interview'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Interviewer: <span className="text-zinc-200 font-medium">{room?.interviewerName || 'Robi'}</span>
            </p>
          </div>

          {/* Room ID Badge */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
              Room ID
            </span>
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-indigo-400 select-all">
              {roomId}
            </div>
          </div>

          {/* Interview Link Box */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Candidate Invite Link
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm">
              <input
                type="text"
                readOnly
                value={candidateLink}
                className="bg-transparent text-zinc-300 w-full focus:outline-none font-mono text-xs truncate px-1"
              />
              <Button
                variant={copied ? 'success' : 'secondary'}
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 text-xs"
                leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-indigo-500/30 text-base py-3.5"
              onClick={() => router.push(`/room/${roomId}/join?role=interviewer`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Enter Interview Room
            </Button>

            <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              Send this link to candidate. You will join as interviewer.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-zinc-500 border-t border-white/5">
        Intervia Ephemeral Session &bull; Link valid for active interview session
      </footer>
    </div>
  );
}
