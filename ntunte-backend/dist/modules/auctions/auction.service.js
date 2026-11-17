"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionService = void 0;
const database_1 = require("../../config/database");
class AuctionService {
    static async placeBid(listingId, userId, amount, bidderName) {
        // 1. Récupérer l'annonce pour vérifier son statut, son prix et sa date de fin
        const listingQuery = `
      SELECT id, status, sale_type, starting_price, current_highest_bid, end_time
      FROM listings WHERE id = $1
    `;
        const res = await (0, database_1.query)(listingQuery, [listingId]);
        if (res.rows.length === 0) {
            throw new Error("Cette annonce n'existe pas.");
        }
        const listing = res.rows[0];
        if (listing.end_time) {
            const endTime = new Date(listing.end_time);
            if (new Date() > endTime) {
                throw new Error("Le temps imparti pour cette enchère est expiré.");
            }
        }
        const currentHighest = listing.current_highest_bid !== null && listing.current_highest_bid !== undefined
            ? Number(listing.current_highest_bid)
            : Number(listing.starting_price);
        if (amount <= currentHighest) {
            throw new Error(`L'enchère doit être supérieure à l'offre actuelle de ${currentHighest.toLocaleString()} Fbu.`);
        }
        // 2. Résoudre le pseudo de l'utilisateur
        let resolvedBidderName = bidderName?.trim();
        if (!resolvedBidderName) {
            const userRes = await (0, database_1.query)(`SELECT COALESCE(username, name, CONCAT('Enchérisseur #', id)) AS display_name FROM users WHERE id = $1`, [userId]);
            resolvedBidderName = userRes.rows[0]?.display_name || `Enchérisseur #${userId}`;
        }
        // 3. Enregistrer l'enchère avec pseudo et timestamp
        const insertRes = await (0, database_1.query)(`INSERT INTO bids (listing_id, user_id, amount, bidder_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, listing_id, user_id, amount, bidder_name, created_at`, [listingId, userId, amount, resolvedBidderName]);
        const updateRes = await (0, database_1.query)('UPDATE listings SET current_highest_bid = $1 WHERE id = $2 RETURNING current_highest_bid', [amount, listingId]);
        return {
            listingId,
            current_highest_bid: Number(updateRes.rows[0].current_highest_bid),
            bid: insertRes.rows[0]
        };
    }
}
exports.AuctionService = AuctionService;
