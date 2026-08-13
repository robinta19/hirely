'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Volume2,
  Wifi,
  AlertCircle,
  CheckCircle2,
  User,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ParticipantRole } from '@/types/interview';

interface PreJoinDeviceCheckProps {
  roomId: string;
  roomTitle?: string;
  interviewerName?: string;
  defaultRole?: ParticipantRole;
  hostKey?: string;
}

export function PreJoinDeviceCheck({
  roomId,
  roomTitle = 'Job Interview',
  interviewerName = 'Interviewer',
  defaultRole = 'candidate',
  hostKey: propHostKey
}: PreJoinDeviceCheckProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  const keyParam = searchParams.get('key');

  // Verify host privilege
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && propHostKey) {
      const savedHostKey = sessionStorage.getItem(`hirely_host_${roomId}`);
      if (keyParam && keyParam === propHostKey) {
        setIsHost(true);
        sessionStorage.setItem(`hirely_host_${roomId}`, keyParam);
      } else if (savedHostKey && savedHostKey === propHostKey) {
        setIsHost(true);
      } else {
        setIsHost(false);
      }
    } else {
      setIsHost(false);
    }
  }, [roomId, keyParam, propHostKey]);

  const [participantName, setParticipantName] = useState(
    isHost ? interviewerName : ''
  );

  // Update participant name when isHost evaluates
  useEffect(() => {
    if (isHost && interviewerName && !participantName) {
      setParticipantName(interviewerName);
    }
  }, [isHost, interviewerName]);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [cameraStatus, setCameraStatus] = useState<'checking' | 'working' | 'error'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'working' | 'error'>('checking');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string>('');
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);

  // Audio Context for mic volume meter
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initMedia() {
      try {
        setCameraStatus('checking');
        setMicStatus('checking');
        setPermissionError('');

        if (!navigator?.mediaDevices?.getUserMedia) {
          setCameraStatus('error');
          setMicStatus('error');
          setPermissionError(
            'Kamera dan Mikrofon diblokir oleh browser karena diakses melalui IP HTTP (bukan HTTPS/localhost). Silakan buka melalui http://localhost:3000 atau URL Vercel (HTTPS).'
          );
          return;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        setCameraStatus('working');
        setMicStatus('working');

        // Setup Audio Visualizer
        setupAudioVisualizer(mediaStream);
      } catch (err: any) {
        console.error('Device access error:', err);
        setCameraStatus('error');
        setMicStatus('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionError('Camera or microphone permission was denied. Please allow browser access to continue.');
        } else {
          setPermissionError('Failed to access media devices. Please check your camera and microphone connections.');
        }
      }
    }

    initMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Ensure video element srcObject is always bound when stream or camera status updates
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraOn, cameraStatus]);

  const setupAudioVisualizer = (mediaStream: MediaStream) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(mediaStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('AudioContext not available:', e);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const handleSpeakerTest = () => {
    setIsTestingSpeaker(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Speaker test failed:', e);
    }
    setTimeout(() => setIsTestingSpeaker(false), 1300);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) return;

    if (!isHost) {
      try {
        await fetch(`/api/room/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'JOIN_CANDIDATE',
            payload: { candidateName: participantName.trim() }
          })
        });
      } catch (err) {
        console.error('Error recording candidate join:', err);
      }
    }

    // Stop pre-join tracks so main room can claim device
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    const hostKeyToPass = keyParam || (typeof window !== 'undefined' ? sessionStorage.getItem(`hirely_host_${roomId}`) : null);

    if (isHost && hostKeyToPass) {
      router.push(
        `/room/${roomId}?key=${encodeURIComponent(hostKeyToPass)}&name=${encodeURIComponent(participantName.trim())}`
      );
    } else {
      router.push(
        `/room/${roomId}?name=${encodeURIComponent(participantName.trim())}`
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          {isHost ? 'Interviewer Access (Host)' : "You're invited to an interview"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {roomTitle}
        </h1>
        {!isHost && (
          <p className="text-sm text-zinc-400">
            Hosted by <span className="text-zinc-200 font-medium">{interviewerName}</span>
          </p>
        )}
      </div>

      <div className="bg-zinc-900 p-6 sm:p-8 rounded-xl border border-zinc-800 shadow-2xl space-y-6">
        <form onSubmit={handleJoin} className="space-y-6">
          {/* Participant Name Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Your Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Enter your name..."
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-sm transition-all"
              />
            </div>
          </div>

          {/* Secure Role Badge */}
          <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="flex items-center gap-1.5">
              <span>Role:</span>
              <strong className="text-white capitalize">{isHost ? 'Interviewer (Host)' : 'Candidate'}</strong>
            </span>
            <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isHost ? 'Host Key Verified' : 'Protected Candidate Room'}</span>
            </span>
          </div>

          {/* Camera Preview Area */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Device Preview & Controls
            </label>

            <div className="relative w-full aspect-video rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center group shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain -scale-x-100 ${
                  isCameraOn && cameraStatus === 'working' ? 'block' : 'hidden'
                }`}
              />

              {(!isCameraOn || cameraStatus !== 'working') && (
                <div className="flex flex-col items-center gap-3 text-zinc-500">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 text-xl font-bold">
                    {participantName ? participantName.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">
                    {cameraStatus === 'checking' ? 'Testing camera & microphone...' : 'Camera is Off'}
                  </span>
                </div>
              )}

              {/* Overlay Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
                  className={`p-2.5 rounded-xl transition-all ${
                    isMicOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  }`}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
                  className={`p-2.5 rounded-xl transition-all ${
                    isCameraOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  }`}
                >
                  {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleSpeakerTest}
                  title="Test speaker sound"
                  aria-label="Test speaker sound"
                  className={`p-2.5 rounded-xl transition-all ${
                    isTestingSpeaker ? 'bg-indigo-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Diagnostic Status Check Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2.5">
              {cameraStatus === 'working' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="text-xs">
                <span className="text-zinc-400 block">Camera</span>
                <span className="text-white font-medium capitalize">{cameraStatus}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {micStatus === 'working' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div className="text-xs">
                  <span className="text-zinc-400 block">Microphone</span>
                  <span className="text-white font-medium capitalize">{micStatus}</span>
                </div>
              </div>
              {/* Mic Volume Level Bar */}
              {isMicOn && (
                <div className="w-10 h-2 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="text-zinc-400 block">Connection</span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
            </div>
          </div>

          {permissionError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{permissionError}</span>
            </div>
          )}

          {/* Join Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!participantName.trim()}
            className="w-full text-base py-3.5 shadow-indigo-500/30"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Join Interview
          </Button>
        </form>
      </div>
    </div>
  );
}
