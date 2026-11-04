import Link from 'next/link';

async function getListings() {
  // Appel de l'API Backend Node.js de Ntunte
  const res = await fetch('http://localhost:5000/api/listings', { cache: 'no-store' });
  if (!res.ok) throw new Error('Impossible de charger les annonces.');
  return res.json();
}

export default async function HomePage() {
  const data = await getListings();
  const listings = data.listings || [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-teal-700">Ntunte</h1>
          <p className="text-gray-600 mt-2">Achat direct et enchères sécurisées au Burundi 🇧🇮</p>
        </header>

        {/* Grille des annonces */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {listings.map((item: any) => (
            <Link href={`/listings/${item.id}`} key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col justify-between">
              <div>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded mb-2 ${item.sale_type === 'AUCTION' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                  {item.sale_type === 'AUCTION' ? 'Enchère en direct' : 'Achat Direct'}
                </span>
                <h2 className="text-lg font-bold text-gray-800">{item.title}</h2>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-teal-600 font-bold text-lg">
                  {item.current_highest_bid || item.starting_price} BIF
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  🌱 -{item.carbon_saved_kg} kg CO₂
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}