import { spawn } from "node:child_process";

type LocalSpeechSuccess = {
  ok: true;
  transcript: string;
  confidence?: number;
  recognizer?: string;
};

type LocalSpeechFailure = {
  ok: false;
  error: string;
  message: string;
  details?: string;
  recognizer?: string;
};

export type LocalSpeechResult = LocalSpeechSuccess | LocalSpeechFailure;

const wakeWordAliases = [
  "atlas",
  "atllas",
  "atles",
  "atlasz",
  "atas",
  "atis",
  "atlaz",
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

const commandPhrases = [
  "estado idle",
  "estado ouvindo",
  "estado pensando",
  "estado falando",
  "estado erro",
  "abrir mapa",
  "fechar mapa",
  "ajuda",
  "limpar"
];

const fallbackEnglishPhrases = [
  "state idle",
  "state listening",
  "state thinking",
  "state speaking",
  "state error",
  "open map",
  "close map",
  "help",
  "clear"
];

function buildPhraseGrammar() {
  const phrases = new Set([...commandPhrases, ...fallbackEnglishPhrases]);

  for (const alias of wakeWordAliases) {
    for (const command of [...commandPhrases, ...fallbackEnglishPhrases]) {
      phrases.add(`${alias} ${command}`);
    }
  }

  return Array.from(phrases);
}

function buildPowerShellScript() {
  const phrasesJson = JSON.stringify(buildPhraseGrammar());

  return `
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$phrases = '${phrasesJson}' | ConvertFrom-Json
$recognizers = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()
$recognizerInfo = $recognizers | Where-Object { $_.Culture.Name -eq "pt-BR" } | Select-Object -First 1

if ($null -eq $recognizerInfo) {
  $recognizerInfo = $recognizers | Select-Object -First 1
}

if ($null -eq $recognizerInfo) {
  throw "Nenhum reconhecedor de fala instalado no Windows."
}

$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine($recognizerInfo)

try {
  $choices = New-Object System.Speech.Recognition.Choices
  $choices.Add([string[]]$phrases) | Out-Null

  $builder = New-Object System.Speech.Recognition.GrammarBuilder
  $builder.Culture = $recognizerInfo.Culture
  $builder.Append($choices)

  $grammar = New-Object System.Speech.Recognition.Grammar($builder)
  $engine.LoadGrammar($grammar)
  $engine.SetInputToDefaultAudioDevice()

  $result = $engine.Recognize([TimeSpan]::FromSeconds(8))

  if ($null -eq $result) {
    @{
      ok = $false
      error = "no-speech"
      message = "Nenhuma fala detectada. Tente novamente."
      recognizer = $recognizerInfo.Culture.Name
    } | ConvertTo-Json -Compress
  } else {
    @{
      ok = $true
      transcript = $result.Text
      confidence = $result.Confidence
      recognizer = $recognizerInfo.Culture.Name
    } | ConvertTo-Json -Compress
  }
} finally {
  $engine.Dispose()
}
`;
}

function parsePowerShellJson(output: string): LocalSpeechResult {
  const trimmed = output.trim();
  const jsonStart = trimmed.lastIndexOf("{");

  if (jsonStart === -1) {
    return {
      ok: false,
      error: "invalid-output",
      message: "O reconhecedor local nao retornou uma resposta valida.",
      details: trimmed
    };
  }

  return JSON.parse(trimmed.slice(jsonStart)) as LocalSpeechResult;
}

export function listenForLocalVoiceCommand(): Promise<LocalSpeechResult> {
  return new Promise((resolve) => {
    const script = buildPowerShellScript();
    const encodedScript = Buffer.from(script, "utf16le").toString("base64");
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encodedScript
      ],
      {
        windowsHide: true
      }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      settled = true;
      child.kill();
      resolve({
        ok: false,
        error: "timeout",
        message: "Tempo de escuta encerrado. Tente novamente."
      });
    }, 12000);

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString("utf8");
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString("utf8");
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve({
        ok: false,
        error: "spawn-error",
        message: "Nao foi possivel iniciar o reconhecedor local do Windows.",
        details: error.message
      });
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        resolve({
          ok: false,
          error: "recognizer-error",
          message: "Falha no reconhecedor local do Windows.",
          details: stderr.trim() || stdout.trim()
        });
        return;
      }

      try {
        resolve(parsePowerShellJson(stdout));
      } catch (error) {
        resolve({
          ok: false,
          error: "parse-error",
          message: "Falha ao ler a resposta do reconhecedor local.",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    });
  });
}
