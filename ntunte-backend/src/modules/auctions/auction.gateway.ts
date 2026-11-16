import { Server, Socket } from 'socket.io';
import { redisClient } from '../../config/redis';
import { AuctionService } from './auction.service';

export const setupAuctionSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connecté au canal d'enchère : ${socket.id}`);

    // L'utilisateur rejoint la "salle" d'une enchère spécifique
    socket.on('join_auction', async (listingId: number) => {
      socket.join(`auction_${listingId}`);

      try {
        // Mémoriser dans Redis le nombre de spectateurs connectés à cette enchère si Redis est actif
        if (redisClient && typeof redisClient.incr === 'function') {
          await redisClient.incr(`auction_viewers:${listingId}`);
        }
      } catch (err) {
        console.error("Erreur Redis lors du join_auction:", err);
      }

      console.log(`Utilisateur ${socket.id} a rejoint l'enchère #${listingId}`);
    });

    // Soumission d'une nouvelle enchère en direct
    socket.on('place_bid', async (data: { listingId: number, userId: number, amount: number }) => {
      try {
        const updatedAuction = await AuctionService.placeBid(
          Number(data.listingId),
          Number(data.userId),
          Number(data.amount)
        );

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