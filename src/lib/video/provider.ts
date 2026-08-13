export interface RoomConnectionInfo {
  roomId: string;
  token: string;
  url: string;
  participantName: string;
  role: 'interviewer' | 'candidate';
  isLiveKitActive: boolean;
}

export interface VideoRoomProvider {
  createParticipantToken(
    roomId: string,
    participantName: string,
    role: 'interviewer' | 'candidate'
  ): Promise<RoomConnectionInfo>;
}
