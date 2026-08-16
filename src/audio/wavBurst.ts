const WAV_HEADER_BYTES = 44;

export interface WavClip {
  channels: number;
  sampleRateHz: number;
  bitsPerSample: number;
  pcmData: Buffer;
}

export const parseWavFile = (fileContents: Buffer): WavClip => ({
  channels: fileContents.readUInt16LE(22),
  sampleRateHz: fileContents.readUInt32LE(24),
  bitsPerSample: fileContents.readUInt16LE(34),
  pcmData: fileContents.subarray(WAV_HEADER_BYTES),
});

const buildWavHeader = (clip: Omit<WavClip, "pcmData">, dataLength: number): Buffer => {
  const blockAlign = clip.channels * (clip.bitsPerSample / 8);
  const header = Buffer.alloc(WAV_HEADER_BYTES);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(clip.channels, 22);
  header.writeUInt32LE(clip.sampleRateHz, 24);
  header.writeUInt32LE(clip.sampleRateHz * blockAlign, 28); // byte rate
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(clip.bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
};

// Concatenates `repeatCount` copies of `clip`, each separated by `gapMs` of silence, into a
// single playable WAV buffer -- so a burst of clicks needs exactly one player process, with
// sample-accurate timing instead of relying on the OS to schedule several spawns on time.
export const buildClipBurst = (clip: WavClip, repeatCount: number, gapMs: number): Buffer => {
  const bytesPerSample = clip.channels * (clip.bitsPerSample / 8);
  const gapSampleCount = Math.round((gapMs / 1000) * clip.sampleRateHz);
  const gap = Buffer.alloc(gapSampleCount * bytesPerSample);

  const parts: Buffer[] = [];
  for (let index = 0; index < repeatCount; index += 1) {
    parts.push(clip.pcmData);
    if (index < repeatCount - 1) {
      parts.push(gap);
    }
  }

  const pcmData = Buffer.concat(parts);
  return Buffer.concat([buildWavHeader(clip, pcmData.length), pcmData]);
};
