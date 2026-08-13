import { AccessToken } from 'livekit-server-sdk';
import { RoomConnectionInfo, VideoRoomProvider } from './provider';

export class LiveKitVideoProvider implements VideoRoomProvider {
  async createParticipantToken(
    roomId: string,
    participantName: string,
    role: 'interviewer' | 'candidate'
  ): Promise<RoomConnectionInfo> {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

    const isLiveKitConfigured = Boolean(apiKey && apiSecret && wsUrl);

    if (!isLiveKitConfigured) {
      // Fallback mode: generates a local connection token so client uses WebRTC media stream room
      return {
        roomId,
        token: `webrtc_mock_token_${roomId}_${role}_${Date.now()}`,
        url: wsUrl || 'ws://localhost:7880',
        participantName,
        role,
        isLiveKitActive: false
      };
    }

    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: `${role}_${participantName.replace(/\s+/g, '_')}_${Date.now()}`,
        name: participantName,
        ttl: '4h',
      });

      at.addGrant({
        room: roomId,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const token = await at.toJwt();

      return {
        roomId,
        token,
        url: wsUrl!,
        participantName,
        role,
        isLiveKitActive: true
      };
    } catch (error) {
      console.warn('Failed to issue LiveKit token, falling back to WebRTC room mode:', error);
      return {
        roomId,
        token: `webrtc_mock_token_${roomId}_${role}_${Date.now()}`,
        url: wsUrl || '',
        participantName,
        role,
        isLiveKitActive: false
      };
    }
  }
}

export const defaultVideoProvider = new LiveKitVideoProvider();
