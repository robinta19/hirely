export type ParticipantRole = 'interviewer' | 'candidate';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  avatarUrl?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  joinedAt?: string;
}

export interface InterviewQuestion {
  id: string;
  order: number;
  text: string;
  category?: string;
}

export interface InterviewAnswer {
  questionId: string;
  questionText: string;
  transcript: string;
  interimTranscript?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface InterviewNote {
  id: string;
  timestamp: string;
  text: string;
}

export type RoomStatus = 'waiting' | 'active' | 'processing' | 'completed';

export interface InterviewRoom {
  id: string;
  title: string;
  interviewerName: string;
  candidateName?: string;
  hostKey?: string;
  createdAt: string;
  status: RoomStatus;
  questions: InterviewQuestion[];
  currentQuestionId?: string;
  showQuestionToCandidate?: boolean;
  answers: Record<string, InterviewAnswer>; // key is questionId
  notes: InterviewNote[];
  analysis?: InterviewAnalysis;
}

export interface QuestionAnalysis {
  questionId: string;
  question: string;
  candidateAnswer: string;
  aiSummary: string;
  score: number; // 1 to 10
  reasoning: string;
}

export interface InterviewAnalysis {
  summary: string;
  strengths: string[];
  concerns: string[];
  overallScore: number; // 0 to 100
  recommendation: 'recommended' | 'further_review' | 'not_recommended';
  questions: QuestionAnalysis[];
  generatedAt: string;
}

export interface CreateRoomInput {
  title: string;
  interviewerName: string;
  questions: string[];
}
