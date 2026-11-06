const { io } = require("socket.io-client");

// URL de votre backend Render
const RENDER_URL = "https://ntunte-backend.onrender.com";
const LISTING_ID = 1; // ID de l'annonce d'enchère à tester

console.log("🚀 Connexion des clients WebSocket à Render...");

// Client A (Premier enchérisseur)
const clientA = io(RENDER_URL, { transports: ["websocket"] });

// Client B (Deuxième enchérisseur)
const clientB = io(RENDER_URL, { transports: ["websocket"] });

// Setup Client A
clientA.on("connect", () => {
  console.log("✅ Client A connecté avec l'ID:", clientA.id);
  clientA.emit("join_auction", LISTING_ID);
});

clientA.on("new_bid_broadcast", (data) => {
  console.log("📢 [Client A reçu] Nouvelle offre la plus haute:", data.current_highest_bid, "BIF");
});

// Setup Client B
clientB.on("connect", () => {
  console.log("✅ Client B connecté avec l'ID:", clientB.id);
  clientB.emit("join_auction", LISTING_ID);

  // Client B place une première enchère après 2 secondes
  setTimeout(() => {
    console.log("🔨 Client B place une offre de 50,000 BIF...");
    clientB.emit("place_bid", {
      listingId: LISTING_ID,
      userId: 102,
      amount: 50000
    });
  }, 2000);

  // Client A surenchérit après 4 secondes
  setTimeout(() => {
    console.log("🔨 Client A surenchérit à 60,000 BIF...");
    clientA.emit("place_bid", {
      listingId: LISTING_ID,
      userId: 101,
      amount: 60000
    });
  }, 4000);
});

// Gestion des erreurs
clientA.on("bid_error", (err) => console.error("❌ Erreur Client A:", err.message));
clientB.on("bid_error", (err) => console.error("❌ Erreur Client B:", err.message));