import { NextRequest, NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/room/room-store';
import { defaultAIProvider } from '@/lib/ai/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const room = getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Interview room not found' }, { status: 404 });
    }

    // Set status to processing
    updateRoom(roomId, { status: 'processing' });

    // Perform AI analysis using Groq
    const analysis = await defaultAIProvider.analyzeInterview(room);

    // Save analysis and mark room as completed
    const updatedRoom = updateRoom(roomId, {
      analysis,
      status: 'completed'
    });

    return NextResponse.json({
      success: true,
      analysis,
      room: updatedRoom
    });
  } catch (error: any) {
    console.error('Error analyzing interview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze interview' },
      { status: 500 }
    );
  }
}
