import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildClipBurst, parseWavFile } from "./wavBurst";

const CLICK_SOUND_PATH = path.join(__dirname, "../../assets/sounds/click.wav");
// A fixed path (rather than a temp dir + random name) so it stays a statically-resolvable
// argument for every fs call -- os.tmpdir()/crypto.randomUUID() are not, and there is no real
// overwrite race to guard against: this is a turn-based board game, and the burst plays out long
// before a human can click again.
const CLICK_BURST_PATH = path.join(__dirname, "../../.audio-cache/click-burst.wav");
const CLICK_GAP_MS = 45;

interface AudioPlayer {
  command: string;
  probeArgs: string[];
  playArgs: (filePath: string) => string[];
}

const LINUX_PLAYERS: AudioPlayer[] = [
  { command: "paplay", probeArgs: ["--version"], playArgs: (filePath) => [filePath] },
  { command: "aplay", probeArgs: ["--version"], playArgs: (filePath) => [filePath] },
  { command: "ffplay", probeArgs: ["-version"], playArgs: (filePath) => ["-nodisp", "-autoexit", "-loglevel", "quiet", filePath] },
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

// One process for the whole burst, not one per click: spawning a player is slow enough (WSL2 in
// particular) that firing several in a 45ms cadence made later clicks in a multi-flip move drift
// noticeably behind the board update. Concatenating the clip into one WAV keeps every click's
// timing inside the audio data itself instead of depending on the OS to schedule each spawn on time.
export const playClickSounds = (repeatCount: number): void => {
  if (repeatCount <= 0) {
    return;
  }

  const clip = parseWavFile(fs.readFileSync(CLICK_SOUND_PATH));
  const burst = buildClipBurst(clip, repeatCount, CLICK_GAP_MS);
  fs.mkdirSync(path.dirname(CLICK_BURST_PATH), { recursive: true });
  fs.writeFileSync(CLICK_BURST_PATH, burst);

  void resolvePlayer().then((player) => {
    if (player) {
      void trySpawn(player.command, player.playArgs(CLICK_BURST_PATH));
    }
  });
};
