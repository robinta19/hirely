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
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';
import { Button } from '@/components/ui/Button';
import { ParticipantRole } from '@/types/interview';

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
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const sendSignalRef = useRef<((msg: any) => Promise<void>) | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());

  const livekitRoomRef = useRef<Room | null>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isRemoteMicOn, setIsRemoteMicOn] = useState(true);
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');

  const [livekitActive, setLivekitActive] = useState(propIsLiveKitActive);
  const [livekitToken, setLivekitToken] = useState<string | undefined>(propToken);
  const [livekitWsUrl, setLivekitWsUrl] = useState<string | undefined>(propWsUrl);

  // Layout & Interactive Focus State (Spotlight vs Grid 50/50)
  const [layoutMode, setLayoutMode] = useState<'spotlight' | 'grid'>('spotlight');
  const [pinnedFocus, setPinnedFocus] = useState<'remote' | 'local'>(
    role === 'interviewer' ? 'remote' : 'local'
  );

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

  // Real LiveKit SFU Connection Effect
  useEffect(() => {
    if (!livekitActive || !livekitToken || !livekitWsUrl) return;

    let isMounted = true;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    livekitRoomRef.current = room;

    async function initLiveKit() {
      try {
        setConnectionState('connecting');

        room.on(RoomEvent.Connected, () => {
          if (isMounted) setConnectionState('connected');
        });

        room.on(RoomEvent.Disconnected, () => {
          if (isMounted) setPeerConnected(false);
        });

        room.on(RoomEvent.ParticipantConnected, () => {
          if (isMounted) setPeerConnected(true);
        });

        room.on(RoomEvent.ParticipantDisconnected, () => {
          if (isMounted && room.remoteParticipants.size === 0) {
            setPeerConnected(false);
          }
        });

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (!isMounted) return;
          setPeerConnected(true);
          setConnectionState('connected');

          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
            setIsRemoteCameraOn(true);
          }
          if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
            track.attach(remoteAudioRef.current);
            setIsRemoteMicOn(true);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          if (!isMounted) return;
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.detach(remoteVideoRef.current);
          }
          if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
            track.detach(remoteAudioRef.current);
          }
        });

        room.on(RoomEvent.TrackMuted, (pub) => {
          if (pub.kind === Track.Kind.Video) setIsRemoteCameraOn(false);
          if (pub.kind === Track.Kind.Audio) setIsRemoteMicOn(false);
        });

        room.on(RoomEvent.TrackUnmuted, (pub) => {
          if (pub.kind === Track.Kind.Video) setIsRemoteCameraOn(true);
          if (pub.kind === Track.Kind.Audio) setIsRemoteMicOn(true);
        });

        await room.connect(livekitWsUrl!, livekitToken!);

        // Publish camera & microphone to room
        await room.localParticipant.enableCameraAndMicrophone();

        // Attach local video track to local video element
        const localPub = Array.from(room.localParticipant.videoTrackPublications.values())[0];
        if (localPub?.track && localVideoRef.current) {
          localPub.track.attach(localVideoRef.current);
        }

        if (room.remoteParticipants.size > 0 && isMounted) {
          setPeerConnected(true);
          room.remoteParticipants.forEach((participant: RemoteParticipant) => {
            participant.videoTrackPublications.forEach(pub => {
              if (pub.track && remoteVideoRef.current) {
                pub.track.attach(remoteVideoRef.current);
              }
            });
            participant.audioTrackPublications.forEach(pub => {
              if (pub.track && remoteAudioRef.current) {
                pub.track.attach(remoteAudioRef.current);
              }
            });
          });
        }
      } catch (err: any) {
        console.warn('Failed to connect to LiveKit room (invalid token or key mismatch), falling back to P2P:', err);
        if (isMounted) {
          setLivekitActive(false);
        }
      }
    }

    initLiveKit();

    return () => {
      isMounted = false;
      room.disconnect();
      livekitRoomRef.current = null;
    };
  }, [livekitActive, livekitToken, livekitWsUrl]);

  // Handle local video stream for fallback P2P mode
  useEffect(() => {
    if (!livekitActive && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOn, livekitActive]);

  // Handle remote video stream for fallback P2P mode
  useEffect(() => {
    if (!livekitActive && remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, peerConnected, isRemoteCameraOn, livekitActive]);

  // Fallback WebRTC Peer-to-Peer setup (only runs if LiveKit is NOT active)
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

        if (!navigator?.mediaDevices?.getUserMedia) {
          console.warn('MediaDevices API not available (Insecure HTTP origin or unsupported browser)');
          return;
        }

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
        } catch (e) {
          console.warn('BroadcastChannel unsupported:', e);
        }

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
          if (incomingStream) {
            setRemoteStream(incomingStream);
            setPeerConnected(true);
            setConnectionState('connected');
          } else if (event.track) {
            const newStream = new MediaStream([event.track]);
            setRemoteStream(newStream);
            setPeerConnected(true);
            setConnectionState('connected');
          }
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
          } catch (err) {
            console.warn('Error creating WebRTC offer:', err);
          }
        };

        const handleSignal = async (data: any) => {
          if (!isMounted || !data || data.senderRole === role) return;

          if (data.id) {
            if (processedSignalIdsRef.current.has(data.id)) return;
            processedSignalIdsRef.current.add(data.id);
          }

          if (data.type === 'JOIN') {
            sendSignal({
              type: 'PRESENCE',
              senderRole: role,
              isCameraOn,
              isMicOn
            });
            if (role === 'interviewer') {
              await createAndSendOffer();
            }
          } else if (data.type === 'PRESENCE') {
            if (typeof data.isCameraOn === 'boolean') setIsRemoteCameraOn(data.isCameraOn);
            if (typeof data.isMicOn === 'boolean') setIsRemoteMicOn(data.isMicOn);
            if (role === 'interviewer') {
              await createAndSendOffer();
            }
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
              await sendSignal({
                type: 'ANSWER',
                senderRole: role,
                sdp: answer
              });
            } catch (err) {
              console.warn('Error handling offer:', err);
            }
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
            } catch (err) {
              console.warn('Error handling answer:', err);
            }
          } else if (data.type === 'ICE_CANDIDATE') {
            if (!pc || !data.candidate) return;
            try {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              } else {
                pendingIceCandidatesRef.current.push(data.candidate);
              }
            } catch (err) {
              console.warn('Error adding ICE candidate:', err);
            }
          } else if (data.type === 'MEDIA_STATE') {
            if (typeof data.isCameraOn === 'boolean') setIsRemoteCameraOn(data.isCameraOn);
            if (typeof data.isMicOn === 'boolean') setIsRemoteMicOn(data.isMicOn);
          } else if (data.type === 'LEAVE') {
            setPeerConnected(false);
            setRemoteStream(null);
          }
        };

        if (channel) {
          channel.onmessage = (event) => {
            handleSignal(event.data);
          };
        }

        let lastTimestamp = 0;
        const pollSignals = async () => {
          if (!isMounted) return;
          try {
            const res = await fetch(`/api/room/${roomId}/signal?since=${lastTimestamp}&role=${role}`);
            const resData = await res.json();
            if (resData.signals && Array.isArray(resData.signals)) {
              for (const sig of resData.signals) {
                if (sig.timestamp > lastTimestamp) {
                  lastTimestamp = sig.timestamp;
                }
                await handleSignal(sig);
              }
            }
          } catch (e) {}
        };

        const signalInterval = setInterval(pollSignals, 1500);

        await sendSignal({
          type: 'JOIN',
          senderRole: role,
          participantName,
          isCameraOn,
          isMicOn
        });

        setConnectionState('connected');

        return () => {
          clearInterval(signalInterval);
        };
      } catch (err) {
        console.warn('WebRTC init failed:', err);
        if (isMounted) setConnectionState('connected');
      }
    }

    let cleanupPoll: (() => void) | undefined;
    initWebRTC().then(cleanup => {
      cleanupPoll = cleanup;
    });

    return () => {
      isMounted = false;
      if (cleanupPoll) cleanupPoll();
      if (streamInstance) {
        streamInstance.getTracks().forEach(t => t.stop());
      }
      if (pc) {
        pc.close();
      }
      if (channel) {
        channel.postMessage({ type: 'LEAVE', senderRole: role });
        channel.close();
      }
      sendSignalRef.current?.({ type: 'LEAVE', senderRole: role });
    };
  }, [roomId, role, participantName, livekitActive]);

  // Media toggle handlers
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
      if (videoTrack) {
        videoTrack.enabled = nextState;
        sendSignalRef.current?.({
          type: 'MEDIA_STATE',
          senderRole: role,
          isCameraOn: nextState,
          isMicOn
        });
      }
    }
  };

  const toggleMic = async () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);

    if (livekitRoomRef.current) {
      await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(nextState);
    } else if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = nextState;
        sendSignalRef.current?.({
          type: 'MEDIA_STATE',
          senderRole: role,
          isCameraOn,
          isMicOn: nextState
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (livekitRoomRef.current) {
      const nextState = !isScreenSharing;
      await livekitRoomRef.current.localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);
    } else {
      if (!isScreenSharing) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const screenTrack = screenStream.getVideoTracks()[0];

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }

          if (pcRef.current) {
            const senders = pcRef.current.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(screenTrack);
            }
          }

          setIsScreenSharing(true);

          screenTrack.onended = () => {
            if (localStream) {
              const originalTrack = localStream.getVideoTracks()[0];
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
              }
              if (pcRef.current && originalTrack) {
                const senders = pcRef.current.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                if (videoSender) {
                  videoSender.replaceTrack(originalTrack);
                }
              }
            }
            setIsScreenSharing(false);
          };
        } catch (e) {
          console.warn('Screen share cancelled or failed:', e);
        }
      } else {
        if (localStream) {
          const originalTrack = localStream.getVideoTracks()[0];
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
          if (pcRef.current && originalTrack) {
            const senders = pcRef.current.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(originalTrack);
            }
          }
        }
        setIsScreenSharing(false);
      }
    }
  };

  const togglePinnedFocus = () => {
    setPinnedFocus(prev => (prev === 'remote' ? 'local' : 'remote'));
  };

  const primaryName = candidateName || 'Candidate';
  const secondaryName = interviewerName || 'Interviewer';

  const remoteDisplayName = role === 'interviewer' ? primaryName : secondaryName;
  const localDisplayName = `${participantName} (You)`;

  const isRemoteVideoVisible = peerConnected && isRemoteCameraOn;
  const isLocalVideoVisible = isCameraOn;

  // Determine CSS class for Remote & Local containers dynamically based on layoutMode and pinnedFocus
  // Grid 50/50 vs Spotlight (Main Stage vs Floating PIP)
  let remoteContainerClass = '';
  let localContainerClass = '';

  if (layoutMode === 'grid') {
    remoteContainerClass = 'relative w-full h-full rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center transition-all duration-500 ease-in-out';
    localContainerClass = 'relative w-full h-full rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center transition-all duration-500 ease-in-out';
  } else {
    // Spotlight mode
    if (pinnedFocus === 'remote') {
      remoteContainerClass = 'absolute inset-0 z-0 w-full h-full bg-zinc-900 flex items-center justify-center transition-all duration-500 ease-in-out';
      localContainerClass = 'absolute top-12 right-2 sm:top-3 sm:right-3 z-30 w-28 sm:w-48 aspect-video rounded-xl bg-zinc-950 border border-zinc-700/80 overflow-hidden flex items-center justify-center shadow-2xl cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all duration-500 ease-in-out group';
    } else {
      localContainerClass = 'absolute inset-0 z-0 w-full h-full bg-zinc-900 flex items-center justify-center transition-all duration-500 ease-in-out';
      remoteContainerClass = 'absolute top-12 right-2 sm:top-3 sm:right-3 z-30 w-28 sm:w-48 aspect-video rounded-xl bg-zinc-950 border border-zinc-700/80 overflow-hidden flex items-center justify-center shadow-2xl cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all duration-500 ease-in-out group';
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Audio Element for Remote Audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Header Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto flex-wrap">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-300">
            <span className={`w-2 h-2 rounded-full ${peerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{peerConnected ? 'LIVE CONNECTED' : 'WAITING FOR PEER'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono hidden sm:flex">
            {livekitActive ? (
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{livekitActive ? 'LiveKit SFU Cloud' : 'HD WebRTC P2P'}</span>
          </div>
        </div>

        {/* Header Right: Layout Switchers & Swap Focus */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Spotlight Mode Button */}
          <button
            type="button"
            onClick={() => setLayoutMode('spotlight')}
            title="Spotlight View (Focus + PIP)"
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
              layoutMode === 'spotlight'
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
            title="Grid 50/50 View (Side-by-Side)"
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
              layoutMode === 'grid'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grid 50/50</span>
          </button>

          {/* Swap Focus Pin Button */}
          {layoutMode === 'spotlight' && (
            <button
              type="button"
              onClick={togglePinnedFocus}
              title="Tukar Layar Utama (Swap Main View)"
              className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">Tukar Layar</span>
            </button>
          )}

          {connectionState === 'reconnecting' && (
            <div className="px-2 py-1 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[11px] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Reconnecting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Screen Sharing Active Notification Banner */}
      {isScreenSharing && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-indigo-600/90 border border-indigo-400/30 text-white text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-md">
          <Monitor className="w-3.5 h-3.5 animate-pulse text-indigo-200" />
          <span>Anda sedang membagikan layar</span>
        </div>
      )}

      {/* Main Video Viewport Area */}
      <div className="relative flex-1 min-h-0 w-full p-3 flex items-center justify-center bg-zinc-950 overflow-hidden">
        <div
          className={`w-full h-full rounded-xl overflow-hidden relative ${
            layoutMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
              : 'relative flex items-center justify-center bg-zinc-900 border border-zinc-800/80'
          }`}
        >
          {/* ========================================================
             CONTAINER 1: REMOTE PARTICIPANT VIDEO CONTAINER
             ======================================================== */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={remoteContainerClass}
            onClick={layoutMode === 'spotlight' && pinnedFocus === 'local' ? togglePinnedFocus : undefined}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-contain ${isRemoteVideoVisible ? 'block' : 'hidden'}`}
            />

            {!isRemoteVideoVisible && (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-lg">
                  {remoteDisplayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{remoteDisplayName}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {peerConnected ? 'Camera is Off' : 'Waiting for peer...'}
                  </p>
                </div>
              </div>
            )}

            {/* Name Tag Badge */}
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-zinc-800 text-[11px] font-medium text-white shadow pointer-events-none">
              <User className="w-3 h-3 text-zinc-400" />
              <span>{remoteDisplayName}</span>
              {!isRemoteMicOn && <MicOff className="w-3 h-3 text-rose-400 ml-1" />}
            </div>

            {/* Hover overlay badge when rendered as PIP */}
            {layoutMode === 'spotlight' && pinnedFocus === 'local' && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium gap-1 z-20">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Klik Tukar Layar</span>
              </div>
            )}
          </motion.div>

          {/* ========================================================
             CONTAINER 2: LOCAL PARTICIPANT VIDEO CONTAINER
             ======================================================== */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={localContainerClass}
            onClick={layoutMode === 'spotlight' && pinnedFocus === 'remote' ? togglePinnedFocus : undefined}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain -scale-x-100 ${isLocalVideoVisible ? 'block' : 'hidden'}`}
            />

            {!isLocalVideoVisible && (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-lg">
                  {participantName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{participantName}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Your Camera is Off</p>
                </div>
              </div>
            )}

            {/* Name Tag Badge */}
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 border border-zinc-800 text-[11px] font-medium text-white shadow pointer-events-none">
              <User className="w-3 h-3 text-zinc-400" />
              <span>{localDisplayName}</span>
              {!isMicOn && <MicOff className="w-3 h-3 text-rose-400 ml-1" />}
            </div>

            {/* Hover overlay badge when rendered as PIP */}
            {layoutMode === 'spotlight' && pinnedFocus === 'remote' && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium gap-1 z-20">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Klik Tukar Layar</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom Control Toolbar */}
      <div className="z-40 px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleMic}
            aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            className={`p-2.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-2 ${
              isMicOn
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMicOn ? 'Mute' : 'Unmuted'}</span>
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleCamera}
            aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
            className={`p-2.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-2 ${
              isCameraOn
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isCameraOn ? 'Camera' : 'Cam Off'}</span>
          </button>

          {/* Screen Share (Available to BOTH Candidate and Interviewer!) */}
          <button
            type="button"
            onClick={toggleScreenShare}
            aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
            className={`p-2.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-2 ${
              isScreenSharing
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLeave}
            className="text-xs"
          >
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
