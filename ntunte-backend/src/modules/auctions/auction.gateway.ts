import { Server, Socket } from 'socket.io';
import { query } from '../../config/database';
import { redisClient } from '../../config/redis';

export class AuctionService {
  /**
   * Traite et valide une enchère en temps réel
   */
  static async placeBid(listingId: number, userId: number, amount: number) {
    // 1. Récupérer l'annonce pour vérifier son statut et son prix actuel
    const listingQuery = `
      SELECT id, status, sale_type, starting_price, current_highest_bid, end_time
      FROM listings WHERE id = $1
    `;
    const res = await query(listingQuery, [listingId]);

    if (res.rows.length === 0) {
      throw new Error("Cette annonce n'existe pas.");
    }

    // Correction ici : suppression du point avant [0]
    const listing = res.rows[0];

    if (listing.status !== 'ACTIVE' || listing.sale_type !== 'AUCTION') {
      throw new Error("Cette enchère n'est plus active.");
    }

    if (new Date() > new Date(listing.end_time)) {
      throw new Error("Le temps imparti pour cette enchère est expiré.");
    }

    const currentHighest = listing.current_highest_bid || listing.starting_price;
    if (amount <= currentHighest) {
      throw new Error(`L'enchère doit être supérieure à l'offre actuelle de ${currentHighest} BIF.`);
    }

    // 2. Enregistrer l'enchère dans la table `bids` et mettre à jour le prix fort
    await query('INSERT INTO bids (listing_id, user_id, amount) VALUES ($1, $2, $3)', [listingId, userId, amount]);

    const updateRes = await query(
      'UPDATE listings SET current_highest_bid = $1 WHERE id = $2 RETURNING current_highest_bid',
      [amount, listingId]
    );

    return {
      listingId,
      current_highest_bid: updateRes.rows[0].current_highest_bid
    };
  }
}

export const setupAuctionSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connecté au canal d'enchère : ${socket.id}`);

    // L'utilisateur rejoint la "salle" d'une enchère spécifique
    socket.on('join_auction', async (listingId: number) => {
      socket.join(`auction_${listingId}`);
      // Mémoriser dans Redis le nombre de spectateurs connectés à cette enchère
      await redisClient.incr(`auction_viewers:${listingId}`);
      console.log(`Utilisateur ${socket.id} a rejoint l'enchère #${listingId}`);
    });

    // Soumission d'une nouvelle enchère en direct
    socket.on('place_bid', async (data: { listingId: number, userId: number, amount: number }) => {
      try {
        const updatedAuction = await AuctionService.placeBid(data.listingId, data.userId, data.amount);

        // Diffuser instantanément la nouvelle mise à TOUS les participants connectés à l'annonce
        io.to(`auction_${data.listingId}`).emit('new_bid_broadcast', {
          success: true,
          listingId: data.listingId,
          current_highest_bid: updatedAuction.current_highest_bid,
          highest_bidder_id: data.userId,
          timestamp: new Date()
        });

      } catch (error: any) {
        // Renvoyer l'erreur uniquement à l'enchérisseur concerné
        socket.emit('bid_error', {
          success: false,
          message: error.message || "Erreur lors de la soumission de l'enchère."
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Déconnexion du client Socket.io : ${socket.id}`);
    });
  });
};