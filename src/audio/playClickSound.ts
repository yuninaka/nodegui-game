import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type WavClip, buildBurstPcm, parseWavFile, wrapAsWavFile } from "./wavBurst";

const CLICK_SOUND_PATH = path.join(__dirname, "../../assets/sounds/click.wav");
// Fallback-only: a fixed path (rather than a temp dir + random name) so it stays a statically-
// resolvable argument for every fs call -- os.tmpdir()/crypto.randomUUID() are not.
const CLICK_BURST_PATH = path.join(__dirname, "../../.audio-cache/click-burst.wav");
const CLICK_GAP_MS = 45;

interface StreamingPlayer {
  kind: "stream";
  command: string;
  probeArgs: string[];
  streamArgs: (clip: WavClip) => string[];
}

interface FilePlayer {
  kind: "file";
  command: string;
  probeArgs: string[];
  playArgs: (filePath: string) => string[];
}

type AudioPlayer = StreamingPlayer | FilePlayer;

const LINUX_PLAYERS: AudioPlayer[] = [
  {
    kind: "stream",
    command: "paplay",
    probeArgs: ["--version"],
    // No trailing "-": paplay treats an explicit filename argument (even "-") as a real file to
    // open, and omitting it entirely is what makes it read from stdin.
    streamArgs: (clip) => ["--raw", "--format=s16le", `--rate=${String(clip.sampleRateHz)}`, `--channels=${String(clip.channels)}`],
  },
  {
    kind: "stream",
    command: "aplay",
    probeArgs: ["--version"],
    streamArgs: (clip) => ["-q", "-t", "raw", "-f", "S16_LE", "-r", String(clip.sampleRateHz), "-c", String(clip.channels), "-"],
  },
  {
    kind: "file",
    command: "ffplay",
    probeArgs: ["-version"],
    playArgs: (filePath) => ["-nodisp", "-autoexit", "-loglevel", "quiet", filePath],
  },
];
const DARWIN_PLAYERS: AudioPlayer[] = [{ kind: "file", command: "afplay", probeArgs: [], playArgs: (filePath) => [filePath] }];
const WIN32_PLAYERS: AudioPlayer[] = [
  {
    kind: "file",
    command: "powershell",
    probeArgs: ["-c", "exit"],
    playArgs: (filePath) => ["-c", `(New-Object Media.SoundPlayer '${filePath}').PlaySync();`],
  },
];

const PLAYERS_BY_PLATFORM: Partial<Record<NodeJS.Platform, AudioPlayer[]>> = {
  linux: LINUX_PLAYERS,
  darwin: DARWIN_PLAYERS,
  win32: WIN32_PLAYERS,
};

const trySpawn = (command: string, args: string[]): Promise<ChildProcess | null> =>
  new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.once("error", () => {
      resolve(null);
    });
    child.once("spawn", () => {
      resolve(child);
    });
  });

const detectPlayer = async (): Promise<AudioPlayer | null> => {
  const candidates = PLAYERS_BY_PLATFORM[process.platform] ?? [];
  for (const candidate of candidates) {
    const probe = await trySpawn(candidate.command, candidate.probeArgs);
    if (probe) {
      probe.kill();
      return candidate;
    }
  }
  console.warn("[audio] no system audio player found; sound effects are disabled");
  return null;
};

let playerPromise: Promise<AudioPlayer | null> | undefined;

const resolvePlayer = (): Promise<AudioPlayer | null> => {
  playerPromise ??= detectPlayer();
  return playerPromise;
};

let cachedClip: WavClip | undefined;

const loadClip = (): WavClip => {
  cachedClip ??= parseWavFile(fs.readFileSync(CLICK_SOUND_PATH));
  return cachedClip;
};

// Kept alive for the whole app session. Opening a fresh player process per move measured fine on
// its own, but the *audio* device itself had noticeable extra latency waking back up for each new
// connection -- audible as the next click lagging behind a quick move. Writing PCM to an
// already-open stream keeps the output device active and avoids that per-move reconnect cost.
let streamProcess: ChildProcess | undefined;

const getStreamProcess = (player: StreamingPlayer, clip: WavClip): ChildProcess => {
  if (streamProcess && !streamProcess.killed) {
    return streamProcess;
  }
  const child = spawn(player.command, player.streamArgs(clip), { stdio: ["pipe", "ignore", "ignore"] });
  child.once("exit", () => {
    streamProcess = undefined;
  });
  child.once("error", () => {
    streamProcess = undefined;
  });
  process.once("exit", () => child.kill());
  streamProcess = child;
  return child;
};

const playViaStream = (player: StreamingPlayer, clip: WavClip, repeatCount: number): void => {
  const child = getStreamProcess(player, clip);
  if (child.stdin) {
    child.stdin.write(buildBurstPcm(clip, repeatCount, CLICK_GAP_MS));
  }
};

const playViaFile = (player: FilePlayer, clip: WavClip, repeatCount: number): void => {
  const wavFile = wrapAsWavFile(clip, buildBurstPcm(clip, repeatCount, CLICK_GAP_MS));
  fs.mkdirSync(path.dirname(CLICK_BURST_PATH), { recursive: true });
  fs.writeFileSync(CLICK_BURST_PATH, wavFile);
  void trySpawn(player.command, player.playArgs(CLICK_BURST_PATH));
};

export const playClickSounds = (repeatCount: number): void => {
  if (repeatCount <= 0) {
    return;
  }

  const clip = loadClip();
  void resolvePlayer().then((player) => {
    if (!player) {
      return;
    }
    if (player.kind === "stream") {
      playViaStream(player, clip, repeatCount);
    } else {
      playViaFile(player, clip, repeatCount);
    }
  });
};
