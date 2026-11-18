'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // États pour le diagnostic
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [diagnosticMessage, setDiagnosticMessage] = useState('Vérification de la connexion au serveur...');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';

  // Lancer le diagnostic au chargement de la page
  useEffect(() => {
    checkBackendHealth();
  }, [apiUrl]);

  const checkBackendHealth = async () => {
    setApiStatus('checking');
    try {
      const res = await fetch(`${apiUrl}/api/listings`, { method: 'GET' });
      if (res.ok || res.status < 500) {
        setApiStatus('online');
        setDiagnosticMessage(`Serveur opérationnel (${apiUrl})`);
      } else {
        setApiStatus('offline');
        setDiagnosticMessage(`Le serveur a répondu avec le code ${res.status}`);
      }
    } catch (err) {
      setApiStatus('offline');
      setDiagnosticMessage(`Impossible de joindre le serveur à l'adresse : ${apiUrl}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log("Tentative de connexion vers :", `${apiUrl}/api/auth/login`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("Statut de la réponse :", res.status);

      const data = await res.json();
      console.log("Données reçues :", data);

      if (res.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          if (data.user) {
            localStorage.setItem('userId', String(data.user.id));
            localStorage.setItem('username', data.user.username);
          }
          router.push('/');
        } else {
          setError("Le serveur a répondu 200 mais aucun token n'a été fourni.");
        }
      } else {
        setError(data.message || data.error || 'Identifiants incorrects.');
      }
    } catch (err: any) {
      console.error("Erreur attrapée dans catch :", err);
      if (err.name === 'AbortError') {
        setError('Le serveur met trop de temps à répondre (timeout 15s).');
      } else {
        setError('Erreur de connexion au serveur. Ouvrez la console pour voir les détails.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">

        {/* Panneau de Diagnostic en temps réel */}
        <div className={`mb-6 p-3 rounded-lg border text-xs flex items-center justify-between ${
          apiStatus === 'online'
            ? 'bg-green-50 border-green-200 text-green-800'
            : apiStatus === 'offline'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              apiStatus === 'online' ? 'bg-green-600 animate-pulse' : apiStatus === 'offline' ? 'bg-red-600' : 'bg-yellow-500'
            }`}></span>
            <span className="font-medium">{diagnosticMessage}</span>
          </div>
          <button
            type="button"
            onClick={checkBackendHealth}
            className="underline font-semibold hover:opacity-70 ml-2"
          >
            Tester
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion à Ntunte</h1>
        <p className="text-sm text-gray-600 mb-6">Connectez-vous pour placer des enchères et vendre.</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail ou Pseudo</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
              placeholder="votre@email.com ou pseudo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || apiStatus === 'offline'}
            className="w-full py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition text-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-600 mt-6">
          Vous n'avez pas de compte ?{' '}
          <Link href="/register" className="text-teal-700 font-semibold hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}