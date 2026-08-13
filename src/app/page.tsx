'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { JoinModal } from '@/components/landing/JoinModal';
import {
  Video,
  MessageSquareText,
  BrainCircuit,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-zinc-800">
      {/* Navigation Header */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950">
              <Video className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-white">
                Intervia
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                Video Interview
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsJoinModalOpen(true)}
            >
              Join Room
            </Button>
            <Link href="/create">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Create Room
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-20 text-center my-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
            <span>Fast setup &bull; Real-time Speech-to-Text &bull; Structured Evaluation</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
            Streamlined video interviews <br className="hidden sm:block" />
            with real-time AI evaluation.
          </h1>

          {/* Supporting Text */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
            Create a secure room, conduct candidate interviews with structured questions, and generate immediate answer summaries.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/create" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Interview Room
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full sm:w-auto text-sm"
              leftIcon={<Video className="w-4 h-4 text-zinc-400" />}
            >
              Join Room
            </Button>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20 text-left"
        >
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Instant Room Setup</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No account required. Generate a room link and start video interviews immediately.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <MessageSquareText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Live Speech-to-Text</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Transcribe candidate answers in real time, tagged to each active question.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Automated Assessment</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Get candidate summaries, strengths, concerns, and overall score recommendations instantly.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>AI evaluations assist human decisions. Zero permanent tracking.</span>
          </div>
          <div>
            <span>Intervia Video Engine &bull; WebRTC & Groq AI</span>
          </div>
        </div>
      </footer>

      {/* Join Modal */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
