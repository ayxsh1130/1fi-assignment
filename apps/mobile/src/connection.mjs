export function normalizeBaseUrl(value) {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Enter an HTTP address, for example http://192.168.1.25:4000');
  }
  return url.origin;
}
export function resolveApiUrl({ override, hostUri, platform }) {
  if (override?.trim()) return normalizeBaseUrl(override);
  if (hostUri) {
    try {
      const host = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
      if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.endsWith('.local')) return `http://${host}:4000`;
    } catch { /* Fall back to platform development defaults. */ }
  }
  return platform === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}
export async function requestJson(baseUrl, path, { body, signal, timeoutMs = 10000, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted) controller.abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      signal:controller.signal,
      ...(body ? { method:'POST', headers:{ 'Content-Type':'application/json' }, body } : {}),
    });
    let data;
    try { data = await response.json(); }
    catch { throw new Error('This address did not return JSON. Check the demo API address and port.'); }
    if (!response.ok) throw new Error(data.error || `The API returned status ${response.status}.`);
    if (path.startsWith('/api/products') && (path.includes('/emi-plans') || path.split('?')[0] === '/api/products')) {
      if (!Array.isArray(data.items) || data.demo !== true) throw new Error('This is not the Marketplace API. Check the address and port.');
    }
    return data;
  } catch (error) {
    if (timedOut) throw new Error('The API request timed out. Check the connection address below.');
    if (error.name === 'AbortError') throw error;
    if (/Failed to fetch|Network request failed|fetch failed/i.test(error.message)) throw new Error('Cannot connect to the demo API. Check the address below and keep the API running.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
