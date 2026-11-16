"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionService = void 0;
const database_1 = require("../../config/database");
class AuctionService {
    /**
     * Traite et valide une enchère en temps réel
     */
    static async placeBid(listingId, userId, amount) {
        // 1. Récupérer l'annonce pour vérifier son statut, son type, son prix et sa date de fin
        const listingQuery = `
      SELECT id, status, sale_type, starting_price, current_highest_bid, end_time
      FROM listings WHERE id = $1
    `;
        const res = await (0, database_1.query)(listingQuery, [listingId]);
        if (res.rows.length === 0) {
            throw new Error("Cette annonce n'existe pas.");
        }
        const listing = res.rows[0];
        // Vérification du statut et du type d'annonce (optionnel selon vos règles, décommentez si nécessaire)
        // if (listing.status && listing.status !== 'ACTIVE') {
        //   throw new Error("Cette enchère n'est plus active.");
        // }
        // Vérification de la date de fin de l'enchère si elle est définie
        if (listing.end_time) {
            const endTime = new Date(listing.end_time);
            if (new Date() > endTime) {
                throw new Error("Le temps imparti pour cette enchère est expiré.");
            }
        }
        // Détermination du seuil minimum requis
        const currentHighest = listing.current_highest_bid !== null && listing.current_highest_bid !== undefined
            ? Number(listing.current_highest_bid)
            : Number(listing.starting_price);
        if (amount <= currentHighest) {
            throw new Error(`L'enchère doit être supérieure à l'offre actuelle de ${currentHighest.toLocaleString()} Fbu.`);
        }
        // 2. Enregistrer l'enchère dans la table `bids` et mettre à jour le prix le plus haut
        await (0, database_1.query)('INSERT INTO bids (listing_id, user_id, amount) VALUES ($1, $2, $3)', [listingId, userId, amount]);
        const updateRes = await (0, database_1.query)('UPDATE listings SET current_highest_bid = $1 WHERE id = $2 RETURNING current_highest_bid', [amount, listingId]);
        return {
            listingId,
            current_highest_bid: Number(updateRes.rows[0].current_highest_bid)
        };
    }
}
exports.AuctionService = AuctionService;
