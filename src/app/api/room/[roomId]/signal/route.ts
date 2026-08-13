import { NextRequest, NextResponse } from 'next/server';
import { addRoomSignal, getRoomSignals } from '@/lib/room/room-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { senderRole, type, sdp, candidate, isCameraOn, isMicOn, participantName } = body;

    if (!roomId || !senderRole || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, senderRole, type' },
        { status: 400 }
      );
    }

    const signal = addRoomSignal(roomId, {
      senderRole,
      type,
      sdp,
      candidate,
      isCameraOn,
      isMicOn,
      participantName
    });

    return NextResponse.json({ success: true, signal });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send signal' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const since = parseInt(searchParams.get('since') || '0', 10);
    const forRole = (searchParams.get('role') as 'interviewer' | 'candidate') || undefined;

    const signals = getRoomSignals(roomId, since, forRole);

    return NextResponse.json({ signals });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}
