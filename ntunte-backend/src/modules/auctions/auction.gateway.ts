import { Server, Socket } from 'socket.io';
import { redisClient } from '../../config/redis';
import { AuctionService } from './auction.service';

export const setupAuctionSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connecté au canal d'enchère : ${socket.id}`);

    socket.on('join_auction', async (listingId: number) => {
      socket.join(`auction_${listingId}`);

      try {
        if (redisClient && typeof redisClient.incr === 'function') {
          await redisClient.incr(`auction_viewers:${listingId}`);
        }
      } catch (err) {
        console.error("Erreur Redis lors du join_auction:", err);
      }

      console.log(`Utilisateur ${socket.id} a rejoint l'enchère #${listingId}`);
    });

    socket.on('place_bid', async (data: { listingId: number; userId: number; amount: number; bidder_name?: string }) => {
      try {
        const result = await AuctionService.placeBid(
          Number(data.listingId),
          Number(data.userId),
          Number(data.amount),
          data.bidder_name
        );

        // Diffuser le format unifié `new_bid` à tous les clients (Web & Mobile)
        io.emit('new_bid', result.bid);

        // Conserver la compatibilité avec l'événement de salle existant
        io.to(`auction_${data.listingId}`).emit('new_bid_broadcast', {
          success: true,
          listingId: data.listingId,
          current_highest_bid: result.current_highest_bid,
          highest_bidder_id: data.userId,
          bidder_name: result.bid.bidder_name,
          timestamp: result.bid.created_at
        });
      } catch (error: any) {
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