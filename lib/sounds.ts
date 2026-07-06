/**
 * Notification sounds for new orders.
 * Each sound is generated via Web Audio API — no audio files needed.
 */

export type SoundType = "chime" | "bell" | "cash" | "ding";

export const SOUND_OPTIONS: Array<{ key: SoundType; label: string; emoji: string }> = [
  { key: "chime", label: "Chime", emoji: "🔔" },
  { key: "bell", label: "Campana", emoji: "🛎️" },
  { key: "cash", label: "Caja", emoji: "💰" },
  { key: "ding", label: "Ding", emoji: "✨" },
];

const STORAGE_KEY = "tak_admin_notification_sound";

export function getSavedSound(): SoundType {
  if (typeof window === "undefined") return "chime";
  return (localStorage.getItem(STORAGE_KEY) as SoundType) || "chime";
}

export function saveSound(sound: SoundType) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, sound);
  }
}

/** Play the notification sound. Returns early silently if AudioContext is unavailable. */
export function playSound(type: SoundType = getSavedSound()) {
  try {
    const ctx = new AudioContext();

    switch (type) {
      case "chime":
        playChime(ctx);
        break;
      case "bell":
        playBell(ctx);
        break;
      case "cash":
        playCash(ctx);
        break;
      case "ding":
        playDing(ctx);
        break;
      default:
        playChime(ctx);
    }
  } catch {
    // AudioContext not available — fail silently
  }
}

// ── Chime: two-tone ascending (original sound, refined) ──────────────────
function playChime(ctx: AudioContext) {
  const t = ctx.currentTime;

  // Note 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, t);
  gain1.gain.setValueAtTime(0.25, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc1.start(t);
  osc1.stop(t + 0.3);

  // Note 2 (a fifth above)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1320, t + 0.15);
  gain2.gain.setValueAtTime(0, t);
  gain2.gain.setValueAtTime(0.2, t + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc2.start(t + 0.15);
  osc2.stop(t + 0.5);
}

// ── Bell: metallic ring with harmonics ───────────────────────────────────
function playBell(ctx: AudioContext) {
  const t = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.18 - i * 0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t);
    osc.stop(t + 0.8);
  });
}

// ── Cash: rapid "ka-ching" — two short bursts ────────────────────────────
function playCash(ctx: AudioContext) {
  const t = ctx.currentTime;

  // Click
  const noise = ctx.createOscillator();
  const nGain = ctx.createGain();
  noise.connect(nGain);
  nGain.connect(ctx.destination);
  noise.type = "square";
  noise.frequency.setValueAtTime(2000, t);
  noise.frequency.setValueAtTime(4000, t + 0.02);
  nGain.gain.setValueAtTime(0.15, t);
  nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  noise.start(t);
  noise.stop(t + 0.06);

  // Ring
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1567.98, t + 0.06); // G6
  osc.frequency.setValueAtTime(2093.0, t + 0.12); // C7
  gain.gain.setValueAtTime(0, t);
  gain.gain.setValueAtTime(0.22, t + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.start(t + 0.06);
  osc.stop(t + 0.5);
}

// ── Ding: single clean tone with gentle decay ────────────────────────────
function playDing(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1046.5, t); // C6
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc.start(t);
  osc.stop(t + 0.6);
}
