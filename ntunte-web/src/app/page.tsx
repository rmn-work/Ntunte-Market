'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Listing {
  id: string | number;
  title?: string;
  titre?: string;
  description?: string;
  price?: number;
  prix?: number;
  starting_price?: number;
  current_highest_bid?: number;
  amount?: number;
  category?: string;
  created_at?: string;
  end_time?: string;
  endTime?: string;
  date_fin?: string;
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [category, setCategory] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';

  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/listings`);
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const json = await res.json();

      let listingsArray = [];
      if (Array.isArray(json)) {
        listingsArray = json;
      } else if (json.listings && Array.isArray(json.listings)) {
        listingsArray = json.listings;
      } else if (json.data && Array.isArray(json.data)) {
        listingsArray = json.data;
      } else if (json.results && Array.isArray(json.results)) {
        listingsArray = json.results;
      } else {
        listingsArray = Object.values(json).find(Array.isArray) || [];
      }

      setListings(listingsArray);
    } catch (error) {
      console.error('Erreur chargement annonces :', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formattedEndTime = customEndTime ? new Date(customEndTime).toISOString() : null;

      const response = await fetch(`${apiUrl}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          starting_price: parseFloat(startingPrice),
          category: category || 'electronics',
          end_time: formattedEndTime,
        }),
      });

      if (response.ok) {
        alert('Produit publié avec succès !');
        setTitle('');
        setDescription('');
        setStartingPrice('');
        setCategory('');
        setCustomEndTime('');
        fetchListings();
      } else {
        alert("Erreur lors de la publication.");
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion avec le serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">

        {/* BLOC DE DIAGNOSTIC TEMPORAIRE */}
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-xs font-mono text-amber-950 overflow-x-auto">
          <p className="font-bold text-sm mb-1">🔍 DIAGNOSTIC API & DONNÉES :</p>
          <p><strong>URL API utilisée :</strong> {apiUrl}/api/listings</p>
          <p><strong>Nombre d'annonces reçues :</strong> {listings.length}</p>
          {listings.length > 0 && (
            <div className="mt-2">
              <p><strong>Clés du 1er objet :</strong> {Object.keys(listings[0]).join(', ')}</p>
              <p><strong>Valeur brute de end_time :</strong> {JSON.stringify(listings[0].end_time ?? 'ABSENT')}</p>
              <pre className="mt-1 p-2 bg-white rounded border border-amber-200">
                {JSON.stringify(listings[0], null, 2)}
              </pre>
            </div>
          )}
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ntunte Marketplace</h1>
          <p className="text-gray-600">Achetez, vendez et enchérissez au Burundi.</p>
        </header>

        {/* Formulaire de publication */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
            <h3 className="text-lg font-bold text-gray-900">Publier une nouvelle annonce</h3>
            <input
              type="text"
              placeholder="Titre du produit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="number"
              placeholder="Prix de départ / Enchère de départ (Fbu)"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              required
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="text"
              placeholder="Catégorie (ex: electronics)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Date et heure de fin de l'enchère (Optionnel) :</label>
              <input
                type="datetime-local"
                value={customEndTime}
                onChange={(e) => setCustomEndTime(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Publication en cours...' : 'Publier l\'annonce'}
            </button>
          </form>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Annonces disponibles</h2>

        {loading ? (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 animate-pulse">
            <p className="font-semibold">Chargement des annonces...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-semibold">Aucune annonce trouvée pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((listing: Listing, index) => {
              const itemTitle = listing.title || listing.titre || 'Annonce sans titre';
              const itemDescription = listing.description || 'Aucune description disponible.';
              const rawPrice =
                listing.current_highest_bid ??
                listing.price ??
                listing.prix ??
                listing.starting_price ??
                listing.amount ??
                0;
              const numericPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice) || 0;
              const createdAtFormatted = listing.created_at ? new Date(listing.created_at).toLocaleString() : 'Récemment';

              const rawEndTime = listing.end_time || listing.endTime || listing.date_fin;
              let timeLeftText = 'Aucune fin définie';
              let isExpired = false;

              if (rawEndTime) {
                const endTimeMs = new Date(rawEndTime).getTime();
                const nowMs = Date.now();
                const diffMs = endTimeMs - nowMs;

                if (diffMs <= 0) {
                  isExpired = true;
                  timeLeftText = 'Enchère terminée';
                } else {
                  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                  if (days > 0) {
                    timeLeftText = `${days} Jours ${hours}h ${minutes}min`;
                  } else {
                    timeLeftText = `${hours}h ${minutes}min restantes`;
                  }
                }
              }

              return (
                <div
                  key={listing.id || index}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{itemTitle}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isExpired ? 'Terminée' : 'Enchère active'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{itemDescription}</p>

                    <div className="text-xs text-gray-500 space-y-1 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <p>📦 Publié : {createdAtFormatted}</p>
                      <p>⏳ Temps restant : <span className="font-semibold text-gray-800">{timeLeftText}</span></p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Offre actuelle</p>
                    <p className="font-bold text-gray-900 text-lg mb-3">
                      {numericPrice.toLocaleString()} Fbu
                    </p>

                    <Link
                      href={`/listings/${listing.id}`}
                      className="block w-full text-center py-2.5 px-4 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition"
                    >
                      {isExpired ? 'Voir les résultats' : 'Enchérir en direct'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}