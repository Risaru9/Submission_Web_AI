import { env, pipeline } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/distilgpt2';

let generatorPromise;

env.useBrowserCache = true;
env.allowLocalModels = false;

async function createGenerator(onProgress) {
  const device = navigator.gpu ? 'webgpu' : 'wasm';

  try {
    return await pipeline('text-generation', MODEL_ID, {
      dtype: 'q4',
      device,
      progress_callback: onProgress
    });
  } catch (error) {
    if (device !== 'webgpu') {
      throw error;
    }

    console.warn('Transformers WebGPU gagal, fallback ke WASM.', error);
    return pipeline('text-generation', MODEL_ID, {
      dtype: 'q4',
      device: 'wasm',
      progress_callback: onProgress
    });
  }
}

function getGenerator(onProgress) {
  if (!generatorPromise) {
    generatorPromise = createGenerator(onProgress);
  }

  return generatorPromise;
}

function buildPrompt(label, persona) {
  return [
    `Write one short and unique fun fact about ${label}.`,
    `Style: ${persona.prompt}.`,
    'Use simple Indonesian language.',
    'Keep it friendly, accurate, and under 55 words.',
    'Fun fact:'
  ].join(' ');
}

function cleanGeneratedText(output, prompt, label) {
  const rawText = Array.isArray(output) ? output[0]?.generated_text : output?.generated_text;
  const generated = String(rawText ?? '').replace(prompt, '').trim();
  const firstSentence = generated.split(/\n|(?<=\.)\s/).find(Boolean)?.trim();

  if (!firstSentence || firstSentence.length < 24) {
    return `${label} menyimpan fakta seru: sayuran ini punya karakter rasa dan tekstur yang membuatnya mudah diolah dalam banyak masakan sehari-hari.`;
  }

  return firstSentence.slice(0, 320);
}

export async function generateVegetableFact(label, persona, onProgress) {
  const generator = await getGenerator(onProgress);
  const prompt = buildPrompt(label, persona);
  const output = await generator(prompt, {
    max_new_tokens: 90,
    temperature: 0.85,
    top_p: 0.92,
    do_sample: true,
    repetition_penalty: 1.12
  });

  return cleanGeneratedText(output, prompt, label);
}
