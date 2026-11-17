'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('username', data.user.username);
        router.push('/');
      } else {
        setError(data.message || "Erreur lors de l'inscription.");
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
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
            onClick={checkBackendHealth}
            className="underline font-semibold hover:opacity-70 ml-2"
          >
            Tester
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Créer un compte Ntunte</h1>
        <p className="text-sm text-gray-600 mb-6">Rejoignez la marketplace du Burundi.</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pseudo</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
              placeholder="mon_pseudo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone (Optionnel)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
              placeholder="+257 ..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mot de passe (min. 6 caractères)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || apiStatus === 'offline'}
            className="w-full py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition text-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'Inscription en cours...' : 'S’inscrire'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-600 mt-6">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="text-teal-700 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}