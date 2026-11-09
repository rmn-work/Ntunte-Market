export const getApiUrl = () => {
  // Récupère la variable d'environnement Render ou utilise l'URL de production par défaut
  return process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';
};

export async function fetchApi(endpoint, options = {}) {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status} lors de l'accès à ${endpoint}`);
  }

  return res.json();
}