"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuctionSocket = void 0;
const redis_1 = require("../../config/redis");
const auction_service_1 = require("./auction.service");
const setupAuctionSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Client connecté au canal d'enchère : ${socket.id}`);
        socket.on('join_auction', async (listingId) => {
            socket.join(`auction_${listingId}`);
            try {
                if (redis_1.redisClient && typeof redis_1.redisClient.incr === 'function') {
                    await redis_1.redisClient.incr(`auction_viewers:${listingId}`);
                }
            }
            catch (err) {
                console.error("Erreur Redis lors du join_auction:", err);
            }
            console.log(`Utilisateur ${socket.id} a rejoint l'enchère #${listingId}`);
        });
        socket.on('place_bid', async (data) => {
            try {
                const result = await auction_service_1.AuctionService.placeBid(Number(data.listingId), Number(data.userId), Number(data.amount), data.bidder_name);
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
            }
            catch (error) {
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
