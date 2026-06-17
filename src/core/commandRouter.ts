import type { AuronState } from "../types/auron";

export type CommandResult =
  | {
      type: "set-state";
      state: AuronState;
      message: string;
    }
  | {
      type: "show-help";
      message: string;
    }
  | {
      type: "clear";
      message: string;
    }
  | {
      type: "open-map";
      message: string;
    }
  | {
      type: "close-map";
      message: string;
    }
  | {
      type: "unknown";
      message: string;
    };

function normalizeCommand(command: string) {
  return command
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function routeCommand(command: string): CommandResult {
  const normalized = normalizeCommand(command);

  switch (normalized) {
    case "estado idle":
      return {
        type: "set-state",
        state: "idle",
        message: "Estado alterado para IDLE."
      };
    case "estado ouvindo":
      return {
        type: "set-state",
        state: "listening",
        message: "Estado alterado para LISTENING."
      };
    case "estado pensando":
      return {
        type: "set-state",
        state: "thinking",
        message: "Estado alterado para THINKING."
      };
    case "estado falando":
      return {
        type: "set-state",
        state: "speaking",
        message: "Estado alterado para SPEAKING."
      };
    case "estado erro":
      return {
        type: "set-state",
        state: "error",
        message: "Estado alterado para ERROR."
      };
    case "limpar":
      return {
        type: "clear",
        message: "Painéis temporários limpos."
      };
    case "ajuda":
      return {
        type: "show-help",
        message: "Lista de comandos disponível."
      };
    case "abrir mapa":
      return {
        type: "open-map",
        message: "Módulo de mapa preparado."
      };
    case "fechar mapa":
      return {
        type: "close-map",
        message: "Mapa fechado."
      };
    default:
      return {
        type: "unknown",
        message: "Comando não reconhecido."
      };
  }
}
