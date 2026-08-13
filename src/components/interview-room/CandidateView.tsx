'use client';

import React from 'react';
import { VideoStage } from './VideoStage';
import { InterviewQuestion } from '@/types/interview';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CandidateViewProps {
  roomId: string;
  candidateName: string;
  interviewerName?: string;
  currentQuestion?: InterviewQuestion;
  showQuestionToCandidate?: boolean;
  onLeave: () => void;
}

export function CandidateView({
  roomId,
  candidateName,
  interviewerName = 'Interviewer',
  currentQuestion,
  showQuestionToCandidate = false,
  onLeave
}: CandidateViewProps) {
  return (
    <div className="relative flex flex-col flex-1 w-full h-full max-w-5xl mx-auto p-1 sm:p-2 min-h-0 overflow-hidden">
      {/* Question Overlay Banner (If HR made it visible) */}
      <AnimatePresence>
        {showQuestionToCandidate && currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-zinc-900/90 to-zinc-900 border border-indigo-500/40 text-white shadow-xl flex items-start gap-3 backdrop-blur-md shrink-0"
          >
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase text-indigo-300 tracking-wider">
                Current Question 0{currentQuestion.order}
              </span>
              <p className="text-sm sm:text-base font-semibold mt-0.5 leading-snug">
                {currentQuestion.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidate Focused Video Stage */}
      <div className="flex-1 w-full h-full min-h-[350px] sm:min-h-[450px] overflow-hidden">
        <VideoStage
          roomId={roomId}
          role="candidate"
          participantName={candidateName}
          candidateName={candidateName}
          interviewerName={interviewerName}
          onLeave={onLeave}
        />
      </div>
    </div>
  );
}
