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
  const [submitting, setSubmitting] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken =
        localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('jwt');
      const storedUserId = localStorage.getItem('userId') || localStorage.getItem('id');

      setToken(storedToken);
      setUserId(storedUserId);
      setIsAuthLoaded(true);
    }
  }, []);

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
        const extractedBids = Array.isArray(bidsJson) ? bidsJson : (bidsJson.bids || bidsJson.data || []);
        setBids(extractedBids);
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
        setBids((prev) => {
          const exists = prev.some((b) => b.id != null && String(b.id) === String(newBid.id));
          return exists ? prev : [newBid, ...prev];
        });
        setListing((prev: any) => prev ? { ...prev, current_highest_bid: newBid.amount } : prev);
      }
    });

    socket.on('listing_sold', (payload: any) => {
      if (String(payload.listingId) === String(id)) {
        setListing((prev: any) =>
          prev ? { ...prev, status: 'SOLD', current_highest_bid: payload.amount } : prev
        );
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

  const getActiveAuth = () => {
    const activeToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('jwt')
        : null);
    const activeUserId = Number(
      userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || 0
    );
    return { activeToken, activeUserId: activeUserId || undefined };
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const { activeToken, activeUserId } = getActiveAuth();
    if (!activeToken) {
      alert("Connectez-vous pour enchérir.");
      return;
    }

    const currentPrice = Number(listing?.current_highest_bid || listing?.starting_price || 0);
    const numericBid = parseFloat(bidAmount);

    if (isNaN(numericBid) || numericBid <= currentPrice) {
      alert(`Votre offre doit être supérieure à ${currentPrice.toLocaleString()} Fbu.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/listings/${id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          amount: numericBid,
          userId: activeUserId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBidAmount('');
        setSuccessMsg("Enchère placée avec succès !");
        await fetchData();
      } else {
        setError(data.message || data.error || "Erreur lors de l'enregistrement de l'enchère.");
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyNow = async () => {
    setError('');
    setSuccessMsg('');

    const { activeToken, activeUserId } = getActiveAuth();
    if (!activeToken) {
      alert("Connectez-vous pour acheter tout de suite.");
      return;
    }

    const buyPrice = Number(listing?.buy_now_price || 15000);
    const confirmed = window.confirm(
      `Confirmer l'achat tout de suite de "${listing?.title}" pour ${buyPrice.toLocaleString()} Fbu ?`
    );
    if (!confirmed) return;

    setBuyingNow(true);
    try {
      const res = await fetch(`${apiUrl}/api/listings/${id}/buy-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          userId: activeUserId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Achat tout de suite effectué avec succès !");
        await fetchData();
      } else {
        setError(data.message || data.error || "Erreur lors de l'achat tout de suite.");
      }
    } catch (err: any) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setBuyingNow(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Chargement de l'annonce...</div>;
  if (!listing) return <div className="p-8 text-red-600">Annonce introuvable.</div>;

  const isSold = listing.status === 'SOLD';
  const currentPrice = Number(listing.current_highest_bid || listing.starting_price || 0);
  const numericBuyNowPrice = Number(listing.buy_now_price ?? 0);
  const hasBuyNow = Boolean(listing.allow_buy_now) || numericBuyNowPrice > 0;
  const buyNowPrice = numericBuyNowPrice > 0 ? numericBuyNowPrice : 15000;

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <Link href="/" className="text-sm text-teal-700 hover:underline font-medium">
          ← Retour aux annonces
        </Link>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
          {isSold && (
            <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold">
              Vendu
            </span>
          )}
        </div>

        <p className="text-gray-600 mt-2">{listing.description}</p>
        <p className="text-xs text-gray-500 mt-4">
          📦 Publié le : {new Date(listing.created_at).toLocaleString()}
        </p>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Enchère actuelle la plus haute :</p>
          <p className="text-2xl font-bold text-teal-700 mt-1">
            {currentPrice.toLocaleString()} Fbu
          </p>

          {hasBuyNow && (
            <p className="text-sm text-emerald-700 font-semibold mt-2">
              ⚡ Acheter tout de suite : {buyNowPrice.toLocaleString()} Fbu
            </p>
          )}

          {listing.end_time && !isExpired && !isSold && (
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

          {isExpired && !isSold && (
            <p className="mt-4 text-sm font-semibold text-red-600">Cette enchère est terminée.</p>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 text-sm rounded-lg border border-emerald-200">
            {successMsg}
          </div>
        )}

        {/* Option Acheter tout de suite + Option Enchères en dessous sur le même produit */}
        {!isSold && !isExpired && isAuthLoaded && (
          token ? (
            <div className="mt-6 space-y-5">
              {hasBuyNow && (
                <div>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={buyingNow}
                    className="w-full py-3 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {buyingNow
                      ? 'Achat en cours...'
                      : `Acheter tout de suite (${buyNowPrice.toLocaleString()} Fbu)`}
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Ou faire une enchère :
                </p>
                <form onSubmit={handlePlaceBid} className="flex flex-col sm:flex-row gap-3">
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
                    disabled={submitting}
                    className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Envoi...' : "Placer l'enchère"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <p className="text-sm text-amber-800">
                ⚠️ Connectez-vous pour acheter tout de suite ou placer une enchère.
              </p>
              <Link
                href="/login"
                className="py-2 px-4 bg-teal-700 text-white text-sm font-semibold rounded-lg hover:bg-teal-800 transition whitespace-nowrap ml-4"
              >
                Se connecter
              </Link>
            </div>
          )
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