const ENV_API = import.meta.env.VITE_API_BASE;

export async function apiFetch(endpoint, options = {}) {
  const baseCandidates = ENV_API 
    ? [ENV_API, '/api', 'http://127.0.0.1:5000/api', 'http://localhost:5000/api']
    : ['/api', 'http://127.0.0.1:5000/api', 'http://localhost:5000/api'];

  let lastError = null;

  for (const base of baseCandidates) {
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const url = `${base}${cleanEndpoint}`;
      const res = await fetch(url, options);
      if (res.ok || res.status === 400 || res.status === 429) {
        return res;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Unable to connect to backend server');
}
