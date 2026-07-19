import { TONE_CONFIG } from './config.js';

export const PERSONAS = TONE_CONFIG.availableTones.map((tone) => ({
  id: tone.value,
  name: tone.label,
  prompt: tone.prompt,
}));
