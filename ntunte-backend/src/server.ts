import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import pool from './config/database';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialisation automatique et sécurisée du schéma des enchères
async function initAuctionSchema() {
  try {
    await pool.query(`
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS current_highest_bid NUMERIC(15, 2),
      ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Schéma PostgreSQL des enchères vérifié avec succès.');
  } catch (err) {
    console.error('⚠️ Erreur lors de la vérification du schéma SQL :', err);
  }
}

io.on('connection', (socket) => {
  console.log('Client connecté :', socket.id);

  // Rejoindre la salle d'une annonce spécifique
  socket.on('join_auction', (listingId) => {
    socket.join(`auction_${listingId}`);
  });

  // Recevoir, valider et enregistrer une nouvelle enchère
  socket.on('place_bid', async (data: { listingId: number; userId: number; amount: number }) => {
    const { listingId, userId, amount } = data;

    try {
      // 1. Récupérer le prix actuel de l'annonce
      const listingRes = await pool.query(
        'SELECT starting_price, current_highest_bid FROM listings WHERE id = $1',
        [listingId]
      );

      if (listingRes.rows.length === 0) {
        return socket.emit('bid_error', { listingId, message: 'Annonce introuvable.' });
      }

      const listing = listingRes.rows[0];
      const currentPrice = Number(listing.current_highest_bid || listing.starting_price);

      // 2. Vérifier que la nouvelle offre est strictement supérieure
      if (isNaN(amount) || amount <= currentPrice) {
        return socket.emit('bid_error', {
          listingId,
          message: `Votre offre doit être supérieure à ${currentPrice.toLocaleString()} Fbu.`,
        });
      }

      // 3. Mettre à jour l'annonce et enregistrer l'enchère en base
      await pool.query(
        'UPDATE listings SET current_highest_bid = $1 WHERE id = $2',
        [amount, listingId]
      );

      await pool.query(
        'INSERT INTO bids (listing_id, user_id, amount) VALUES ($1, $2, $3)',
        [listingId, userId, amount]
      );

      // 4. Diffuser le nouveau prix en direct à tous les utilisateurs connectés à cette annonce
      io.to(`auction_${listingId}`).emit('new_bid_broadcast', {
        listingId,
        current_highest_bid: amount,
        userId,
      });
    } catch (error: any) {
      console.error('Erreur lors de l’enchère :', error);
      socket.emit('bid_error', { listingId, message: error.message || 'Erreur serveur lors de l’enchère.' });
    }
  });
});

const PORT = process.env.PORT || 5000;
initAuctionSchema().then(() => {
  server.listen(PORT, () => {
    console.log(`Serveur Ntunte actif sur le port ${PORT}`);
  });
});