import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildBurstPcm, parseWavFile, wrapAsWavFile, type WavClip } from "./wavBurst";

const CLICK_SOUND_PATH = path.join(__dirname, "../../assets/sounds/click.wav");
// A fixed path (rather than a temp dir + random name) so it stays a statically-resolvable
// argument for every fs call -- os.tmpdir()/crypto.randomUUID() are not. There is no real
// overwrite race to guard against: this is a turn-based board game, and playback finishes long
// before a human can click again.
const CLICK_BURST_PATH = path.join(__dirname, "../../.audio-cache/click-burst.wav");
const CLICK_GAP_MS = 45;

interface AudioPlayer {
  command: string;
  probeArgs: string[];
  playArgs: (filePath: string) => string[];
}

const LINUX_PLAYERS: AudioPlayer[] = [
  // A low --latency-msec matters here: at the default (~270ms measured), paplay was buffering
  // long enough that opening a fresh connection per move was audible as startup lag on the next
  // click. (An earlier attempt kept one `paplay --raw` process alive across the whole session and
  // wrote PCM to its stdin instead of spawning per move -- confirmed, via a human listening, to
  // buffer everything until the pipe closed rather than render it in real time, so every click
  // played at once only when the app quit. Reverted; see CLAUDE.md.)
  { command: "paplay", probeArgs: ["--version"], playArgs: (filePath) => ["--latency-msec=20", filePath] },
  { command: "aplay", probeArgs: ["--version"], playArgs: (filePath) => [filePath] },
  {
    command: "ffplay",
    probeArgs: ["-version"],
    playArgs: (filePath) => ["-nodisp", "-autoexit", "-loglevel", "quiet", filePath],
  },
];
const DARWIN_PLAYERS: AudioPlayer[] = [{ command: "afplay", probeArgs: [], playArgs: (filePath) => [filePath] }];
const WIN32_PLAYERS: AudioPlayer[] = [
  {
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

// One process for the whole burst, not one per click: spawning a player is slow enough (WSL2 in
// particular) that firing several in a 45ms cadence made later clicks in a multi-flip move drift
// noticeably behind the board update. Concatenating the clip into one WAV keeps every click's
// timing inside the audio data itself instead of depending on the OS to schedule each spawn on time.
export const playClickSounds = (repeatCount: number): void => {
  if (repeatCount <= 0) {
    return;
  }

  const clip = loadClip();
  const wavFile = wrapAsWavFile(clip, buildBurstPcm(clip, repeatCount, CLICK_GAP_MS));

  void resolvePlayer().then((player) => {
    if (!player) {
      return;
    }
    fs.mkdirSync(path.dirname(CLICK_BURST_PATH), { recursive: true });
    fs.writeFileSync(CLICK_BURST_PATH, wavFile);
    void trySpawn(player.command, player.playArgs(CLICK_BURST_PATH));
  });
};
