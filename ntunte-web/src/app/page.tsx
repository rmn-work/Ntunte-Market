'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Listing {
  id: string | number;
  title: string;
  starting_price: number;
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [debugInfo, setDebugInfo] = useState<string>('Connexion au serveur en cours...');

  useEffect(() => {
    async function fetchListings() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';
      const targetUrl = `${apiUrl}/api/listings`;

      try {
        console.log(`Tentative de fetch sur : ${targetUrl}`);
        const res = await fetch(targetUrl);

        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status} (${res.statusText})`);
        }

        const json = await res.json();
        const listingsArray = json.listings || json.data || [];

        setListings(Array.isArray(listingsArray) ? listingsArray : []);
        setDebugInfo(`Succès ! URL contactée : ${targetUrl} (Annonces trouvées : ${listingsArray.length})`);
      } catch (error: any) {
        const errorMsg = `Échec de l'URL [${targetUrl}] : ${error.message}`;
        console.error(errorMsg);
        setListings([]);
        setDebugInfo(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-green-700">Ntunte Marketplace</h1>
          <p className="text-gray-600">Achetez, vendez et enchérissez au Burundi.</p>

          {/* Bloc de diagnostic visuel */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm font-mono">
            <strong>Diagnostic en direct :</strong> {debugInfo}
          </div>
        </header>

        {loading ? (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 animate-pulse">
            <p className="font-semibold">Chargement des annonces... (Si le serveur backend sort de veille, cela peut prendre 10 à 20 secondes)</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-semibold">Aucune annonce trouvée pour le moment.</p>
            <p className="text-sm mt-1">Le backend répond correctement, mais la base de données ne contient pas encore d'annonces.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((listing: Listing) => (
              <div key={listing.id} className="bg-white p-4 rounded-xl shadow border">
                <h3 className="font-bold text-lg">{listing.title}</h3>
                <p className="text-green-600 font-semibold mt-2">{listing.starting_price} BIF</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}