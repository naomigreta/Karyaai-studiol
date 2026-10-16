import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../site/sw.js', import.meta.url), 'utf8');

test('UI includes integrated generator, styles, duration and MP4 controls', () => {
  for (const id of ['accessCode','videoPromptPreview','videoStyle','videoDuration','videoRatio','costConsent','createVideo','resumeJob','videoStatus','resultPlayer','downloadVideo','seriesName','episodeNumber','characterName','characterDescription','characterOutfit','referenceImage','referencePreview']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /\.netlify\/functions\/video-create/);
  assert.match(html, /\.netlify\/functions\/video-status/);
  assert.doesNotMatch(html, /<iframe[^>]+videoGeneratorFrame/);
  assert.match(html, /KARAKTER & KONTINUITAS SERIAL/);
  assert.match(html, /Gambar referensi tokoh/);
  assert.match(html, /CHARACTER CONTINUITY LOCK/);
  assert.match(html, /karyaai-studio-active-job-v12/);
  assert.doesNotMatch(html, /demo video AI publik/);
  assert.doesNotMatch(html, /value=\"1:1\"/);
});

test('service worker does not cache dynamic function responses', () => {
  assert.match(sw, /startsWith\('\/\.netlify\/functions\/'\)/);
  assert.match(sw, /karyaai-pwa-v5-series/);
});
