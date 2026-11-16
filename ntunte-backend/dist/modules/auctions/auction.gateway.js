"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuctionSocket = void 0;
const redis_1 = require("../../config/redis");
const auction_service_1 = require("./auction.service");
const setupAuctionSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Client connecté au canal d'enchère : ${socket.id}`);
        // L'utilisateur rejoint la "salle" d'une enchère spécifique
        socket.on('join_auction', async (listingId) => {
            socket.join(`auction_${listingId}`);
            try {
                // Mémoriser dans Redis le nombre de spectateurs connectés à cette enchère si Redis est actif
                if (redis_1.redisClient && typeof redis_1.redisClient.incr === 'function') {
                    await redis_1.redisClient.incr(`auction_viewers:${listingId}`);
                }
            }
            catch (err) {
                console.error("Erreur Redis lors du join_auction:", err);
            }
            console.log(`Utilisateur ${socket.id} a rejoint l'enchère #${listingId}`);
        });
        // Soumission d'une nouvelle enchère en direct
        socket.on('place_bid', async (data) => {
            try {
                const updatedAuction = await auction_service_1.AuctionService.placeBid(Number(data.listingId), Number(data.userId), Number(data.amount));
                // Diffuser instantanément la nouvelle mise à TOUS les participants connectés à l'annonce
                io.to(`auction_${data.listingId}`).emit('new_bid_broadcast', {
                    success: true,
                    listingId: data.listingId,
                    current_highest_bid: updatedAuction.current_highest_bid,
                    highest_bidder_id: data.userId,
                    timestamp: new Date()
                });
            }
            catch (error) {
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
exports.setupAuctionSocket = setupAuctionSocket;
