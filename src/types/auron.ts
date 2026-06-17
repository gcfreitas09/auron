export const auronStates = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "error"
] as const;

export type AuronState = (typeof auronStates)[number];
