'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';

interface Bid {
  id: number | string;
  bidder_name: string;
  amount: number | string;
  created_at: string;
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const [listing, setListing] = useState<any>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';

  const fetchData = async () => {
    try {
      const [listingRes, bidsRes] = await Promise.all([
        fetch(`${apiUrl}/api/listings`),
        fetch(`${apiUrl}/api/listings/${id}/bids`)
      ]);

      const listingJson = await listingRes.json();
      const list = Array.isArray(listingJson) ? listingJson : listingJson.listings || listingJson.data || [];
      const found = list.find((item: any) => String(item.id) === String(id));
      setListing(found || null);

      if (bidsRes.ok) {
        const bidsJson = await bidsRes.json();
        setBids(bidsJson.bids || []);
      }
    } catch (err) {
      console.error('Erreur chargement :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = io(apiUrl);
    socket.on('new_bid', (newBid: any) => {
      if (String(newBid.listing_id) === String(id)) {
        setBids((prev) => [newBid, ...prev]);
        setListing((prev: any) => prev ? { ...prev, current_highest_bid: newBid.amount } : prev);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, apiUrl]);

  useEffect(() => {
    if (!listing?.end_time) return;
    const updateTimer = () => {
      const diff = new Date(listing.end_time).getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsExpired(false);
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [listing?.end_time]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentPrice = Number(listing?.current_highest_bid || listing?.starting_price || 0);
    const numericBid = parseFloat(bidAmount);

    if (isNaN(numericBid) || numericBid <= currentPrice) {
      alert(`Votre offre doit être supérieure à ${currentPrice.toLocaleString()} Fbu.`);
      return;
    }

    try {
      // Récupération de l'ID utilisateur stocké (ou ID 1 par défaut)
      const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 1 : 1;

      const res = await fetch(`${apiUrl}/api/listings/${id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericBid,
          user_id: Number(currentUserId),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBidAmount('');
        fetchData();
      } else {
        alert(data.message || "Erreur lors de l'enregistrement de l'enchère.");
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion au serveur.');
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Chargement de l'annonce...</div>;
  if (!listing) return <div className="p-8 text-red-600">Annonce introuvable.</div>;

  const currentPrice = Number(listing.current_highest_bid || listing.starting_price || 0);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <Link href="/" className="text-sm text-teal-700 hover:underline font-medium">
          ← Retour aux annonces
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-4">{listing.title}</h1>
        <p className="text-gray-600 mt-2">{listing.description}</p>
        <p className="text-xs text-gray-500 mt-4">
          📦 Publié le : {new Date(listing.created_at).toLocaleString()}
        </p>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Enchère actuelle la plus haute :</p>
          <p className="text-2xl font-bold text-teal-700 mt-1">
            {currentPrice.toLocaleString()} Fbu
          </p>

          {listing.end_time && !isExpired && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {[
                { label: 'Jours', val: timeLeft.days },
                { label: 'Heures', val: timeLeft.hours },
                { label: 'Minutes', val: timeLeft.minutes },
                { label: 'Secondes', val: timeLeft.seconds }
              ].map((item) => (
                <div key={item.label} className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-center min-w-[70px]">
                  <span className="block text-lg font-bold text-gray-900">{item.val}</span>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {isExpired && (
            <p className="mt-4 text-sm font-semibold text-red-600">Cette enchère est terminée.</p>
          )}
        </div>

        {/* Formulaire pour enchérir épuré (sans champ pseudo) */}
        {!isExpired && (
          <form onSubmit={handlePlaceBid} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              placeholder={`Offre > ${currentPrice} Fbu`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              required
              min={currentPrice + 1}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Placer l'enchère
            </button>
          </form>
        )}

        {/* Historique public des enchères */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Historique des enchères ({bids.length})
          </h2>

          {bids.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
              Aucune enchère placée pour le moment. Soyez le premier à enchérir !
            </p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {bids.map((bid, idx) => (
                <div
                  key={bid.id || idx}
                  className={`p-3.5 flex items-center justify-between ${idx === 0 ? 'bg-teal-50/60' : 'bg-white'}`}
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                      <span>👤 {bid.bidder_name}</span>
                      {idx === 0 && (
                        <span className="text-[11px] bg-teal-700 text-white px-2 py-0.5 rounded-full">
                          Meilleure offre
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      🕒 {new Date(bid.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 text-base">
                    {Number(bid.amount).toLocaleString()} Fbu
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}