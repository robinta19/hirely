'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  PhoneOff,
  Wifi,
  AlertTriangle,
  User,
  Radio,
  Grid,
  Layout,
  Maximize2,
  RefreshCw,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Room, RoomEvent, Track, RemoteTrack, LocalTrack, RemoteParticipant } from 'livekit-client';
import { Button } from '@/components/ui/Button';
import { ParticipantRole } from '@/types/interview';

export interface ParticipantStream {
  sid: string;
  identity: string;
  name: string;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenShare?: boolean;
  videoTrack?: RemoteTrack | LocalTrack | MediaStreamTrack | null;
  audioTrack?: RemoteTrack | LocalTrack | MediaStreamTrack | null;
  stream?: MediaStream | null;
}

interface VideoStageProps {
  roomId: string;
  role: ParticipantRole;
  participantName: string;
  candidateName?: string;
  interviewerName?: string;
  onLeave: () => void;
  onEndInterview?: () => void;
  isLiveKitActive?: boolean;
  token?: string;
  wsUrl?: string;
}

function RemoteParticipantTile({ participant }: { participant: ParticipantStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (participant.videoTrack && videoRef.current) {
      if ('attach' in participant.videoTrack && typeof participant.videoTrack.attach === 'function') {
        participant.videoTrack.attach(videoRef.current);
      }
    }
    if (participant.audioTrack && audioRef.current) {
      if ('attach' in participant.audioTrack && typeof participant.audioTrack.attach === 'function') {
        participant.audioTrack.attach(audioRef.current);
      }
    }
    if (participant.stream) {
      if (videoRef.current) videoRef.current.srcObject = participant.stream;
      if (audioRef.current) audioRef.current.srcObject = participant.stream;
    }
  }, [participant.videoTrack, participant.audioTrack, participant.stream]);

  const displayName = participant.name || 'Participant';
  const isVideoOn = participant.isCameraOn;

  return (
    <div className="relative w-full h-full min-h-[180px] rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
      <audio ref={audioRef} autoPlay playsInline />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-contain ${isVideoOn ? 'block' : 'hidden'}`}
      />

      {!isVideoOn && (
        <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
          <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-base">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">{displayName}</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">Camera is Off</p>
          </div>
        </div>
      )}

      {/* Name Tag Badge */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-zinc-800 text-[11px] font-medium text-white shadow pointer-events-none">
        <User className="w-3 h-3 text-zinc-400" />
        <span>{displayName}</span>
        {!participant.isMicOn && <MicOff className="w-3 h-3 text-rose-400 ml-1" />}
      </div>
    </div>
  );
}

export function VideoStage({
  roomId,
  role,
  participantName,
  candidateName = 'Candidate',
  interviewerName = 'Interviewer',
  onLeave,
  onEndInterview,
  isLiveKitActive: propIsLiveKitActive = false,
  token: propToken,
  wsUrl: propWsUrl
}: VideoStageProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const sendSignalRef = useRef<((msg: any) => Promise<void>) | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());

  const livekitRoomRef = useRef<Room | null>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');

  const [livekitActive, setLivekitActive] = useState(propIsLiveKitActive);
  const [livekitToken, setLivekitToken] = useState<string | undefined>(propToken);
  const [livekitWsUrl, setLivekitWsUrl] = useState<string | undefined>(propWsUrl);

  const [remoteParticipantsList, setRemoteParticipantsList] = useState<ParticipantStream[]>([]);
  const [layoutMode, setLayoutMode] = useState<'spotlight' | 'grid'>('spotlight');
  const [pinnedFocus, setPinnedFocus] = useState<'remote' | 'local'>(
    role === 'interviewer' ? 'remote' : 'local'
  );

  const togglePinnedFocus = () => {
    setPinnedFocus(prev => (prev === 'remote' ? 'local' : 'remote'));
  };

  // Fetch LiveKit status on mount
  useEffect(() => {
    async function checkLiveKit() {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, participantName, role })
        });
        const data = await res.json();
        if (res.ok && data.isLiveKitActive && data.token && data.url) {
          setLivekitActive(true);
          setLivekitToken(data.token);
          setLivekitWsUrl(data.url);
        }
      } catch (e) {
        console.warn('LiveKit token check error:', e);
      }
    }
    checkLiveKit();
  }, [roomId, participantName, role]);

  // Real LiveKit SFU Connection Effect with Multi-Participant Support
  useEffect(() => {
    if (!livekitActive || !livekitToken || !livekitWsUrl) return;

    let isMounted = true;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    livekitRoomRef.current = room;

    const syncParticipants = () => {
      if (!isMounted || !room) return;
      const list: ParticipantStream[] = [];

      room.remoteParticipants.forEach((p: RemoteParticipant) => {
        const videoPubs = Array.from(p.videoTrackPublications.values());
        const audioPubs = Array.from(p.audioTrackPublications.values());

        const screenPub = videoPubs.find(pub => pub.source === Track.Source.ScreenShare);
        const cameraPub = videoPubs.find(pub => pub.source === Track.Source.Camera || pub.source !== Track.Source.ScreenShare);
        const mainAudioPub = audioPubs[0];

        if (screenPub && screenPub.track) {
          list.push({
            sid: `${p.sid}_screen`,
            identity: `${p.identity}_screen`,
            name: `${p.name || p.identity} (Layar Shared)`,
            isCameraOn: !screenPub.isMuted,
            isMicOn: false,
            isScreenShare: true,
            videoTrack: screenPub.track,
            audioTrack: null
          });
        }

        list.push({
          sid: p.sid,
          identity: p.identity,
          name: p.name || p.identity || 'Participant',
          isCameraOn: Boolean(cameraPub && !cameraPub.isMuted),
          isMicOn: Boolean(mainAudioPub && !mainAudioPub.isMuted),
          videoTrack: cameraPub?.track || null,
          audioTrack: mainAudioPub?.track || null
        });
      });

      setRemoteParticipantsList(list);
      setPeerConnected(list.length > 0);
    };

    async function initLiveKit() {
      try {
        setConnectionState('connecting');

        room.on(RoomEvent.Connected, () => {
          if (isMounted) {
            setConnectionState('connected');
            syncParticipants();
          }
        });

        room.on(RoomEvent.Disconnected, () => {
          if (isMounted) {
            setPeerConnected(false);
            setRemoteParticipantsList([]);
          }
        });

        room.on(RoomEvent.ParticipantConnected, () => {
          syncParticipants();
        });

        room.on(RoomEvent.ParticipantDisconnected, () => {
          syncParticipants();
        });

        room.on(RoomEvent.TrackSubscribed, () => {
          syncParticipants();
        });

        room.on(RoomEvent.TrackUnsubscribed, () => {
          syncParticipants();
        });

        room.on(RoomEvent.TrackMuted, () => {
          syncParticipants();
        });

        room.on(RoomEvent.TrackUnmuted, () => {
          syncParticipants();
        });

        room.on(RoomEvent.LocalTrackPublished, () => {
          syncParticipants();
        });

        room.on(RoomEvent.LocalTrackUnpublished, () => {
          syncParticipants();
        });

        await room.connect(livekitWsUrl!, livekitToken!);
        await room.localParticipant.enableCameraAndMicrophone();

        const localPub = Array.from(room.localParticipant.videoTrackPublications.values())[0];
        if (localPub?.track && localVideoRef.current) {
          localPub.track.attach(localVideoRef.current);
        }

        syncParticipants();
      } catch (err: any) {
        console.warn('Failed to connect to LiveKit SFU, falling back to P2P:', err);
        if (isMounted) setLivekitActive(false);
      }
    }

    initLiveKit();

    return () => {
      isMounted = false;
      room.disconnect();
      livekitRoomRef.current = null;
    };
  }, [livekitActive, livekitToken, livekitWsUrl]);

  // Local Video Attachment for Both LiveKit SFU and Fallback P2P Mode (Re-attaches on layout/focus/screen-share switch)
  useEffect(() => {
    if (!localVideoRef.current || !isCameraOn) return;

    if (livekitRoomRef.current) {
      const localPub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values()).find(
        pub => pub.source === Track.Source.Camera || pub.source !== Track.Source.ScreenShare
      );
      if (localPub?.track) {
        localPub.track.attach(localVideoRef.current);
      }
    } else if (localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [layoutMode, pinnedFocus, isCameraOn, isScreenSharing, localStream, livekitActive, remoteParticipantsList]);

  // Local Screen Share Video Attachment for Both LiveKit SFU and Fallback P2P Mode
  useEffect(() => {
    if (!localScreenRef.current || !isScreenSharing) return;

    if (livekitRoomRef.current) {
      const screenPub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values()).find(
        pub => pub.source === Track.Source.ScreenShare
      );
      if (screenPub?.track) {
        screenPub.track.attach(localScreenRef.current);
      }
    } else if (localScreenStream) {
      localScreenRef.current.srcObject = localScreenStream;
    }
  }, [isScreenSharing, localScreenStream, livekitActive, remoteParticipantsList]);

  // Fallback WebRTC P2P Effect
  useEffect(() => {
    if (livekitActive) return;

    let isMounted = true;
    let streamInstance: MediaStream | null = null;
    let channel: BroadcastChannel | null = null;
    let pc: RTCPeerConnection | null = null;

    const sendSignal = async (messageData: any) => {
      try {
        channel?.postMessage(messageData);
      } catch (e) {}

      try {
        await fetch(`/api/room/${roomId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData)
        });
      } catch (e) {
        console.warn('Signal POST error:', e);
      }
    };
    sendSignalRef.current = sendSignal;

    async function initWebRTC() {
      try {
        setConnectionState('connecting');
        if (!navigator?.mediaDevices?.getUserMedia) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamInstance = stream;
        setLocalStream(stream);

        try {
          channel = new BroadcastChannel(`hirely_room_${roomId}`);
          channelRef.current = channel;
        } catch (e) {}

        pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        stream.getTracks().forEach(track => {
          if (pc && stream) {
            pc.addTrack(track, stream);
          }
        });

        pc.ontrack = (event) => {
          if (!isMounted) return;
          const [incomingStream] = event.streams;
          const targetStream = incomingStream || new MediaStream([event.track]);
          const remoteName = role === 'interviewer' ? (candidateName || 'Candidate') : (interviewerName || 'Interviewer');

          setRemoteParticipantsList([{
            sid: 'p2p_remote',
            identity: 'p2p_remote',
            name: remoteName,
            isCameraOn: true,
            isMicOn: true,
            stream: targetStream
          }]);

          setPeerConnected(true);
          setConnectionState('connected');
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({
              type: 'ICE_CANDIDATE',
              senderRole: role,
              candidate: event.candidate
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (!isMounted || !pc) return;
          const state = pc.iceConnectionState;
          if (state === 'connected' || state === 'completed') {
            setPeerConnected(true);
            setConnectionState('connected');
          } else if (state === 'disconnected' || state === 'failed') {
            setPeerConnected(false);
          }
        };

        const createAndSendOffer = async () => {
          if (!pc) return;
          try {
            if (pc.signalingState !== 'stable') return;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal({
              type: 'OFFER',
              senderRole: role,
              sdp: offer
            });
          } catch (err) {}
        };

        const handleSignal = async (data: any) => {
          if (!isMounted || !data || data.senderRole === role) return;

          if (data.id) {
            if (processedSignalIdsRef.current.has(data.id)) return;
            processedSignalIdsRef.current.add(data.id);
          }

          if (data.type === 'JOIN') {
            sendSignal({ type: 'PRESENCE', senderRole: role, isCameraOn, isMicOn });
            if (role === 'interviewer') await createAndSendOffer();
          } else if (data.type === 'PRESENCE') {
            if (role === 'interviewer') await createAndSendOffer();
          } else if (data.type === 'OFFER') {
            if (!pc) return;
            try {
              if (pc.signalingState !== 'stable') {
                await pc.setLocalDescription({ type: 'rollback' } as any).catch(() => {});
              }
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              for (const cand of pendingIceCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {}
              }
              pendingIceCandidatesRef.current = [];
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignal({ type: 'ANSWER', senderRole: role, sdp: answer });
            } catch (err) {}
          } else if (data.type === 'ANSWER') {
            if (!pc) return;
            try {
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                for (const cand of pendingIceCandidatesRef.current) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch (e) {}
                }
                pendingIceCandidatesRef.current = [];
              }
            } catch (err) {}
          } else if (data.type === 'ICE_CANDIDATE') {
            if (!pc || !data.candidate) return;
            try {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              } else {
                pendingIceCandidatesRef.current.push(data.candidate);
              }
            } catch (err) {}
          } else if (data.type === 'LEAVE') {
            setPeerConnected(false);
            setRemoteParticipantsList([]);
          }
        };

        if (channel) {
          channel.onmessage = (event) => handleSignal(event.data);
        }

        let lastTimestamp = 0;
        const pollSignals = async () => {
          if (!isMounted) return;
          try {
            const res = await fetch(`/api/room/${roomId}/signal?since=${lastTimestamp}&role=${role}`);
            const resData = await res.json();
            if (resData.signals && Array.isArray(resData.signals)) {
              for (const sig of resData.signals) {
                if (sig.timestamp > lastTimestamp) lastTimestamp = sig.timestamp;
                await handleSignal(sig);
              }
            }
          } catch (e) {}
        };

        const signalInterval = setInterval(pollSignals, 1500);
        await sendSignal({ type: 'JOIN', senderRole: role, participantName, isCameraOn, isMicOn });
        setConnectionState('connected');

        return () => {
          clearInterval(signalInterval);
        };
      } catch (err) {
        if (isMounted) setConnectionState('connected');
      }
    }

    let cleanupPoll: (() => void) | undefined;
    initWebRTC().then(cleanup => { cleanupPoll = cleanup; });

    return () => {
      isMounted = false;
      if (cleanupPoll) cleanupPoll();
      if (streamInstance) streamInstance.getTracks().forEach(t => t.stop());
      if (pc) pc.close();
      if (channel) {
        channel.postMessage({ type: 'LEAVE', senderRole: role });
        channel.close();
      }
      sendSignalRef.current?.({ type: 'LEAVE', senderRole: role });
    };
  }, [roomId, role, participantName, livekitActive, candidateName, interviewerName, isCameraOn, isMicOn]);

  const toggleCamera = async () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setCameraEnabled(nextState);
      if (nextState) {
        const pub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values())[0];
        if (pub?.track && localVideoRef.current) {
          pub.track.attach(localVideoRef.current);
        }
      }
    } else if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = nextState;
    }
  };

  const toggleMic = async () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(nextState);
    } else if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = nextState;
    }
  };

  const toggleScreenShare = async () => {
    if (livekitRoomRef.current) {
      try {
        const nextState = !isScreenSharing;
        await livekitRoomRef.current.localParticipant.setScreenShareEnabled(nextState, {
          audio: false,
          selfBrowserSurface: 'include'
        });
        setIsScreenSharing(nextState);
      } catch (err: any) {
        console.warn('LiveKit screen share error or cancelled by user:', err);
        setIsScreenSharing(false);
      }
    } else {
      if (!isScreenSharing) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          const screenTrack = screenStream.getVideoTracks()[0];

          setLocalScreenStream(screenStream);
          if (pcRef.current) {
            const senders = pcRef.current.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(screenTrack);
            }
          }

          setIsScreenSharing(true);

          screenTrack.onended = async () => {
            setLocalScreenStream(null);
            if (localStream) {
              const originalTrack = localStream.getVideoTracks()[0];
              if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
              if (pcRef.current && originalTrack) {
                const senders = pcRef.current.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                if (videoSender) await videoSender.replaceTrack(originalTrack);
              }
            }
            setIsScreenSharing(false);
          };
        } catch (e) {
          console.warn('Screen share cancelled or failed:', e);
          setIsScreenSharing(false);
          setLocalScreenStream(null);
        }
      } else {
        setLocalScreenStream(null);
        if (localStream) {
          const originalTrack = localStream.getVideoTracks()[0];
          if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
          if (pcRef.current && originalTrack) {
            const senders = pcRef.current.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) await videoSender.replaceTrack(originalTrack);
          }
        }
        setIsScreenSharing(false);
      }
    }
  };

  const totalUsers = 1 + remoteParticipantsList.length;
  const isMultiUser = totalUsers > 2;
  const activeRemoteScreenShare = remoteParticipantsList.find(p => p.isScreenShare);

  // Auto grid columns depending on participant count
  const getGridColsClass = () => {
    if (totalUsers <= 2) return 'grid-cols-1 sm:grid-cols-2';
    if (totalUsers <= 4) return 'grid-cols-2 lg:grid-cols-2';
    if (totalUsers <= 6) return 'grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="relative flex flex-col h-full bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Top Header Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto flex-wrap">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-300">
            <span className={`w-2 h-2 rounded-full ${peerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{peerConnected ? `${totalUsers} USER${totalUsers > 1 ? 'S' : ''} CONNECTED` : 'WAITING FOR OTHERS'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono hidden sm:flex">
            {livekitActive ? <Radio className="w-3.5 h-3.5 text-emerald-400" /> : <Wifi className="w-3.5 h-3.5 text-amber-400" />}
            <span>{livekitActive ? 'LiveKit Multi-SFU' : 'HD WebRTC'}</span>
          </div>
        </div>

        {/* Header Right: Layout Switchers */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Spotlight Mode Button */}
          <button
            type="button"
            onClick={() => setLayoutMode('spotlight')}
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
              layoutMode === 'spotlight' && !isMultiUser
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Spotlight</span>
          </button>

          {/* Grid Mode Button */}
          <button
            type="button"
            onClick={() => setLayoutMode('grid')}
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
              layoutMode === 'grid' || isMultiUser
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grid ({totalUsers})</span>
          </button>

          {/* Swap Focus Pin Button */}
          {layoutMode === 'spotlight' && !isScreenSharing && (
            <button
              type="button"
              onClick={togglePinnedFocus}
              title="Tukar Layar Utama (Swap Main View)"
              className="p-1.5 rounded-md bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-1 shadow transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tukar Layar</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Sharing Banner */}
      {isScreenSharing && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-indigo-600/90 border border-indigo-400/30 text-white text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-md">
          <Monitor className="w-3.5 h-3.5 animate-pulse text-indigo-200" />
          <span>Anda sedang membagikan layar</span>
        </div>
      )}

      {/* Main Multi-Participant / Screen Share Video Viewport */}
      <div className="relative flex-1 min-h-0 w-full p-3 flex items-center justify-center bg-zinc-950 overflow-hidden">
        {isScreenSharing ? (
          /* Local Screen Share Main Stage */
          <div className="relative w-full h-full rounded-xl bg-zinc-950 border border-indigo-500/50 overflow-hidden flex items-center justify-center">
            <video
              ref={localScreenRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded bg-indigo-600/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow">
              <Monitor className="w-3.5 h-3.5 animate-pulse text-indigo-200" />
              <span>Layar Anda ({participantName})</span>
            </div>

            {/* Floating Camera PIP */}
            <div className="absolute bottom-3 right-3 z-30 w-36 sm:w-48 aspect-video rounded-xl bg-zinc-950 border border-zinc-700/80 overflow-hidden flex items-center justify-center shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain -scale-x-100 ${isCameraOn ? 'block' : 'hidden'}`}
              />
              {!isCameraOn && (
                <div className="flex flex-col items-center justify-center gap-1 text-center p-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs">
                    {participantName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] text-zinc-300">{participantName}</span>
                </div>
              )}
              <div className="absolute bottom-1 left-1 z-10 px-1.5 py-0.5 rounded bg-black/75 border border-zinc-800 text-[10px] text-white">
                {participantName} (You)
              </div>
            </div>
          </div>
        ) : activeRemoteScreenShare ? (
          /* Remote Screen Share Main Stage */
          <div className="relative w-full h-full rounded-xl bg-zinc-950 border border-indigo-500/50 overflow-hidden flex items-center justify-center">
            <RemoteParticipantTile participant={activeRemoteScreenShare} />
            <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded bg-indigo-600/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow">
              <Monitor className="w-3.5 h-3.5 animate-pulse text-indigo-200" />
              <span>Layar {activeRemoteScreenShare.name}</span>
            </div>
          </div>
        ) : layoutMode === 'grid' || isMultiUser ? (
          <div className={`w-full h-full grid ${getGridColsClass()} gap-3 overflow-y-auto`}>
            {/* Local Participant Tile */}
            <div className="relative w-full h-full min-h-[180px] rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain -scale-x-100 ${isCameraOn ? 'block' : 'hidden'}`}
              />
              {!isCameraOn && (
                <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-base">
                    {participantName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{participantName} (You)</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Your Camera is Off</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-zinc-800 text-[11px] font-medium text-white shadow pointer-events-none">
                <User className="w-3 h-3 text-zinc-400" />
                <span>{participantName} (You)</span>
                {!isMicOn && <MicOff className="w-3 h-3 text-rose-400 ml-1" />}
              </div>
            </div>

            {/* Remote Participants Tiles */}
            {remoteParticipantsList.map((p) => (
              <RemoteParticipantTile key={p.sid || p.identity} participant={p} />
            ))}

            {/* If waiting for remote participants */}
            {remoteParticipantsList.length === 0 && (
              <div className="relative w-full h-full min-h-[180px] rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 font-bold text-base animate-pulse">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Menunggu Peserta Lain...</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Bagikan link undangan ruangan untuk bergabung</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Spotlight 1-on-1 Layout Mode with Click-to-Swap Focus */
          <div className="w-full h-full rounded-xl overflow-hidden relative flex items-center justify-center bg-zinc-900 border border-zinc-800/80">
            {/* Remote Participant Spotlight */}
            <div
              onClick={pinnedFocus === 'local' ? togglePinnedFocus : undefined}
              className={
                pinnedFocus === 'remote'
                  ? 'absolute inset-0 z-0 w-full h-full bg-zinc-900 flex items-center justify-center'
                  : 'absolute top-12 right-3 z-30 w-36 sm:w-48 aspect-video rounded-xl bg-zinc-950 border border-zinc-700/80 overflow-hidden flex items-center justify-center shadow-2xl cursor-pointer hover:ring-2 hover:ring-white transition-all duration-300 group'
              }
            >
              {remoteParticipantsList[0] ? (
                <RemoteParticipantTile participant={remoteParticipantsList[0]} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 font-bold text-base animate-pulse">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-white">Menunggu Peserta...</span>
                </div>
              )}

              {pinnedFocus === 'local' && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium gap-1 z-20 pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Klik Tukar Layar</span>
                </div>
              )}
            </div>

            {/* Local Participant Spotlight */}
            <div
              onClick={pinnedFocus === 'remote' ? togglePinnedFocus : undefined}
              className={
                pinnedFocus === 'local'
                  ? 'absolute inset-0 z-0 w-full h-full bg-zinc-900 flex items-center justify-center'
                  : 'absolute top-12 right-3 z-30 w-36 sm:w-48 aspect-video rounded-xl bg-zinc-950 border border-zinc-700/80 overflow-hidden flex items-center justify-center shadow-2xl cursor-pointer hover:ring-2 hover:ring-white transition-all duration-300 group'
              }
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain -scale-x-100 ${isCameraOn ? 'block' : 'hidden'}`}
              />
              {!isCameraOn && (
                <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-base">
                    {participantName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white">{participantName} (You)</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-zinc-800 text-[11px] font-medium text-white shadow pointer-events-none">
                <User className="w-3 h-3 text-zinc-400" />
                <span>{participantName} (You)</span>
                {!isMicOn && <MicOff className="w-3 h-3 text-rose-400 ml-1" />}
              </div>

              {pinnedFocus === 'remote' && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium gap-1 z-20 pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Klik Tukar Layar</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Toolbar */}
      <div className="z-40 px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-2 ${
              isMicOn ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60' : 'bg-rose-600 text-white'
            }`}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMicOn ? 'Mute' : 'Unmuted'}</span>
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className={`p-2.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-2 ${
              isCameraOn ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60' : 'bg-rose-600 text-white'
            }`}
          >
            {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isCameraOn ? 'Camera' : 'Cam Off'}</span>
          </button>

          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-2.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-2 ${
              isScreenSharing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onLeave} className="text-xs">
            Leave Call
          </Button>

          {role === 'interviewer' && onEndInterview && (
            <Button
              variant="danger"
              size="sm"
              onClick={onEndInterview}
              className="text-xs"
              leftIcon={<PhoneOff className="w-3.5 h-3.5" />}
            >
              End & Analyze
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
