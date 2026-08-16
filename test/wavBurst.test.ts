import { describe, expect, it } from "vitest";
import { buildBurstPcm, parseWavFile, wrapAsWavFile } from "../src/audio/wavBurst";

const makeClip = (pcmData: Buffer) => ({
  channels: 1,
  sampleRateHz: 1000,
  bitsPerSample: 16,
  pcmData,
});

describe("parseWavFile", () => {
  it("reads format fields and strips the 44-byte header", () => {
    const pcmData = Buffer.from([1, 2, 3, 4]);
    const header = Buffer.alloc(44);
    header.writeUInt16LE(2, 22); // channels
    header.writeUInt32LE(48000, 24); // sample rate
    header.writeUInt16LE(16, 34); // bits per sample
    const fileContents = Buffer.concat([header, pcmData]);

    const clip = parseWavFile(fileContents);
    expect(clip.channels).toBe(2);
    expect(clip.sampleRateHz).toBe(48000);
    expect(clip.bitsPerSample).toBe(16);
    expect(clip.pcmData).toEqual(pcmData);
  });
});

describe("buildBurstPcm", () => {
  it("repeats the clip with silence gaps in between", () => {
    const clip = makeClip(Buffer.from([10, 20]));
    // 2ms gap at 1000Hz -> 2 samples -> 4 bytes per gap
    const pcmData = buildBurstPcm(clip, 3, 2);
    expect(Array.from(pcmData)).toEqual([10, 20, 0, 0, 0, 0, 10, 20, 0, 0, 0, 0, 10, 20]);
  });

  it("has no trailing gap for a single repeat", () => {
    const clip = makeClip(Buffer.from([5, 6]));
    const pcmData = buildBurstPcm(clip, 1, 45);
    expect(pcmData).toEqual(Buffer.from([5, 6]));
  });
});

describe("wrapAsWavFile", () => {
  it("writes a header whose data size matches the PCM payload", () => {
    const clip = makeClip(Buffer.from([1, 2, 3, 4]));
    const wavFile = wrapAsWavFile(clip, clip.pcmData);

    expect(wavFile.readUInt32LE(40)).toBe(4);
    expect(wavFile).toHaveLength(44 + 4);
    expect(wavFile.subarray(44)).toEqual(clip.pcmData);
  });

  it("round-trips through parseWavFile", () => {
    const clip = makeClip(Buffer.from([9, 8, 7, 6]));
    const wavFile = wrapAsWavFile(clip, clip.pcmData);
    const parsed = parseWavFile(wavFile);

    expect(parsed.channels).toBe(clip.channels);
    expect(parsed.sampleRateHz).toBe(clip.sampleRateHz);
    expect(parsed.bitsPerSample).toBe(clip.bitsPerSample);
    expect(parsed.pcmData).toEqual(clip.pcmData);
  });
});
