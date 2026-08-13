'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinModal({ isOpen, onClose }: JoinModalProps) {
  const router = useRouter();
  const [roomIdOrUrl, setRoomIdOrUrl] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    let cleanId = roomIdOrUrl.trim();
    if (!cleanId) {
      setError('Please enter a room ID or full link');
      return;
    }

    // Extract room ID if full URL was pasted
    if (cleanId.includes('/room/')) {
      const parts = cleanId.split('/room/');
      cleanId = parts[1].split('/')[0].split('?')[0];
    } else if (cleanId.includes('/join/')) {
      const parts = cleanId.split('/join/');
      cleanId = parts[1].split('/')[0].split('?')[0];
    }

    router.push(`/room/${cleanId}/join?role=candidate`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Interview Room"
      description="Enter the Room ID or paste the link provided by your interviewer."
    >
      <form onSubmit={handleJoin} className="space-y-4 mt-2">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Room ID or Invite Link
          </label>
          <input
            type="text"
            placeholder="e.g. 8fJ29KxQpL or https://intervia.app/room/8fJ29KxQpL"
            value={roomIdOrUrl}
            onChange={(e) => setRoomIdOrUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            autoFocus
          />
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Join Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
