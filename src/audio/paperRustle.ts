const AudioCtx =
  window.AudioContext ||
  (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let initialized = false;

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const size = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function initAudio() {
  if (initialized) return;
  if (!AudioCtx) return;
  initialized = true;

  audioCtx = new AudioCtx();

  const source = audioCtx.createBufferSource();
  source.buffer = createNoiseBuffer(audioCtx);
  source.loop = true;

  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'bandpass';
  filterNode.frequency.value = 800;
  filterNode.Q.value = 0.5;

  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;

  source.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start();
}

export function updatePaperRustle(velocity: number) {
  if (!audioCtx || !gainNode || !filterNode || audioCtx.state !== 'running') return;

  const targetGain = Math.min(0.25, velocity * 5);
  const targetFreq = 800 + Math.min(1200, velocity * 8000);

  const now = audioCtx.currentTime;
  gainNode.gain.setTargetAtTime(targetGain, now, 0.05);
  filterNode.frequency.setTargetAtTime(targetFreq, now, 0.05);

  if (velocity < 0.0001) {
    gainNode.gain.setTargetAtTime(0, now, 0.1);
  }
}

export function resumeAudio() {
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
}
