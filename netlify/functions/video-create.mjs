const MODEL_ENDPOINT = 'https://api.replicate.com/v1/models/wan-video/wan-2.2-5b-fast/predictions';
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export default async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Allow': 'POST, OPTIONS' } });
  if (request.method !== 'POST') return json({ error: 'Gunakan metode POST.' }, 405);
  const accessCode = process.env.KARYAAI_ACCESS_CODE;
  if (!accessCode) return json({ error: 'Backend belum diamankan. Tambahkan KARYAAI_ACCESS_CODE di Netlify lalu deploy ulang.' }, 503);
  if (request.headers.get('x-karyaai-access-code') !== accessCode) return json({ error: 'Kode akses salah. Periksa kode akses aplikasi.' }, 401);
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return json({ error: 'Backend belum dikonfigurasi. Tambahkan REPLICATE_API_TOKEN di Site configuration → Environment variables pada Netlify, lalu deploy ulang.' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Body harus berupa JSON yang valid.' }, 400); }
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const duration = Number(body.duration);
  const style = body.style;
  const aspectRatio = body.aspectRatio;
  if (!prompt) return json({ error: 'Prompt wajib diisi.' }, 400);
  if (prompt.length > 3500) return json({ error: 'Prompt maksimal 3.500 karakter.' }, 413);
  const image = body.image;
  if (image !== undefined && image !== null && image !== '') {
    if (typeof image !== 'string' || image.length > 350000 || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) {
      return json({ error: 'Gambar referensi harus berupa JPEG/PNG/WEBP terkompresi dengan data URL maksimal sekitar 250 KB.' }, 400);
    }
  }
  if (!Number.isInteger(duration) || duration < 5 || duration > 24) return json({ error: 'Durasi yang didukung model ini adalah 5–24 detik per klip.' }, 400);
  if (!['realistic', '3d'].includes(style)) return json({ error: 'Pilih gaya realistic atau 3d.' }, 400);
  if (!['16:9', '9:16'].includes(aspectRatio)) return json({ error: 'Rasio yang didukung adalah 16:9 atau 9:16.' }, 400);

  const stylePrompt = style === '3d'
    ? 'Stylized high-quality 3D animated film, expressive character animation, physically based materials, cinematic global illumination, polished 3D rendering.'
    : 'Photorealistic live-action cinematic footage, natural skin and material detail, realistic physics, authentic lighting, natural camera movement.';
  // Wan 2.2's public schema supports 81–121 frames and 5–30 FPS.
  // Adjust FPS to approximate the requested duration without claiming exact timing.
  const numFrames = 121;
  const fps = Math.max(5, Math.min(24, Math.round(numFrames / duration)));
  const input = {
    ...(image ? { image } : {}),
    prompt: `${image ? 'Use the provided reference image as the starting frame. Preserve the same character identity, face, hairstyle, skin tone, clothing, and distinctive props throughout the clip. ' : ''}${prompt}\n\nVisual style: ${stylePrompt}\nHigh visual quality, coherent motion, stable scene composition. No captions, logos, or watermarks.` ,
    go_fast: true,
    num_frames: numFrames,
    resolution: '480p',
    aspect_ratio: aspectRatio,
    frames_per_second: fps,
    optimize_prompt: false,
    disable_safety_checker: false,
  };

  try {
    const upstream = await fetch(MODEL_ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'wait=1' },
      body: JSON.stringify({ input }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const detail = typeof result.detail === 'string' ? result.detail : typeof result.error === 'string' ? result.error : '';
      const message = upstream.status === 401 || upstream.status === 403
        ? 'Token Replicate tidak valid atau tidak memiliki akses. Periksa REPLICATE_API_TOKEN.'
        : upstream.status === 402 ? 'Saldo/kredit Replicate tidak cukup. Periksa billing dan batas penggunaan akun.'
        : upstream.status === 429 ? 'Layanan sedang padat atau batas permintaan tercapai. Tunggu lalu coba lagi.'
        : `Penyedia video menolak permintaan (HTTP ${upstream.status}).`;
      return json({ error: detail ? `${message} ${detail.slice(0, 220)}` : message }, upstream.status === 429 ? 429 : 502);
    }
    if (!result.id) return json({ error: 'Penyedia tidak mengembalikan ID pekerjaan. Silakan coba lagi.' }, 502);
    return json({ id: result.id, status: result.status || 'starting', requestedDuration: duration, estimatedDurationSeconds: Math.round((numFrames / fps) * 10) / 10 });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return json({ error: timeout ? 'Penyedia terlalu lama merespons saat menerima permintaan. Coba lagi.' : 'Tidak dapat menghubungi penyedia video. Periksa koneksi dan coba lagi.' }, 502);
  }
};
