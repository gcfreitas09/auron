import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeVoiceCommand } from "../core/normalizeVoiceCommand";

type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onstart: null | (() => void);
  onresult: null | ((event: SpeechRecognitionEventLike) => void);
  onerror: null | ((event: SpeechRecognitionErrorEventLike) => void);
  onend: null | (() => void);
  onspeechstart?: null | (() => void);
  onspeechend?: null | (() => void);
  start: () => void;
  abort?: () => void;
  stop?: () => void;
};

type SpeechRecognitionResultLike = {
  0: {
    transcript: string;
  };
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionErrorEventLike = {
  error:
    | "not-allowed"
    | "service-not-allowed"
    | "no-speech"
    | "audio-capture"
    | "aborted"
    | "network"
    | string;
};

type RecognitionConstructor = new () => RecognitionLike;

type VoiceControlProps = {
  onListeningStart: () => void;
  onListeningEnd: () => void;
  onRecognized: (command: string, transcript: string) => void | Promise<void>;
  onError: (message: string) => void;
  onUnsupported: (message: string) => void;
  showMeta?: boolean;
  compact?: boolean;
};

type LocalVoiceResult =
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

function mapRecognitionError(error: SpeechRecognitionErrorEventLike["error"]) {
  switch (error) {
    case "not-allowed":
      return "Microfone bloqueado pelo navegador.";
    case "service-not-allowed":
      return "Servico de voz bloqueado neste ambiente.";
    case "no-speech":
      return "Nenhuma fala detectada. Tente novamente.";
    case "audio-capture":
      return "Microfone nao encontrado.";
    case "aborted":
      return "Reconhecimento de voz interrompido.";
    case "network":
      return "Erro de rede ou servico de voz indisponivel.";
    default:
      return `Erro de reconhecimento de voz: ${error}.`;
  }
}

function mapElectronRecognitionError(
  error: SpeechRecognitionErrorEventLike["error"],
  speechStarted: boolean,
  elapsedMs: number
) {
  if (error === "network" && !speechStarted && elapsedMs < 1500) {
    return "O Electron nao conseguiu iniciar o motor de reconhecimento de voz. Use o navegador por enquanto ou implemente um fallback local de STT na proxima etapa.";
  }

  return mapRecognitionError(error);
}

function VoiceControl({
  onListeningStart,
  onListeningEnd,
  onRecognized,
  onError,
  onUnsupported,
  showMeta = true,
  compact = false
}: VoiceControlProps) {
  const [voiceStatus, setVoiceStatus] = useState("Pronto para ouvir.");
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const speechStartedRef = useRef(false);
  const recognitionStartedAtRef = useRef(0);

  const environmentLabel = useMemo(() => {
    if (typeof navigator === "undefined") {
      return "Browser";
    }

    return /Electron/i.test(navigator.userAgent) ? "Electron" : "Browser";
  }, []);

  const recognitionCtor = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };

    return (
      speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition ??
      null
    );
  }, []);

  const isSupported = recognitionCtor !== null;
  const electronVoiceApi =
    typeof window !== "undefined" && environmentLabel === "Electron"
      ? window.auron?.listenForLocalVoiceCommand
      : undefined;

  function handleRecognizedTranscript(transcript: string) {
    const normalizedCommand = normalizeVoiceCommand(transcript);

    setLastTranscript(transcript);
    setLastCommand(normalizedCommand);

    if (!normalizedCommand) {
      const message = "Nenhum comando de voz foi identificado.";
      setVoiceError(message);
      setVoiceStatus(message);
      onError(message);
      return;
    }

    setVoiceError("");
    setVoiceStatus(`Reconhecido: ${normalizedCommand}`);
    void onRecognized(normalizedCommand, transcript);
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
      releaseMicrophoneStream();
    };
  }, []);

  function releaseMicrophoneStream() {
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current = null;
  }

  async function verifyMicrophoneAccess() {
    if (!navigator.mediaDevices?.getUserMedia) {
      return "API de microfone nao disponivel neste ambiente.";
    }

    try {
      releaseMicrophoneStream();
      microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      return null;
    } catch (error) {
      if (environmentLabel === "Electron") {
        return "Microfone bloqueado no Electron. Verifique permissoes do sistema.";
      }

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "SecurityError") {
          return "Microfone bloqueado pelo navegador.";
        }

        if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          return "Microfone nao encontrado.";
        }
      }

      return error instanceof Error
        ? `Falha ao acessar microfone: ${error.message}`
        : "Falha ao acessar microfone.";
    }
  }

  async function handleStartVoice() {
    if (electronVoiceApi) {
      await handleElectronVoiceStart(electronVoiceApi);
      return;
    }

    if (!recognitionCtor) {
      const message =
        environmentLabel === "Electron"
          ? "SpeechRecognition nao esta disponivel neste Electron. Sera necessario fallback de STT em etapa futura."
          : "Reconhecimento de voz nao disponivel neste ambiente.";
      setVoiceStatus(message);
      setVoiceError(message);
      onUnsupported(message);
      return;
    }

    if (isListening || recognitionRef.current) {
      return;
    }

    const microphoneError = await verifyMicrophoneAccess();
    if (microphoneError) {
      setVoiceStatus(microphoneError);
      setVoiceError(microphoneError);
      onError(microphoneError);
      return;
    }

    const recognition = new recognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    speechStartedRef.current = false;
    recognitionStartedAtRef.current = 0;

    setVoiceError("");
    setLastTranscript("");
    setLastCommand("");
    setVoiceStatus("Preparando captura de voz...");

    recognition.onstart = () => {
      recognitionStartedAtRef.current = performance.now();
      setIsListening(true);
      setVoiceError("");
      setVoiceStatus("Ouvindo...");
      onListeningStart();
    };

    recognition.onspeechstart = () => {
      speechStartedRef.current = true;
      setVoiceStatus("Captando fala...");
    };

    recognition.onspeechend = () => {
      setVoiceStatus("Processando comando...");
    };

    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      if (!result || !result.isFinal) {
        return;
      }

      const transcript = result[0]?.transcript?.trim() ?? "";
      handleRecognizedTranscript(transcript);
    };

    recognition.onerror = (event) => {
      const elapsedMs = recognitionStartedAtRef.current
        ? performance.now() - recognitionStartedAtRef.current
        : 0;
      const message =
        environmentLabel === "Electron"
          ? mapElectronRecognitionError(
              event.error,
              speechStartedRef.current,
              elapsedMs
            )
          : mapRecognitionError(event.error);
      setVoiceError(message);
      setVoiceStatus(message);
      setIsListening(false);
      recognitionRef.current = null;
      releaseMicrophoneStream();
      onError(message);
      onListeningEnd();
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      releaseMicrophoneStream();
      onListeningEnd();
      setVoiceStatus((currentStatus) =>
        currentStatus === "Ouvindo..." ? "Escuta finalizada." : currentStatus
      );
    };

    try {
      recognition.start();
    } catch (error) {
      const message =
        error instanceof Error
          ? `Nao foi possivel iniciar o reconhecimento: ${error.message}`
          : "Nao foi possivel iniciar o reconhecimento de voz.";
      setVoiceError(message);
      setVoiceStatus(message);
      setIsListening(false);
      recognitionRef.current = null;
      releaseMicrophoneStream();
      onError(message);
    }
  }

  async function handleElectronVoiceStart(
    listenForLocalVoiceCommand: () => Promise<LocalVoiceResult>
  ) {
    if (isListening || recognitionRef.current) {
      return;
    }

    setVoiceError("");
    setLastTranscript("");
    setLastCommand("");
    setIsListening(true);
    setVoiceStatus("Ouvindo pelo reconhecedor local do Windows...");
    onListeningStart();

    try {
      const result = await listenForLocalVoiceCommand();

      if (!result.ok) {
        const details = result.details ? ` (${result.details})` : "";
        const message = `${result.message}${details}`;
        setVoiceError(message);
        setVoiceStatus(message);
        onError(message);
        return;
      }

      const confidence =
        typeof result.confidence === "number"
          ? ` - confianca ${(result.confidence * 100).toFixed(0)}%`
          : "";
      const recognizer = result.recognizer ? ` (${result.recognizer})` : "";

      setVoiceStatus(`Reconhecido${confidence}${recognizer}.`);
      handleRecognizedTranscript(result.transcript);
    } catch (error) {
      const message =
        error instanceof Error
          ? `Falha no reconhecedor local: ${error.message}`
          : "Falha no reconhecedor local.";
      setVoiceError(message);
      setVoiceStatus(message);
      onError(message);
    } finally {
      setIsListening(false);
      onListeningEnd();
    }
  }

  return (
    <div className={`voice-control${compact ? " voice-control--compact" : ""}`}>
      <button
        type="button"
        className={`voice-control__button${isListening ? " is-listening" : ""}`}
        onClick={handleStartVoice}
        disabled={isListening}
      >
        {isListening ? "Ouvindo..." : "Ouvir comando"}
      </button>

      {showMeta ? (
        <div className="voice-control__meta">
          <p className="voice-control__status">
            {isSupported
              ? voiceStatus
              : environmentLabel === "Electron"
                ? "SpeechRecognition nao esta disponivel neste Electron. Sera necessario fallback de STT em etapa futura."
                : "Reconhecimento de voz nao disponivel neste ambiente."}
          </p>

          <p className="voice-control__environment">
            Ambiente: {environmentLabel}
          </p>

          {lastTranscript ? (
            <p className="voice-control__transcript">
              Reconhecido: "{lastTranscript}"
            </p>
          ) : null}

          {lastCommand ? (
            <p className="voice-control__transcript">
              Comando enviado: "{lastCommand}"
            </p>
          ) : null}

          {voiceError ? (
            <p className="voice-control__error">{voiceError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default VoiceControl;
