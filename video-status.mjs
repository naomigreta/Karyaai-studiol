const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export default async (request) => {
  if (request.method !== 'GET') return json({ error: 'Gunakan metode GET.' }, 405);
  const accessCode = process.env.KARYAAI_ACCESS_CODE;
  if (!accessCode) return json({ error: 'Backend belum diamankan. Tambahkan KARYAAI_ACCESS_CODE di Netlify lalu deploy ulang.' }, 503);
  if (request.headers.get('x-karyaai-access-code') !== accessCode) return json({ error: 'Kode akses salah.' }, 401);
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return json({ error: 'Backend belum dikonfigurasi. Tambahkan REPLICATE_API_TOKEN di Netlify lalu deploy ulang.' }, 503);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return json({ error: 'ID pekerjaan tidak valid.' }, 400);
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(id)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = response.status === 404 ? 'Pekerjaan tidak ditemukan atau tautan status sudah tidak tersedia.'
        : response.status === 429 ? 'Batas pemeriksaan status tercapai. Tunggu sebentar.'
        : 'Tidak bisa membaca status dari penyedia video.';
      return json({ error: message }, response.status === 429 ? 429 : 502);
    }
    return json({
      id: result.id,
      status: result.status,
      output: result.output ?? null,
      error: result.error ? String(result.error).slice(0, 300) : null,
      logs: result.logs ? String(result.logs).slice(-240) : '',
      startedAt: result.started_at ?? null,
      completedAt: result.completed_at ?? null,
    });
  } catch {
    return json({ error: 'Jaringan gagal saat memeriksa status. Coba lagi.' }, 502);
  }
};
