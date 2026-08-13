import { SpeechToTextProvider, SpeechCallback, ErrorCallback } from './provider';

// Extend Window interface for WebkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class BrowserSpeechToTextProvider implements SpeechToTextProvider {
  private recognition: any = null;
  private listening: boolean = false;
  private onResultCallback: SpeechCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;
  private accumulatedFinalText: string = '';
  private lang: string = 'id-ID';

  constructor(defaultLang: string = 'id-ID') {
    this.lang = defaultLang;
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = this.lang;

          this.recognition.onresult = (event: any) => {
            let currentInterim = '';
            let newlyFinalized = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                newlyFinalized += transcript + ' ';
              } else {
                currentInterim += transcript;
              }
            }

            if (newlyFinalized) {
              this.accumulatedFinalText += newlyFinalized;
            }

            if (this.onResultCallback) {
              this.onResultCallback({
                finalTranscript: this.accumulatedFinalText.trim(),
                interimTranscript: currentInterim.trim(),
                isFinal: newlyFinalized.length > 0
              });
            }
          };

          this.recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error);
            const err = event.error;

            if (err === 'not-allowed' || err === 'service-not-allowed') {
              this.listening = false;
              if (this.onErrorCallback) {
                this.onErrorCallback('Izin mikrofon ditolak atau tidak diizinkan oleh browser.');
              }
            } else if (err === 'network') {
              this.listening = false;
              if (this.onErrorCallback) {
                this.onErrorCallback('Koneksi internet bermasalah untuk pengenalan suara.');
              }
            } else if (err !== 'no-speech' && err !== 'aborted') {
              if (this.onErrorCallback) {
                this.onErrorCallback(`Kendala transkrip suara: ${err}`);
              }
            }
          };

          this.recognition.onend = () => {
            // Restart automatically if still intended to be listening
            if (this.listening) {
              try {
                this.recognition.start();
              } catch (e) {
                // Ignore if already active
              }
            }
          };
        } catch (e) {
          console.warn('Failed to construct SpeechRecognition:', e);
        }
      }
    }
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  getLanguage(): string {
    return this.lang;
  }

  async start(onResult: SpeechCallback, onError?: ErrorCallback, lang?: string): Promise<void> {
    if (lang) {
      this.setLanguage(lang);
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.listening = true;

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      if (onError) {
        onError('Web Speech API tidak didukung pada browser ini. Gunakan Google Chrome atau Microsoft Edge.');
      }
      this.listening = false;
      return;
    }

    try {
      this.recognition.start();
    } catch (err: any) {
      const msg = err.message || String(err);
      if (!msg.includes('already started')) {
        console.warn('Speech start warning:', err);
        // If error on start, try re-initializing
        try {
          this.initRecognition();
          this.recognition?.start();
        } catch (retryErr: any) {
          if (onError) onError(retryErr.message || 'Gagal memulai transkripsi suara.');
          this.listening = false;
        }
      }
    }
  }

  async stop(): Promise<void> {
    this.listening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignored
      }
    }
  }

  isListening(): boolean {
    return this.listening;
  }

  setInitialTranscript(initialText: string) {
    this.accumulatedFinalText = initialText ? initialText.trim() + ' ' : '';
  }
}

export const defaultSpeechProvider = new BrowserSpeechToTextProvider('id-ID');
