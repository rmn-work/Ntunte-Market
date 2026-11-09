import Link from 'next/link';

async function getListings() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ntunte-backend.onrender.com';
    const res = await fetch(`${apiUrl}/api/listings`, {
      cache: 'no-store' // Désactive le cache pour avoir les données en temps réel
    });

    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`);
    }

    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Échec du chargement des annonces :", error.message);
    // Retourne un tableau vide pour éviter le crash de la page
    return [];
  }
}

export default async function Home() {
  const listings = await getListings();

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-green-700">Ntunte Marketplace</h1>
          <p className="text-gray-600">Achetez, vendez et enchérissez au Burundi.</p>
        </header>

        {listings.length === 0 ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-semibold">Chargement des annonces ou serveur en cours de réveil...</p>
            <p className="text-sm mt-1">Si le problème persiste, vérifiez que l'API backend `/api_listings` est bien active.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((listing) => (
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