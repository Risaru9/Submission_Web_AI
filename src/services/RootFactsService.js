import { TONE_CONFIG } from '../utils/config.js';
import { env, pipeline } from '@huggingface/transformers';

const GENERATOR_MODEL = 'Xenova/distilgpt2';

env.useBrowserCache = true;
env.allowLocalModels = false;

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
  }

  // TODO [Basic] Muat model dan inisialisasi pipeline text2text-generation
  // TODO [Advance] Implementasikan strategi Backend Adaptive
  async loadModel() {
    const preferredDevice = navigator.gpu ? 'webgpu' : 'wasm';

    try {
      this.generator = await pipeline('text-generation', GENERATOR_MODEL, {
        dtype: 'q4',
        device: preferredDevice,
      });
      this.currentBackend = preferredDevice === 'webgpu' ? 'WebGPU' : 'WASM';
    } catch (error) {
      if (preferredDevice !== 'webgpu') {
        throw error;
      }

      console.warn('Transformers WebGPU gagal, fallback ke WASM.', error);
      this.generator = await pipeline('text-generation', GENERATOR_MODEL, {
        dtype: 'q4',
        device: 'wasm',
      });
      this.currentBackend = 'WASM';
    }

    this.isModelLoaded = true;
    return this;
  }

  // TODO [Advance] Konfigurasi tone fakta yang dihasilkan
  setTone(tone) {
    const isAvailable = TONE_CONFIG.availableTones.some((item) => item.value === tone);
    this.currentTone = isAvailable ? tone : TONE_CONFIG.defaultTone;
  }

  // TODO [Basic] Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
  // TODO [Skilled] Konfigurasikan parameter generasi berdasarkan kebutuhan
  // TODO [Advance] Implemenasikan parameter tone untuk mengatur nada fakta yang dihasilkan
  async generateFacts(vegetableName) {
    if (!vegetableName) {
      throw new Error('Nama sayuran kosong');
    }

    if (!this.isReady() || this.isGenerating) {
      return this.createFallbackFact(vegetableName);
    }

    this.isGenerating = true;

    try {
      const tone = TONE_CONFIG.availableTones.find((item) => item.value === this.currentTone)
        || TONE_CONFIG.availableTones[0];
      const prompt = [
        `Write one short and unique fun fact about ${vegetableName}.`,
        `Style: ${tone.prompt}.`,
        'Use simple Indonesian language.',
        'Keep it friendly, accurate, and under 55 words.',
        'Fun fact:',
      ].join(' ');

      const output = await this.generator(prompt, {
        max_new_tokens: 90,
        temperature: 0.85,
        top_p: 0.92,
        do_sample: true,
        repetition_penalty: 1.12,
      });
      const rawText = Array.isArray(output) ? output[0]?.generated_text : output?.generated_text;
      const text = String(rawText || '').replace(prompt, '').trim();
      const sentence = text.split(/\n|(?<=\.)\s/).find(Boolean)?.trim();

      return sentence && sentence.length > 24
        ? sentence.slice(0, 320)
        : this.createFallbackFact(vegetableName);
    } finally {
      this.isGenerating = false;
    }
  }

  // TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
  isReady() {
    return Boolean(this.generator && this.isModelLoaded);
  }

  createFallbackFact(vegetableName) {
    return `${vegetableName} punya fakta menarik: sayuran ini sering dipakai di dapur karena warna, tekstur, dan rasanya mudah berpadu dengan banyak masakan.`;
  }
}
