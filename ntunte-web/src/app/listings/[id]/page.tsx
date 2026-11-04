'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 👈 Ajout pour l'expérience utilisateur

  useEffect(() => {
    // Rejoindre la salle WebSocket de l'enchère
    socket.emit('join_auction', params.id);

    // Écouter les mises à jour en direct des enchères
    socket.on('new_bid_broadcast', (data) => {
      if (data.listingId.toString() === params.id) {
        setCurrentBid(data.current_highest_bid);
        setErrorMsg(null); // Effacer l'erreur si l'enchère passe
      }
    });

    // 👈 Écouter les erreurs renvoyées par le backend (ex: montant trop bas)
    socket.on('bid_error', (data) => {
      setErrorMsg(data.message);
    });

    return () => {
      socket.off('new_bid_broadcast');
      socket.off('bid_error');
    };
  }, [params.id]);

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null); // Réinitialiser l'erreur à chaque tentative

    socket.emit('place_bid', {
      listingId: parseInt(params.id),
      userId: 1, // ID de l'utilisateur connecté (récupéré depuis le token JWT)
      amount: parseFloat(bidAmount),
    });
    setBidAmount('');
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Article en Enchère #{params.id}</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <p className="text-xl text-gray-700">
          Enchère actuelle : <span className="font-bold text-green-600">{currentBid} BIF</span>
        </p>

        {/* 👈 Affichage dynamique de l'erreur en cas de rejet */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mt-4 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePlaceBid} className="mt-4 flex gap-4">
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Entrez votre offre en BIF"
            className="border p-2 rounded flex-1"
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Placer l'enchère
          </button>
        </form>
      </div>
    </main>
  );
}