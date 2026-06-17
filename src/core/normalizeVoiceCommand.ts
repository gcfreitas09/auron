const auronAliases = [
  "auron",
  "aurun",
  "auro",
  "aurao",
  "aurum",
  "auran",
  "oron",
  "aron",
  "auren",
  "aoron",
  "aaron"
];

const voiceCommandAliases = new Map([
  ["state idle", "estado idle"],
  ["state listening", "estado ouvindo"],
  ["state thinking", "estado pensando"],
  ["state speaking", "estado falando"],
  ["state error", "estado erro"],
  ["open map", "abrir mapa"],
  ["close map", "fechar mapa"],
  ["help", "ajuda"],
  ["clear", "limpar"]
]);

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[\s,.:;!?-]+/, "")
    .replace(/\s+/g, " ");
}

export function normalizeVoiceCommand(transcript: string) {
  const normalized = normalizeText(transcript);
  const aliasPattern = auronAliases.join("|");
  const wakeWordPattern = new RegExp(`^(${aliasPattern})(\\b|\\s|[,.:;!?-]+)`, "i");

  const command = normalized
    .replace(wakeWordPattern, "")
    .replace(/^[\s,.:;!?-]+/, "")
    .trim();

  return voiceCommandAliases.get(command) ?? command;
}
