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

      {/* Main PreJoin Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10 w-full my-auto">
        <PreJoinDeviceCheck
          roomId={roomId}
          roomTitle={room?.title || 'Job Interview'}
          interviewerName={room?.interviewerName || 'Nata'}
          defaultRole={roleParam}
          hostKey={room?.hostKey}
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center text-xs text-zinc-500 border-t border-zinc-800/80">
        Hirely Pre-call Device Check &bull; Zero permanent data stored
      </footer>
    </div>
  );
}
