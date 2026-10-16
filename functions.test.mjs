import test from 'node:test';
import assert from 'node:assert/strict';
import createHandler from '../netlify/functions/video-create.mjs';
import statusHandler from '../netlify/functions/video-status.mjs';

const request = (url, method = 'GET', body) => new Request(url, {
  method,
  headers: body === undefined ? {} : { 'content-type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test('video-create rejects empty prompt before provider call', async () => {
  process.env.REPLICATE_API_TOKEN = 'test-token';
  process.env.KARYAAI_ACCESS_CODE = 'test-code';
  const req = request('https://example.net/.netlify/functions/video-create', 'POST', { prompt: ' ' , duration: 5, style: 'realistic', aspectRatio: '16:9' });
  const response = await createHandler(new Request(req, { headers: { 'content-type': 'application/json', 'x-karyaai-access-code': 'test-code' } }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /wajib diisi/);
});

test('video-create validates duration model limits', async () => {
  process.env.REPLICATE_API_TOKEN = 'test-token';
  process.env.KARYAAI_ACCESS_CODE = 'test-code';
  const req = request('https://example.net/.netlify/functions/video-create', 'POST', { prompt: 'test prompt', duration: 30, style: '3d', aspectRatio: '16:9' });
  const response = await createHandler(new Request(req, { headers: { 'content-type': 'application/json', 'x-karyaai-access-code': 'test-code' } }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /5–24/);
});

test('video-create sends a valid async request and returns job ID', async () => {
  process.env.REPLICATE_API_TOKEN = 'test-token';
  process.env.KARYAAI_ACCESS_CODE = 'test-code';
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, init) => {
    sent = { url: String(url), init, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ id: 'pred_12345678', status: 'starting' }), { status: 201, headers: { 'content-type': 'application/json' } });
  };
  try {
    const reference = 'data:image/jpeg;base64,YWJj';
    const req = request('https://example.net/.netlify/functions/video-create', 'POST', { prompt: 'A red fox in a forest', duration: 10, style: '3d', aspectRatio: '9:16', image: reference });
  const response = await createHandler(new Request(req, { headers: { 'content-type': 'application/json', 'x-karyaai-access-code': 'test-code' } }));
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.id, 'pred_12345678');
    assert.match(sent.url, /wan-video\/wan-2\.2-5b-fast\/predictions/);
    assert.equal(sent.init.headers.Authorization, 'Bearer test-token');
    assert.equal(sent.body.input.aspect_ratio, '9:16');
    assert.match(sent.body.input.prompt, /3D animated film/);
    assert.equal(sent.body.input.num_frames, 121);
    assert.equal(sent.body.input.image, reference);
    assert.match(sent.body.input.prompt, /provided reference image as the starting frame/);
  } finally { globalThis.fetch = originalFetch; }
});


test('video-create rejects oversized or invalid reference images', async () => {
  process.env.REPLICATE_API_TOKEN = 'test-token';
  process.env.KARYAAI_ACCESS_CODE = 'test-code';
  const invalidImage = 'https://example.com/not-a-data-uri.jpg';
  const req = request('https://example.net/.netlify/functions/video-create', 'POST', { prompt: 'test', duration: 5, style: 'realistic', aspectRatio: '16:9', image: invalidImage });
  const response = await createHandler(new Request(req, { headers: { 'content-type': 'application/json', 'x-karyaai-access-code': 'test-code' } }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Gambar referensi/);
});

test('video-create gives actionable message when secret is missing', async () => {
  process.env.KARYAAI_ACCESS_CODE = 'test-code';
  delete process.env.REPLICATE_API_TOKEN;
  const req = request('https://example.net/.netlify/functions/video-create', 'POST', { prompt: 'test', duration: 5, style: 'realistic', aspectRatio: '16:9' });
  const response = await createHandler(new Request(req, { headers: { 'content-type': 'application/json', 'x-karyaai-access-code': 'test-code' } }));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /REPLICATE_API_TOKEN/);
});

test('video-status rejects malformed ID and returns sanitized status', async () => {
  process.env.REPLICATE_API_TOKEN = 'test-token';
  process.env.KARYAAI_ACCESS_CODE = 'test-code';
  process.env.KARYAAI_ACCESS_CODE = 'test-code';
  const bad = await statusHandler(new Request('https://example.net/.netlify/functions/video-status?id=https://evil.example', { headers: { 'x-karyaai-access-code': 'test-code' } }));
  assert.equal(bad.status, 400);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /api\.replicate\.com\/v1\/predictions\/pred_12345678/);
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    return new Response(JSON.stringify({ id: 'pred_12345678', status: 'succeeded', output: 'https://replicate.delivery/video.mp4', logs: 'done' }), { status: 200 });
  };
  try {
    const response = await statusHandler(new Request('https://example.net/.netlify/functions/video-status?id=pred_12345678', { headers: { 'x-karyaai-access-code': 'test-code' } }));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.status, 'succeeded');
    assert.equal(data.output, 'https://replicate.delivery/video.mp4');
  } finally { globalThis.fetch = originalFetch; }
});

test('video-create rejects unsupported aspect ratio instead of showing a false option', async () => {
  process.env.REPLICATE_API_TOKEN = 'test-token';
  process.env.KARYAAI_ACCESS_CODE = 'test-code';
  const req = request('https://example.net/.netlify/functions/video-create', 'POST', { prompt: 'test', duration: 5, style: 'realistic', aspectRatio: '1:1' });
  const response = await createHandler(new Request(req, { headers: { 'content-type': 'application/json', 'x-karyaai-access-code': 'test-code' } }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /16:9 atau 9:16/);
});
