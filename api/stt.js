/* Sakeenah — Speech-to-Text server function (Vercel: /api/stt).
   The browser records the learner (MediaRecorder) and POSTs the audio file here; this function forwards it to an
   OpenAI-compatible transcription API and returns only the text. The API key never reaches the browser and the
   audio is never stored (it lives in memory for the length of the request).

   Environment variables (Vercel → Project → Settings → Environment Variables):
     STT_API_KEY   required  — key of the transcription provider
     STT_PROVIDER  optional  — 'openai' (default) | 'groq' | 'custom'
     STT_MODEL     optional  — default: openai 'whisper-1', groq 'whisper-large-v3'
     STT_BASE_URL  optional  — OpenAI-compatible base URL (required for 'custom', e.g. a self-hosted Whisper server)

   GET  /api/stt                  → { ok, configured, provider, model, languages }
   POST /api/stt?lang=ar  (body = audio/webm | audio/ogg | audio/mp4 | audio/wav, ≤ 4 MB)
        → 200 { text, language, provider, model }   or   4xx/5xx { error } */
const LANGUAGES = ['ar', 'en', 'tr', 'ur'];          // the app's languages; all four are supported by Whisper
const MAX_BYTES = 4 * 1024 * 1024;                   // Vercel request bodies are limited to ~4.5 MB
const PROVIDERS = {
  openai: { base: 'https://api.openai.com/v1', model: 'whisper-1' },
  groq:   { base: 'https://api.groq.com/openai/v1', model: 'whisper-large-v3' },
  custom: { base: '', model: 'whisper-1' }
};
const EXT = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav' };

function config(){
  const provider = (process.env.STT_PROVIDER || 'openai').toLowerCase();
  const p = PROVIDERS[provider] || PROVIDERS.custom;
  const base = (process.env.STT_BASE_URL || p.base).replace(/\/+$/, '');
  return { provider, base, model: process.env.STT_MODEL || p.model, key: process.env.STT_API_KEY || '', configured: !!(process.env.STT_API_KEY && base) };
}
const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };
function readBody(req){
  return new Promise((resolve, reject) => { const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > MAX_BYTES){ reject(Object.assign(new Error('too_large'), { code:'too_large' })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); });
}

module.exports = async function handler(req, res){
  const c = config();
  if (req.method === 'GET') return send(res, 200, { ok:true, configured:c.configured, provider:c.provider, model:c.model, languages:LANGUAGES });
  if (req.method !== 'POST') return send(res, 405, { error:'method_not_allowed' });
  if (!c.configured) return send(res, 503, { error:'not_configured' });
  const url = new URL(req.url, 'http://x'); const lang = (url.searchParams.get('lang') || '').slice(0, 2);
  if (!LANGUAGES.includes(lang)) return send(res, 400, { error:'unsupported_language', languages:LANGUAGES });
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  if (!EXT[type]) return send(res, 415, { error:'unsupported_audio' });
  let audio;
  try { audio = await readBody(req); } catch (e) { return send(res, e.code === 'too_large' ? 413 : 400, { error: e.code === 'too_large' ? 'too_large' : 'bad_request' }); }
  if (audio.length < 1000) return send(res, 400, { error:'empty_audio' });
  const form = new FormData();
  form.append('file', new Blob([audio], { type }), 'speech.' + EXT[type]);
  form.append('model', c.model); form.append('language', lang); form.append('response_format', 'json'); form.append('temperature', '0');
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(c.base + '/audio/transcriptions', { method:'POST', headers:{ Authorization: 'Bearer ' + c.key }, body:form, signal:ctl.signal });
    if (!r.ok) return send(res, 502, { error:'upstream_error', status:r.status });
    const j = await r.json();
    return send(res, 200, { text: String(j.text || '').trim(), language: lang, provider: c.provider, model: c.model });
  } catch (e) {
    return send(res, e.name === 'AbortError' ? 504 : 502, { error: e.name === 'AbortError' ? 'upstream_timeout' : 'upstream_unreachable' });
  } finally { clearTimeout(timer); }
};
