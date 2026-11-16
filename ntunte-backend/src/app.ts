'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Listing {
  id: number;
  title: string;
  description: string;
  category: string;
  sale_type: string;
  starting_price: number;
  current_highest_bid?: number;
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [category, setCategory] = useState('');
  const [saleType, setSaleType] = useState('AUCTION');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchListings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/listings`);
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error('Erreur chargement annonces:', err);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1,
        title,
        description,
        starting_price: parseFloat(startingPrice),
        category: category || 'general',
        sale_type: saleType,
      }),
    });
    setTitle('');
    setDescription('');
    setStartingPrice('');
    setCategory('');
    fetchListings();
  };

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-teal-800">Ntunte Marketplace</h1>
      <p className="text-gray-600 mb-6">Achetez, vendez et enchérissez au Burundi.</p>

      {/* Formulaire de publication */}
      <section className="bg-white p-5 rounded-lg shadow mb-8 border">
        <h2 className="text-xl font-semibold mb-4">Publier une nouvelle annonce</h2>
        <form onSubmit={handleCreateListing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Titre du produit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Prix de départ (Fbu)"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Catégorie (ex: electronics)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={saleType}
            onChange={(e) => setSaleType(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="AUCTION">Enchère (Auction)</option>
            <option value="DIRECT">Vente directe</option>
          </select>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded md:col-span-2"
            required
          />
          <button
            type="submit"
            className="bg-teal-600 text-white py-2 px-6 rounded hover:bg-teal-700 md:col-span-2 font-medium"
          >
            Publier l'annonce
          </button>
        </form>
      </section>

      {/* Liste des annonces avec bouton d'enchère */}
      <h2 className="text-2xl font-bold mb-4">Annonces disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listings.map((item) => {
          const displayPrice = item.current_highest_bid || item.starting_price;
          return (
            <div key={item.id} className="border rounded-lg p-5 shadow-sm bg-white flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
                    {item.sale_type === 'AUCTION' ? 'Enchère en cours' : 'Achat direct'}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{item.description}</p>
                <p className="text-lg font-bold text-teal-700 mt-4">
                  Offre actuelle : {Number(displayPrice).toLocaleString()} Fbu
                </p>
              </div>

              <Link
                href={`/listings/${item.id}`}
                className="mt-4 block text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-medium"
              >
                Enchérir maintenant
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
}