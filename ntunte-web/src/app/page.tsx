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
  buy_now_price?: number | null;
  allow_buy_now?: boolean;
  sale_type?: string;
  status?: string;
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [category, setCategory] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    }
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedAuctionPrice = parseFloat(startingPrice);
      const parsedBuyNow = buyNowPrice ? parseFloat(buyNowPrice) : null;
      const formattedEndTime = customEndTime ? new Date(customEndTime).toISOString() : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

      const response = await fetch(`${apiUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          description,
          starting_price: parsedAuctionPrice,
          buy_now_price: parsedBuyNow,
          allow_buy_now: Boolean(parsedBuyNow && parsedBuyNow > 0),
          category: category || 'electronics',
          sale_type: 'AUCTION',
          end_time: formattedEndTime,
          ...(storedUserId ? { userId: Number(storedUserId) } : {}),
        }),
      });

      if (response.ok) {
        alert('Produit publié avec succès !');
        setTitle('');
        setDescription('');
        setStartingPrice('');
        setBuyNowPrice('');
        setCategory('');
        setCustomEndTime('');
        fetchListings();
      } else {
        const data = await response.json();
        alert(data.message || "Erreur lors de la publication.");
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
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ntunte Marketplace</h1>
            <p className="text-gray-600">Achetez, vendez et enchérissez au Burundi.</p>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2 shadow-sm"
              >
                <span>🚪</span> Déconnexion
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition text-sm"
              >
                Connexion
              </Link>
            )}
          </div>
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
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <input
              type="number"
              placeholder="Prix de départ / Enchère (Fbu)"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              required
              min={1}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <input
              type="number"
              placeholder="Prix Acheter tout de suite (Optionnel, ex: 15000 Fbu)"
              value={buyNowPrice}
              onChange={(e) => setBuyNowPrice(e.target.value)}
              min={1}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <input
              type="text"
              placeholder="Catégorie (ex: electronics)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">
                Date et heure de fin de l'enchère (Optionnel) :
              </label>
              <input
                type="datetime-local"
                value={customEndTime}
                onChange={(e) => setCustomEndTime(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Publication en cours...' : "Publier l'annonce"}
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
            {listings.map((item: Listing, index) => {
              const itemTitle = item.title || item.titre || 'Annonce sans titre';
              const itemDescription = item.description || 'Aucune description disponible.';
              const isSold = item.status === 'SOLD';
              const rawPrice =
                item.current_highest_bid ??
                item.price ??
                item.prix ??
                item.starting_price ??
                item.amount ??
                0;
              const numericPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice)) || 0;
              const hasBuyNow =
                Boolean(item.allow_buy_now) || (item.buy_now_price != null && Number(item.buy_now_price) > 0);
              const numericBuyNow = Number(item.buy_now_price || 15000);
              const createdAtFormatted = item.created_at
                ? new Date(item.created_at).toLocaleString()
                : 'Récemment';

              const rawEndTime = item.end_time || item.endTime || item.date_fin;
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

              const badgeText = isSold
                ? 'Vendu'
                : isExpired
                ? 'Terminée'
                : 'Enchère active';

              const badgeClass = isSold
                ? 'bg-gray-200 text-gray-800'
                : isExpired
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800';

              return (
                <div
                  key={item.id || index}
                  className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{itemTitle}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-3">{itemDescription}</p>

                    <div className="text-xs text-gray-500 space-y-1 mt-3 mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <p>📦 Publié : {createdAtFormatted}</p>
                      <p>
                        ⏳ Temps restant :{' '}
                        <span className="font-semibold text-gray-800">{timeLeftText}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-teal-700 font-bold mt-2">
                      Offre actuelle : {numericPrice.toLocaleString()} Fbu
                    </p>
                    {hasBuyNow && (
                      <p className="text-emerald-700 font-semibold text-xs mt-1">
                        ⚡ Acheter tout de suite : {numericBuyNow.toLocaleString()} Fbu
                      </p>
                    )}
                    <Link
                      href={`/listings/${item.id}`}
                      className="inline-block w-full text-center mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition"
                    >
                      Participer à l'enchère / Acheter →
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