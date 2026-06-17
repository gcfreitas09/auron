type AuronLocalVoiceResult =
  | {
      ok: true;
      transcript: string;
      confidence?: number;
      recognizer?: string;
    }
  | {
      ok: false;
      error: string;
      message: string;
      details?: string;
      recognizer?: string;
    };

interface Window {
  auron?: {
    version: string;
    listenForLocalVoiceCommand?: () => Promise<AuronLocalVoiceResult>;
  };
}
