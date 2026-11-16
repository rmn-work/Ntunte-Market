'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';
const socket = io(apiUrl);

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState<string>(`Article #${params.id}`);
  const [description, setDescription] = useState<string>('');
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  const [customEndTime, setCustomEndTime] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  const [bidAmount, setBidAmount] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchListingDetail = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/listings`);
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.listings || json.data || [];
        const found = list.find((item: any) => item.id?.toString() === params.id?.toString());

        if (found) {
          setTitle(found.title || found.titre || `Article #${params.id}`);
          setDescription(found.description || '');
          const initial = found.current_highest_bid ?? found.starting_price ?? found.price ?? 0;
          setCurrentBid(parseFloat(initial) || 0);
          setCreatedAt(found.created_at || new Date().toISOString());
          if (found.end_time) setEndTime(found.end_time);
        }
      } catch (err) {
        console.error('Erreur récupération détails annonce :', err);
      }
    };

    fetchListingDetail();
  }, [params.id]);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const totalSeconds = Math.floor((new Date(endTime).getTime() - Date.now()) / 1000);

      if (totalSeconds <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setWinnerMessage(`🎉 Enchère terminée ! Félicitations au vainqueur avec une offre de ${currentBid.toLocaleString()} Fbu ! 🏆`);
        clearInterval(interval);
      } else {
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, currentBid]);

  useEffect(() => {
    socket.emit('join_auction', params.id);

    socket.on('new_bid_broadcast', (data) => {
      if (data.listingId?.toString() === params.id?.toString()) {
        setCurrentBid(parseFloat(data.current_highest_bid));
        setErrorMsg(null);
        setSuccessMsg('Votre enchère a été enregistrée en direct !');
      }
    });

    socket.on('bid_error', (data) => {
      setErrorMsg(data.message);
      setSuccessMsg(null);
    });

    return () => {
      socket.off('new_bid_broadcast');
      socket.off('bid_error');
    };
  }, [params.id]);

  const handleSetEndTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEndTime) {
      setEndTime(customEndTime);
      alert('Fin de l’enchère configurée avec succès !');
    }
  };

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime && new Date(endTime).getTime() < Date.now()) {
      setErrorMsg("Cette enchère est terminée.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedAmount = parseFloat(bidAmount);
    if (isNaN(parsedAmount) || parsedAmount <= currentBid) {
      setErrorMsg(`Votre offre doit être supérieure à ${currentBid.toLocaleString()} Fbu.`);
      return;
    }

    socket.emit('place_bid', {
      listingId: parseInt(params.id),
      userId: 2,
      amount: parsedAmount,
    });
    setBidAmount('');
  };

  const isExpired = endTime ? new Date(endTime).getTime() < Date.now() : false;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-teal-700 hover:underline font-medium inline-block mb-6">
          ← Retour aux annonces
        </Link>

        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {description && <p className="text-gray-600 mb-4">{description}</p>}

          {createdAt && (
            <p className="text-xs text-gray-500 mb-4">
              📦 Publié le : {new Date(createdAt).toLocaleString()}
            </p>
          )}

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-teal-800">Enchère actuelle la plus haute :</p>
            <p className="text-3xl font-bold text-teal-700 mb-3">{currentBid.toLocaleString()} Fbu</p>

            {timeLeft ? (
              <div className="bg-white p-3 rounded-md border border-teal-100 flex justify-around text-center">
                <div>
                  <span className="block text-xl font-bold text-teal-900">{timeLeft.days}</span>
                  <span className="text-xs text-gray-500">Jours</span>
                </div>
                <div>
                  <span className="block text-xl font-bold text-teal-900">{timeLeft.hours}</span>
                  <span className="text-xs text-gray-500">Heures</span>
                </div>
                <div>
                  <span className="block text-xl font-bold text-teal-900">{timeLeft.minutes}</span>
                  <span className="text-xs text-gray-500">Minutes</span>
                </div>
                <div>
                  <span className="block text-xl font-bold text-red-600 animate-pulse">{timeLeft.seconds}</span>
                  <span className="text-xs text-gray-500">Secondes</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic">Aucune date de fin définie.</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <form onSubmit={handleSetEndTime} className="flex flex-col sm:flex-row gap-3 items-center">
              <label className="text-sm font-medium text-gray-700">Définir la fin :</label>
              <input
                type="datetime-local"
                value={customEndTime}
                onChange={(e) => setCustomEndTime(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg text-sm flex-1"
                required
              />
              <button type="submit" className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-black">
                Valider
              </button>
            </form>
          </div>

          {winnerMessage && (
            <div className="bg-gradient-to-r from-yellow-400 via-green-400 to-teal-500 text-white p-4 rounded-xl mb-6 text-center font-bold text-lg shadow-lg animate-bounce">
              {winnerMessage}
            </div>
          )}

          {isExpired ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 font-semibold text-center">
              ⛔ Cette enchère est définitivement clôturée.
            </div>
          ) : (
            <>
              {errorMsg && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium">{errorMsg}</div>}
              {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm font-medium">{successMsg}</div>}

              <form onSubmit={handlePlaceBid} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Offre > ${currentBid} Fbu`}
                  className="border border-gray-300 p-3 rounded-lg flex-1"
                  required
                />
                <button type="submit" className="bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-800">
                  Placer l'enchère
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}