let audioCtx: AudioContext | null = null;
let raceInterval: NodeJS.Timeout | null = null;
let raceOsc: OscillatorNode | null = null;
let raceGain: GainNode | null = null;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playSound = (type: 'win' | 'tick' | 'quack' | 'shuffle' | 'pop' | 'fail') => {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
      osc.start(now);
      osc.stop(now + 1);
    } else if (type === 'tick') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'quack') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'shuffle') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.error("Audio not supported or blocked", e);
  }
};

export const startRaceMusic = () => {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    
    stopRaceMusic();
    
    raceInterval = setInterval(() => {
      playSound('quack');
    }, 600);
    
    raceOsc = ctx.createOscillator();
    raceGain = ctx.createGain();
    raceOsc.type = 'triangle';
    raceOsc.frequency.setValueAtTime(150, ctx.currentTime);
    
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(10, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(raceOsc.frequency);
    lfo.start();
    
    raceGain.gain.setValueAtTime(0.05, ctx.currentTime);
    raceOsc.connect(raceGain);
    raceGain.connect(ctx.destination);
    raceOsc.start();
  } catch (e) {}
};

export const stopRaceMusic = () => {
  if (raceInterval) {
    clearInterval(raceInterval);
    raceInterval = null;
  }
  if (raceOsc && raceGain) {
    try {
      const ctx = getCtx();
      if (ctx) {
        raceGain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        raceOsc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {}
    raceOsc = null;
    raceGain = null;
  }
};
