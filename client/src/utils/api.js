const ENV_API = import.meta.env.VITE_API_BASE;

export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // In production (e.g. Vercel), always use relative /api
  const baseCandidates = isLocal
    ? (ENV_API ? [ENV_API, '/api', 'http://127.0.0.1:5000/api', 'http://localhost:5000/api'] : ['/api', 'http://127.0.0.1:5000/api', 'http://localhost:5000/api'])
    : [ENV_API || '/api'];

  let lastError = null;

  for (const base of baseCandidates) {
    try {
      const url = `${base}${cleanEndpoint}`;
      const res = await fetch(url, options);
      if (res) return res;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Unable to connect to backend server');
}
