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
  CESIUM_BASE_URL?: string;
  auron?: {
    version: string;
    listenForLocalVoiceCommand?: () => Promise<AuronLocalVoiceResult>;
  };
}

declare const CESIUM_BASE_URL: string;
