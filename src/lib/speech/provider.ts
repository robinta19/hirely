export interface SpeechResult {
  finalTranscript: string;
  interimTranscript: string;
  isFinal: boolean;
}

export type SpeechCallback = (result: SpeechResult) => void;
export type ErrorCallback = (error: string) => void;

export interface SpeechToTextProvider {
  isSupported(): boolean;
  start(onResult: SpeechCallback, onError?: ErrorCallback): Promise<void>;
  stop(): Promise<void>;
  isListening(): boolean;
}
