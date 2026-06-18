import type { AuronState } from "../types/auron";
import {
  defaultMapLocation,
  findMapLocation,
  homeMapLocation,
  type MapLocation
} from "./mapLocations";

export type CommandResult =
  | {
      type: "set-state";
      state: AuronState;
      message: string;
    }
  | {
      type: "show_help";
      message: string;
    }
  | {
      type: "clear";
      message: string;
    }
  | {
      type: "open-map";
      location: MapLocation;
      message: string;
    }
  | {
      type: "close-map";
      message: string;
    }
  | {
      type: "adjust-map";
      action: "zoom" | "rotate" | "tilt";
      delta: number;
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

function buildOpenMapResult(locationQuery: string) {
  const location = findMapLocation(locationQuery);

  if (!location) {
    return null;
  }

  return {
    type: "open-map" as const,
    location,
    message: `Abrindo mapa de ${location.label}.`
  };
}

export function routeCommand(command: string): CommandResult {
  const normalized = normalizeCommand(command);
  const openMapMatch = normalized.match(
    /^(?:abrir mapa de|abrir mapa do|abrir mapa em|mapa de|mapa do|abrir)\s+(.+)$/
  );

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
        message: "Paineis temporarios limpos."
      };
    case "ajuda":
      return {
        type: "show_help",
        message: "Lista de comandos disponivel."
      };
    case "abrir mapa":
      return {
        type: "open-map",
        location: defaultMapLocation,
        message: "Abrindo Globe Mode."
      };
    case "abrir globo":
    case "visao global":
    case "recentralizar globo":
    case "resetar globo":
      return {
        type: "open-map",
        location: defaultMapLocation,
        message: "Recentralizando globo."
      };
    case "fechar mapa":
      return {
        type: "close-map",
        message: "Mapa fechado."
      };
    case "aproximar mapa":
      return {
        type: "adjust-map",
        action: "zoom",
        delta: 1,
        message: "Aproximando mapa."
      };
    case "afastar mapa":
      return {
        type: "adjust-map",
        action: "zoom",
        delta: -1,
        message: "Afastando mapa."
      };
    case "girar mapa":
      return {
        type: "adjust-map",
        action: "rotate",
        delta: 24,
        message: "Girando mapa."
      };
    case "inclinar mapa":
      return {
        type: "adjust-map",
        action: "tilt",
        delta: 8,
        message: "Inclinando mapa."
      };
    case "centralizar mapa":
      return {
        type: "open-map",
        location: homeMapLocation,
        message: "Mapa centralizado em Porto Alegre."
      };
    default:
      if (openMapMatch) {
        const mapResult = buildOpenMapResult(openMapMatch[1]);

        if (mapResult) {
          return mapResult;
        }
      }

      return {
        type: "unknown",
        message: "Comando nao reconhecido."
      };
  }
}
