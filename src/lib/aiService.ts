import type { BreedRecognitionResult, TopPrediction } from '@/types';

/**
 * PashuVision AI — Modular breed recognition service.
 *
 * This module mirrors the `predict_breed(image)` contract from the problem
 * statement (SIH25004). The current implementation is a deterministic
 * placeholder that produces realistic-looking predictions. It is designed to
 * be replaced by a real PyTorch / YOLO inference backend WITHOUT touching the
 * frontend — any replacement only needs to return a `BreedRecognitionResult`.
 *
 * Future integration points:
 *  - Swap `predictBreed` to call an Edge Function that runs the real model.
 *  - Add Grad-CAM heatmap generation in `generateHeatmap`.
 */

const CATTLE_BREEDS = [
  'Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar', 'Kankrej', 'Ongole',
  'Hariana', 'Deoni', 'Krishna Valley', 'Amritmahal', 'Hallikar',
  'Kangayam', 'Bargur', 'Malvi', 'Rathi', 'Nagori', 'Vechur', 'Dangi',
  'Bachaur', 'Gangatiri', 'Badri', 'Red Kandhari',
];

const BUFFALO_BREEDS = [
  'Murrah', 'Mehsana', 'Jaffarabadi', 'Surti', 'Bhadawari',
  'Nili-Ravi', 'Nagpuri', 'Pandharpuri', 'Toda', 'Chilika',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function softmaxBiased(seed: number, count: number): number[] {
  const raw = Array.from({ length: count }, (_, i) => {
    return Math.exp(-((seed % (i * 7 + 3)) % 11) * 0.45);
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((r) => (r / sum) * 100);
}

function pickBreeds(seed: number, pool: string[], count: number): string[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed * (i + 7)) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Predict the breed of an Indian cattle or buffalo from an image.
 * Replace this function body with a call to the real inference service.
 */
export async function predictBreed(imageDataUrl: string): Promise<BreedRecognitionResult> {
  const start = performance.now();

  // Simulate model inference latency (600-1400ms)
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));

  const seed = hashString(imageDataUrl.slice(0, 512) || String(imageDataUrl.length));
  const isBuffalo = (seed % 3) === 0;
  const pool = isBuffalo ? BUFFALO_BREEDS : CATTLE_BREEDS;
  const species = isBuffalo ? 'buffalo' : 'cattle';

  const breeds = pickBreeds(seed, pool, 3);
  const confidences = softmaxBiased(seed, 3);
  const sorted = breeds
    .map((breed, i) => ({ breed, confidence: confidences[i] }))
    .sort((a, b) => b.confidence - a.confidence);

  // Normalize top-3 to sum ~100
  const total = sorted.reduce((a, b) => a + b.confidence, 0);
  const top_predictions: TopPrediction[] = sorted.map((s) => ({
    breed: s.breed,
    confidence: Math.round((s.confidence / total) * 1000) / 10,
  }));

  const inference_ms = Math.round(performance.now() - start);

  return {
    breed: top_predictions[0].breed,
    confidence: top_predictions[0].confidence,
    top_predictions,
    species,
    inference_ms,
  };
}

/**
 * Generate a Grad-CAM-style heatmap placeholder overlay.
 * Returns a data URL of a radial gradient that can be layered over the image.
 * Replace with real Grad-CAM output from the model backend.
 */
export function generateHeatmapPlaceholder(): string {
  const size = 256;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="heat" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stop-color="rgba(239,68,68,0.75)"/>
        <stop offset="30%" stop-color="rgba(245,158,11,0.55)"/>
        <stop offset="60%" stop-color="rgba(34,197,94,0.3)"/>
        <stop offset="100%" stop-color="rgba(14,165,233,0.05)"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#heat)"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
