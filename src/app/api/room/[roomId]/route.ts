import { NextRequest, NextResponse } from 'next/server';
import { getRoom, updateRoom, updateRoomAnswer, addRoomNote } from '@/lib/room/room-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: 'Interview room not found' }, { status: 404 });
  }

  return NextResponse.json({ room });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: 'Interview room not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { action, payload } = body;

    let updatedRoom = room;

    switch (action) {
      case 'JOIN_CANDIDATE':
        updatedRoom = updateRoom(roomId, {
          candidateName: payload.candidateName,
          status: room.status === 'waiting' ? 'active' : room.status
        }) || room;
        break;

      case 'SET_CURRENT_QUESTION':
        updatedRoom = updateRoom(roomId, {
          currentQuestionId: payload.questionId
        }) || room;
        break;

      case 'TOGGLE_SHOW_QUESTION_TO_CANDIDATE':
        updatedRoom = updateRoom(roomId, {
          showQuestionToCandidate: typeof payload.show === 'boolean' ? payload.show : !room.showQuestionToCandidate
        }) || room;
        break;

      case 'UPDATE_TRANSCRIPT':
        updatedRoom = updateRoomAnswer(
          roomId,
          payload.questionId,
          payload.transcript,
          payload.interimTranscript
        ) || room;
        break;

      case 'ADD_NOTE':
        if (payload.text) {
          updatedRoom = addRoomNote(roomId, payload.text) || room;
        }
        break;

      case 'UPDATE_STATUS':
        updatedRoom = updateRoom(roomId, {
          status: payload.status
        }) || room;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update room state' }, { status: 500 });
  }
}
