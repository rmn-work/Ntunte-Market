export default function Loading() {
  return (
    <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-yellow-50 border border-yellow-200 rounded-xl shadow text-yellow-800 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-700 mx-auto mb-4"></div>
        <p className="font-semibold text-lg">Réveil du serveur en cours...</p>
        <p className="text-sm mt-2 text-yellow-700">
          Le backend hébergé sur Render est en train de s'allumer. Veuillez patienter quelques secondes (première connexion un peu lente).
        </p>
      </div>
    </main>
  );
}