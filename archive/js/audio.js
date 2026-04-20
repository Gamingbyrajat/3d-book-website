// js/audio.js
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let noiseSource;
let gainNode;
let filterNode;

// Generate White Noise Buffer
function createNoiseBuffer(ctx) {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    // basic white noise
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

function initAudio() {
    if (audioCtx) return;
    
    audioCtx = new AudioContext();
    
    // Create nodes
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(audioCtx);
    noiseSource.loop = true;
    
    // Bandpass filter to sculpt noise into a 'paper rustle' or 'friction' sound
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.value = 800; // Centered around 800Hz
    filterNode.Q.value = 0.5;
    
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0; // start silent
    
    // Connect up
    noiseSource.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseSource.start();
    
    console.log("Audio Initialized");
}

// Browsers require a gesture to start audio
document.addEventListener('click', () => {
    initAudio();
    const overlay = document.querySelector('.status-overlay');
    if(overlay) overlay.style.display = 'none';
}, { once: true });
document.addEventListener('touchstart', () => {
    initAudio();
    const overlay = document.querySelector('.status-overlay');
    if(overlay) overlay.style.display = 'none';
}, { once: true });
document.addEventListener('wheel', () => {
    // If not initialized yet, clicking is best, but sometimes wheel works if user interacted
    if(audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});

window.addEventListener('bookScrollVelocity', (e) => {
    if (!audioCtx || audioCtx.state !== 'running') return;
    
    const velocity = e.detail.velocity; // Typically 0 to ~10 px/ms depending on wheel
    
    // Map velocity to gain (max 0.3 to not blow out ears)
    let targetGain = Math.min(0.3, velocity * 0.05); 
    
    // Map velocity to filter frequency (to simulate higher friction tone)
    let targetFreq = 800 + Math.min(1000, velocity * 100);
    
    // Use exponential approach so it doesn't crackle
    const now = audioCtx.currentTime;
    gainNode.gain.setTargetAtTime(targetGain, now, 0.05);
    filterNode.frequency.setTargetAtTime(targetFreq, now, 0.05);
    
    // Auto zero out if scrolling stopps
    if (velocity === 0) {
        gainNode.gain.setTargetAtTime(0, now, 0.1);
    }
});
