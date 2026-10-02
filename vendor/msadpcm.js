/* Native Microsoft ADPCM WAVE decoder. No resampling or lossy intermediate.
 * Format coefficients come from fmt; smpl loop positions stay in source frames.
 * Arithmetic checked against FFmpeg libavcodec/adpcm.c and real EG2 banks.
 */
const ADAPT = [230, 230, 230, 230, 307, 409, 512, 614, 768, 614, 512, 409, 307, 230, 230, 230];

export function decodeMSADPCM(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const text = (p, n) => String.fromCharCode(...new Uint8Array(arrayBuffer, p, n));
  const fail = (message) => { throw new Error(`MS ADPCM: ${message}`); };
  if (view.byteLength < 12 || text(0, 4) !== 'RIFF' || text(8, 4) !== 'WAVE') fail('expected RIFF/WAVE');
  if (view.getUint32(4, true) + 8 !== view.byteLength) fail('RIFF size mismatch');
  let format, data, fact = null;
  const loops = [];
  for (let p = 12; p < view.byteLength;) {
    if (p + 8 > view.byteLength) fail('truncated chunk header');
    const tag = text(p, 4), size = view.getUint32(p + 4, true), q = p + 8;
    if (q + size > view.byteLength) fail('truncated chunk');
    if (tag === 'fmt ') {
      if (size < 22 || view.getUint16(q, true) !== 2) fail('expected Microsoft ADPCM fmt');
      const count = view.getUint16(q + 20, true), coefficients = [];
      if (!count || 22 + count * 4 > size) fail('invalid coefficient table');
      for (let i = 0; i < count; i++) coefficients.push([view.getInt16(q + 22 + i * 4, true), view.getInt16(q + 24 + i * 4, true)]);
      format = { channelCount: view.getUint16(q + 2, true), sampleRate: view.getUint32(q + 4, true),
        blockAlign: view.getUint16(q + 12, true), bits: view.getUint16(q + 14, true),
        samplesPerBlock: view.getUint16(q + 18, true), coefficients };
    } else if (tag === 'data') {
      if (data) fail('multiple data chunks');
      data = { offset: q, size };
    } else if (tag === 'fact' && size >= 4) fact = view.getUint32(q, true);
    else if (tag === 'smpl') {
      if (size < 36) fail('truncated smpl');
      const count = view.getUint32(q + 28, true);
      if (36 + count * 24 > size) fail('truncated smpl loops');
      for (let i = 0; i < count; i++) {
        const s = q + 36 + i * 24;
        loops.push({ identifier: view.getUint32(s, true), type: view.getUint32(s + 4, true),
          startSample: view.getUint32(s + 8, true), endSampleInclusive: view.getUint32(s + 12, true),
          fraction: view.getUint32(s + 16, true), playCount: view.getUint32(s + 20, true) });
      }
    }
    p = q + size + (size & 1);
    if (p > view.byteLength) fail('missing chunk padding');
  }
  if (!format || !data) fail('missing fmt/data');
  const {channelCount: count, sampleRate, blockAlign, samplesPerBlock, coefficients, bits} = format;
  if (![1, 2].includes(count) || !sampleRate || bits !== 4 || blockAlign < 7 * count) fail('unsupported format');
  const fullFrames = 2 + (blockAlign - 7 * count) * 2 / count;
  if (samplesPerBlock !== fullFrames || !Number.isInteger(fullFrames)) fail('inconsistent samples per block');
  const blocks = Math.floor(data.size / blockAlign), remainder = data.size % blockAlign;
  if (remainder && remainder < 7 * count) fail('truncated last block header');
  const available = blocks * fullFrames + (remainder ? 2 + Math.floor((remainder - 7 * count) * 2 / count) : 0);
  if (fact !== null && fact > available) fail('fact exceeds encoded samples');
  const frames = fact === null ? available : fact;
  const channels = Array.from({length: count}, () => new Float32Array(frames));
  let frame = 0;
  for (let block = data.offset; block < data.offset + data.size; block += blockAlign) {
    const end = Math.min(block + blockAlign, data.offset + data.size);
    const state = [];
    for (let c = 0; c < count; c++) {
      const predictor = view.getUint8(block + c);
      if (!coefficients[predictor]) fail('predictor out of range');
      state.push({ coef: coefficients[predictor], delta: view.getInt16(block + count + 2 * c, true),
        s1: view.getInt16(block + 3 * count + 2 * c, true), s2: view.getInt16(block + 5 * count + 2 * c, true) });
      if (state[c].delta < 0) fail('negative initial delta');
      if (frame < frames) channels[c][frame] = state[c].s2 / 32768;
      if (frame + 1 < frames) channels[c][frame + 1] = state[c].s1 / 32768;
    }
    frame += 2;
    const expand = (c, nibble) => {
      const s = state[c];
      const prediction = Math.trunc((s.s1 * s.coef[0] + s.s2 * s.coef[1]) / 256);
      const sample = Math.max(-32768, Math.min(32767, prediction + (nibble >= 8 ? nibble - 16 : nibble) * s.delta));
      s.s2 = s.s1; s.s1 = sample;
      s.delta = Math.min(Math.floor(2147483647 / 768), Math.max(16, Math.floor(ADAPT[nibble] * s.delta / 256)));
      if (frame < frames) channels[c][frame] = sample / 32768;
    };
    for (let p = block + 7 * count; p < end; p++) {
      const byte = view.getUint8(p);
      expand(0, byte >> 4);
      if (count === 1) frame++;
      expand(count - 1, byte & 15);
      frame++;
    }
  }
  return {channels, sampleRate, loops, frames};
}
