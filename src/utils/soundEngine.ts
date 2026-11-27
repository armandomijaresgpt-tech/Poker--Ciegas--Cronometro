import { SoundEvent, SoundProfile } from '../types/poker';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignore audio unlock errors
  }
}

interface ToneOptions {
  freq: number;
  startTime: number;
  duration: number;
  type: OscillatorType;
  gainPeak: number;
  endFreq?: number;
}

function scheduleTone(ctx: AudioContext, masterGain: GainNode, opts: ToneOptions): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.freq, opts.startTime);
  if (opts.endFreq) {
    osc.frequency.exponentialRampToValueAtTime(opts.endFreq, opts.startTime + opts.duration);
  }

  gain.gain.setValueAtTime(0.0001, opts.startTime);
  gain.gain.linearRampToValueAtTime(opts.gainPeak, opts.startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, opts.startTime + opts.duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(opts.startTime);
  osc.stop(opts.startTime + opts.duration + 0.03);
}

export function playSoundEvent(
  event: SoundEvent,
  options: { volume?: number; profile?: SoundProfile; enabled?: boolean } = {}
): void {
  const { volume = 0.85, profile = 'casino', enabled = true } = options;
  if (!enabled || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), now);
  master.connect(ctx.destination);

  const primaryOsc: OscillatorType =
    profile === 'casino' ? 'triangle' : profile === 'modern' ? 'sine' : 'square';
  const harmonicOsc: OscillatorType =
    profile === 'casino' ? 'sine' : profile === 'modern' ? 'triangle' : 'sawtooth';
  const gainScale = profile === 'classic' ? 0.35 : 0.6;

  switch (event) {
    case 'level_start': {
      scheduleTone(ctx, master, {
        freq: 523.25,
        startTime: now,
        duration: 0.28,
        type: primaryOsc,
        gainPeak: 0.55 * gainScale,
      });
      scheduleTone(ctx, master, {
        freq: 783.99,
        startTime: now + 0.16,
        duration: 0.45,
        type: primaryOsc,
        gainPeak: 0.65 * gainScale,
      });
      scheduleTone(ctx, master, {
        freq: 1567.98,
        startTime: now + 0.16,
        duration: 0.3,
        type: 'sine',
        gainPeak: 0.2 * gainScale,
      });
      break;
    }

    case 'blinds_up': {
      scheduleTone(ctx, master, {
        freq: 196,
        endFreq: 98,
        startTime: now,
        duration: 0.25,
        type: 'sine',
        gainPeak: 0.55,
      });
      const notes = [587.33, 739.99, 880, 1174.66];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.11;
        const dur = idx === notes.length - 1 ? 0.65 : 0.22;
        scheduleTone(ctx, master, {
          freq,
          startTime: t,
          duration: dur,
          type: primaryOsc,
          gainPeak: (idx === notes.length - 1 ? 0.8 : 0.55) * gainScale,
        });
        scheduleTone(ctx, master, {
          freq: freq * 2,
          startTime: t,
          duration: dur * 0.7,
          type: harmonicOsc,
          gainPeak: 0.18 * gainScale,
        });
      });
      break;
    }

    case 'warning_1m': {
      [0, 0.18].forEach((offset) => {
        scheduleTone(ctx, master, {
          freq: 659.25,
          endFreq: 620,
          startTime: now + offset,
          duration: 0.14,
          type: 'triangle',
          gainPeak: 0.5 * gainScale,
        });
        scheduleTone(ctx, master, {
          freq: 1318.5,
          startTime: now + offset,
          duration: 0.08,
          type: 'sine',
          gainPeak: 0.22 * gainScale,
        });
      });
      break;
    }

    case 'countdown_tick': {
      scheduleTone(ctx, master, {
        freq: 880,
        endFreq: 660,
        startTime: now,
        duration: 0.055,
        type: 'triangle',
        gainPeak: 0.32 * gainScale,
      });
      break;
    }

    case 'countdown_final': {
      scheduleTone(ctx, master, {
        freq: 1174.66,
        endFreq: 987.77,
        startTime: now,
        duration: 0.09,
        type: primaryOsc,
        gainPeak: 0.5 * gainScale,
      });
      break;
    }

    case 'break_start': {
      const notes = [783.99, 659.25, 523.25];
      notes.forEach((freq, idx) => {
        scheduleTone(ctx, master, {
          freq,
          startTime: now + idx * 0.18,
          duration: 0.65,
          type: 'sine',
          gainPeak: 0.5 * gainScale,
        });
      });
      break;
    }

    case 'break_end': {
      [0, 0.24].forEach((offset) => {
        scheduleTone(ctx, master, {
          freq: 880,
          startTime: now + offset,
          duration: 0.18,
          type: primaryOsc,
          gainPeak: 0.65 * gainScale,
        });
        scheduleTone(ctx, master, {
          freq: 1318.51,
          startTime: now + offset + 0.06,
          duration: 0.25,
          type: 'sine',
          gainPeak: 0.4 * gainScale,
        });
      });
      break;
    }

    case 'shot_clock_tick': {
      // Distinct crisp wood/radar blip for final 5s of Call the Clock
      scheduleTone(ctx, master, {
        freq: 1320,
        endFreq: 1046.5,
        startTime: now,
        duration: 0.065,
        type: 'sine',
        gainPeak: 0.45 * gainScale,
      });
      break;
    }

    case 'shot_clock_end': {
      // Unmistakable double buzzer when Call the Clock time expires
      [0, 0.2].forEach((offset) => {
        scheduleTone(ctx, master, {
          freq: 220,
          endFreq: 185,
          startTime: now + offset,
          duration: 0.18,
          type: 'sawtooth',
          gainPeak: 0.4 * gainScale,
        });
        scheduleTone(ctx, master, {
          freq: 440,
          endFreq: 370,
          startTime: now + offset,
          duration: 0.18,
          type: 'triangle',
          gainPeak: 0.45 * gainScale,
        });
      });
      break;
    }

    case 'ui_click': {
      scheduleTone(ctx, master, {
        freq: 420,
        endFreq: 280,
        startTime: now,
        duration: 0.03,
        type: 'sine',
        gainPeak: 0.18,
      });
      break;
    }
  }
}

export function triggerVibration(pattern: number | number[], enabled = true): void {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore vibration errors
  }
}
