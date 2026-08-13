import { NextRequest, NextResponse } from 'next/server';
import { defaultVideoProvider } from '@/lib/video/livekit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, participantName, role } = body;

    if (!roomId || !participantName || !role) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomId, participantName, role' },
        { status: 400 }
      );
    }

    const connectionInfo = await defaultVideoProvider.createParticipantToken(
      roomId,
      participantName,
      role
    );

    return NextResponse.json(connectionInfo);
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    );
  }
}
