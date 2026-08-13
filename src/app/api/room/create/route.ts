import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/room/room-store';
import { CreateRoomInput } from '@/types/interview';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateRoomInput;

    if (!body.title || !body.interviewerName) {
      return NextResponse.json(
        { error: 'Interview title and interviewer name are required' },
        { status: 400 }
      );
    }

    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one interview question is required' },
        { status: 400 }
      );
    }

    const room = createRoom(body);

    return NextResponse.json({
      success: true,
      room
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    );
  }
}
