'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PreJoinDeviceCheck } from '@/components/interview-room/PreJoinDeviceCheck';
import { InterviewRoom, ParticipantRole } from '@/types/interview';
import { Video } from 'lucide-react';

export default function JoinRoomPage({
  params
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const roleParam = (searchParams.get('role') as ParticipantRole) || 'candidate';

  const [room, setRoom] = useState<InterviewRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoom() {
      if (!roomId) return;
      try {
        const res = await fetch(`/api/room/${roomId}`);
        const data = await res.json();
        if (res.ok && data.room) {
          setRoom(data.room);
        }
      } catch (err) {
        console.error('Error fetching room details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [roomId]);

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
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[140px] rounded-full" />
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

      {/* Main PreJoin Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8 w-full my-auto">
        <PreJoinDeviceCheck
          roomId={roomId}
          roomTitle={room?.title || 'Job Interview'}
          interviewerName={room?.interviewerName || 'Robi'}
          defaultRole={roleParam}
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-zinc-500 border-t border-white/5">
        Intervia Pre-call Device Check &bull; Zero permanent data stored
      </footer>
    </div>
  );
}
