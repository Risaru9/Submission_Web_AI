import { TONE_CONFIG } from '../utils/config.js';
import { env, pipeline } from '@huggingface/transformers';

const GENERATOR_MODEL = 'Xenova/LaMini-Flan-T5-77M';

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
    this.loadPromise = null;
  }

  // TODO [Basic] Muat model dan inisialisasi pipeline text2text-generation
  // TODO [Advance] Implementasikan strategi Backend Adaptive
  async loadModel(onProgress) {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    const preferredDevice = navigator.gpu ? 'webgpu' : 'wasm';

    this.loadPromise = (async () => {
      onProgress?.('Memuat Generative AI... 0%');

      try {
        this.generator = await pipeline('text2text-generation', GENERATOR_MODEL, {
          dtype: 'q4',
          device: preferredDevice,
          progress_callback: (progress) => {
            const percent = progress?.progress
              ? Math.round(progress.progress)
              : null;
            const status = percent
              ? `Memuat Generative AI... ${percent}%`
              : `Memuat Generative AI... ${progress?.status || 'menyiapkan model'}`;

            onProgress?.(status);
          },
        });
        this.currentBackend = preferredDevice === 'webgpu' ? 'WebGPU' : 'WASM';
      } catch (error) {
        if (preferredDevice !== 'webgpu') {
          this.loadPromise = null;
          throw error;
        }

        console.warn('Transformers WebGPU gagal, fallback ke WASM.', error);
        onProgress?.('Memuat Generative AI... fallback WASM');
        this.generator = await pipeline('text2text-generation', GENERATOR_MODEL, {
          dtype: 'q4',
          device: 'wasm',
          progress_callback: (progress) => {
            const percent = progress?.progress
              ? Math.round(progress.progress)
              : null;
            const status = percent
              ? `Memuat Generative AI... ${percent}%`
              : `Memuat Generative AI... ${progress?.status || 'menyiapkan model'}`;

            onProgress?.(status);
          },
        });
        this.currentBackend = 'WASM';
      }

      this.isModelLoaded = true;

      // WARM UP
      try {
        await this.generator('warmup', { max_new_tokens: 1 });
      } catch (e) {
        console.warn('Warmup failed', e);
      }

      onProgress?.(`Generative AI siap (${this.currentBackend})`);
      return this;
    })();

    return this.loadPromise;
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

    if (!this.isReady()) {
      await this.loadModel();
    }

    if (this.isGenerating) {
      throw new Error('Generative AI sedang memproses permintaan sebelumnya');
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
      const text = String(rawText || '').trim();

      if (!text || text.length < 5) {
        throw new Error('Output Generative AI tidak valid');
      }

      return text.slice(0, 320);
    } finally {
      this.isGenerating = false;
    }
  }

  // TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
  isReady() {
    return Boolean(this.generator && this.isModelLoaded);
  }

}
