import { describe, expect, it } from "vitest";
import { buildClipBurst, parseWavFile } from "../src/audio/wavBurst";

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

describe("buildClipBurst", () => {
  it("repeats the clip with silence gaps and a matching data-size header", () => {
    const clip = makeClip(Buffer.from([10, 20]));
    const burst = buildClipBurst(clip, 3, 2); // 2ms gap at 1000Hz -> 2 samples -> 4 bytes per gap

    const dataSize = burst.readUInt32LE(40);
    expect(dataSize).toBe(2 * 3 + 4 * 2); // 3 clips (2 bytes each) + 2 gaps (4 bytes each)
    expect(burst).toHaveLength(44 + dataSize);

    const pcmData = burst.subarray(44);
    expect(Array.from(pcmData)).toEqual([10, 20, 0, 0, 0, 0, 10, 20, 0, 0, 0, 0, 10, 20]);
  });

  it("has no trailing gap for a single repeat", () => {
    const clip = makeClip(Buffer.from([5, 6]));
    const burst = buildClipBurst(clip, 1, 45);
    expect(burst.subarray(44)).toEqual(Buffer.from([5, 6]));
  });
});
