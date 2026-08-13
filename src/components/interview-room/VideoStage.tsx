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
  Radio
} from 'lucide-react';
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
        if (res.ok && data.isLiveKitActive) {
          setLivekitActive(true);
        }
      } catch (e) {
        console.warn('LiveKit check skipped/failed:', e);
      }
    }
    checkLiveKit();
  }, [roomId, participantName, role]);

  // Handle local video element srcObject
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOn]);

  // Handle remote video & audio element srcObject
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, peerConnected, isRemoteCameraOn]);

  // WebRTC Peer-to-Peer setup with dual BroadcastChannel + Server signaling
  useEffect(() => {
    let isMounted = true;
    let streamInstance: MediaStream | null = null;
    let channel: BroadcastChannel | null = null;
    let pc: RTCPeerConnection | null = null;

    // Helper to send signal via BroadcastChannel + HTTP API
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

        // Request local audio and video stream
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

        // Create BroadcastChannel signaling instance for room
        try {
          channel = new BroadcastChannel(`hirely_room_${roomId}`);
          channelRef.current = channel;
        } catch (e) {
          console.warn('BroadcastChannel unsupported or failed:', e);
        }

        // Create RTCPeerConnection with STUN servers
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          if (pc && stream) {
            pc.addTrack(track, stream);
          }
        });

        // Remote track handler
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

        // ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({
              type: 'ICE_CANDIDATE',
              senderRole: role,
              candidate: event.candidate
            });
          }
        };

        // Connection state tracking
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

        // Process incoming signaling message logic
        const handleSignal = async (data: any) => {
          if (!isMounted || !data || data.senderRole === role) return;

          // Deduplicate signal messages
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

              // Process buffered ICE candidates
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

                // Process buffered ICE candidates
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

        // Attach BroadcastChannel listener
        if (channel) {
          channel.onmessage = (event) => {
            handleSignal(event.data);
          };
        }

        // Poll backend signaling endpoint for signals across different devices
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
          } catch (e) {
            // silent catch for interval polling
          }
        };

        const signalInterval = setInterval(pollSignals, 1500);

        // Announce JOIN presence
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
  }, [roomId, role, participantName]);

  // Media toggle handlers
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !isCameraOn;
        videoTrack.enabled = nextState;
        setIsCameraOn(nextState);
        sendSignalRef.current?.({
          type: 'MEDIA_STATE',
          senderRole: role,
          isCameraOn: nextState,
          isMicOn
        });
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !isMicOn;
        audioTrack.enabled = nextState;
        setIsMicOn(nextState);
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
  };

  const primaryName = candidateName || 'Candidate';
  const secondaryName = interviewerName || 'Interviewer';

  return (
    <div className="relative flex flex-col h-full bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Hidden audio element to output remote participant audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Overlay Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-300">
            <span className={`w-2 h-2 rounded-full ${peerConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{peerConnected ? 'LIVE CONNECTED' : 'WAITING FOR PEER'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            {livekitActive ? (
              <Radio className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-zinc-300" />
            )}
            <span>{livekitActive ? 'LiveKit Cloud' : 'HD WebRTC P2P'}</span>
          </div>
        </div>

        {connectionState === 'reconnecting' && (
          <div className="px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Reconnecting...</span>
          </div>
        )}
      </div>

      {/* Main Video Viewport Grid */}
      <div className="relative flex-1 w-full h-full p-3 flex items-center justify-center bg-zinc-950">
        {/* Main Prominent Frame */}
        <div className="relative w-full h-full rounded-xl bg-zinc-900 border border-zinc-800/80 overflow-hidden flex items-center justify-center">
          {role === 'interviewer' ? (
            /* Interviewer Main View -> Displays Candidate Stream */
            peerConnected && remoteStream && isRemoteCameraOn ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-2xl font-bold">
                  {primaryName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">{primaryName}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {peerConnected
                      ? (isRemoteCameraOn ? 'Connecting candidate stream...' : 'Candidate camera is muted')
                      : 'Waiting for candidate to enter room...'}
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Candidate Main View -> Displays Candidate's Own Camera */
            isCameraOn && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-2xl font-bold">
                  {participantName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">{participantName}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Your Camera is Off</p>
                </div>
              </div>
            )
          )}

          {/* Bottom Left Name Tag Badge */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/70 border border-zinc-800 text-xs font-medium text-white">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {role === 'interviewer'
                ? primaryName
                : `${participantName} (You)`}
            </span>
            {role === 'interviewer' ? (
              !isRemoteMicOn && <MicOff className="w-3.5 h-3.5 text-rose-400 ml-1" />
            ) : (
              !isMicOn && <MicOff className="w-3.5 h-3.5 text-rose-400 ml-1" />
            )}
          </div>

          {/* Picture-in-Picture (PIP) Thumbnail */}
          <div className="absolute top-3 right-3 z-10 w-36 sm:w-44 aspect-video rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
            {role === 'interviewer' ? (
              /* Interviewer PIP -> Shows Interviewer Local Camera */
              isCameraOn && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
                    {secondaryName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-medium block truncate">{secondaryName}</span>
                    <span className="text-[10px] text-zinc-400 block">Interviewer</span>
                  </div>
                </div>
              )
            ) : (
              /* Candidate PIP -> Shows Interviewer Remote Video */
              peerConnected && remoteStream && isRemoteCameraOn ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
                    {secondaryName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-medium block truncate">{secondaryName}</span>
                    <span className="text-[10px] text-zinc-400 block">
                      {peerConnected ? 'HR Interviewer' : 'Waiting for HR...'}
                    </span>
                  </div>
                </div>
              )
            )}
            <div className="absolute bottom-1 right-1 text-[10px] bg-black/70 px-1 py-0.5 rounded text-zinc-400 font-mono">
              {role === 'interviewer' ? 'You (HR)' : 'HR Stream'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Toolbar */}
      <div className="z-20 px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
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

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
            className={`p-2.5 rounded-lg transition-colors font-medium text-xs hidden sm:flex items-center gap-2 ${
              isScreenSharing
                ? 'bg-zinc-100 text-zinc-950'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>{isScreenSharing ? 'Sharing' : 'Share'}</span>
          </button>
        </div>

        {/* Right Actions: Leave or End Interview */}
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
