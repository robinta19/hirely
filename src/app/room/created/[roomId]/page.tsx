'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Copy, Check, Video, ArrowRight, ShieldCheck } from 'lucide-react';
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

  const candidateLink = origin ? `${origin}/room/${roomId}/join` : `/room/${roomId}/join`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(candidateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEnterRoom = () => {
    if (room?.hostKey && typeof window !== 'undefined') {
      sessionStorage.setItem(`hirely_host_${roomId}`, room.hostKey);
    }
    router.push(`/room/${roomId}/join?key=${room?.hostKey || ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-zinc-800">
      {/* Header */}
      <header className="relative z-50 border-b border-zinc-800 bg-[#050507] sticky top-0">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-geist font-extrabold text-xl tracking-wider text-white">
              Hirely
            </span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-xl mx-auto px-6 py-10 w-full my-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-900 p-6 sm:p-8 rounded-xl border border-zinc-800 space-y-6 shadow-2xl"
        >
          {/* Success Badge */}
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <Check className="w-6 h-6" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Interview Room Created
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
              {room?.title || 'Job Interview'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Interviewer: <span className="text-zinc-200 font-medium">{room?.interviewerName || 'Nata'}</span>
            </p>
          </div>

          {/* Room ID Badge */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
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
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm">
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
              className="w-full shadow-indigo-500/20 text-sm py-3"
              onClick={handleEnterRoom}
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
      <footer className="relative z-10 py-5 text-center text-xs text-zinc-500 border-t border-zinc-800/80">
        Hirely Ephemeral Session &bull; Link valid for active interview session
      </footer>
    </div>
  );
}
