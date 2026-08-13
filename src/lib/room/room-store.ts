import { InterviewRoom, InterviewQuestion, CreateRoomInput } from '@/types/interview';
import { generateRoomId } from './room-id';

export interface SignalMessage {
  id: string;
  senderRole: 'interviewer' | 'candidate';
  type: 'JOIN' | 'PRESENCE' | 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'MEDIA_STATE' | 'LEAVE';
  sdp?: any;
  candidate?: any;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  participantName?: string;
  timestamp: number;
}

// Global in-memory storage for active interview rooms during session lifetime
const globalRooms = globalThis as unknown as {
  interviewRoomsStore?: Map<string, InterviewRoom>;
  interviewSignalsStore?: Map<string, SignalMessage[]>;
};

if (!globalRooms.interviewRoomsStore) {
  globalRooms.interviewRoomsStore = new Map<string, InterviewRoom>();
}
if (!globalRooms.interviewSignalsStore) {
  globalRooms.interviewSignalsStore = new Map<string, SignalMessage[]>();
}

const roomStore = globalRooms.interviewRoomsStore;
const signalStore = globalRooms.interviewSignalsStore;

export function createRoom(input: CreateRoomInput): InterviewRoom {
  const roomId = generateRoomId();
  const hostKey = `hk_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`;

  const questions: InterviewQuestion[] = input.questions
    .filter(q => q.trim().length > 0)
    .map((text, idx) => ({
      id: `q_${idx + 1}`,
      order: idx + 1,
      text: text.trim()
    }));

  const room: InterviewRoom = {
    id: roomId,
    title: input.title || 'Job Interview',
    interviewerName: input.interviewerName || 'Interviewer',
    hostKey,
    createdAt: new Date().toISOString(),
    status: 'waiting',
    questions,
    currentQuestionId: questions.length > 0 ? questions[0].id : undefined,
    showQuestionToCandidate: false,
    answers: {},
    notes: []
  };

  roomStore.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): InterviewRoom | undefined {
  return roomStore.get(roomId);
}

export function updateRoom(roomId: string, update: Partial<InterviewRoom>): InterviewRoom | undefined {
  const room = roomStore.get(roomId);
  if (!room) return undefined;

  const updatedRoom = {
    ...room,
    ...update
  };

  roomStore.set(roomId, updatedRoom);
  return updatedRoom;
}

export function updateRoomAnswer(
  roomId: string,
  questionId: string,
  transcript: string,
  interimTranscript?: string
): InterviewRoom | undefined {
  const room = roomStore.get(roomId);
  if (!room) return undefined;

  const question = room.questions.find(q => q.id === questionId);
  const existingAnswer = room.answers[questionId];

  const updatedAnswers = {
    ...room.answers,
    [questionId]: {
      questionId,
      questionText: question ? question.text : '',
      transcript: transcript,
      interimTranscript: interimTranscript || '',
      startedAt: existingAnswer?.startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString()
    }
  };

  const updatedRoom: InterviewRoom = {
    ...room,
    answers: updatedAnswers
  };

  roomStore.set(roomId, updatedRoom);
  return updatedRoom;
}

export function addRoomNote(roomId: string, noteText: string): InterviewRoom | undefined {
  const room = roomStore.get(roomId);
  if (!room) return undefined;

  const newNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: noteText
  };

  const updatedRoom: InterviewRoom = {
    ...room,
    notes: [...room.notes, newNote]
  };

  roomStore.set(roomId, updatedRoom);
  return updatedRoom;
}

export function deleteRoom(roomId: string): boolean {
  signalStore.delete(roomId);
  return roomStore.delete(roomId);
}

export function addRoomSignal(
  roomId: string,
  signal: Omit<SignalMessage, 'id' | 'timestamp'>
): SignalMessage {
  const roomSignals = signalStore.get(roomId) || [];
  const fullSignal: SignalMessage = {
    ...signal,
    id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now()
  };

  // Keep last 100 signal messages per room to prevent unconsumed memory growth
  const updatedSignals = [...roomSignals, fullSignal].slice(-100);
  signalStore.set(roomId, updatedSignals);
  return fullSignal;
}

export function getRoomSignals(
  roomId: string,
  sinceTimestamp: number = 0,
  forRole?: 'interviewer' | 'candidate'
): SignalMessage[] {
  const roomSignals = signalStore.get(roomId) || [];
  return roomSignals.filter(sig => {
    const isNew = sig.timestamp > sinceTimestamp;
    const isTargeted = forRole ? sig.senderRole !== forRole : true;
    return isNew && isTargeted;
  });
}

